// src/types/index.ts

export interface Word {
  id: string;
  text: string;
  syllables: string[];
  phonemes: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  imageUrl?: string;
}

export interface MFCCFeatures {
  coefficients: number[][];
  energy: number[];
  delta: number[][];
  deltaDelta: number[][]; // Added missing property
  sampleRate: number;
  hopSize: number;
}

export interface AudioData {
  path: string;
  duration: number;
  sampleRate: number;
  samples: Float32Array;
}

export interface PhonemeScore {
  phoneme: string;
  score: number;
  position: number;
  startTime: number;
  endTime: number;
  feedback: string;
  color: string;
}

export interface SyllableScore {
  syllable: string;
  score: number;
  phonemes: PhonemeScore[];
  needsPractice: boolean;
}

export interface PronunciationResult {
  overallScore: number;
  syllableScores: SyllableScore[];
  phonemeScores: PhonemeScore[];
  feedback: string;
  emoji: string;
  encouragement: string;
  debugInfo?: {
    rawDistance: number;
    normalizedDistance: number;
    refFrames: number;
    childFrames: number;
  };
}

export interface DTWResult {
  distance: number;
  similarity: number;
  path: Array<[number, number]>;
  normalizedDistance: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  audioPath: string | null;
  duration: number;
  currentTime: number;
}

export interface UserProgress {
  userId: string;
  wordsAttempted: number;
  averageScore: number;
  practiceHistory: PracticeSession[];
  achievements: Achievement[];
}

export interface PracticeSession {
  wordId: string;
  word: string;
  score: number;
  timestamp: number;
  syllableScores: SyllableScore[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: number;
  icon: string;
}

export interface TTSConfig {
  voice: string;
  rate: number;
  pitch: number;
  language: string;
}

export interface AppSettings {
  ttsConfig: TTSConfig;
  hapticEnabled: boolean;
  darkMode: boolean;
  dyslexicMode: boolean; // For OpenDyslexic font
  highContrast: boolean; // For visual stress
  fontSize: 'small' | 'medium' | 'large';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface ClinicalReport {
  generatedAt: number;
  totalSessions: number;
  averageScore: number;
  consistencyScore: number; // Standard deviation metric
  weakestPhonemes: { phoneme: string; averageScore: number; count: number }[];
  strongestPhonemes: { phoneme: string; averageScore: number; count: number }[];
  progressTrend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}
