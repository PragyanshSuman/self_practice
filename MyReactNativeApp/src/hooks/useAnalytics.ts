import { useState, useCallback, useEffect } from 'react';
import { ComprehensiveTracingAnalytics } from '@models/AnalyticsTypes';
import StorageService from '@services/StorageService';

interface UseAnalyticsProps {
  userId: string;
  letter?: string;
}

interface AnalyticsSummary {
  totalSessions: number;
  averageAccuracy: number;
  averageDuration: number;
  masteredLetters: string[];
  problematicLetters: string[];
  overallRiskLevel: string;
  recentImprovement: number;
  sessionHistory: ComprehensiveTracingAnalytics[];
}

export const useAnalytics = ({ userId, letter }: UseAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ComprehensiveTracingAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load analytics from storage
   */
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allAnalytics = await StorageService.getAllAnalytics(userId);
      
      // Filter by letter if specified
      const filteredAnalytics = letter
        ? allAnalytics.filter(a => a.letter === letter)
        : allAnalytics;

      setAnalytics(filteredAnalytics);
      
      // Calculate summary
      const summaryData = calculateSummary(filteredAnalytics);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [userId, letter]);

  /**
   * Calculate analytics summary
   */
  const calculateSummary = (data: ComprehensiveTracingAnalytics[]): AnalyticsSummary => {
    if (data.length === 0) {
      return {
        totalSessions: 0,
        averageAccuracy: 0,
        averageDuration: 0,
        masteredLetters: [],
        problematicLetters: [],
        overallRiskLevel: 'low',
        recentImprovement: 0,
        sessionHistory: [],
      };
    }

    // Calculate averages
    const totalAccuracy = data.reduce(
      (sum, a) => sum + a.spatial_accuracy_deviation.accuracy_score,
      0
    );
    const averageAccuracy = totalAccuracy / data.length;

    const totalDuration = data.reduce(
      (sum, a) => sum + a.time_based_performance.total_session_duration,
      0
    );
    const averageDuration = totalDuration / data.length;

    // Group by letter
    const letterGroups: Record<string, ComprehensiveTracingAnalytics[]> = {};
    data.forEach(a => {
      if (!letterGroups[a.letter]) {
        letterGroups[a.letter] = [];
      }
      letterGroups[a.letter].push(a);
    });

    // Determine mastered and problematic letters
    const masteredLetters: string[] = [];
    const problematicLetters: string[] = [];

    Object.entries(letterGroups).forEach(([letter, sessions]) => {
      const avgAccuracy =
        sessions.reduce((sum, s) => sum + s.spatial_accuracy_deviation.accuracy_score, 0) /
        sessions.length;

      if (avgAccuracy >= 85 && sessions.length >= 3) {
        masteredLetters.push(letter);
      } else if (avgAccuracy < 60) {
        problematicLetters.push(letter);
      }
    });

    // Calculate overall risk level
    const avgDyslexiaRisk =
      data.reduce((sum, a) => sum + a.automated_risk_assessment.dyslexia_risk_score, 0) /
      data.length;
    const avgDysgraphiaRisk =
      data.reduce((sum, a) => sum + a.automated_risk_assessment.dysgraphia_risk_score, 0) /
      data.length;
    const overallRisk = (avgDyslexiaRisk + avgDysgraphiaRisk) / 2;

    const overallRiskLevel =
      overallRisk < 20 ? 'low' :
      overallRisk < 40 ? 'mild' :
      overallRisk < 60 ? 'moderate' :
      overallRisk < 80 ? 'high' : 'severe';

    // Calculate recent improvement (last 5 vs previous 5 sessions)
    let recentImprovement = 0;
    if (data.length >= 10) {
      const sorted = [...data].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const recent5 = sorted.slice(0, 5);
      const previous5 = sorted.slice(5, 10);

      const recentAvg =
        recent5.reduce((sum, a) => sum + a.spatial_accuracy_deviation.accuracy_score, 0) / 5;
      const previousAvg =
        previous5.reduce((sum, a) => sum + a.spatial_accuracy_deviation.accuracy_score, 0) / 5;

      recentImprovement = ((recentAvg - previousAvg) / previousAvg) * 100;
    }

    return {
      totalSessions: data.length,
      averageAccuracy,
      averageDuration,
      masteredLetters,
      problematicLetters,
      overallRiskLevel,
      recentImprovement,
      sessionHistory: data.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    };
  };

  /**
   * Get analytics for specific letter
   */
  const getLetterAnalytics = useCallback(
    (targetLetter: string): ComprehensiveTracingAnalytics[] => {
      return analytics.filter(a => a.letter === targetLetter);
    },
    [analytics]
  );

  /**
   * Get latest session
   */
  const getLatestSession = useCallback((): ComprehensiveTracingAnalytics | null => {
    if (analytics.length === 0) return null;
    
    return [...analytics].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }, [analytics]);

  /**
   * Get performance trend
   */
  const getPerformanceTrend = useCallback(
    (metric: 'accuracy' | 'velocity' | 'jerk' | 'duration'): number[] => {
      const sorted = [...analytics].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return sorted.map(a => {
        switch (metric) {
          case 'accuracy':
            return a.spatial_accuracy_deviation.accuracy_score;
          case 'velocity':
            return a.velocity_kinematics.average_velocity;
          case 'jerk':
            return a.acceleration_jerk_analysis.normalized_jerk_score;
          case 'duration':
            return a.time_based_performance.total_session_duration;
          default:
            return 0;
        }
      });
    },
    [analytics]
  );

  /**
   * Export all analytics
   */
  const exportAnalytics = useCallback(async () => {
    try {
      if (analytics.length === 0) {
        throw new Error('No analytics data to export');
      }

      const exportPromises = analytics.map(a => 
        StorageService.exportToJSON(a)
      );

      const filePaths = await Promise.all(exportPromises);
      return filePaths;
    } catch (err) {
      console.error('Export failed:', err);
      throw err;
    }
  }, [analytics]);

  /**
   * Clear all analytics
   */
  const clearAnalytics = useCallback(async () => {
    try {
      await StorageService.clearAll();
      setAnalytics([]);
      setSummary(null);
    } catch (err) {
      console.error('Failed to clear analytics:', err);
      throw err;
    }
  }, []);

  /**
   * Refresh analytics
   */
  const refresh = useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Load on mount
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    loading,
    error,
    analytics,
    summary,
    getLetterAnalytics,
    getLatestSession,
    getPerformanceTrend,
    exportAnalytics,
    clearAnalytics,
    refresh,
  };
};
