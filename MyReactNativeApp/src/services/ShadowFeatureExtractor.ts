import {
    RawTouchPoint,
    SessionFeatureSummary,
    StrokeFeatureSummary,
    Point,
    IdealPathData,
    LetterPath,
    MLFeatures
} from '@models/TracingData';
import { detectTremor } from '@services/analytics/TremorAnalyzer';
import { computeSpatialAccuracy } from '@services/analytics/SpatialAnalyzer';
import { computeShapeQuality } from '@services/analytics/ShapeAnalyzer';

export class ShadowFeatureExtractor {
    private rawPoints: RawTouchPoint[] = [];
    private strokeSummaries: StrokeFeatureSummary[] = [];
    private currentStrokePoints: RawTouchPoint[] = [];
    private strokeStartTime: number = 0;
    private letterPath: LetterPath | null = null;
    // History for global analysis
    private allStrokesHistory: RawTouchPoint[][] = [];

    public startSession(config?: { letterPath: LetterPath, idealPath: IdealPathData }) {
        this.rawPoints = [];
        this.strokeSummaries = [];
        this.currentStrokePoints = [];
        this.allStrokesHistory = [];
        if (config) {
            this.letterPath = config.letterPath;
            this.idealPath = config.idealPath;
        }
    }

    public addPoint(point: RawTouchPoint) {
        this.rawPoints.push(point);
        this.currentStrokePoints.push(point);
        if (this.currentStrokePoints.length === 1) {
            this.strokeStartTime = point.timestamp;
        }
    }

    public endStroke(strokeId: number) {
        if (this.currentStrokePoints.length < 2) return;

        // Save stroke for global history
        this.allStrokesHistory.push([...this.currentStrokePoints]);

        const summary = this.computeStrokeFeatures(strokeId, this.currentStrokePoints);
        this.strokeSummaries.push(summary);
        this.currentStrokePoints = [];
    }

    public async generateSessionSummary(
        sessionId: string,
        letter: string,
        context: SessionFeatureSummary['context']
    ): Promise<SessionFeatureSummary> {

        // 1. Basic Aggregation
        const totalPauses = this.strokeSummaries.reduce((acc, s) => acc + s.pauseCount, 0);
        const totalDuration = this.strokeSummaries.reduce((acc, s) => acc + s.strokeDuration, 0) +
            this.strokeSummaries.reduce((acc, s) => acc + (s.pauseCount * s.avgPauseDuration), 0); // Approx
        const startTime = this.rawPoints.length > 0 ? this.rawPoints[0].timestamp : Date.now();
        const endTime = this.rawPoints.length > 0 ? this.rawPoints[this.rawPoints.length - 1].timestamp : Date.now();
        const completionTime = endTime - startTime;

        // 2. Kinematics Analysis with Savitzky-Golay Filtering (Gold Standard)
        // We smooth the raw velocities to remove digitizer jitter while preserving peaks
        const { savitzkyGolayFilter } = await import('@utils/SignalProcessing');

        const rawVelocities = this.allStrokesHistory.flat().map((p, i, arr) => {
            if (i === 0) return 0;
            const prev = arr[i - 1];
            const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
            const dt = p.timestamp - prev.timestamp;
            return dt > 0 ? dist / dt : 0;
        });

        // Apply Savitzky-Golay (Window=5, Order=2 implied or default)
        // Better than Gaussian for preserving peak velocity data points
        const smoothedVelocities = savitzkyGolayFilter(rawVelocities, 5);

        const avgVelocity = smoothedVelocities.reduce((a, b) => a + b, 0) / (smoothedVelocities.length || 1);
        const velocityVariance = smoothedVelocities.reduce((acc, v) => acc + Math.pow(v - avgVelocity, 2), 0) / (smoothedVelocities.length || 1);
        const velocityCoV = avgVelocity > 0 ? Math.sqrt(velocityVariance) / avgVelocity : 0;
        const peakVelocity = Math.max(...smoothedVelocities);

        // 3. Shape & Tremor
        const shapeQuality = computeShapeQuality(this.allStrokesHistory);

        let tremorPower = 0;
        let tremorAmp = 0;
        let tremorFreq = 0;
        if (this.strokeSummaries.length > 0) {
            tremorPower = this.strokeSummaries.reduce((acc, s) => acc + s.tremor.tremor_power, 0) / this.strokeSummaries.length;
            tremorAmp = this.strokeSummaries.reduce((acc, s) => acc + s.tremor.tremor_amplitude, 0) / this.strokeSummaries.length;
            tremorFreq = this.strokeSummaries.reduce((acc, s) => acc + s.tremor.tremor_frequency, 0) / this.strokeSummaries.length;
        }

        // 4. ML Analysis
        let mlFeatures: MLFeatures = {
            predictedChar: '?',
            expectedChar: letter,
            isCorrect: false,
            confidence: 0,
            topPredictions: [],
            reversalDetected: false,
            analysisTimestamp: new Date().toISOString()
        };

        try {
            const { MLTracingAnalyzer } = await import('./MLTracingAnalyzer');
            // Convert RawTouchPoint[][] to Point[][]
            const strokes = this.allStrokesHistory.map(stroke =>
                stroke.map(point => ({ x: point.x, y: point.y }))
            );

            console.log(`[ShadowFeatureExtractor] Starting ML Analysis with ${strokes.length} strokes.`);
            if (strokes.length === 0) {
                console.warn('[ShadowFeatureExtractor] No strokes recorded, skipping ML.');
            } else {
                const result = await MLTracingAnalyzer.analyzeTracing(strokes, letter);
                if (result) {
                    mlFeatures = result;
                    console.log(`[ShadowFeatureExtractor] ML Success: ${result.predictedChar} (${(result.confidence * 100).toFixed(1)}%)`);
                } else {
                    console.error('[ShadowFeatureExtractor] ML returned null result.');
                }
            }
        } catch (error) {
            console.error('[ShadowFeatureExtractor] ML analysis failed:', error);
        }

        // 5. Construct Clinical Summary
        const summary: SessionFeatureSummary = {
            sessionId,
            letter,
            timestamp: new Date().toISOString(),

            overview: {
                isCorrect: mlFeatures.isCorrect,
                completionTime,
                score: mlFeatures.confidence * 100, // Placeholder scoring
                status: 'completed'
            },

            clinical: {
                dataQuality: {
                    samplingRate: this.strokeSummaries.length > 0 ? this.strokeSummaries[0].samplingRate : 0,
                    completenessScore: 1.0,
                    totalSamples: this.rawPoints.length,
                    pointsDropped: 0
                },
                kinematics: {
                    avgVelocity,
                    peakVelocity: peakVelocity,
                    velocityCoV,
                    velocityPeaks: this.strokeSummaries.reduce((acc, s) => acc + s.velocityPeaks, 0),
                    // Use pauseCount as the source for "Hesitations/Valleys" + Inter-stroke pauses
                    velocityValleys: this.strokeSummaries.reduce((acc, s) => acc + s.pauseCount, 0) +
                        (this.strokeSummaries.length > 1 ? this.strokeSummaries.length - 1 : 0), // Count every lift as a potential pause/hesitation for now to ensure visibility
                    timeInMotion: totalDuration,
                    timePaused: totalPauses * (this.strokeSummaries[0]?.avgPauseDuration || 0), // simplified
                    fluencyRatio: completionTime > 0 ? totalDuration / completionTime : 0
                },
                dynamics: {
                    maxAcceleration: Math.max(...this.strokeSummaries.map(s => s.maxAcceleration)),
                    avgJerk: this.strokeSummaries.reduce((acc, s) => acc + s.normalizedJerk, 0) / (this.strokeSummaries.length || 1),
                    // LDLJ typically requires calculated jerk profile. 
                    // Approximation using normalizedJerk (which is J * D^3 / V^2 for some definitions) - ln(J).
                    // We will just log-transform our existing dimensionless jerk for now as a robust proxy 
                    // or use a refined normalizedJerk if available.
                    // Let's use -ln(normalizedJerk) as smoothness (Higher is smoother).
                    normalizedJerk: this.strokeSummaries.reduce((acc, s) => acc + s.normalizedJerk, 0) / (this.strokeSummaries.length || 1),
                    accelerationSymmetry: this.strokeSummaries.length > 0 ? (1 - (this.strokeSummaries[0].maxAcceleration / (Math.max(...this.strokeSummaries.map(s => s.maxAcceleration)) || 1))) : 1.0, // Simplistic symmetry measure
                    ballisticMovements: this.strokeSummaries.filter(s => s.isBallistic).length,
                },
                graphomotor: {
                    tremorFrequency: tremorFreq,
                    tremorAmplitude: tremorAmp,
                    tremorPower: tremorPower,
                    avgPressure: this.strokeSummaries.reduce((acc, s) => acc + s.avgPressure, 0) / (this.strokeSummaries.length || 1),
                    pressureVariance: this.calculatePressureVariance(), // NEW Method
                    strokeWidthMean: 0,
                    strokeWidthVariance: 0
                },
                shape: {
                    ...shapeQuality,
                    pathVariance: 0, // Disabled
                    spatialDrift: 0,
                    offTrackEvents: 0,
                    closureSuccess: shapeQuality.closure_success_rate > 0.8
                },
                sequencing: {
                    strokeCountActual: this.strokeSummaries.length,
                    strokeCountExpected: this.letterPath?.expectedStrokeCount || 0,
                    extraStrokes: Math.max(0, this.strokeSummaries.length - (this.letterPath?.expectedStrokeCount || 0)),
                    missingStrokes: 0,
                    strokeSequenceCorrect: true, // Placeholder
                    liftOffCount: this.strokeSummaries.length,
                    avgInterStrokeLatency: 0 // Placeholder
                },
                orientation: {
                    micropauseCount: this.strokeSummaries.reduce((acc, s) => acc + s.pauseCount, 0), // Internal usage
                    reversalDetected: mlFeatures.reversalDetected || this.strokeSummaries.some(s => s.reversalsCount > 0),
                    reversalType: mlFeatures.reversalType ? (
                        mlFeatures.reversalType === 'horizontal_flip' ? 'horizontal' :
                            mlFeatures.reversalType === 'vertical_flip' ? 'vertical' :
                                mlFeatures.reversalType === 'rotation_180' ? 'rotation' : undefined
                    ) : (this.strokeSummaries.some(s => s.reversalsCount > 0) ? 'rotation' : undefined), // Fallback type
                    mirrorConfusionScore: mlFeatures.reversalDetected ? 0.9 : 0.1,
                    orientationConsistency: 1.0,
                    // Hack to expose raw count in the "reversalDetected" boolean if needed or we update UI.
                    // For now, ensuring the boolean flips is critical.
                }
            },

            ml: mlFeatures,
            context
        };

        return summary;
    }

    private computeStrokeFeatures(strokeId: number, points: RawTouchPoint[]): StrokeFeatureSummary {
        let totalDist = 0;
        let totalDuration = points[points.length - 1].timestamp - points[0].timestamp;
        let pauses = 0;
        let pauseDuration = 0;
        let maxAcc = 0;
        let totalJerk = 0;
        let velocityPeaks = 0;
        let velocityValleys = 0;

        // Sampling rate estimation (Hz)
        const samplingRate = points.length > 1 && totalDuration > 0
            ? (points.length / (totalDuration / 1000))
            : 0;

        // Kinematic Analysis
        const velocities: number[] = [];

        // Velocity & Acceleration loop
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            const dt = p2.timestamp - p1.timestamp;

            totalDist += dist;

            if (dt > this.MIN_PAUSE_DURATION) {
                pauses++;
                pauseDuration += dt;
            }

            if (dt > 0 && i > 1) {
                const v1 = dist / dt;
                // Prev velocity
                const p0 = points[i - 2];
                const dist0 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
                const dt0 = p1.timestamp - p0.timestamp;
                const v0 = dist0 / dt0;

                const acc = Math.abs(v1 - v0) / dt;
                if (acc > maxAcc) maxAcc = acc;

                // Jerk (simplified)
                if (i > 2) {
                    const jerk = Math.abs(acc - (Math.abs(v0 - 0) / dt0)) / dt;
                    totalJerk += jerk;
                }
            }
        }

        // Ballistic movement detection: High peak velocity + smooth accel/decel
        // Simple heuristic: if maxAcc is high (> 0.5) and normalizedJerk is low (< 0.05), it's likely ballistic
        // Better: Check if velocity profile is bell-shaped. For now, we count strokes with high efficiency.
        // Let's use: (AvgVelocity / MaxAcceleration) ratio -> Higher means smoother, more ballistic
        const ballisticScore = maxAcc > 0 ? (totalDist / totalDuration) / maxAcc : 0;
        const isBallistic = ballisticScore > 2.0; // Threshold tuning required

        // Count reversals (sharp turns > 160 degrees)
        const reversals = this.calculateReversals(points);

        // 1. Tremor Analysis
        const tremorFn = detectTremor(points, totalDuration);

        // 2. Spatial Analysis (requires IdealPath)
        let spatialFn = {
            mean_path_deviation: 0,
            max_path_deviation: 0,
            deviation_std: 0,
            off_track_events: [],
            off_track_duration_total: 0,
            off_track_recovery_times: [],
            spatial_drift: 0,
            deviation_profile: []
        };

        if (this.idealPath) {
            // DISABLED FOR BLANK CANVAS MODE: Do not calculate spatial deviation against hidden template
            // spatialFn = computeSpatialAccuracy(points, this.idealPath, strokeId);
        }

        return {
            strokeId,
            initiationDelay: 0,
            strokeDuration: totalDuration,
            pauseCount: pauses,
            avgPauseDuration: pauses > 0 ? pauseDuration / pauses : 0,
            avgVelocity: totalDuration > 0 ? totalDist / totalDuration : 0,
            avgPressure: points.reduce((acc, p) => acc + p.pressure, 0) / points.length,
            maxAcceleration: maxAcc,
            maxAcceleration: maxAcc,
            normalizedJerk: totalJerk / (totalDuration || 1),
            velocityPeaks,
            velocityValleys: pauses, // Use pauses as the "hesitation" count
            samplingRate,
            isBallistic, // NEW
            ballisticScore, // NEW
            baselineDeviation: spatialFn.mean_path_deviation,
            convexityHullArea: 0,
            reversalsCount: reversals,
            isDirectionCorrect: reversals === 0,

            // New Advanced Metrics
            tremor: tremorFn,
            spatial: spatialFn
        };

        console.log(`[ShadowFeatureExtractor] Stroke Analysis: Pauses=${pauses} (${pauseDuration.toFixed(0)}ms), Reversals=${reversals}, Ballistic=${isBallistic ? 'YES' : 'NO'}`);
        return summary;
    }

    private readonly MIN_PAUSE_DURATION = 150; // ms (Standard threshold for "Hesitation")

    private calculatePressureVariance(): number {
        if (this.rawPoints.length < 2) return 0;
        const pressures = this.rawPoints.map(p => p.pressure);
        const mean = pressures.reduce((a, b) => a + b, 0) / pressures.length;
        const variance = pressures.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / pressures.length;
        return variance;
    }

    private calculateReversals(points: RawTouchPoint[]): number {
        const stride = 4; // Look 4 points back/forward to get a stable vector (~60ms)
        if (points.length < stride * 2 + 1) return 0;

        let reversals = 0;

        // Iterate through points with stride safety
        for (let i = stride; i < points.length - stride; i++) {
            const p_prev = points[i - stride];
            const p_curr = points[i];
            const p_next = points[i + stride];

            // Vector 1 (Entering the turn)
            const v1x = p_curr.x - p_prev.x;
            const v1y = p_curr.y - p_prev.y;

            // Vector 2 (Exiting the turn)
            const v2x = p_next.x - p_curr.x;
            const v2y = p_next.y - p_curr.y;

            const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
            const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

            // Filter out stationary segments (must move > 3 pixels over stride)
            if (mag1 < 3.0 || mag2 < 3.0) continue;

            // Dot Product for Angle
            const dot = v1x * v2x + v1y * v2y;

            if (mag1 > 0 && mag2 > 0) {
                const angleRad = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
                const angleDeg = angleRad * 180 / Math.PI;

                // Reversal = Sharp Turn (> 135 degrees)
                // If angle is effectively 180 (parallel opposite), it's a reversal.
                // acos(dot) gives angle between vectors placed tail-to-tail.
                // If moving straight, angle is 0.
                // If u-turn, angle is 180.

                if (Math.abs(angleDeg) > 135) {
                    reversals++;
                    // Skip ahead by stride to avoid counting the same corner multiple times
                    i += stride;
                }
            }
        }
        return reversals;
    }
}
