// src/utils/FFT.ts
// Optimized FFT implementation (Cooley-Tukey) for React Native

export class FFT {
    /**
     * Compute Forward FFT
     * Input: Real-valued signal
     * Output: Interleaved Real/Imaginary array [r0, i0, r1, i1, ...]
     */
    public static fft(signal: Float32Array): Float32Array {
        const n = signal.length;
        // Round up to next power of 2 if needed (or assume caller handles padding)
        // For simplicity here, we assume n is power of 2 or we pad
        const m = this.nextPowerOfTwo(n);
        const output = new Float32Array(m * 2);

        // Copy input
        for (let i = 0; i < n; i++) {
            output[i * 2] = signal[i];
        }

        // Bit-reverse
        let j = 0;
        for (let i = 0; i < m; i++) {
            if (i < j) {
                [output[i * 2], output[j * 2]] = [output[j * 2], output[i * 2]];
                [output[i * 2 + 1], output[j * 2 + 1]] = [output[j * 2 + 1], output[i * 2 + 1]];
            }
            let k = m / 2;
            while (k <= j) {
                j -= k;
                k /= 2;
            }
            j += k;
        }

        // Butterfly
        for (let size = 2; size <= m; size *= 2) {
            const halfSize = size / 2;
            const step = -2 * Math.PI / size; // Negative for Forward FFT

            for (let i = 0; i < m; i += size) {
                for (let j = 0; j < halfSize; j++) {
                    const angle = step * j;
                    const wReal = Math.cos(angle);
                    const wImag = Math.sin(angle);

                    const evenIdx = (i + j) * 2;
                    const oddIdx = (i + j + halfSize) * 2;

                    const tReal = output[oddIdx] * wReal - output[oddIdx + 1] * wImag;
                    const tImag = output[oddIdx] * wImag + output[oddIdx + 1] * wReal;

                    output[oddIdx] = output[evenIdx] - tReal;
                    output[oddIdx + 1] = output[evenIdx + 1] - tImag;

                    output[evenIdx] += tReal;
                    output[evenIdx + 1] += tImag;
                }
            }
        }

        return output;
    }

    /**
     * Compute Inverse FFT
     * Input: Interleaved Real/Imaginary array
     * Output: Real-valued signal (taking Real part of result)
     */
    public static ifft(complexSignal: Float32Array): Float32Array {
        const n = complexSignal.length / 2;
        const output = new Float32Array(n * 2);

        // Copy input
        output.set(complexSignal);

        // Conjugate input (part of IFFT trick using FFT alg)
        for (let i = 0; i < n; i++) {
            output[i * 2 + 1] = -output[i * 2 + 1];
        }

        // Run FFT (which is effectively inverse due to Conjugate trick + scaling)
        // Wait, standard trick is: IFFT(x) = conj(FFT(conj(x))) / N

        // We can reuse the FFT logic but flip the angle sign. 
        // Or just implement directly carefully.

        // Let's manually implement IFFT butterfly (same as FFT but Positive Angle)

        // Bit-reverse
        let j = 0;
        for (let i = 0; i < n; i++) {
            if (i < j) {
                [output[i * 2], output[j * 2]] = [output[j * 2], output[i * 2]];
                [output[i * 2 + 1], output[j * 2 + 1]] = [output[j * 2 + 1], output[i * 2 + 1]];
            }
            let k = n / 2;
            while (k <= j) {
                j -= k;
                k /= 2;
            }
            j += k;
        }

        for (let size = 2; size <= n; size *= 2) {
            const halfSize = size / 2;
            const step = 2 * Math.PI / size; // POSITIVE for Inverse

            for (let i = 0; i < n; i += size) {
                for (let j = 0; j < halfSize; j++) {
                    const angle = step * j;
                    const wReal = Math.cos(angle);
                    const wImag = Math.sin(angle);

                    const evenIdx = (i + j) * 2;
                    const oddIdx = (i + j + halfSize) * 2;

                    const tReal = output[oddIdx] * wReal - output[oddIdx + 1] * wImag;
                    const tImag = output[oddIdx] * wImag + output[oddIdx + 1] * wReal;

                    output[oddIdx] = output[evenIdx] - tReal;
                    output[oddIdx + 1] = output[evenIdx + 1] - tImag;

                    output[evenIdx] += tReal;
                    output[evenIdx + 1] += tImag;
                }
            }
        }

        // Scale by N and take real part
        const result = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            result[i] = output[i * 2] / n;
        }

        return result;
    }

    private static nextPowerOfTwo(n: number): number {
        return Math.pow(2, Math.ceil(Math.log2(n)));
    }
}
