/**
 * PronunciationEngine: The brain of the pronunciation system
 * 
 * RESPONSIBILITY:
 * - Orchestrates dictionary lookup, fallback generation, and phoneme processing
 * - Implements caching for performance
 * - Provides clean API for UI components
 * 
 * DESIGN PATTERNS:
 * - Singleton pattern (one instance manages cache)
 * - Strategy pattern (dictionary vs. rule-based vs. future ML)
 * - Facade pattern (hides complexity from UI)
 */

import {
  PronunciationRequest,
  PronunciationResponse,
  ProcessedPronunciation,
  RawPronunciationData,
} from '../../types/pronunciation.types';
import { phonemesToIPA, phonemesToSyllables, addStressMarkers } from './PhonemeMapper';
import { generateFallbackPronunciation } from './RuleBasedFallback';

// Import CMU dictionary
import cmuDict from '../../assets/data/cmu_dict_full.json';

/**
 * Main pronunciation engine class
 * 
 * USAGE:
 * ```typescript
 * const engine = PronunciationEngine.getInstance();
 * const result = await engine.getPronunciation({ word: 'apple' });
 * ```
 */
export class PronunciationEngine {
  private static instance: PronunciationEngine;
  private cache: Map<string, ProcessedPronunciation>;
  private dictionary: Record<string, string[]>;

  private constructor() {
    this.cache = new Map();
    this.dictionary = cmuDict as Record<string, string[]>;

    console.log(`[PronunciationEngine] Initialized with ${Object.keys(this.dictionary).length} words`);
  }

  /**
   * Singleton accessor
   */
  public static getInstance(): PronunciationEngine {
    if (!PronunciationEngine.instance) {
      PronunciationEngine.instance = new PronunciationEngine();
    }
    return PronunciationEngine.instance;
  }

  /**
   * Main API: Get pronunciation for a word
   * 
   * @param request - Pronunciation request configuration
   * @returns Promise<PronunciationResponse>
   * 
   * FLOW:
   * 1. Validate input
   * 2. Check cache
   * 3. Lookup in dictionary
   * 4. Fallback to rule-based if not found
   * 5. Process phonemes → IPA + syllables
   * 6. Cache result
   * 7. Return structured data
   */
  public async getPronunciation(
    request: PronunciationRequest
  ): Promise<PronunciationResponse> {
    try {
      // 1. Validate input
      const validation = this.validateInput(request.word);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: validation.reason || 'Invalid word input',
          },
        };
      }

      const normalizedWord = request.word.toLowerCase().trim();

      // 2. Check cache
      if (this.cache.has(normalizedWord)) {
        console.log(`[PronunciationEngine] Cache hit: ${normalizedWord}`);
        return {
          success: true,
          data: this.cache.get(normalizedWord)!,
        };
      }

      // 3. Lookup pronunciation
      const rawData = this.lookupPronunciation(normalizedWord, request.preferDictionary);

      if (!rawData || rawData.phonemes.length === 0) {
        return {
          success: false,
          error: {
            code: 'LOOKUP_FAILED',
            message: `Could not generate pronunciation for "${normalizedWord}"`,
          },
        };
      }

      // 4. Process into UI-ready format
      const processedData = this.processPronunciation(rawData, request.language || 'en');

      // 5. Cache result
      this.cache.set(normalizedWord, processedData);

      return {
        success: true,
        data: processedData,
      };

    } catch (error) {
      console.error('[PronunciationEngine] Error:', error);
      return {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Validates word input
   */
  private validateInput(word: string): { isValid: boolean; reason?: string } {
    if (!word || typeof word !== 'string') {
      return { isValid: false, reason: 'Word must be a non-empty string' };
    }

    const trimmed = word.trim();
    if (trimmed.length === 0) {
      return { isValid: false, reason: 'Word cannot be empty' };
    }

    if (trimmed.length > 50) {
      return { isValid: false, reason: 'Word too long (max 50 characters)' };
    }

    if (!/^[a-zA-Z\s-]+$/.test(trimmed)) {
      return { isValid: false, reason: 'Word must contain only letters, spaces, or hyphens' };
    }

    return { isValid: true };
  }

  /**
   * Looks up pronunciation from dictionary or generates fallback
   */
  private lookupPronunciation(
    word: string,
    preferDictionary: boolean = true
  ): RawPronunciationData | null {
    // Try dictionary first
    const phonemes = this.dictionary[word];

    if (phonemes && phonemes.length > 0) {
      console.log(`[PronunciationEngine] Dictionary hit: ${word}`);
      return {
        word,
        phonemes,
        isFromDictionary: true,
        confidence: 1.0,
      };
    }

    // If dictionary required but not found
    if (preferDictionary) {
      console.log(`[PronunciationEngine] Word not in dictionary: ${word}`);
      return null;
    }

    // Fallback to rule-based
    console.log(`[PronunciationEngine] Using rule-based fallback: ${word}`);
    return generateFallbackPronunciation(word);
  }

  /**
   * Processes raw phonemes into UI-ready format
   */
  private processPronunciation(
    rawData: RawPronunciationData,
    language: string
  ): ProcessedPronunciation {
    const { word, phonemes, isFromDictionary, confidence } = rawData;

    // Convert phonemes to IPA
    const ipaNotation = phonemesToIPA(phonemes);

    // Convert phonemes to syllables
    const baseSyllables = phonemesToSyllables(phonemes);
    const syllables = addStressMarkers(baseSyllables, phonemes);

    return {
      word,
      syllables,
      ipaNotation,
      phonemes,
      metadata: {
        source: isFromDictionary ? 'dictionary' : 'rule-based',
        confidence,
        language,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Clears pronunciation cache
   * Use when memory is constrained or for testing
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('[PronunciationEngine] Cache cleared');
  }

  /**
   * Preloads multiple words into cache
   * Useful for lesson planning in educational apps
   */
  public async preloadWords(words: string[]): Promise<void> {
    console.log(`[PronunciationEngine] Preloading ${words.length} words...`);

    const promises = words.map(word =>
      this.getPronunciation({ word })
    );

    await Promise.all(promises);
    console.log('[PronunciationEngine] Preload complete');
  }

  /**
   * FUTURE EXTENSION: Switch pronunciation strategy
   * 
   * Example:
   * ```typescript
   * engine.setStrategy('ml-model', { modelPath: 'g2p_model.onnx' });
   * ```
   */
  public setStrategy(
    strategy: 'dictionary' | 'rule-based' | 'ml-model',
    config?: Record<string, any>
  ): void {
    // TODO: Implement strategy switching
    console.log(`[PronunciationEngine] Strategy set to: ${strategy}`, config);
  }
}

/**
 * Convenience export for direct usage
 */
export const pronunciationEngine = PronunciationEngine.getInstance();
