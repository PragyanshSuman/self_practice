// src/utils/FormantAnalyzer.ts
// Diamond Standard: Bio-Physical Articulation Analysis using LPC

import { AudioData } from '../types';
import { AudioProcessor } from './audioProcessor';

interface FormantResult {
    f1: number;
    f2: number;
    f3: number;
    bandwidths: number[];
    isVowel: boolean;
    vowelQuality: string; // e.g., "Front-High"
}

interface Complex {
    re: number;
    im: number;
}

export class FormantAnalyzer {
    private order: number;
    private sampleRate: number;
    private vtlnFactor: number; // Vocal Tract Length Normalization (Child ~ 1.25)

    constructor(sampleRate: number = 16000, order: number = 12) {
        this.sampleRate = sampleRate;
        this.order = order; // Order 12 is good for 16kHz
        this.vtlnFactor = 1.0;
    }

    public setAge(age: number) {
        // Child (5-8): ~1.3
        // Child (9-12): ~1.15
        // Adult: 1.0
        if (age < 9) this.vtlnFactor = 1.3;
        else if (age < 13) this.vtlnFactor = 1.15;
        else this.vtlnFactor = 1.0;
        console.log(`[FormantAnalyzer] VTLN Factor set to ${this.vtlnFactor} for age ${age}`);
    }

    public analyze(frame: Float32Array): FormantResult {
        // 1. Pre-emphasis
        const preemph = this.preEmphasis(frame);

        // 2. Windowing (Hamming)
        const windowed = this.applyWindow(preemph);

        // 3. LPC Analysis (Levinson-Durbin)
        const lpcCoeffs = this.computeLPC(windowed, this.order);

        // 4. Root Solving (Durand-Kerner method)
        // LPC polynomial: 1 + a1*z^-1 + ... + ap*z^-p = 0
        const roots = this.findRoots(lpcCoeffs);

        // 5. Convert Roots to Frequencies
        const formants = this.extractFormants(roots);

        // 6. Sort and Filter
        // Basic check: F1 usually 200-1000Hz, F2 800-2500Hz
        const validFormants = formants
            .filter(f => f.freq > 90 && f.bandwidth < 400) // Filter by bandwidth (sharp peaks)
            .sort((a, b) => a.freq - b.freq);

        const f1 = validFormants[0]?.freq || 0;
        const f2 = validFormants[1]?.freq || 0;
        const f3 = validFormants[2]?.freq || 0;

        // 7. Normalize (VTLN) - Invert scaling to match Reference (Adult) space
        // If child F1 is 1000 (high), and factor is 1.25, Adult equivalent is 800.
        const normF1 = f1 / this.vtlnFactor;
        const normF2 = f2 / this.vtlnFactor;

        return {
            f1: normF1,
            f2: normF2,
            f3: f3 / this.vtlnFactor,
            bandwidths: [validFormants[0]?.bandwidth || 0, validFormants[1]?.bandwidth || 0],
            isVowel: f1 > 200 && f2 > 800,
            vowelQuality: this.classifyVowel(normF1, normF2)
        };
    }

    private preEmphasis(signal: Float32Array): Float32Array {
        const out = new Float32Array(signal.length);
        out[0] = signal[0];
        for (let i = 1; i < signal.length; i++) {
            out[i] = signal[i] - 0.97 * signal[i - 1];
        }
        return out;
    }

    private applyWindow(signal: Float32Array): Float32Array {
        const out = new Float32Array(signal.length);
        for (let i = 0; i < signal.length; i++) {
            out[i] = signal[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (signal.length - 1)));
        }
        return out;
    }

    /**
     * Levinson-Durbin Recursion
     * Returns predictor coefficients [1, a1, a2, ... ap]
     */
    private computeLPC(signal: Float32Array, order: number): number[] {
        const n = signal.length;

        // Autocorrelation
        const r = new Float32Array(order + 1);
        for (let k = 0; k <= order; k++) {
            let sum = 0;
            for (let i = 0; i < n - k; i++) sum += signal[i] * signal[i + k];
            r[k] = sum;
        }

        // Recursion
        const a = new Float32Array(order + 1);
        a.fill(0);
        a[0] = 1;

        let e = r[0]; // Error energy

        for (let k = 1; k <= order; k++) {
            let lambda = 0;
            for (let j = 0; j < k; j++) lambda -= a[j] * r[k - j];
            lambda /= e;

            // Update coefficients
            for (let j = 0; j < (k + 1) / 2; j++) {
                const temp = a[k - j] + lambda * a[j];
                a[j] = a[j] + lambda * a[k - j];
                a[k - j] = temp;
            }
            a[k] = lambda;
            e *= (1 - lambda * lambda);
        }

        return Array.from(a);
    }

    /**
     * Find roots of polynomial using Durand-Kerner method
     * Poly: P(z) = x^n + a1*x^(n-1) + ... + an = 0
     * Note: LPC is 1 + a1*z^-1... multiply by z^p to get z^p + a1*z^(p-1)...
     */
    private findRoots(lpcCoeffs: number[]): Complex[] {
        const p = lpcCoeffs.length - 1;
        // Initial guess: Roots unity circle
        const roots: Complex[] = [];
        for (let i = 0; i < p; i++) {
            const angle = 2 * Math.PI * i / p + 0.1; // Offset slightly
            // Initial magnitude slightly less than 1 for stability
            roots.push({ re: 0.9 * Math.cos(angle), im: 0.9 * Math.sin(angle) });
        }

        // Iterations
        const iterations = 20;
        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < p; i++) {
                // Evaluate P(z)
                // P(z) = z^p + a1*z^(p-1) + ... + ap
                let topRe = 1.0;
                let topIm = 0.0;

                // Horner's method or direct sum
                // We'll do direct sum for clarity given complex math
                // Current z = roots[i]
                let zRe = 1.0;
                let zIm = 0.0;

                let valRe = 0.0;
                let valIm = 0.0;

                // Calc value of polynomial at roots[i]
                // Coeffs are [1, a1, a2...] mapping to z^p, z^(p-1)...
                for (let j = 0; j <= p; j++) {
                    const coeff = lpcCoeffs[j];
                    // Need power z^(p-j)
                    const power = p - j;
                    const pz = this.complexPow(roots[i], power);
                    valRe += coeff * pz.re;
                    valIm += coeff * pz.im;
                }

                // Product term: (z - root[j]) for j != i
                let denomRe = 1.0;
                let denomIm = 0.0;

                for (let j = 0; j < p; j++) {
                    if (i === j) continue;
                    const diffRe = roots[i].re - roots[j].re;
                    const diffIm = roots[i].im - roots[j].im;

                    // Multiply denom by diff
                    const tempRe = denomRe * diffRe - denomIm * diffIm;
                    const tempIm = denomRe * diffIm + denomIm * diffRe;
                    denomRe = tempRe;
                    denomIm = tempIm;
                }

                // Update root[i] -= P(z) / Product
                // Division
                const divDenom = denomRe * denomRe + denomIm * denomIm;
                const deltaRe = (valRe * denomRe + valIm * denomIm) / divDenom;
                const deltaIm = (valIm * denomRe - valRe * denomIm) / divDenom;

                roots[i].re -= deltaRe;
                roots[i].im -= deltaIm;
            }
        }

        return roots;
    }

    private complexPow(c: Complex, n: number): Complex {
        const r = Math.sqrt(c.re * c.re + c.im * c.im);
        const theta = Math.atan2(c.im, c.re);
        const rn = Math.pow(r, n);
        const thetan = theta * n;
        return { re: rn * Math.cos(thetan), im: rn * Math.sin(thetan) };
    }

    private extractFormants(roots: Complex[]): { freq: number, bandwidth: number }[] {
        const formants = [];
        for (const r of roots) {
            if (r.im < 0) continue; // Conjugate pairs, take positive freq

            const mag = Math.sqrt(r.re * r.re + r.im * r.im);
            const arg = Math.atan2(r.im, r.re);

            const freq = (arg * this.sampleRate) / (2 * Math.PI);
            const bandwidth = -Math.log(mag) * (this.sampleRate / Math.PI);

            formants.push({ freq, bandwidth });
        }
        return formants;
    }

    private classifyVowel(f1: number, f2: number): string {
        // Simplified Vowel Quadrilateral (Adult Male Reference - normalized target)
        if (f1 < 350) {
            if (f2 > 2200) return 'High-Front (i)';
            if (f2 < 1000) return 'High-Back (u)';
        }
        if (f1 > 700) {
            if (f2 < 1500) return 'Low (a/ae)';
        }
        return 'Mid';
    }
}
