import { modelService } from '../services/ModelService';

// 1. Class Mapping (identical to Python, but ported)
const FULL_MAPPING_STR = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabdefghnqrt";
const CLASS_MAPPING_LIST = FULL_MAPPING_STR.split('');

// Extended classes for dyslexia
const DYSLEXIA_CLASSES = {
    47: "Normal (Dyslexia)",
    48: "Reversal",
    49: "Corrected"
};

export const getCharFromIndex = (index: number): string => {
    if (index < CLASS_MAPPING_LIST.length) {
        return CLASS_MAPPING_LIST[index];
    }
    return DYSLEXIA_CLASSES[index as keyof typeof DYSLEXIA_CLASSES] || "?";
};

export const isAlpha = (char: string): boolean => {
    return /^[A-Za-z]$/.test(char);
};

export const ALPHABET_INDICES = CLASS_MAPPING_LIST
    .map((char, index) => ({ char, index }))
    .filter(item => isAlpha(item.char))
    .map(item => item.index);

// 2. Preprocessing (Rasterization)
// We need to convert the path/strokes to a 28x28 grayscale grid (Float32Array)

// Type for a point in stroke
interface Point {
    x: number;
    y: number;
}

// Type for a stroke (array of points)
type Stroke = Point[];

export const rasterizeStrokes = (strokes: Stroke[], canvasWidth: number, canvasHeight: number): Float32Array => {
    const GRID_SIZE = 28;
    const grid = new Float32Array(GRID_SIZE * GRID_SIZE).fill(0); // 0 = black (background), 1 = white (stroke)
    // Note: Python code inverted it (white on black background expected by model?) 
    // Python: new("RGB", "white") -> draw black -> convert to gray -> INVERT -> threshold.
    // Result: Background=0 (Black), Text=1 (White).

    // We will draw logically on a grid.

    // 1. Find bounding box of valid strokes to center/crop
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasPoints = false;

    strokes.forEach(stroke => {
        stroke.forEach(p => {
            if (p.x !== undefined && p.y !== undefined) {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
                hasPoints = true;
            }
        });
    });

    if (!hasPoints) return grid; // Return empty black grid

    // Add padding (simulating the Python padding=20 on 400x400 canvas ~ 5%)
    // But we are resizing to 28x28. 
    // Let's first map strokes to 28x28 coordinates maintaining aspect ratio.

    // Bounding Box Dimensions
    const w = maxX - minX;
    const h = maxY - minY;

    // Square the bounding box to maintain aspect ratio, centering content
    const maxDim = Math.max(w, h);
    const centerX = minX + w / 2;
    const centerY = minY + h / 2;

    // New square bounds
    // We want a bit of padding in the final 28x28 box. 
    // Let's mapped the square bounds to, say, 20x20 in the center of 28x28 (4px padding)
    const targetSize = 20;
    const scale = targetSize / maxDim; // Scale factor

    const offsetX = (GRID_SIZE - w * scale) / 2;
    const offsetY = (GRID_SIZE - h * scale) / 2;
    // Actually simpler: map the centered square to center of 28x28

    const mapX = (x: number) => {
        return (x - centerX) * scale + (GRID_SIZE / 2);
    };

    const mapY = (y: number) => {
        return (y - centerY) * scale + (GRID_SIZE / 2);
    };

    // Helper to set pixel with simplified anti-aliasing/thickness
    const drawPoint = (gx: number, gy: number, intensity: number = 1.0) => {
        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
            const idx = Math.floor(gy) * GRID_SIZE + Math.floor(gx);
            // Add intensity, capping at 1.0
            grid[idx] = Math.min(1.0, grid[idx] + intensity);
        }
    };

    // Line drawing algorithm (Bresenham-ish) or just simple interpolation
    strokes.forEach(stroke => {
        for (let i = 0; i < stroke.length - 1; i++) {
            const p1 = stroke[i];
            const p2 = stroke[i + 1];

            const x1 = mapX(p1.x);
            const y1 = mapY(p1.y);
            const x2 = mapX(p2.x);
            const y2 = mapY(p2.y);

            const dist = Math.hypot(x2 - x1, y2 - y1);
            const steps = Math.ceil(dist * 2); // 2 samples per pixel for continuity

            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const tx = x1 + (x2 - x1) * t;
                const ty = y1 + (y2 - y1) * t;

                // Draw a "thick" point (3x3 kernel)
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        // Gaussian-ish falloff
                        const distFromCenter = Math.hypot(dx, dy);
                        const intensity = Math.max(0, 1 - distFromCenter * 0.5);
                        drawPoint(tx + dx, ty + dy, intensity);
                    }
                }
            }
        }
    });

    return grid;
};

// 3. Reversal Detection Logic
// Needs to handle the tensor manipulation logic: Flip H, Flip V, Rot 180
// Since we have a flat 1D array of length 784 (28*28), we can implement flips manually.

export const flipHorizontal = (grid: Float32Array): Float32Array => {
    // Flip across vertical axis (swap columns)
    const newGrid = new Float32Array(grid.length);
    const size = 28;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const srcIdx = y * size + x;
            const destIdx = y * size + (size - 1 - x);
            newGrid[destIdx] = grid[srcIdx];
        }
    }
    return newGrid;
};

export const flipVertical = (grid: Float32Array): Float32Array => {
    // Flip across horizontal axis (swap rows)
    const newGrid = new Float32Array(grid.length);
    const size = 28;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const srcIdx = y * size + x;
            const destIdx = (size - 1 - y) * size + x;
            newGrid[destIdx] = grid[srcIdx];
        }
    }
    return newGrid;
};

export const rotate180 = (grid: Float32Array): Float32Array => {
    // Equivalent to flipH then flipV
    return flipVertical(flipHorizontal(grid));
};
