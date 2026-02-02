// src/utils/syllableSplitter.ts - Dynamic syllable analysis

import { SyllableScore, MFCCFeatures, PhonemeScore } from '../types';
import { DTWComparator } from './dtwCompare';

export class SyllableSplitter {
  private dtwComparator: DTWComparator;

  constructor() {
    this.dtwComparator = new DTWComparator();
  }

  /**
   * Analyze syllable-level pronunciation
   */
  public analyzeSyllables(
    referenceFeatures: MFCCFeatures,
    userFeatures: MFCCFeatures,
    syllables: string[],
    phonemeScores: PhonemeScore[]
  ): SyllableScore[] {
    const syllableScores: SyllableScore[] = [];

    // Distribute phonemes across syllables
    const phonemesPerSyllable = this.distributePhonemes(syllables, phonemeScores);

    // Calculate frames per syllable
    const totalFrames = referenceFeatures.coefficients.length;
    const framesPerSyllable = totalFrames / syllables.length;

    for (let i = 0; i < syllables.length; i++) {
      const syllable = syllables[i];
      const startFrame = Math.floor(i * framesPerSyllable);
      const endFrame = Math.floor((i + 1) * framesPerSyllable);

      // Compare syllable region
      const score = this.dtwComparator.compareRegion(
        referenceFeatures,
        userFeatures,
        startFrame,
        endFrame,
        Math.max(0, startFrame - 10),
        Math.min(userFeatures.coefficients.length, endFrame + 10)
      );

      const syllablePhonemes = phonemesPerSyllable[i] || [];
      const needsPractice = score < 70;

      syllableScores.push({
        syllable,
        score: Math.round(score),
        phonemes: syllablePhonemes,
        needsPractice,
      });
    }

    return syllableScores;
  }

  /**
   * Distribute phoneme scores across syllables
   */
  private distributePhonemes(
    syllables: string[],
    phonemeScores: PhonemeScore[]
  ): PhonemeScore[][] {
    const result: PhonemeScore[][] = [];
    
    if (phonemeScores.length === 0) {
      return syllables.map(() => []);
    }

    const phonemesPerSyllable = Math.ceil(phonemeScores.length / syllables.length);

    for (let i = 0; i < syllables.length; i++) {
      const start = i * phonemesPerSyllable;
      const end = Math.min(start + phonemesPerSyllable, phonemeScores.length);
      result.push(phonemeScores.slice(start, end));
    }

    return result;
  }

  /**
   * Calculate average syllable score
   */
  public calculateAverageScore(syllableScores: SyllableScore[]): number {
    if (syllableScores.length === 0) return 0;
    
    const sum = syllableScores.reduce((acc, s) => acc + s.score, 0);
    return Math.round(sum / syllableScores.length);
  }

  /**
   * Get syllables that need practice
   */
  public getSyllablesNeedingPractice(syllableScores: SyllableScore[]): SyllableScore[] {
    return syllableScores.filter(s => s.needsPractice);
  }

  /**
   * Get best performing syllable
   */
  public getBestSyllable(syllableScores: SyllableScore[]): SyllableScore | null {
    if (syllableScores.length === 0) return null;
    return syllableScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }
}

export default SyllableSplitter;
