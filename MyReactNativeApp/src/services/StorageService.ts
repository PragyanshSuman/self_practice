import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { SessionFeatureSummary } from '@models/TracingData';

const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  SESSION_DATA: '@session_data',
  ANALYTICS_HISTORY: '@analytics_history',
  PROGRESS_DATA: '@progress_data',
  SETTINGS: '@settings',
};

/**
 * Storage service for persisting analytics and user data
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() { }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Save analytics data
   */
  async saveAnalytics(analytics: SessionFeatureSummary): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.SESSION_DATA}_${analytics.sessionId}`;
      await AsyncStorage.setItem(key, JSON.stringify(analytics));

      // Update analytics history index
      await this.updateAnalyticsHistory(analytics.sessionId, analytics.letter, analytics.timestamp);
    } catch (error) {
      console.error('Failed to save analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics by session ID
   */
  async getAnalytics(sessionId: string): Promise<SessionFeatureSummary | null> {
    try {
      const key = `${STORAGE_KEYS.SESSION_DATA}_${sessionId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return null;
    }
  }

  /**
   * Get all analytics for a user
   */
  async getAllAnalytics(userId: string): Promise<SessionFeatureSummary[]> {
    try {
      const history = await this.getAnalyticsHistory();
      // Filter by userId if it was part of history, but currently history is simple
      const userSessions = history;

      const analytics = await Promise.all(
        userSessions.map(session => this.getAnalytics(session.sessionId))
      );

      return analytics.filter(a => a !== null) as SessionFeatureSummary[];
    } catch (error) {
      console.error('Failed to get all analytics:', error);
      return [];
    }
  }

  /**
   * Update analytics history index
   */
  private async updateAnalyticsHistory(
    sessionId: string,
    letter: string,
    timestamp: string
  ): Promise<void> {
    try {
      const history = await this.getAnalyticsHistory();

      history.push({
        sessionId,
        letter,
        timestamp,
        userId: 'default_user',
      });

      await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to update analytics history:', error);
    }
  }

  /**
   * Get analytics history
   */
  private async getAnalyticsHistory(): Promise<Array<{
    sessionId: string;
    letter: string;
    timestamp: string;
    userId: string;
  }>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get analytics history:', error);
      return [];
    }
  }

  /**
   * Export analytics to CSV
   */
  async exportToCSV(analytics: SessionFeatureSummary): Promise<string> {
    try {
      const headers = [
        'Session ID', 'Letter', 'Timestamp', 'Avg Pause (ms)', 'Pause Count',
        'Direction Errors', 'Path Variance', 'Order Errors', 'Avg Jerk', 'Completion Time (ms)'
      ];

      const values = [
        analytics.sessionId,
        analytics.letter,
        analytics.timestamp,
        analytics.features.avgPauseDuration.toFixed(2),
        analytics.features.pauseCount,
        analytics.features.directionErrors,
        analytics.features.pathVariance.toFixed(2),
        analytics.features.strokeOrderErrors,
        analytics.features.avgJerk.toFixed(4),
        analytics.features.completionTime
      ];

      const csvData = headers.join(',') + '\n' + values.join(',');
      const fileName = `tracing_analytics_${analytics.sessionId}.csv`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, csvData, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Failed to export CSV:', error);
      throw error;
    }
  }

  /**
   * Export analytics to JSON
   */
  async exportToJSON(analytics: SessionFeatureSummary): Promise<string> {
    try {
      const fileName = `tracing_analytics_${analytics.sessionId}.json`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, JSON.stringify(analytics, null, 2), 'utf8');

      return filePath;
    } catch (error) {
      console.error('Failed to export JSON:', error);
      throw error;
    }
  }

  // Legacy/Helper stubs
  async saveProgress(userId: string, progress: any): Promise<void> { /* ... */ }
  async getProgress(userId: string): Promise<any | null> { return null; }
  async clearAll(): Promise<void> { await AsyncStorage.clear(); }
}

export default StorageService.getInstance();

