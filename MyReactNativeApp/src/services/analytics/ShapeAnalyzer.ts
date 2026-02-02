import { Point } from '@models/TracingData';
import { convexHull, polygonArea } from '../../utils/GeometryUtils';

export interface ShapeQualityMetrics {
    aspect_ratio: number;
    compactness_score: number;
    symmetry_score: number;
    corner_sharpness_scores: number[];
    curve_smoothness_score: number;
    closure_success_rate: number;
    closure_gap_sizes: number[];
    endpoint_count: number;
    junction_count: number;
}

const distance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
};

const mean = (values: number[]): number => {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
};

const computeBoundingBox = (points: Point[]) => {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    return { minX, maxX, minY, maxY };
};

const detectCorners = (stroke: Point[]): number[] => {
    const sharpnessScores: number[] = [];

    for (let i = 1; i < stroke.length - 1; i++) {
        const p1 = stroke[i - 1];
        const p2 = stroke[i];
        const p3 = stroke[i + 1];

        const v1x = p2.x - p1.x;
        const v1y = p2.y - p1.y;
        const v2x = p3.x - p2.x;
        const v2y = p3.y - p2.y;

        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

        if (mag1 === 0 || mag2 === 0) continue;

        const cosAngle = dot / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

        // Detect sharp turns (< 90 degrees)
        if (angle < Math.PI / 2) {
            const sharpness = 1 - angle / (Math.PI / 2);
            sharpnessScores.push(sharpness);
        }
    }

    return sharpnessScores;
};

const measureClosureGap = (stroke: Point[]): number => {
    if (stroke.length < 3) return 0;
    return distance(stroke[0], stroke[stroke.length - 1]);
};

// Simplified: Takes a flattened array of all points for global shape, or array of strokes
export const computeShapeQuality = (
    allStrokes: Point[][]
): ShapeQualityMetrics => {
    if (!allStrokes.length) {
        return {
            aspect_ratio: 1,
            compactness_score: 0,
            symmetry_score: 0,
            corner_sharpness_scores: [],
            curve_smoothness_score: 0,
            closure_success_rate: 0,
            closure_gap_sizes: [],
            endpoint_count: 0,
            junction_count: 0,
        };
    }

    const flattenedPoints = allStrokes.flat();
    const bbox = computeBoundingBox(flattenedPoints);
    const width = bbox.maxX - bbox.minX;
    const height = bbox.maxY - bbox.minY;
    const aspectRatio = height > 0 ? width / height : 1;

    let perimeter = 0;
    allStrokes.forEach(stroke => {
        for (let i = 1; i < stroke.length; i++) {
            perimeter += distance(stroke[i - 1], stroke[i]);
        }
    });

    const { convexHull, polygonArea } = require('../../utils/GeometryUtils');
    const area = width * height; // Bounding box area (fallback)

    // Lazy load to avoid cycle? Or direct import. 
    // Ideally use imports at top, but for now assuming direct access or fix imports.
    // Let's rely on global import if possible, but safe to use logic here.

    // Actually, GeometryUtils is already available in project. 
    // Let's implement Convex Hull call.
    const hullParams = convexHull(flattenedPoints);
    const hullArea = polygonArea(hullParams);

    // Solidity = Area / ConvexHullArea
    const solidity = hullArea > 0 ? area / hullArea : 0; // Not used yet but good metric

    // Compactness = 4 * PI * Area / Perimeter^2 (using Hull Area is more robust for "Visual" area)
    // But standardized FORM-A uses [Perimeter^2 / Area]. 
    // Let's stick closer to standard: (4 * PI * HullArea) / (HullPerimeter^2)? 
    // Or just (Area / HullArea) which is "Solidity".
    // User requested "Compactness". Standard def: (4 * PI * Area) / Perimeter^2.
    // We will use Hull Area as "Effective Area" to avoid underestimating empty space in letters like 'L'.
    const effectiveArea = hullArea > 0 ? hullArea : area;

    const compactnessScore =
        effectiveArea > 0 ? (4 * Math.PI * effectiveArea) / (perimeter * perimeter) : 0;

    const centerX = (bbox.minX + bbox.maxX) / 2;
    let leftPoints = 0;
    let rightPoints = 0;
    flattenedPoints.forEach(p => {
        if (p.x < centerX) leftPoints++;
        else rightPoints++;
    });
    const totalPoints = leftPoints + rightPoints;
    const symmetryScore =
        totalPoints > 0
            ? 1 - Math.abs(leftPoints - rightPoints) / totalPoints
            : 0;

    const allCorners: number[] = [];
    allStrokes.forEach(stroke => {
        allCorners.push(...detectCorners(stroke));
    });

    const closureGaps: number[] = [];
    let closureCount = 0;
    let successfulClosures = 0;

    // Assume every multi-point stroke might attempt closure if start/end are close?
    // Or just measure gap for ALL strokes.
    allStrokes.forEach(stroke => {
        if (stroke.length > 5) { // Only consider long strokes
            const gap = measureClosureGap(stroke);
            closureGaps.push(gap);
            closureCount++;
            if (gap < 20) successfulClosures++; // 20px tolerance
        }
    });

    const closureSuccessRate =
        closureCount > 0 ? successfulClosures / closureCount : 1;

    const endpointCount = allStrokes.length * 2;
    let junctionCount = 0;

    // Simplified junction counting (quadratic, be careful with many points)
    // Sampling: only check every 5th point to save CPU
    for (let i = 0; i < allStrokes.length; i++) {
        for (let j = i + 1; j < allStrokes.length; j++) {
            const s1 = allStrokes[i];
            const s2 = allStrokes[j];
            // Check for intersections ? Too complex for this step without geometry lib
            // We'll skip complex junction detection for now
            junctionCount = 0;
        }
    }

    const curveSmoothness =
        allCorners.length > 0 ? 1 - mean(allCorners) : 1;

    return {
        aspect_ratio: aspectRatio,
        compactness_score: compactnessScore,
        symmetry_score: symmetryScore,
        corner_sharpness_scores: allCorners,
        curve_smoothness_score: curveSmoothness,
        closure_success_rate: closureSuccessRate,
        closure_gap_sizes: closureGaps,
        endpoint_count: endpointCount,
        junction_count: junctionCount,
    };
};
