// src/utils/NoiseReducer.ts
// Titanium Standard: DSP-based Spectral Subtraction for Active Noise Isolation

import { AudioData } from '../types';
import { FFT } from './FFT';
import { AudioProcessor } from './audioProcessor'; // Assuming needed for some helpers, or just raw math

export class NoiseReducer {
    private frameSize: number;
    private hopSize: number;
    private sampleRate: number;
    private oversubtractionFactor: number; // Alpha

    constructor(
        sampleRate: number = 16000,
        frameSize: number = 512,
        hopSize: number = 256
    ) {
        this.sampleRate = sampleRate;
        this.frameSize = frameSize;
        this.hopSize = hopSize;
        this.oversubtractionFactor = 2.0; // Aggressive subtraction for noisy environments
    }

    /**
     * Main cleaning function
     * Reads the first 200ms to learn noise profile, then cleans the entire buffer.
     */
    public clean(audio: AudioData): AudioData {
        console.log('[NoiseReducer] Starting Spectral Subtraction...');
        const samples = audio.samples;

        // 1. Learn Noise Profile (First 200ms)
        // 200ms in samples
        const noiseDurationSamples = Math.floor(0.2 * this.sampleRate);
        const noiseSegment = samples.slice(0, Math.min(samples.length, noiseDurationSamples));

        // Calculate average noise spectrum
        const noiseProfile = this.learnNoiseProfile(noiseSegment);

        // 2. Process the whole signal via STFT (Short-Time Fourier Transform)
        const cleanedSamples = this.spectralSubtraction(samples, noiseProfile);

        // 3. Post-Processing: Dynamic Gating (Silence low-volume non-speech)
        const gatedSamples = this.processDynamicGate(cleanedSamples);

        console.log('[NoiseReducer] Cleanup complete.');

        return {
            ...audio,
            samples: gatedSamples
        };
    }

    /**
     * Estimate the Noise Spectral Magnitude
     */
    private learnNoiseProfile(noiseSamples: Float32Array): Float32Array {
        const frames = this.frameSignal(noiseSamples);
        if (frames.length === 0) return new Float32Array(this.frameSize).fill(0);

        const accumulatedMag = new Float32Array(this.frameSize);

        for (const frame of frames) {
            const windowed = this.applyHanningWindow(frame);
            const fft = FFT.fft(windowed);
            const mag = this.computeMagnitude(fft);

            for (let i = 0; i < this.frameSize; i++) {
                accumulatedMag[i] += mag[i];
            }
        }

        // Average
        for (let i = 0; i < this.frameSize; i++) {
            accumulatedMag[i] /= frames.length;
        }

        return accumulatedMag;
    }

    private spectralSubtraction(signal: Float32Array, noiseMag: Float32Array): Float32Array {
        const frames = this.frameSignal(signal);
        const outputSignal = new Float32Array(signal.length);
        const windowSum = new Float32Array(signal.length); // For overlap-add normalization

        for (let i = 0; i < frames.length; i++) {
            const startIdx = i * this.hopSize;
            const frame = frames[i];

            // 1. Windowing
            const windowed = this.applyHanningWindow(frame);

            // 2. FFT
            const fft = FFT.fft(windowed);
            const mag = this.computeMagnitude(fft);
            const phase = this.computePhase(fft);

            // 3. Subtract Noise
            const cleanMag = new Float32Array(this.frameSize);
            for (let k = 0; k < this.frameSize; k++) {
                // Spectral Subtraction formula: |Y| - alpha * |N|
                // Rectified (cannot be negative)
                let val = mag[k] - this.oversubtractionFactor * noiseMag[k];

                // Spectral Floor (prevent musical noise artifacts by keeping a tiny bit of background)
                const flow = 0.01 * mag[k];
                cleanMag[k] = Math.max(val, flow);
            }

            // 4. Reconstruct Complex
            const cleanFFT = new Float32Array(this.frameSize * 2);
            for (let k = 0; k < this.frameSize; k++) {
                cleanFFT[k * 2] = cleanMag[k] * Math.cos(phase[k]);
                cleanFFT[k * 2 + 1] = cleanMag[k] * Math.sin(phase[k]);
            }

            // 5. IFFT
            const reconstructed = FFT.ifft(cleanFFT);

            // 6. Overlap-Add
            for (let j = 0; j < this.frameSize; j++) {
                if (startIdx + j < outputSignal.length) {
                    outputSignal[startIdx + j] += reconstructed[j];
                    // We technically need to divide by window sum, 
                    // but for Hanning 50% overlap, it sums to constant 1 if scaled right.
                    // For simplicity, we assume simple overlap-add requires generic handling or valid hop
                    // With 50% overlap Hanning, simple addition works reasonably well for reconstruction
                }
            }
        }

        return outputSignal;
    }

    private processDynamicGate(samples: Float32Array): Float32Array {
        // Simple gate: if energy is very low, silence it completely
        const gateThreshold = 0.005;
        const gated = new Float32Array(samples.length);

        for (let i = 0; i < samples.length; i++) {
            if (Math.abs(samples[i]) < gateThreshold) {
                gated[i] = 0;
            } else {
                gated[i] = samples[i];
            }
        }
        return gated;
    }

    // --- Helpers ---

    private frameSignal(signal: Float32Array): Float32Array[] {
        const frames: Float32Array[] = [];
        const numFrames = Math.floor((signal.length - this.frameSize) / this.hopSize);

        for (let i = 0; i < numFrames; i++) {
            const start = i * this.hopSize;
            // Use zero padding if close to end? We just ignore partial frames for simplicity in noise reduction
            // Or safer: copy to buffer
            const buffer = new Float32Array(this.frameSize);
            for (let j = 0; j < this.frameSize; j++) {
                if (start + j < signal.length) {
                    buffer[j] = signal[start + j];
                }
            }
            frames.push(buffer);
        }
        return frames;
    }

    private applyHanningWindow(frame: Float32Array): Float32Array {
        const output = new Float32Array(this.frameSize);
        for (let i = 0; i < this.frameSize; i++) {
            const multiplier = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.frameSize - 1)));
            output[i] = frame[i] * multiplier;
        }
        return output;
    }

    private computeMagnitude(fft: Float32Array): Float32Array {
        // fft is [r, i, r, i...]
        const mag = new Float32Array(this.frameSize);
        // Note: FFT.ts output size is NextPowerOf2 * 2. 
        // But here frameSize is powerOf2 (512). So it matches.
        for (let i = 0; i < this.frameSize; i++) {
            const r = fft[i * 2];
            const im = fft[i * 2 + 1];
            mag[i] = Math.sqrt(r * r + im * im);
        }
        return mag;
    }

    private computePhase(fft: Float32Array): Float32Array {
        const phase = new Float32Array(this.frameSize);
        for (let i = 0; i < this.frameSize; i++) {
            const r = fft[i * 2];
            const im = fft[i * 2 + 1];
            phase[i] = Math.atan2(im, r);
        }
        return phase;
    }
}
