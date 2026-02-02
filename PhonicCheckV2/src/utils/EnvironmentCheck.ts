// src/utils/EnvironmentCheck.ts
// Titanium Standard: Environmental Signal-to-Noise Ratio (SNR) Analysis

import { AudioData } from '../types';

export interface EnvironmentReport {
    snr: number;        // Signal-to-Noise Ratio in dB
    isNoisy: boolean;   // Recommendation: Is it too noisy?
    noiseFloor: number; // RMS of background
    message: string;    // User-friendly feedback
}

export class EnvironmentCheck {
    private snrThreshold: number; // dB

    constructor(snrThreshold: number = 15) {
        this.snrThreshold = snrThreshold; // 15dB is a good minimum for speech recognition
    }

    /**
     * Analyze audio recording to determine environment quality
     * Expects a recording that contains some initial silence (noise) and then speech
     */
    public checkEnvironment(audio: AudioData): EnvironmentReport {
        const samples = audio.samples;

        // 1. Detect Voice Activity to separate Signal from Noise
        // Simple energy-based VAD (Voice Activity Detection)

        const frameSize = 512;
        const energies: number[] = [];

        for (let i = 0; i < samples.length; i += frameSize) {
            let sum = 0;
            let count = 0;
            for (let j = 0; j < frameSize && i + j < samples.length; j++) {
                sum += samples[i + j] * samples[i + j];
                count++;
            }
            if (count > 0) {
                energies.push(Math.sqrt(sum / count)); // RMS
            }
        }

        if (energies.length === 0) {
            return { snr: 0, isNoisy: true, noiseFloor: 0, message: "Audio too short." };
        }

        // 2. Determine Noise Floor (lowest 15% of energies) vs Signal (highest 15%)
        const sortedEnergies = [...energies].sort((a, b) => a - b);

        const noiseCount = Math.max(1, Math.floor(energies.length * 0.15));
        const signalCount = Math.max(1, Math.floor(energies.length * 0.15));

        // Average RMS of lowest frames
        let noiseSum = 0;
        for (let i = 0; i < noiseCount; i++) noiseSum += sortedEnergies[i];
        const noiseFloor = noiseSum / noiseCount;

        // Average RMS of highest frames (loudest speech)
        let signalSum = 0;
        for (let i = 0; i < signalCount; i++) signalSum += sortedEnergies[sortedEnergies.length - 1 - i];
        const signalLevel = signalSum / signalCount;

        // Avoid log(0)
        const noisePower = Math.max(noiseFloor, 0.000001);
        const signalPower = Math.max(signalLevel, 0.000001);

        // 3. Calculate SNR (dB) = 20 * log10(Signal_RMS / Noise_RMS)
        // Or 10 * log10(Signal_Power / Noise_Power) if squared, but we used RMS directly so 20.
        const snr = 20 * Math.log10(signalPower / noisePower);

        const isNoisy = snr < this.snrThreshold;

        let message = "Environment is quiet. Excellent.";
        if (snr < 10) {
            message = "Too noisy! Please move to a quieter room.";
        } else if (snr < 15) {
            message = "A bit noisy. Try to get closer to the microphone.";
        }

        // Check for absolute silence (mic broken)
        if (signalPower < 0.001) {
            message = "No sound detected. Check microphone permissions.";
            return { snr: 0, isNoisy: true, noiseFloor: 0, message };
        }

        return {
            snr: Math.round(snr),
            isNoisy,
            noiseFloor,
            message
        };
    }
}
