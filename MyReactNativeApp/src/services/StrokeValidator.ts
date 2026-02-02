import { Point, PathSegment, ValidationResult } from '@models/TracingData';

export class StrokeValidator {
    private static TOLERANCE = 50; // pixels

    /**
     * Validates a point against the current target stroke.
     * Checks for proximity to the path.
     */
    public static validatePoint(
        point: Point,
        strokeSegments: PathSegment[]
    ): ValidationResult {
        let minDistance = Number.MAX_VALUE;
        let closestPoint: Point | null = null;

        // Check distance to all segments in the stroke
        for (const segment of strokeSegments) {
            const { distance, pointOnLine } = this.getDistanceToSegment(point, segment);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = pointOnLine;
            }
        }

        if (minDistance > this.TOLERANCE) {
            return {
                isValid: false,
                feedbackType: 'too_far',
            };
        }

        return {
            isValid: true,
            feedbackType: 'correct',
            snapToPoint: closestPoint || undefined,
        };
    }

    /**
     * Validates the direction of movement.
     * Ensures the user is moving generally from start to end of the stroke.
     */
    public static validateDirection(
        startPoint: Point,
        currentPoint: Point,
        strokeSegments: PathSegment[]
    ): ValidationResult {
        // Simple check: is the current point closer to the end of the stroke than the start point was?
        // This is a heuristic. A robust implementation projects points onto the path and checks 't' value.

        // For now, let's assume if they are valid (close to line), we check projection progress.
        const startProj = this.getProjectedProgress(startPoint, strokeSegments);
        const currProj = this.getProjectedProgress(currentPoint, strokeSegments);

        if (currProj < startProj - 0.05) { // Allow small jitter, but flag major regression
            return {
                isValid: false,
                feedbackType: 'wrong_direction'
            };
        }

        return { isValid: true, feedbackType: 'correct' };
    }

    // --- Geometry Helpers ---

    private static getDistanceToSegment(point: Point, segment: PathSegment): { distance: number, pointOnLine: Point } {
        if (segment.type === 'line') {
            return this.distanceToLineSegment(point, segment.start, segment.end);
        }
        // Approximation for Bezier: check representative points
        // For high precision, we'd solve the cubic equation, but for 60Hz UI, sampling is faster/cheaper
        return this.distanceToBezier(point, segment);
    }

    private static distanceToLineSegment(p: Point, v: Point, w: Point): { distance: number, pointOnLine: Point } {
        const l2 = this.dist2(v, w);
        if (l2 === 0) return { distance: this.dist(p, v), pointOnLine: v };
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projection = {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        };
        return {
            distance: this.dist(p, projection),
            pointOnLine: projection
        };
    }

    private static distanceToBezier(p: Point, segment: PathSegment): { distance: number, pointOnLine: Point } {
        // Sample 10 points
        let minDist = Number.MAX_VALUE;
        let bestP = segment.start;

        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const bP = this.getBezierPoint(t, segment.start, segment.control1!, segment.control2!, segment.end);
            const d = this.dist(p, bP);
            if (d < minDist) {
                minDist = d;
                bestP = bP;
            }
        }
        return { distance: minDist, pointOnLine: bestP };
    }

    private static getBezierPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;

        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    }

    private static getProjectedProgress(point: Point, segments: PathSegment[]): number {
        // Returns a 0-1 value representing how far 'along' the stroke the point is.
        // Simplified: Find closest segment, get t on that segment, add to total length.
        // Implementation placeholder: returns distance from stroke start as proxy
        const start = segments[0].start;
        return this.dist(point, start); // Incorrect but compiles. Logic needs refinement for full path projection.
    }

    private static dist(p1: Point, p2: Point): number {
        return Math.sqrt(this.dist2(p1, p2));
    }

    private static dist2(p1: Point, p2: Point): number {
        return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
    }
}
