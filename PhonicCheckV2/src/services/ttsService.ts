// src/services/ttsService.ts - Text-to-Speech service

import Tts from 'react-native-tts';
import { TTSConfig } from '../types';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

export class TTSService {
  private isInitialized: boolean = false;
  private currentConfig: TTSConfig;
  private availableVoices: any[] = [];

  constructor() {
    this.currentConfig = {
      voice: '',
      rate: 0.5, // Slower for learning
      pitch: 1.0,
      language: 'en-US',
    };
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize TTS engine
      await Tts.getInitStatus();

      // Configure default settings
      await Tts.setDefaultRate(this.currentConfig.rate);
      await Tts.setDefaultPitch(this.currentConfig.pitch);
      await Tts.setDefaultLanguage(this.currentConfig.language);

      // Get available voices
      const voices = await Tts.voices();
      this.availableVoices = voices;

      // Select a high-quality voice if available
      // Prefer network voices on Android for better quality
      if (Platform.OS === 'android') {
        const bestVoice = voices.find(v =>
          v.language === 'en-US' && v.notInstalled === false && v.networkConnectionRequired === true
        );
        if (bestVoice) {
          this.currentConfig.voice = bestVoice.id;
          await Tts.setDefaultVoice(bestVoice.id);
        }
      }

      this.isInitialized = true;
      console.log('TTS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TTS:', error);
      // Fallback to stub if initialization fails (e.g. on emulator without TTS)
      this.isInitialized = false;
    }
  }

  public async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      Tts.stop(); // Stop any current speech
      Tts.speak(text);
    } catch (error) {
      console.error('TTS speak error:', error);
    }
  }

  public async speakAndSave(text: string): Promise<string> {
    // Note: react-native-tts doesn't support save-to-file directly on all platforms/versions
    // This is a placeholder for that logic if needed, or we rely on synthesis
    // For now, we'll just speak it
    await this.speak(text);
    return ""; // Return empty path as we can't easily save to file with basic Tts lib
  }

  public async stop(): Promise<void> {
    try {
      Tts.stop();
    } catch (error) {
      console.warn('Error stopping TTS:', error);
    }
  }

  public async updateConfig(config: Partial<TTSConfig>): Promise<void> {
    this.currentConfig = { ...this.currentConfig, ...config };

    if (this.isInitialized) {
      if (config.rate) await Tts.setDefaultRate(config.rate);
      if (config.pitch) await Tts.setDefaultPitch(config.pitch);
      if (config.voice) await Tts.setDefaultVoice(config.voice);
    }
  }

  public async getVoices(): Promise<any[]> {
    if (!this.isInitialized) return [];
    return this.availableVoices;
  }

  public getConfig(): TTSConfig {
    return { ...this.currentConfig };
  }

  public async setRate(rate: number): Promise<void> {
    this.currentConfig.rate = rate;
    if (this.isInitialized) {
      await Tts.setDefaultRate(rate);
    }
  }

  public cleanup(): void {
    try {
      Tts.stop();
      // Tts.removeEventListener... if listeners were added
    } catch (error) {
      console.warn('Error cleaning up TTS:', error);
    }
  }
}

export default TTSService;
