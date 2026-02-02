// src/services/audioRecorder.ts - Audio recording service

import AudioRecord from 'react-native-audio-record';
import { Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';

export class AudioRecorder {
  private recordingPath: string;
  private isCurrentlyRecording: boolean = false;
  private options: any;

  constructor() {
    this.recordingPath = '';
    this.options = {
      sampleRate: 16000,  // default 44100
      channels: 1,        // 1 or 2, default 1
      bitsPerSample: 16,  // 8 or 16, default 16
      audioSource: 6,     // android only (VOICE_RECOGNITION)
      wavFile: 'test.wav' // default 'audio.wav'
    };
  }

  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record your pronunciation.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  }

  public async startRecording(): Promise<string> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // Initialize recorder
      AudioRecord.init(this.options);

      // Start recording
      AudioRecord.start();
      this.isCurrentlyRecording = true;
      console.log('Recording started');

      // We determine path later on stop, but we can predict/return current one if needed
      // AudioRecord saves to external cache dir on Android usually
      return "";
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  public async stopRecording(): Promise<string> {
    if (!this.isCurrentlyRecording) {
      return this.recordingPath;
    }

    try {
      const audioFile = await AudioRecord.stop();
      this.isCurrentlyRecording = false;
      this.recordingPath = audioFile;

      console.log('Recording stopped. File saved at:', audioFile);
      return audioFile;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  public async pauseRecording(): Promise<void> {
    // react-native-audio-record doesn't strictly support pause/resume in the same way
    // For this use case, we might just stop.
    console.warn('Pause not supported natively by simple recorder, ignoring');
  }

  public async resumeRecording(): Promise<void> {
    console.warn('Resume not supported natively by simple recorder, ignoring');
  }

  public isRecording(): boolean {
    return this.isCurrentlyRecording;
  }

  public async deleteRecording(path: string): Promise<void> {
    try {
      if (path && await RNFS.exists(path)) {
        await RNFS.unlink(path);
        console.log('Recording deleted:', path);
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  }

  public async getRecordingDuration(path: string): Promise<number> {
    // Estimate from file size for WAV:
    // Size = SampleRate * Channels * (Bits/8) * Duration
    // Duration = Size / (SampleRate * Channels * (Bits/8))
    try {
      const stat = await RNFS.stat(path);
      const bytesPerSecond = 16000 * 1 * (16 / 8);
      return stat.size / bytesPerSecond;
    } catch (e) {
      return 0;
    }
  }

  public async cleanup(): Promise<void> {
    if (this.isCurrentlyRecording) {
      await this.stopRecording();
    }
  }
}

export default AudioRecorder;
