import { Point, IdealPathData } from '@models/TracingData';

export interface SpatialAccuracyMetrics {
    mean_path_deviation: number;
    max_path_deviation: number;
    deviation_std: number;
    off_track_events: OffTrackEvent[];
    off_track_duration_total: number;
    off_track_recovery_times: number[];
    spatial_drift: number;
    deviation_profile: number[];
}

export interface OffTrackEvent {
    timestamp: number;
    deviation: number;
    duration: number;
    recoveryTime: number;
    location: Point;
}

const OFF_TRACK_THRESHOLD = 30; // pixels

const distance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
};

const mean = (values: number[]): number => {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
};

const std = (values: number[]): number => {
    if (values.length < 2) return 0;
    const m = mean(values);
    const variance =
        values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
    return Math.sqrt(variance);
};

const pointToSegmentDistance = (
    point: Point,
    segStart: Point,
    segEnd: Point
): number => {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const lenSquared = dx * dx + dy * dy;

    if (lenSquared === 0) return distance(point, segStart);

    const t = Math.max(
        0,
        Math.min(
            1,
            ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSquared
        )
    );

    const projX = segStart.x + t * dx;
    const projY = segStart.y + t * dy;

    return Math.sqrt(
        Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2)
    );
};

// Simplified minDistanceToPath that works with IdealPathData structure
const minDistanceToPath = (point: Point, idealPath: IdealPathData, activeStrokePoints?: Point[]): number => {
    // If we have specific active stroke points, check those first for efficiency
    // Otherwise check all points in idealPath
    const targetPoints = activeStrokePoints || idealPath.points;

    if (!targetPoints || targetPoints.length === 0) return Number.POSITIVE_INFINITY;

    let minDist = Number.POSITIVE_INFINITY;

    // Check line segments
    for (let i = 0; i < targetPoints.length - 1; i++) {
        const p1 = targetPoints[i];
        const p2 = targetPoints[i + 1];

        // Skip if jump (handle gaps between strokes if checking full path)
        // Heuristic: if distance between p1/p2 > 50, it's likely a pen lift
        if (distance(p1, p2) > 50) continue;

        const segDist = pointToSegmentDistance(point, p1, p2);
        if (segDist < minDist) minDist = segDist;
    }

    return minDist;
};

export const computeSpatialAccuracy = (
    actualStroke: Point[], // Expected to have x, y, timestamp
    idealPath: IdealPathData, // The full ideal path reference
    activeStrokeIndex?: number // Optional index to narrow down ideal path segments
): SpatialAccuracyMetrics => {
    if (!actualStroke.length) {
        return {
            mean_path_deviation: 0,
            max_path_deviation: 0,
            deviation_std: 0,
            off_track_events: [],
            off_track_duration_total: 0,
            off_track_recovery_times: [],
            spatial_drift: 0,
            deviation_profile: [],
        };
    }

    // Extract relevant ideal points for this stroke if index provided
    let idealStrokePoints: Point[] = idealPath.points;
    if (activeStrokeIndex !== undefined && idealPath.strokeBoundaries) {
        const start = activeStrokeIndex === 0 ? 0 : idealPath.strokeBoundaries[activeStrokeIndex - 1];
        const end = idealPath.strokeBoundaries[activeStrokeIndex];
        // Safety check
        if (start < idealPath.points.length) {
            idealStrokePoints = idealPath.points.slice(start, Math.min(end + 1, idealPath.points.length));
        }
    }

    const deviations: number[] = [];
    const offTrackEvents: OffTrackEvent[] = [];
    let currentOffTrack: OffTrackEvent | null = null;

    actualStroke.forEach((point: any) => { // Use any to allow timestamp access
        const deviation = minDistanceToPath(point, idealPath, idealStrokePoints);
        deviations.push(deviation);

        const time = point.timestamp || 0;

        if (deviation > OFF_TRACK_THRESHOLD) {
            if (!currentOffTrack) {
                currentOffTrack = {
                    timestamp: time,
                    deviation,
                    duration: 0,
                    recoveryTime: 0,
                    location: point,
                };
            } else {
                currentOffTrack.duration = time - currentOffTrack.timestamp;
                if (deviation > currentOffTrack.deviation) {
                    currentOffTrack.deviation = deviation;
                    currentOffTrack.location = point;
                }
            }
        } else {
            if (currentOffTrack) {
                currentOffTrack.recoveryTime =
                    time - (currentOffTrack.timestamp + currentOffTrack.duration);
                offTrackEvents.push(currentOffTrack);
                currentOffTrack = null;
            }
        }
    });

    if (currentOffTrack) {
        offTrackEvents.push(currentOffTrack);
    }

    const meanDeviation = mean(deviations);
    const maxDeviation = deviations.length > 0 ? Math.max(...deviations) : 0;
    const deviationStd = std(deviations);

    const offTrackDurationTotal = offTrackEvents.reduce(
        (sum, evt) => sum + evt.duration,
        0
    );
    const recoveryTimes = offTrackEvents.map(evt => evt.recoveryTime);

    // Spatial drift: compare first quarter vs last quarter deviation
    const quarterSize = Math.floor(deviations.length / 4);
    const firstQuarter = deviations.slice(0, quarterSize);
    const lastQuarter = deviations.slice(-quarterSize);
    const spatialDrift =
        lastQuarter.length > 0 && firstQuarter.length > 0
            ? mean(lastQuarter) - mean(firstQuarter)
            : 0;

    return {
        mean_path_deviation: meanDeviation,
        max_path_deviation: maxDeviation,
        deviation_std: deviationStd,
        off_track_events: offTrackEvents,
        off_track_duration_total: offTrackDurationTotal,
        off_track_recovery_times: recoveryTimes,
        spatial_drift: spatialDrift,
        deviation_profile: deviations,
    };
};
