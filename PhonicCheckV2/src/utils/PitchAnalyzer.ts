// src/utils/PitchAnalyzer.ts
// Platinum Standard: Prosody & Expression Analysis

import { AudioData } from '../types';

export interface PitchResult {
    averagePitch: number;
    pitchRange: number;
    isMonotone: boolean; // Robot voice detection
    confidence: number;
    microPauses: number; // Count of unnatural pauses
    feedback: string;
}

export class PitchAnalyzer {
    private sampleRate: number;
    private minFreq: number = 75;  // Hz (Adult Male low)
    private maxFreq: number = 600; // Hz (Child high)

    constructor(sampleRate: number = 16000) {
        this.sampleRate = sampleRate;
    }

    public analyze(audio: AudioData): PitchResult {
        const samples = audio.samples;
        const frameSize = 1024; // ~64ms for good pitch resolution
        const hopSize = 512;

        const pitches: number[] = [];
        const confidences: number[] = [];

        // 1. F0 Extraction (YIN-like Autocorrelation)
        for (let i = 0; i < samples.length - frameSize; i += hopSize) {
            const frame = samples.slice(i, i + frameSize);
            const pitch = this.detectPitch(frame);
            if (pitch > 0) {
                pitches.push(pitch);
                confidences.push(1.0); // Simplified confidence
            }
        }

        if (pitches.length === 0) {
            return {
                averagePitch: 0,
                pitchRange: 0,
                isMonotone: true,
                confidence: 0,
                microPauses: 0,
                feedback: "No voice detected."
            };
        }

        // 2. Statistics
        const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
        const minP = Math.min(...pitches);
        const maxP = Math.max(...pitches);
        const range = maxP - minP;

        // Std Dev for Monotone Check
        const variance = pitches.reduce((a, b) => a + Math.pow(b - avgPitch, 2), 0) / pitches.length;
        const stdDev = Math.sqrt(variance);

        // 3. Monotone Check
        // Normal speech has semitone variations.
        // If stdDev is very low (< 20Hz approx for kids), it's robotic.
        const isMonotone = stdDev < 15;

        // 4. Micro-Pause Detection
        // Use energy profile to find gaps > 150ms inside the speech block
        const microPauses = this.detectMicroPauses(samples);

        let feedback = "Great expression!";
        if (isMonotone) feedback = "Try to speak with more feeling! Don't be a robot.";
        if (microPauses > 2) feedback = "Try to say the word smoothly without stopping.";

        return {
            averagePitch: Math.round(avgPitch),
            pitchRange: Math.round(range),
            isMonotone,
            confidence: 0.9,
            microPauses,
            feedback
        };
    }

    private detectPitch(frame: Float32Array): number {
        // Simple Autocorrelation
        const n = frame.length;
        const correlations = new Float32Array(n);

        // Compute ACF
        for (let lag = 0; lag < n / 2; lag++) {
            let sum = 0;
            for (let i = 0; i < n - lag; i++) {
                sum += frame[i] * frame[i + lag];
            }
            correlations[lag] = sum;
        }

        // Find peak in valid range
        // Lag = SampleRate / Freq
        const minLag = Math.floor(this.sampleRate / this.maxFreq);
        const maxLag = Math.floor(this.sampleRate / this.minFreq);

        let maxVal = -Infinity;
        let peakLag = -1;

        // Simple peak picking
        for (let lag = minLag; lag <= maxLag; lag++) {
            if (correlations[lag] > maxVal) {
                maxVal = correlations[lag];
                peakLag = lag;
            }
        }

        // Threshold to avoid noise
        if (maxVal < 0.1 * correlations[0]) return 0; // Unvoiced/Noise

        return this.sampleRate / peakLag;
    }

    private detectMicroPauses(samples: Float32Array): number {
        // RMS envelope
        const frameSize = 256; // 16ms
        const energies = [];
        for (let i = 0; i < samples.length; i += frameSize) {
            let sum = 0;
            for (let j = 0; j < frameSize && i + j < samples.length; j++) sum += samples[i + j] * samples[i + j];
            energies.push(Math.sqrt(sum / frameSize));
        }

        // Threshold
        const maxE = Math.max(...energies);
        const threshold = maxE * 0.1;

        let pauseFrames = 0;
        let pauseCount = 0;
        let inPause = false;

        // Skip initial silence
        let startIndex = 0;
        while (startIndex < energies.length && energies[startIndex] < threshold) startIndex++;

        // Skip end silence
        let endIndex = energies.length - 1;
        while (endIndex > startIndex && energies[endIndex] < threshold) endIndex--;

        for (let i = startIndex; i <= endIndex; i++) {
            if (energies[i] < threshold) {
                pauseFrames++;
            } else {
                if (pauseFrames > 0) {
                    // 16ms * frames
                    const durationMs = pauseFrames * 16;
                    if (durationMs > 150) { // > 150ms pause
                        pauseCount++;
                    }
                    pauseFrames = 0;
                }
            }
        }

        return pauseCount;
    }
}
