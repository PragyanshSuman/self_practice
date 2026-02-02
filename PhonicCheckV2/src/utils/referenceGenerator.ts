// src/utils/referenceGenerator.ts - Generate synthetic reference audio based on phonemes
import { AudioData } from '../types';

// Approximate formant frequencies for common phonemes (F1, F2, F3)
export const PHONEME_FORMANTS: Record<string, number[]> = {
    // Vowels
    'aa': [730, 1090, 2440],
    'ae': [660, 1720, 2410],
    'ah': [640, 1190, 2390],
    'ao': [570, 840, 2410],
    'aw': [570, 840, 2410], // Diphthong approximation
    'ay': [660, 1720, 2410],
    'eh': [530, 1840, 2480],
    'er': [490, 1350, 1690],
    'ey': [530, 1840, 2480],
    'ih': [390, 1990, 2550],
    'iy': [270, 2290, 3010],
    'ow': [570, 840, 2410],
    'oy': [570, 840, 2410],
    'uh': [440, 1020, 2240],
    'uw': [300, 870, 2240],

    // Consonants (Simulated with noise/bursts or different spectra)
    'b': [200, 0, 0], // Low freq burst
    'ch': [0, 2000, 0], // High freq noise
    'd': [200, 1500, 0],
    'dh': [200, 0, 0],
    'f': [0, 1500, 0], // Noise
    'g': [200, 2000, 0],
    'hh': [0, 0, 0], // Aspiration
    'jh': [0, 2000, 0],
    'k': [0, 2000, 0], // Burst
    'l': [400, 1000, 2500],
    'm': [250, 1000, 2500],
    'n': [250, 1500, 2500],
    'ng': [250, 2000, 2500],
    'p': [0, 0, 0], // Silence -> Burst
    'r': [400, 1200, 1600],
    's': [0, 4000, 0], // High freq noise
    'sh': [0, 2500, 0],
    't': [0, 3000, 0],
    'th': [0, 2000, 0],
    'v': [200, 1500, 0],
    'w': [300, 800, 2200],
    'y': [270, 2290, 3010],
    'z': [200, 4000, 0],
    'zh': [200, 2500, 0],
};

export class ReferenceGenerator {
    private sampleRate = 16000;
    private targetF0 = 120; // Default Adult Male

    public setAge(age: number) {
        // Child (5-8): ~300Hz
        // Child (9-12): ~250Hz
        // Teen/Adult: ~120-180Hz
        if (age < 9) this.targetF0 = 300;
        else if (age < 13) this.targetF0 = 250;
        else this.targetF0 = 120;
    }

    public generateReference(word: string, phonemes: string[]): AudioData {
        const samples: number[] = [];

        // Silence start
        this.addSilence(samples, 0.1);

        for (const phoneme of phonemes) {
            const p = phoneme.toLowerCase();
            const formants = PHONEME_FORMANTS[p] || PHONEME_FORMANTS['ah']; // Default to 'ah'
            const duration = this.getDuration(p);

            this.addPhoneme(samples, formants, duration, p);
        }

        // Silence end
        this.addSilence(samples, 0.1);

        return {
            path: 'synthetic_reference',
            duration: samples.length / this.sampleRate,
            sampleRate: this.sampleRate,
            samples: new Float32Array(samples),
        };
    }

    private getDuration(phoneme: string): number {
        const vowels = ['aa', 'ae', 'ah', 'ao', 'aw', 'ay', 'eh', 'er', 'ey', 'ih', 'iy', 'ow', 'oy', 'uh', 'uw'];
        if (vowels.includes(phoneme)) return 0.2; // 200ms for vowels
        if (['s', 'sh', 'th', 'f', 'z', 'zh', 'v'].includes(phoneme)) return 0.15; // Fricatives
        return 0.08; // Plosives/others (short)
    }

    private addSilence(samples: number[], duration: number) {
        const numSamples = Math.floor(duration * this.sampleRate);
        for (let i = 0; i < numSamples; i++) samples.push(0);
    }

    private addPhoneme(samples: number[], formants: number[], duration: number, phoneme: string) {
        const numSamples = Math.floor(duration * this.sampleRate);
        const startIdx = samples.length;

        // Simple formant synthesis + noise for consonants
        const isFricative = ['s', 'sh', 'f', 'th', 'h'].some(c => phoneme.includes(c));
        const isVoiced = !['p', 't', 'k', 's', 'sh', 'f', 'h'].some(c => phoneme === c);

        for (let i = 0; i < numSamples; i++) {
            let sample = 0;
            const t = i / this.sampleRate;

            if (isVoiced) {
                // Fundamental freq (pitch) - Adaptive based on age
                const f0 = this.targetF0;

                // Add harmonics (simulating formants roughly by adding sines)
                // Boost the first formant for clearer vowel shape
                sample += Math.sin(2 * Math.PI * f0 * t) * 0.5; // Base
                if (formants[0]) sample += Math.sin(2 * Math.PI * formants[0] * t) * 0.4;
                if (formants[1]) sample += Math.sin(2 * Math.PI * formants[1] * t) * 0.2;
                if (formants[2]) sample += Math.sin(2 * Math.PI * formants[2] * t) * 0.1;
            }

            if (isFricative) {
                // Add white/colored noise
                sample += (Math.random() * 2 - 1) * 0.3;
            }

            // Apply envelope (attack/decay) to avoid clicks
            const envelope = this.getEnvelope(i, numSamples);
            samples.push(sample * envelope);
        }
    }

    private getEnvelope(index: number, length: number): number {
        const attack = Math.min(index, 400) / 400;
        const decay = Math.min(length - index, 400) / 400;
        return Math.min(attack, decay);
    }
}
