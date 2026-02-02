// src/components/ProgressTracker.tsx - Display user progress

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors, fonts } from '../theme';

interface ProgressTrackerProps {
  totalWords: number;
  averageScore: number;
  bestScore: number;
  recentImprovement: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  totalWords,
  averageScore,
  bestScore,
  recentImprovement,
}) => {
  const getImprovementText = () => {
    if (recentImprovement > 5) return '📈 Great progress!';
    if (recentImprovement > 0) return '📊 Improving!';
    if (recentImprovement === 0) return '➡️ Steady';
    return '💪 Keep practicing!';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress 📊</Text>

      <View style={styles.statsGrid}>
        {/* Total Words */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statValue}>{totalWords}</Text>
          <Text style={styles.statLabel}>Words Practiced</Text>
        </View>

        {/* Average Score */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>{Math.round(averageScore)}</Text>
          <Text style={styles.statLabel}>Average Score</Text>
        </View>

        {/* Best Score */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>{bestScore}</Text>
          <Text style={styles.statLabel}>Best Score</Text>
        </View>

        {/* Recent Improvement */}
        <View style={[styles.statCard, styles.statCardWide]}>
          <Text style={styles.improvementText}>{getImprovementText()}</Text>
          {recentImprovement !== 0 && (
            <Text style={styles.improvementValue}>
              {recentImprovement > 0 ? '+' : ''}
              {recentImprovement.toFixed(1)} points
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 16,
    letterSpacing: fonts.letterSpacing.normal,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statCardWide: {
    width: '100%',
    backgroundColor: colors.info,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: fonts.sizes.xlarge,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  improvementText: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 4,
  },
  improvementValue: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
});

export default ProgressTracker;
