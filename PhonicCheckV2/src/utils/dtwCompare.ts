// src/utils/dtwCompare.ts - Dynamic Time Warping with optimizations

import { DTWResult, MFCCFeatures } from '../types';

export class DTWComparator {
  private windowSize: number;

  constructor(windowSize: number = 50) {
    this.windowSize = windowSize; // Sakoe-Chiba band constraint
  }

  /**
   * Compare two MFCC feature sets
   */
  public compare(features1: MFCCFeatures, features2: MFCCFeatures): DTWResult {
    const seq1 = this.flattenFeatures(features1);
    const seq2 = this.flattenFeatures(features2);

    if (seq1.length === 0 || seq2.length === 0) {
      return {
        distance: Infinity,
        similarity: 0,
        path: [],
        normalizedDistance: 1,
      };
    }

    const { distance, path } = this.computeDTW(seq1, seq2);

    // Normalize distance
    const maxLen = Math.max(seq1.length, seq2.length);
    const normalizedDistance = distance / maxLen;

    // Encouraging Scoring for Dyslexia (CALIBRATED):
    // Distance of ~250 -> 37 (Fail).
    // Distance of ~50 -> 87 (Pass).
    const similarity = Math.max(0, 100 - (normalizedDistance / 4));

    console.log(`[DTW] Dist=${distance.toFixed(2)}, NormDist=${normalizedDistance.toFixed(2)}, Sim=${similarity}`);

    return {
      distance,
      similarity,
      path,
      normalizedDistance,
    };
  }

  /**
   * Flatten MFCC features into sequence of vectors
   */
  private flattenFeatures(features: MFCCFeatures): number[][] {
    const flattened: number[][] = [];

    for (let i = 0; i < features.coefficients.length; i++) {
      const frame: number[] = [
        ...features.coefficients[i],
        features.energy[i],
        ...(features.delta[i] || []),
      ];
      flattened.push(frame);
    }

    return flattened;
  }

  /**
   * Compute DTW distance with Sakoe-Chiba band optimization
   */
  private computeDTW(
    seq1: number[][],
    seq2: number[][]
  ): { distance: number; path: Array<[number, number]> } {
    const n = seq1.length;
    const m = seq2.length;

    // Initialize DTW matrix with Infinity
    const dtw: number[][] = Array(n + 1)
      .fill(0)
      .map(() => Array(m + 1).fill(Infinity));

    dtw[0][0] = 0;

    // Sakoe-Chiba Verification (15% constraint)
    // Limits the path to stay near the diagonal to prevent "infinite stretching" of words
    const window = Math.max(Math.abs(n - m), Math.floor(Math.max(n, m) * 0.15));

    // Penalties for warping (off-diagonal moves)
    const warpPenalty = 2.0;

    for (let i = 1; i <= n; i++) {
      const jMin = Math.max(1, i - window);
      const jMax = Math.min(m, i + window);

      for (let j = jMin; j <= jMax; j++) {
        const cost = this.euclideanDistance(seq1[i - 1], seq2[j - 1]);

        dtw[i][j] = cost + Math.min(
          dtw[i - 1][j] + warpPenalty,     // insertion (warp)
          dtw[i][j - 1] + warpPenalty,     // deletion (warp)
          dtw[i - 1][j - 1]                // match (diagonal)
        );
      }
    }

    // Backtrack to find optimal path
    const path: Array<[number, number]> = [];
    let i = n;
    let j = m;

    while (i > 0 && j > 0) {
      path.unshift([i - 1, j - 1]);

      const values = [
        { val: dtw[i - 1][j - 1], di: -1, dj: -1 },
        { val: dtw[i - 1][j], di: -1, dj: 0 },
        { val: dtw[i][j - 1], di: 0, dj: -1 },
      ];

      const min = values.reduce((prev, curr) =>
        curr.val < prev.val ? curr : prev
      );

      i += min.di;
      j += min.dj;
    }

    return {
      distance: dtw[n][m],
      path,
    };
  }

  /**
   * Euclidean distance between two feature vectors
   */
  private euclideanDistance(vec1: number[], vec2: number[]): number {
    let sum = 0;
    const len = Math.min(vec1.length, vec2.length);

    for (let i = 0; i < len; i++) {
      const diff = vec1[i] - vec2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Compare specific regions (for phoneme/syllable analysis)
   */
  public compareRegion(
    features1: MFCCFeatures,
    features2: MFCCFeatures,
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): number {
    // Extract region
    const region1 = this.extractRegion(features1, start1, end1);
    const region2 = this.extractRegion(features2, start2, end2);

    if (region1.coefficients.length === 0 || region2.coefficients.length === 0) {
      return 0;
    }

    const result = this.compare(region1, region2);
    return result.similarity;
  }

  /**
   * Extract feature region
   */
  private extractRegion(
    features: MFCCFeatures,
    start: number,
    end: number
  ): MFCCFeatures {
    const clampedStart = Math.max(0, start);
    const clampedEnd = Math.min(features.coefficients.length, end);

    return {
      coefficients: features.coefficients.slice(clampedStart, clampedEnd),
      energy: features.energy.slice(clampedStart, clampedEnd),
      delta: features.delta.slice(clampedStart, clampedEnd),
      deltaDelta: features.deltaDelta?.slice(clampedStart, clampedEnd) || [],
      sampleRate: features.sampleRate,
      hopSize: features.hopSize,
    };
  }
}

export default DTWComparator;
