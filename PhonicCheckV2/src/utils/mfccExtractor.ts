// src/utils/mfccExtractor.ts - Optimized MFCC extraction for React Native

import { MFCCFeatures } from '../types';

export class MFCCExtractor {
  private sampleRate: number;
  private frameSize: number;
  private hopSize: number;
  private numMFCC: number;
  private numFilters: number;
  private fftSize: number;
  private minFreq: number;
  private maxFreq: number;
  private melFilterbank: number[][];
  private dctMatrix: number[][];

  constructor(
    sampleRate: number = 16000,
    frameSize: number = 400,
    hopSize: number = 160,
    numMFCC: number = 13,
    numFilters: number = 26
  ) {
    this.sampleRate = sampleRate;
    this.frameSize = frameSize;
    this.hopSize = hopSize;
    this.numMFCC = numMFCC;
    this.numFilters = numFilters;
    this.fftSize = this.nextPowerOfTwo(frameSize);
    this.minFreq = 0;
    this.maxFreq = sampleRate / 2;
    
    // Pre-compute filterbank and DCT matrix
    this.melFilterbank = this.createMelFilterbank();
    this.dctMatrix = this.createDCTMatrix();
  }

  /**
   * Main extraction method - optimized for performance
   */
  public extract(audioSamples: Float32Array): MFCCFeatures {
    // 1. Frame the signal
    const frames = this.frameSignal(audioSamples);
    
    if (frames.length === 0) {
      return {
        coefficients: [],
        energy: [],
        delta: [],
        sampleRate: this.sampleRate,
        hopSize: this.hopSize,
      };
    }

    // 2. Apply Hamming window and compute power spectrum
    const powerSpectra: Float32Array[] = [];
    const energies: number[] = [];

    for (const frame of frames) {
      const windowed = this.applyHammingWindow(frame);
      const power = this.computePowerSpectrum(windowed);
      powerSpectra.push(power);
      energies.push(this.computeEnergy(frame));
    }

    // 3. Apply Mel filterbank
    const melSpectra = powerSpectra.map(spectrum => 
      this.applyFilterbank(spectrum)
    );

    // 4. Apply DCT to get MFCCs
    const mfccCoefficients = melSpectra.map(melSpectrum => 
      this.applyDCT(melSpectrum)
    );

    // 5. Compute delta features
    const delta = this.computeDelta(mfccCoefficients);

    return {
      coefficients: mfccCoefficients,
      energy: energies,
      delta,
      sampleRate: this.sampleRate,
      hopSize: this.hopSize,
    };
  }

  /**
   * Frame the signal into overlapping windows
   */
  private frameSignal(signal: Float32Array): Float32Array[] {
    const frames: Float32Array[] = [];
    const numFrames = Math.floor((signal.length - this.frameSize) / this.hopSize) + 1;

    for (let i = 0; i < numFrames; i++) {
      const start = i * this.hopSize;
      const end = start + this.frameSize;
      
      if (end <= signal.length) {
        frames.push(signal.slice(start, end));
      }
    }

    return frames;
  }

  /**
   * Apply Hamming window
   */
  private applyHammingWindow(frame: Float32Array): Float32Array {
    const windowed = new Float32Array(frame.length);
    const N = frame.length;

    for (let i = 0; i < N; i++) {
      windowed[i] = frame[i] * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1)));
    }

    return windowed;
  }

  /**
   * Compute power spectrum using FFT
   */
  private computePowerSpectrum(frame: Float32Array): Float32Array {
    // Zero-pad to FFT size
    const padded = new Float32Array(this.fftSize);
    padded.set(frame);

    // Compute FFT
    const fftResult = this.fft(padded);

    // Compute power spectrum
    const powerSpectrum = new Float32Array(this.fftSize / 2 + 1);
    for (let i = 0; i < powerSpectrum.length; i++) {
      const real = fftResult[i * 2];
      const imag = fftResult[i * 2 + 1];
      powerSpectrum[i] = real * real + imag * imag;
    }

    return powerSpectrum;
  }

  /**
   * Optimized FFT implementation (Cooley-Tukey)
   */
  private fft(signal: Float32Array): Float32Array {
    const n = signal.length;
    const output = new Float32Array(n * 2);

    // Copy input to output (interleaved real/imag)
    for (let i = 0; i < n; i++) {
      output[i * 2] = signal[i];
      output[i * 2 + 1] = 0;
    }

    // Bit-reversal permutation
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

    // FFT butterfly computation
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const step = (2 * Math.PI) / size;

      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const angle = step * j;
          const wReal = Math.cos(angle);
          const wImag = -Math.sin(angle);

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
   * Create Mel filterbank (pre-computed for efficiency)
   */
  private createMelFilterbank(): number[][] {
    const melPoints = this.linspace(
      this.hzToMel(this.minFreq),
      this.hzToMel(this.maxFreq),
      this.numFilters + 2
    );

    const hzPoints = melPoints.map(mel => this.melToHz(mel));
    const binPoints = hzPoints.map(hz => 
      Math.floor((this.fftSize + 1) * hz / this.sampleRate)
    );

    const filterbank: number[][] = [];

    for (let i = 1; i <= this.numFilters; i++) {
      const filter = new Array(this.fftSize / 2 + 1).fill(0);

      // Rising slope
      for (let j = binPoints[i - 1]; j < binPoints[i]; j++) {
        if (j < filter.length) {
          filter[j] = (j - binPoints[i - 1]) / (binPoints[i] - binPoints[i - 1]);
        }
      }

      // Falling slope
      for (let j = binPoints[i]; j < binPoints[i + 1]; j++) {
        if (j < filter.length) {
          filter[j] = (binPoints[i + 1] - j) / (binPoints[i + 1] - binPoints[i]);
        }
      }

      filterbank.push(filter);
    }

    return filterbank;
  }

  /**
   * Apply Mel filterbank to power spectrum
   */
  private applyFilterbank(powerSpectrum: Float32Array): number[] {
    const melSpectrum: number[] = [];

    for (const filter of this.melFilterbank) {
      let sum = 0;
      for (let i = 0; i < powerSpectrum.length; i++) {
        sum += powerSpectrum[i] * filter[i];
      }
      // Log compression (add small epsilon to avoid log(0))
      melSpectrum.push(Math.log(sum + 1e-10));
    }

    return melSpectrum;
  }

  /**
   * Create DCT matrix (pre-computed)
   */
  private createDCTMatrix(): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < this.numMFCC; i++) {
      const row: number[] = [];
      for (let j = 0; j < this.numFilters; j++) {
        row.push(Math.cos(Math.PI * i * (j + 0.5) / this.numFilters));
      }
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Apply DCT using pre-computed matrix
   */
  private applyDCT(melSpectrum: number[]): number[] {
    const mfcc: number[] = [];

    for (let i = 0; i < this.numMFCC; i++) {
      let sum = 0;
      for (let j = 0; j < melSpectrum.length; j++) {
        sum += melSpectrum[j] * this.dctMatrix[i][j];
      }
      mfcc.push(sum);
    }

    return mfcc;
  }

  /**
   * Compute frame energy
   */
  private computeEnergy(frame: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < frame.length; i++) {
      energy += frame[i] * frame[i];
    }
    return Math.log(energy + 1e-10);
  }

  /**
   * Compute delta (derivative) features
   */
  private computeDelta(features: number[][], n: number = 2): number[][] {
    const delta: number[][] = [];

    for (let t = 0; t < features.length; t++) {
      const deltaFrame: number[] = [];

      for (let i = 0; i < features[t].length; i++) {
        let numerator = 0;
        let denominator = 0;

        for (let j = 1; j <= n; j++) {
          const prevIdx = Math.max(0, t - j);
          const nextIdx = Math.min(features.length - 1, t + j);

          numerator += j * (features[nextIdx][i] - features[prevIdx][i]);
          denominator += 2 * j * j;
        }

        deltaFrame.push(denominator > 0 ? numerator / denominator : 0);
      }

      delta.push(deltaFrame);
    }

    return delta;
  }

  /**
   * Helper: Convert Hz to Mel scale
   */
  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  /**
   * Helper: Convert Mel to Hz scale
   */
  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  /**
   * Helper: Create linearly spaced array
   */
  private linspace(start: number, end: number, num: number): number[] {
    const result: number[] = [];
    const step = (end - start) / (num - 1);

    for (let i = 0; i < num; i++) {
      result.push(start + step * i);
    }

    return result;
  }

  /**
   * Helper: Find next power of 2
   */
  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
}

export default MFCCExtractor;
