import { mean, std } from './MathUtils';

/**
 * Apply Gaussian smoothing filter
 */
export const gaussianSmooth = (data: number[], sigma: number = 1.0): number[] => {
  const kernelRadius = Math.ceil(3 * sigma);
  const kernelSize = 2 * kernelRadius + 1;
  
  // Generate Gaussian kernel
  const kernel: number[] = [];
  let kernelSum = 0;
  
  for (let i = 0; i < kernelSize; i++) {
    const x = i - kernelRadius;
    const value = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(value);
    kernelSum += value;
  }
  
  // Normalize kernel
  const normalizedKernel = kernel.map(k => k / kernelSum);
  
  // Apply convolution
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let weightSum = 0;
    
    for (let j = 0; j < kernelSize; j++) {
      const dataIndex = i + j - kernelRadius;
      if (dataIndex >= 0 && dataIndex < data.length) {
        sum += data[dataIndex] * normalizedKernel[j];
        weightSum += normalizedKernel[j];
      }
    }
    
    result.push(sum / weightSum);
  }
  
  return result;
};

/**
 * Calculate power spectral density using basic periodogram
 */
export const powerSpectralDensity = (signal: number[], samplingRate: number): { frequencies: number[]; psd: number[] } => {
  const n = signal.length;
  if (n === 0) return { frequencies: [], psd: [] };
  
  // Simple DFT for tremor frequency analysis
  const halfN = Math.floor(n / 2);
  const frequencies: number[] = [];
  const psd: number[] = [];
  
  for (let k = 0; k < halfN; k++) {
    const freq = (k * samplingRate) / n;
    frequencies.push(freq);
    
    let real = 0;
    let imag = 0;
    
    for (let i = 0; i < n; i++) {
      const angle = -2 * Math.PI * k * i / n;
      real += signal[i] * Math.cos(angle);
      imag += signal[i] * Math.sin(angle);
    }
    
    const magnitude = Math.sqrt(real * real + imag * imag) / n;
    psd.push(magnitude * magnitude);
  }
  
  return { frequencies, psd };
};

/**
 * Detect tremor frequency from velocity signal
 */
export const detectTremorFrequency = (velocities: number[], samplingRate: number): { frequency: number; amplitude: number } => {
  if (velocities.length < 10) return { frequency: 0, amplitude: 0 };
  
  // Remove DC component
  const avg = mean(velocities);
  const centered = velocities.map(v => v - avg);
  
  const { frequencies, psd } = powerSpectralDensity(centered, samplingRate);
  
  // Find peak in tremor frequency range (3-12 Hz)
  let maxPower = 0;
  let maxFreq = 0;
  
  for (let i = 0; i < frequencies.length; i++) {
    if (frequencies[i] >= 3 && frequencies[i] <= 12) {
      if (psd[i] > maxPower) {
        maxPower = psd[i];
        maxFreq = frequencies[i];
      }
    }
  }
  
  const amplitude = Math.sqrt(maxPower);
  
  return { frequency: maxFreq, amplitude };
};

/**
 * Butterworth low-pass filter (simplified)
 */
export const lowPassFilter = (data: number[], cutoffFreq: number, samplingRate: number): number[] => {
  const RC = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / samplingRate;
  const alpha = dt / (RC + dt);
  
  const filtered: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    filtered.push(filtered[i - 1] + alpha * (data[i] - filtered[i - 1]));
  }
  
  return filtered;
};

/**
 * High-pass filter for removing drift
 */
export const highPassFilter = (data: number[], cutoffFreq: number, samplingRate: number): number[] => {
  const RC = 1.0 / (cutoffFreq * 2 * Math.PI);
  const dt = 1.0 / samplingRate;
  const alpha = RC / (RC + dt);
  
  const filtered: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    filtered.push(alpha * (filtered[i - 1] + data[i] - data[i - 1]));
  }
  
  return filtered;
};

/**
 * Calculate zero-crossing rate (frequency content indicator)
 */
export const zeroCrossingRate = (signal: number[]): number => {
  if (signal.length < 2) return 0;
  
  let crossings = 0;
  for (let i = 1; i < signal.length; i++) {
    if ((signal[i] >= 0 && signal[i - 1] < 0) || (signal[i] < 0 && signal[i - 1] >= 0)) {
      crossings++;
    }
  }
  
  return crossings / (signal.length - 1);
};

/**
 * Detect outliers using modified Z-score
 */
export const detectOutliers = (data: number[], threshold: number = 3.5): boolean[] => {
  const median = percentile50(data);
  const mad = medianAbsoluteDeviation(data, median);
  
  return data.map(value => {
    const modifiedZ = 0.6745 * (value - median) / (mad || 1);
    return Math.abs(modifiedZ) > threshold;
  });
};

const percentile50 = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const medianAbsoluteDeviation = (values: number[], median: number): number => {
  const deviations = values.map(v => Math.abs(v - median));
  return percentile50(deviations);
};

/**
 * Savitzky-Golay smoothing filter (simplified)
 */
export const savitzkyGolayFilter = (data: number[], windowSize: number = 5): number[] => {
  if (windowSize % 2 === 0) windowSize++;
  const halfWindow = Math.floor(windowSize / 2);
  
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length - 1, i + halfWindow);
    
    let sum = 0;
    let count = 0;
    
    for (let j = start; j <= end; j++) {
      sum += data[j];
      count++;
    }
    
    result.push(sum / count);
  }
  
  return result;
};

/**
 * Calculate autocorrelation (for pattern detection)
 */
export const autocorrelation = (signal: number[], lag: number): number => {
  if (signal.length <= lag) return 0;
  
  const n = signal.length - lag;
  const meanVal = mean(signal);
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (signal[i] - meanVal) * (signal[i + lag] - meanVal);
  }
  
  for (let i = 0; i < signal.length; i++) {
    denominator += Math.pow(signal[i] - meanVal, 2);
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * Calculate spectral entropy (complexity measure)
 */
export const spectralEntropy = (signal: number[], samplingRate: number): number => {
  const { psd } = powerSpectralDensity(signal, samplingRate);
  
  const sum = psd.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  
  const normalized = psd.map(p => p / sum);
  
  let entropy = 0;
  for (const p of normalized) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
};
