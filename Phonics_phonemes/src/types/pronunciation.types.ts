/**
 * Core type definitions for the Pronunciation System
 * 
 * Design Philosophy:
 * - Immutable data structures
 * - Clear separation between raw phoneme data and UI-ready output
 * - Future-proof for ML integration and analytics
 */

/**
 * ARPAbet phoneme representation from CMU Dictionary
 * Example: ["AE1", "P", "AH0", "L"]
 */
export type ARPAbetPhoneme = string;

/**
 * International Phonetic Alphabet representation
 * Example: "ˈæp.əl"
 */
export type IPAString = string;

/**
 * Syllable breakdown with stress markers
 * Example: ["ˈæp", "əl"]
 */
export type Syllable = string;

/**
 * Raw pronunciation data from CMU Dictionary lookup
 */
export interface RawPronunciationData {
  word: string;
  phonemes: ARPAbetPhoneme[];
  isFromDictionary: boolean; // true if from CMU, false if rule-based fallback
  confidence: number; // 1.0 for dictionary, 0.0-0.8 for rule-based
}

/**
 * Processed pronunciation data ready for UI consumption
 * This is what PronunciationCard receives
 */
export interface ProcessedPronunciation {
  word: string;
  syllables: Syllable[];
  ipaNotation: IPAString;
  phonemes: ARPAbetPhoneme[]; // Keep raw phonemes for future analytics
  metadata: {
    source: 'dictionary' | 'rule-based' | 'ml-model'; // Extensible for future ML
    confidence: number;
    language: string; // Default: 'en', future: 'en-IN', 'en-US'
    timestamp: number; // For caching/analytics
  };
}

/**
 * Audio playback configuration
 */
export interface AudioConfig {
  rate: number; // 0.1 to 1.0 (0.3 = slow, 0.6 = normal)
  pitch?: number; // Future: 0.5 to 2.0
  language: string; // 'en-IN' by default
  voice?: string; // Future: specific TTS voice selection
}

/**
 * Pronunciation engine request
 */
export interface PronunciationRequest {
  word: string;
  language?: string;
  preferDictionary?: boolean; // Force dictionary or allow fallback
}

/**
 * Pronunciation engine response
 */
export interface PronunciationResponse {
  success: boolean;
  data?: ProcessedPronunciation;
  error?: {
    code: 'INVALID_INPUT' | 'LOOKUP_FAILED' | 'PROCESSING_ERROR';
    message: string;
  };
}

/**
 * Future-proofing: ML model input/output types
 * These are placeholders for when you integrate speech recognition scoring
 */
export interface MLModelInput {
  word: string;
  audioBuffer?: ArrayBuffer; // For pronunciation scoring
  userPhonemes?: ARPAbetPhoneme[]; // User's attempted pronunciation
}

export interface MLModelOutput {
  predictedPhonemes: ARPAbetPhoneme[];
  confidence: number;
  pronunciationScore?: number; // 0-100
  feedback?: string[]; // e.g., ["Emphasize first syllable", "Soften 'p' sound"]
}

/**
 * Analytics event for dyslexia research
 * Future: track user pronunciation attempts
 */
export interface PronunciationAnalyticsEvent {
  eventId: string;
  userId?: string; // Anonymous by default
  word: string;
  attempts: number;
  completedSuccessfully: boolean;
  timeSpent: number; // milliseconds
  slowModeUsed: boolean;
  timestamp: number;
}
