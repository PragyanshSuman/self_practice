import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

interface AudioCache {
  [key: string]: Sound;
}

/**
 * Audio service for playing letter sounds and names
 */
export class AudioService {
  private static instance: AudioService;
  private audioCache: AudioCache = {};
  private currentSound: Sound | null = null;

  private constructor() {}

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Load audio file for a letter
   */
  async loadLetterAudio(letter: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = `letter_${letter.toLowerCase()}`;
      
      if (this.audioCache[key]) {
        resolve();
        return;
      }

      // Audio files should be in android/app/src/main/res/raw/ and ios/Resources/
      const fileName = `letter_${letter.toLowerCase()}.mp3`;
      
      const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.warn(`Failed to load sound for letter ${letter}:`, error);
          // Create silent fallback
          this.audioCache[key] = new Sound('', Sound.MAIN_BUNDLE, () => {});
          reject(error);
          return;
        }
        
        this.audioCache[key] = sound;
        resolve();
      });
    });
  }

  /**
   * Play letter sound (phoneme)
   */
  async playLetterSound(letter: string, onComplete?: () => void): Promise<void> {
    const key = `letter_${letter.toLowerCase()}`;
    
    // Stop current sound if playing
    if (this.currentSound) {
      this.currentSound.stop();
    }

    // Load if not cached
    if (!this.audioCache[key]) {
      try {
        await this.loadLetterAudio(letter);
      } catch (error) {
        console.error('Failed to load audio:', error);
        onComplete?.();
        return;
      }
    }

    const sound = this.audioCache[key];
    this.currentSound = sound;

    sound.play((success) => {
      if (!success) {
        console.warn('Playback failed');
      }
      this.currentSound = null;
      onComplete?.();
    });
  }

  /**
   * Play letter name
   */
  async playLetterName(letter: string, onComplete?: () => void): Promise<void> {
    const key = `letter_name_${letter.toLowerCase()}`;
    
    if (this.currentSound) {
      this.currentSound.stop();
    }

    if (!this.audioCache[key]) {
      const fileName = `letter_name_${letter.toLowerCase()}.mp3`;
      
      await new Promise<void>((resolve, reject) => {
        const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn(`Failed to load letter name for ${letter}:`, error);
            reject(error);
            return;
          }
          this.audioCache[key] = sound;
          resolve();
        });
      });
    }

    const sound = this.audioCache[key];
    this.currentSound = sound;

    sound.play((success) => {
      if (!success) {
        console.warn('Letter name playback failed');
      }
      this.currentSound = null;
      onComplete?.();
    });
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound = null;
    }
  }

  /**
   * Preload all letter audio files
   */
  async preloadAllLetters(): Promise<void> {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const promises = letters.map(letter => 
      this.loadLetterAudio(letter).catch(err => 
        console.warn(`Failed to preload ${letter}:`, err)
      )
    );
    await Promise.all(promises);
  }

  /**
   * Release all audio resources
   */
  releaseAll(): void {
    Object.values(this.audioCache).forEach(sound => {
      sound.release();
    });
    this.audioCache = {};
    this.currentSound = null;
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    Object.values(this.audioCache).forEach(sound => {
      sound.setVolume(clampedVolume);
    });
  }
}

export default AudioService.getInstance();
