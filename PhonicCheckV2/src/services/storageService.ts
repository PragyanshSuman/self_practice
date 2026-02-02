// src/services/storageService.ts - Local storage service

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, PracticeSession } from '../types';

export interface Statistics {
    totalWords: number;
    averageScore: number;
    bestScore: number;
    recentImprovement: number;
}

const KEYS = {
    SETTINGS: '@settings',
    HISTORY: '@practice_history',
    STATS: '@statistics',
};

const DEFAULT_SETTINGS: AppSettings = {
    ttsConfig: {
        voice: '',
        rate: 0.5,
        pitch: 1.0,
        language: 'en-US',
    },
    hapticEnabled: true,
    darkMode: false,
    dyslexicMode: false,
    highContrast: false,
    fontSize: 'large',
    difficultyLevel: 'beginner',
};

const DEFAULT_STATS: Statistics = {
    totalWords: 0,
    averageScore: 0,
    bestScore: 0,
    recentImprovement: 0,
};

export class StorageService {
    /**
     * Save app settings
     */
    public async saveSettings(settings: AppSettings): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Load app settings
     */
    public async loadSettings(): Promise<AppSettings | null> {
        try {
            const settings = await AsyncStorage.getItem(KEYS.SETTINGS);
            if (settings) {
                return JSON.parse(settings);
            }
            return DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error loading settings:', error);
            return DEFAULT_SETTINGS;
        }
    }

    /**
     * Save a new practice session
     */
    public async savePracticeSession(session: PracticeSession): Promise<void> {
        try {
            // 1. Get existing history
            const history = await this.getPracticeHistory();

            // 2. Add new session
            const updatedHistory = [...history, session];
            await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updatedHistory));

            // 3. Update statistics
            await this.updateStatistics(session, history);

        } catch (error) {
            console.error('Error saving practice session:', error);
            throw error;
        }
    }

    /**
     * Get practice history
     */
    public async getPracticeHistory(limit?: number): Promise<PracticeSession[]> {
        try {
            const historyJson = await AsyncStorage.getItem(KEYS.HISTORY);
            let history: PracticeSession[] = historyJson ? JSON.parse(historyJson) : [];

            if (limit && history.length > limit) {
                return history.slice(history.length - limit);
            }

            return history;
        } catch (error) {
            console.error('Error getting practice history:', error);
            return [];
        }
    }

    /**
     * Get user statistics
     */
    public async getStatistics(): Promise<Statistics> {
        try {
            const statsJson = await AsyncStorage.getItem(KEYS.STATS);
            return statsJson ? JSON.parse(statsJson) : DEFAULT_STATS;
        } catch (error) {
            console.error('Error getting statistics:', error);
            return DEFAULT_STATS;
        }
    }

    /**
     * Update statistics based on new session
     */
    private async updateStatistics(newSession: PracticeSession, previousHistory: PracticeSession[]): Promise<void> {
        try {
            const currentStats = await this.getStatistics();

            // Calculate new averages
            const totalScore = previousHistory.reduce((sum, s) => sum + s.score, 0) + newSession.score;
            const totalWords = previousHistory.length + 1;
            const averageScore = totalScore / totalWords;

            // Calculate recent improvement (metrics based on last 5 sessions)
            let recentImprovement = 0;
            if (previousHistory.length >= 5) {
                const recentSessions = previousHistory.slice(-5);
                const previousAverage = recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length;
                recentImprovement = newSession.score - previousAverage;
            } else if (previousHistory.length > 0) {
                const previousAverage = previousHistory.reduce((sum, s) => sum + s.score, 0) / previousHistory.length;
                recentImprovement = newSession.score - previousAverage;
            }

            const newStats: Statistics = {
                totalWords,
                averageScore,
                bestScore: Math.max(currentStats.bestScore, newSession.score),
                recentImprovement,
            };

            await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(newStats));

        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    /**
     * Clear all app data
     */
    public async clearAllData(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([KEYS.SETTINGS, KEYS.HISTORY, KEYS.STATS]);
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }
}
