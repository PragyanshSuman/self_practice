import * as opentype from 'opentype.js';
import { PathSegment, LetterPath } from '@models/TracingData';

/**
 * FontTemplateGenerator - Automatically generates letter templates from font files
 * Replaces manual Bézier curve definitions with automatic extraction
 */
export class FontTemplateGenerator {
    private font: opentype.Font | null = null;
    private readonly CANVAS_WIDTH = 600;
    private readonly CANVAS_HEIGHT = 800;
    private readonly LETTER_SIZE = 400;
    private readonly CENTER_X = this.CANVAS_WIDTH / 2;
    private readonly BASELINE = this.CANVAS_HEIGHT / 2 + 100;

    /**
     * Load a font file
     * @param fontPath - Path to TTF/OTF font file
     */
    async loadFont(fontPath: string): Promise<void> {
        try {
            this.font = await opentype.load(fontPath);
            console.log('[FontTemplateGenerator] Font loaded successfully');
        } catch (error) {
            console.error('[FontTemplateGenerator] Failed to load font:', error);
            throw error;
        }
    }

    /**
     * Generate letter path from font
     * @param letter - The letter to generate (A-Z)
     * @param strokeOrder - Optional manual stroke order indices
     */
    generateLetterPath(
        letter: string,
        strokeOrder?: number[]
    ): LetterPath {
        if (!this.font) {
            throw new Error('Font not loaded. Call loadFont() first.');
        }

        const glyph = this.font.charToGlyph(letter);
        const path = glyph.getPath(0, 0, this.LETTER_SIZE);

        // Convert OpenType path to our PathSegment format
        const rawStrokes = this.convertOpentypePath(path);

        // Apply stroke order if provided
        const orderedStrokes = strokeOrder
            ? strokeOrder.map(idx => rawStrokes[idx]).filter(Boolean)
            : rawStrokes;

        return {
            letter,
            expectedStrokeCount: orderedStrokes.length,
            width: this.LETTER_SIZE,
            height: this.LETTER_SIZE,
            baseline: this.BASELINE,
            difficulty: this.estimateDifficulty(orderedStrokes.length),
            confusionPairs: this.getConfusionPairs(letter),
            strokes: orderedStrokes
        };
    }

    /**
     * Convert OpenType path commands to PathSegment arrays
     */
    private convertOpentypePath(path: opentype.Path): PathSegment[][] {
        const strokes: PathSegment[][] = [];
        let currentStroke: PathSegment[] = [];
        let currentPoint = { x: 0, y: 0 };

        for (const cmd of path.commands) {
            const transformedCmd = this.transformCommand(cmd);

            switch (transformedCmd.type) {
                case 'M': // Move to - start new stroke
                    if (currentStroke.length > 0) {
                        strokes.push(currentStroke);
                        currentStroke = [];
                    }
                    currentPoint = { x: transformedCmd.x, y: transformedCmd.y };
                    break;

                case 'L': // Line to
                    currentStroke.push({
                        type: 'line',
                        start: { ...currentPoint },
                        end: { x: transformedCmd.x, y: transformedCmd.y }
                    });
                    currentPoint = { x: transformedCmd.x, y: transformedCmd.y };
                    break;

                case 'C': // Cubic Bézier curve
                    currentStroke.push({
                        type: 'bezier',
                        start: { ...currentPoint },
                        control1: { x: transformedCmd.x1, y: transformedCmd.y1 },
                        control2: { x: transformedCmd.x2, y: transformedCmd.y2 },
                        end: { x: transformedCmd.x, y: transformedCmd.y }
                    });
                    currentPoint = { x: transformedCmd.x, y: transformedCmd.y };
                    break;

                case 'Q': // Quadratic Bézier - convert to cubic
                    const cubicControl1 = {
                        x: currentPoint.x + (2 / 3) * (transformedCmd.x1 - currentPoint.x),
                        y: currentPoint.y + (2 / 3) * (transformedCmd.y1 - currentPoint.y)
                    };
                    const cubicControl2 = {
                        x: transformedCmd.x + (2 / 3) * (transformedCmd.x1 - transformedCmd.x),
                        y: transformedCmd.y + (2 / 3) * (transformedCmd.y1 - transformedCmd.y)
                    };
                    currentStroke.push({
                        type: 'bezier',
                        start: { ...currentPoint },
                        control1: cubicControl1,
                        control2: cubicControl2,
                        end: { x: transformedCmd.x, y: transformedCmd.y }
                    });
                    currentPoint = { x: transformedCmd.x, y: transformedCmd.y };
                    break;

                case 'Z': // Close path
                    // Optionally add closing line if needed
                    break;
            }
        }

        if (currentStroke.length > 0) {
            strokes.push(currentStroke);
        }

        return strokes;
    }

    /**
     * Transform OpenType coordinates to canvas coordinates
     * OpenType uses bottom-left origin, we use top-left with baseline
     */
    private transformCommand(cmd: any): any {
        const scale = 1.0;
        const offsetX = this.CENTER_X - (this.LETTER_SIZE / 2);
        const offsetY = this.BASELINE - this.LETTER_SIZE;

        const transform = (x: number, y: number) => ({
            x: offsetX + x * scale,
            y: offsetY + (this.LETTER_SIZE - y) * scale  // Flip Y axis
        });

        const transformed: any = { type: cmd.type };

        switch (cmd.type) {
            case 'M':
            case 'L':
                const p = transform(cmd.x, cmd.y);
                transformed.x = p.x;
                transformed.y = p.y;
                break;

            case 'C':
                const p1 = transform(cmd.x1, cmd.y1);
                const p2 = transform(cmd.x2, cmd.y2);
                const p3 = transform(cmd.x, cmd.y);
                transformed.x1 = p1.x;
                transformed.y1 = p1.y;
                transformed.x2 = p2.x;
                transformed.y2 = p2.y;
                transformed.x = p3.x;
                transformed.y = p3.y;
                break;

            case 'Q':
                const q1 = transform(cmd.x1, cmd.y1);
                const q2 = transform(cmd.x, cmd.y);
                transformed.x1 = q1.x;
                transformed.y1 = q1.y;
                transformed.x = q2.x;
                transformed.y = q2.y;
                break;
        }

        return transformed;
    }

    /**
     * Estimate difficulty based on stroke count
     */
    private estimateDifficulty(strokeCount: number): 'easy' | 'medium' | 'hard' {
        if (strokeCount <= 2) return 'easy';
        if (strokeCount <= 3) return 'medium';
        return 'hard';
    }

    /**
     * Get confusion pairs for a letter (letters that look similar)
     */
    private getConfusionPairs(letter: string): string[] {
        const confusionMap: Record<string, string[]> = {
            'A': ['V', 'H'],
            'B': ['D', 'P', 'R'],
            'C': ['O', 'G'],
            'D': ['B', 'O'],
            'E': ['F'],
            'F': ['E', 'T'],
            'G': ['C', 'O'],
            'H': ['N', 'A'],
            'I': ['L', 'T'],
            'J': ['I'],
            'K': ['X'],
            'L': ['I', 'T'],
            'M': ['W', 'N'],
            'N': ['M', 'H'],
            'O': ['Q', 'C', 'D'],
            'P': ['B', 'R', 'Q'],
            'Q': ['O', 'P'],
            'R': ['P', 'B'],
            'S': ['Z'],
            'T': ['F', 'I', 'L'],
            'U': ['V'],
            'V': ['A', 'U'],
            'W': ['M'],
            'X': ['K'],
            'Y': [],
            'Z': ['S']
        };

        return confusionMap[letter.toUpperCase()] || [];
    }

    /**
     * Generate all alphabet letters
     */
    async generateAlphabet(): Promise<Record<string, LetterPath>> {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letterPaths: Record<string, LetterPath> = {};

        // Pedagogically correct stroke orders
        const strokeOrders: Record<string, number[]> = {
            'A': [0, 1, 2],  // Left diagonal, right diagonal, crossbar
            'B': [0, 1, 2],  // Vertical, upper curve, lower curve
            'E': [0, 1, 2, 3],  // Vertical, top, middle, bottom
            'F': [0, 1, 2],  // Vertical, top, middle
            'H': [0, 1, 2],  // Left vertical, right vertical, crossbar
            // Add more as needed
        };

        for (const letter of alphabet) {
            try {
                letterPaths[letter] = this.generateLetterPath(
                    letter,
                    strokeOrders[letter]
                );
            } catch (error) {
                console.error(`Failed to generate letter ${letter}:`, error);
            }
        }

        return letterPaths;
    }
}

// Export singleton instance
export const fontTemplateGenerator = new FontTemplateGenerator();
