// src/utils/audioProcessor.ts - Process audio files and extract PCM data

import RNFS from 'react-native-fs';
import { AudioData } from '../types';

export class AudioProcessor {
  private sampleRate: number = 16000;

  /**
   * Load audio file and convert to Float32Array PCM samples
   */
  public async loadAudioFile(filePath: string): Promise<AudioData> {
    try {
      // Read audio file as base64
      const base64Audio = await RNFS.readFile(filePath, 'base64');

      // Decode base64 to binary
      const binaryString = this.base64ToArrayBuffer(base64Audio);

      // Parse WAV file
      const audioData = this.parseWavFile(binaryString);

      const maxAmp = Math.max(...audioData.samples.map(Math.abs));
      console.log(`[AudioProcessor] Raw Audio: Samples=${audioData.samples.length}, MaxAmp=${maxAmp.toFixed(4)}`);

      return {
        path: filePath,
        duration: audioData.samples.length / this.sampleRate,
        sampleRate: this.sampleRate,
        samples: audioData.samples,
      };
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw new Error(`Failed to load audio: ${error}`);
    }
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    console.log('[AudioProcessor] Converting base64 to ArrayBuffer, length:', base64.length);
    const binaryString = require('buffer').Buffer.from(base64, 'base64').toString('binary');
    const len = binaryString.length;
    console.log('[AudioProcessor] Binary string length:', len);
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  }

  /**
   * Parse WAV file format and extract PCM samples
   */
  private parseWavFile(arrayBuffer: ArrayBuffer): { samples: Float32Array; sampleRate: number } {
    const dataView = new DataView(arrayBuffer);

    // Verify WAV format (RIFF header)
    const riff = String.fromCharCode(
      dataView.getUint8(0),
      dataView.getUint8(1),
      dataView.getUint8(2),
      dataView.getUint8(3)
    );

    if (riff !== 'RIFF') {
      throw new Error('Invalid WAV file: Missing RIFF header');
    }

    // Get sample rate (bytes 24-27)
    const sampleRate = dataView.getUint32(24, true);
    this.sampleRate = sampleRate;

    // Get bits per sample (bytes 34-35)
    const bitsPerSample = dataView.getUint16(34, true);

    // Find data chunk
    let offset = 12;
    let dataChunkSize = 0;

    while (offset < arrayBuffer.byteLength) {
      const chunkId = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3)
      );

      const chunkSize = dataView.getUint32(offset + 4, true);

      if (chunkId === 'data') {
        dataChunkSize = chunkSize;
        offset += 8;
        break;
      }

      offset += 8 + chunkSize;
    }

    // Extract PCM samples
    const numSamples = dataChunkSize / (bitsPerSample / 8);
    const samples = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      let sample = 0;

      if (bitsPerSample === 16) {
        sample = dataView.getInt16(offset + i * 2, true) / 32768.0;
      } else if (bitsPerSample === 8) {
        sample = (dataView.getUint8(offset + i) - 128) / 128.0;
      } else if (bitsPerSample === 32) {
        sample = dataView.getInt32(offset + i * 4, true) / 2147483648.0;
      }

      samples[i] = sample;
    }

    // Resample to 16kHz if needed
    if (sampleRate !== 16000) {
      return { samples: this.resample(samples, sampleRate, 16000), sampleRate: 16000 };
    }

    return { samples, sampleRate };
  }

  /**
   * Resample audio to target sample rate
   */
  private resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const newLength = Math.round(samples.length / ratio);
    const resampled = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.ceil(srcIndex);

      if (srcIndexCeil >= samples.length) {
        resampled[i] = samples[srcIndexFloor];
      } else {
        const fraction = srcIndex - srcIndexFloor;
        resampled[i] = samples[srcIndexFloor] * (1 - fraction) + samples[srcIndexCeil] * fraction;
      }
    }

    return resampled;
  }

  /**
   * Normalize audio samples to range [-1, 1]
   */
  public normalize(samples: Float32Array): Float32Array {
    const max = Math.max(...Array.from(samples).map(Math.abs));
    if (max === 0) return samples;

    const normalized = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      normalized[i] = samples[i] / max;
    }

    return normalized;
  }

  /**
   * Trim silence from start and end
   */
  public trimSilence(samples: Float32Array, threshold: number = 0.005): Float32Array {
    let start = 0;
    let end = samples.length - 1;

    // Find start
    while (start < samples.length && Math.abs(samples[start]) < threshold) {
      start++;
    }

    // Find end
    while (end > start && Math.abs(samples[end]) < threshold) {
      end--;
    }

    return samples.slice(start, end + 1);
  }

  /**
   * Apply pre-emphasis filter
   */
  public preEmphasis(samples: Float32Array, alpha: number = 0.97): Float32Array {
    const emphasized = new Float32Array(samples.length);
    emphasized[0] = samples[0];

    for (let i = 1; i < samples.length; i++) {
      emphasized[i] = samples[i] - alpha * samples[i - 1];
    }

    return emphasized;
  }

  /**
   * Calculate RMS energy
   */
  public calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Detect voice activity
   */
  public detectVoiceActivity(samples: Float32Array, threshold: number = 0.02): boolean {
    const rms = this.calculateRMS(samples);
    return rms > threshold;
  }
}

export default AudioProcessor;
