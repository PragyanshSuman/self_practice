import { Point } from '@models/TracingData';
import { powerSpectralDensity } from '@utils/SignalProcessing';

export interface TremorMetrics {
    tremor_frequency: number; // Estimated dominant frequency in Hz
    tremor_amplitude: number; // Average oscillation magnitude in pixels
    tremor_power: number; // Combined tremor score (0-100)
    has_significant_tremor: boolean;
    tremor_severity: 'none' | 'mild' | 'moderate' | 'severe';
}

const perpendicularDistance = (
    point: Point,
    lineStart: Point,
    lineEnd: Point
): number => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lineLengthSquared = dx * dx + dy * dy;

    if (lineLengthSquared === 0) {
        return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
    }

    const t = Math.max(
        0,
        Math.min(
            1,
            ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
            lineLengthSquared
        )
    );

    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;

    return Math.sqrt(
        Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2)
    );
};

export const detectTremor = (stroke: Point[], strokeDurationMs: number): TremorMetrics => {
    if (stroke.length < 10) {
        return {
            tremor_frequency: 0,
            tremor_amplitude: 0,
            tremor_power: 0,
            has_significant_tremor: false,
            tremor_severity: 'none',
        };
    }

    // Compute deviation from linear segments (smoothing window)
    const deviations: number[] = [];
    const windowSize = 5;

    for (let i = windowSize; i < stroke.length - windowSize; i++) {
        const lineStart = stroke[i - windowSize];
        const lineEnd = stroke[i + windowSize];
        const point = stroke[i];

        const deviation = perpendicularDistance(point, lineStart, lineEnd);
        deviations.push(deviation);
    }

    if (deviations.length === 0) {
        return {
            tremor_frequency: 0,
            tremor_amplitude: 0,
            tremor_power: 0,
            has_significant_tremor: false,
            tremor_severity: 'none',
        };
    }

    // Amplitude: average deviation
    const tremor_amplitude =
        deviations.reduce((a, b) => a + b, 0) / deviations.length;

    // FREQUENCY UPGRADE: Power Spectral Density (PSD)
    // Identify dominant frequency in the 2-12Hz band using DFT
    const samplingRate = (stroke.length / (strokeDurationMs / 1000)) || 60;
    const { frequencies, psd } = powerSpectralDensity(deviations, samplingRate);

    let maxPower = 0;
    let tremor_frequency = 0;

    for (let i = 0; i < frequencies.length; i++) {
        if (frequencies[i] >= 2 && frequencies[i] <= 12) { // Clinical Tremor Band
            if (psd[i] > maxPower) {
                maxPower = psd[i];
                tremor_frequency = frequencies[i];
            }
        }
    }

    // Tremor power: magnitude of the peak in relevant band
    const tremor_power = Math.min(100, maxPower * 1000); // Scaling factor needed for display

    let tremor_severity: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
    let has_significant_tremor = false;

    if (tremor_power > 30) {
        tremor_severity = 'severe';
        has_significant_tremor = true;
    } else if (tremor_power > 20) {
        tremor_severity = 'moderate';
        has_significant_tremor = true;
    } else if (tremor_power > 10) {
        tremor_severity = 'mild';
        has_significant_tremor = true;
    }

    return {
        tremor_frequency,
        tremor_amplitude,
        tremor_power,
        has_significant_tremor,
        tremor_severity,
    };
};
