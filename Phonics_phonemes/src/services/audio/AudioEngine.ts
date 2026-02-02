/**
 * AudioEngine: TTS wrapper with rate control and error handling
 * 
 * RESPONSIBILITY:
 * - Abstracts react-native-tts complexity
 * - Provides pronunciation-specific audio controls
 * - Handles TTS initialization, errors, and lifecycle
 * 
 * DESIGN PHILOSOPHY:
 * - Single responsibility: only audio playback
 * - No UI concerns (no state management here)
 * - Defensive programming (handles TTS unavailability gracefully)
 * 
 * FUTURE EXTENSIONS:
 * - Speech recognition for pronunciation scoring
 * - Custom voice selection (male/female/child voices)
 * - Audio recording for comparison
 */

import Tts from 'react-native-tts';
import { AudioConfig } from '../../types/pronunciation.types';

/**
 * Audio playback states
 */
export enum AudioState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
}

/**
 * Audio engine configuration
 */
interface AudioEngineConfig {
  defaultLanguage: string; // e.g., 'en-IN'
  defaultRate: number; // 0.1 to 1.0
  defaultPitch: number; // 0.5 to 2.0
  enableDucking?: boolean; // Lower other audio when speaking
}

/**
 * Main audio engine class
 * 
 * USAGE:
 * ```typescript
 * const audio = AudioEngine.getInstance();
 * await audio.initialize();
 * await audio.speak('apple', { rate: 0.5 });
 * ```
 */
export class AudioEngine {
  private static instance: AudioEngine;
  private state: AudioState;
  private config: AudioEngineConfig;
  private isInitialized: boolean;

  private constructor() {
    this.state = AudioState.IDLE;
    this.isInitialized = false;
    this.config = {
      defaultLanguage: 'en-IN', // Indian English
      defaultRate: 0.5, // Normal speed
      defaultPitch: 1.0, // Normal pitch
      enableDucking: true,
    };
  }

  /**
   * Singleton accessor
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes TTS engine
   * 
   * MUST be called before any speak() operations
   * Call this in App.tsx useEffect
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[AudioEngine] Already initialized');
      return;
    }

    try {
      this.state = AudioState.INITIALIZING;
      console.log('[AudioEngine] Initializing TTS...');

      // Wait for engine to be ready
      await Tts.getInitStatus();

      // Set default language with fallback
      try {
        await Tts.setDefaultLanguage(this.config.defaultLanguage);
      } catch (langError) {
        console.warn(`[AudioEngine] Failed to set default language ${this.config.defaultLanguage}, trying en-US`);
        try {
          await Tts.setDefaultLanguage('en-US');
        } catch (fallbackError) {
          console.warn('[AudioEngine] Failed to set fallback language en-US, using system default');
        }
      }

      // Set default speech rate
      await Tts.setDefaultRate(this.config.defaultRate);

      // Set default pitch
      await Tts.setDefaultPitch(this.config.defaultPitch);

      // Enable audio ducking (optional, better UX)
      if (this.config.enableDucking) {
        try {
          await Tts.setDucking(true);
        } catch (duckingError) {
          console.warn('[AudioEngine] Ducking not supported on this device');
        }
      }

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.state = AudioState.IDLE;
      console.log('[AudioEngine] TTS initialized successfully');

      // Log available voices (useful for debugging)
      const voices = await Tts.voices();
      const enVoices = voices.filter(v => v.language.startsWith('en'));
      console.log(`[AudioEngine] Found ${enVoices.length} English voices:`,
        enVoices.map(v => v.name).join(', '));

    } catch (error) {
      console.error('[AudioEngine] Initialization failed:', error);
      this.state = AudioState.ERROR;
      this.isInitialized = false;
      throw new Error('Failed to initialize TTS engine');
    }
  }

  /**
   * Sets up TTS event listeners
   */
  private setupEventListeners(): void {
    Tts.addEventListener('tts-start', () => {
      console.log('[AudioEngine] TTS started');
      this.state = AudioState.PLAYING;
    });

    Tts.addEventListener('tts-finish', () => {
      console.log('[AudioEngine] TTS finished');
      this.state = AudioState.IDLE;
    });

    Tts.addEventListener('tts-cancel', () => {
      console.log('[AudioEngine] TTS cancelled');
      this.state = AudioState.IDLE;
    });

    Tts.addEventListener('tts-error', (event) => {
      console.error('[AudioEngine] TTS error:', event);
      this.state = AudioState.ERROR;
    });
  }

  /**
   * Speaks a word with configurable audio settings
   * 
   * @param text - Word or phrase to pronounce
   * @param config - Audio configuration (rate, pitch, language)
   * @returns Promise that resolves when speech starts
   * 
   * DESIGN DECISION:
   * - Rate 0.5 = normal pronunciation (not too fast for learners)
   * - Rate 0.3 = slow mode (for dyslexia-friendly playback)
   */
  public async speak(
    text: string,
    config?: Partial<AudioConfig>
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[AudioEngine] Not initialized, attempting to initialize...');
      await this.initialize();
    }

    if (this.state === AudioState.PLAYING) {
      console.log('[AudioEngine] Already playing, stopping current...');
      await this.stop();
    }

    try {
      const audioConfig: AudioConfig = {
        rate: config?.rate ?? this.config.defaultRate,
        pitch: config?.pitch ?? this.config.defaultPitch,
        language: config?.language ?? this.config.defaultLanguage,
      };

      console.log(`[AudioEngine] Speaking "${text}" at rate ${audioConfig.rate}`);

      // Set rate explicitly before speaking (needed for Android consistency)
      await Tts.setDefaultRate(audioConfig.rate);

      // Speak with configuration
      await Tts.speak(text);

    } catch (error) {
      console.error('[AudioEngine] Speak error:', error);
      this.state = AudioState.ERROR;
      throw new Error('Failed to speak text');
    }
  }

  /**
   * Speaks a word at normal speed
   */
  public async speakNormal(text: string): Promise<void> {
    return this.speak(text, { rate: 0.5 });
  }

  /**
   * Speaks a word at slow speed (dyslexia-friendly)
   */
  public async speakSlow(text: string): Promise<void> {
    return this.speak(text, { rate: 0.15 });
  }

  /**
   * Stops current speech
   */
  public async stop(): Promise<void> {
    try {
      await Tts.stop();
      this.state = AudioState.IDLE;
      console.log('[AudioEngine] Stopped');
    } catch (error) {
      console.error('[AudioEngine] Stop error:', error);
    }
  }

  /**
   * Pauses current speech (if supported)
   * Note: Not all TTS engines support pause/resume
   */
  public async pause(): Promise<void> {
    try {
      // react-native-tts doesn't have pause, so we stop
      await this.stop();
      this.state = AudioState.PAUSED;
    } catch (error) {
      console.error('[AudioEngine] Pause error:', error);
    }
  }

  /**
   * Gets current audio state
   */
  public getState(): AudioState {
    return this.state;
  }

  /**
   * Checks if TTS is currently speaking
   */
  public isSpeaking(): boolean {
    return this.state === AudioState.PLAYING;
  }

  /**
   * Updates engine configuration
   */
  public updateConfig(newConfig: Partial<AudioEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[AudioEngine] Config updated:', this.config);
  }

  /**
   * Sets default language for all future speech
   */
  public async setLanguage(language: string): Promise<void> {
    try {
      await Tts.setDefaultLanguage(language);
      this.config.defaultLanguage = language;
      console.log(`[AudioEngine] Language set to: ${language}`);
    } catch (error) {
      console.error('[AudioEngine] Failed to set language:', error);
    }
  }

  /**
   * Gets available TTS voices
   * Useful for letting users choose voice
   */
  public async getAvailableVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    try {
      const voices = await Tts.voices();
      return voices.map(v => ({
        id: v.id,
        name: v.name,
        language: v.language,
      }));
    } catch (error) {
      console.error('[AudioEngine] Failed to get voices:', error);
      return [];
    }
  }

  /**
   * Cleanup method
   * Call when unmounting app or switching screens
   */
  public async cleanup(): Promise<void> {
    try {
      await this.stop();
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      Tts.removeAllListeners('tts-error');
      console.log('[AudioEngine] Cleaned up');
    } catch (error) {
      console.error('[AudioEngine] Cleanup error:', error);
    }
  }

  /**
   * FUTURE EXTENSION: Speech recognition for pronunciation scoring
   * 
   * Example integration:
   * ```typescript
   * import Voice from '@react-native-voice/voice';
   * 
   * public async startRecording(): Promise<void> {
   *   await Voice.start('en-US');
   * }
   * 
   * public async stopRecordingAndScore(expectedWord: string): Promise<number> {
   *   const results = await Voice.stop();
   *   const userSaid = results;
   *   return this.comparePronunciation(expectedWord, userSaid);
   * }
   * ```
   */
}

/**
 * Convenience export
 */
export const audioEngine = AudioEngine.getInstance();
