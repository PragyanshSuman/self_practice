// src/components/SyllableBreakdown.tsx - Interactive syllable practice

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fonts } from '../theme';
import { SyllableScore } from '../types';

interface SyllableBreakdownProps {
  syllableScores: SyllableScore[];
  onPracticeSyllable?: (syllable: string) => void;
}

const SyllableBreakdown: React.FC<SyllableBreakdownProps> = ({
  syllableScores,
  onPracticeSyllable,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (syllableScores.length === 0) {
    return null;
  }

  const handleSyllablePress = (syllable: string, index: number) => {
    setSelectedIndex(index);
    onPracticeSyllable?.(syllable);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return colors.scoreExcellent;
    if (score >= 70) return colors.scoreGood;
    if (score >= 50) return colors.scoreFair;
    return colors.scoreNeedsPractice;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Syllable Practice 🎯</Text>
      <Text style={styles.subtitle}>Tap any syllable to practice it</Text>

      <View style={styles.syllablesGrid}>
        {syllableScores.map((syllable, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.syllableCard,
              selectedIndex === index && styles.syllableCardSelected,
              { borderColor: getScoreColor(syllable.score) },
            ]}
            onPress={() => handleSyllablePress(syllable.syllable, index)}
            activeOpacity={0.7}
          >
            {/* Score Badge */}
            <View
              style={[
                styles.syllableScoreBadge,
                { backgroundColor: getScoreColor(syllable.score) },
              ]}
            >
              <Text style={styles.syllableScoreText}>{syllable.score}</Text>
            </View>

            {/* Syllable Text */}
            <Text style={styles.syllableText}>{syllable.syllable}</Text>

            {/* Status Icon */}
            <Text style={styles.statusIcon}>
              {syllable.needsPractice ? '💪' : '✨'}
            </Text>

            {/* Status Label */}
            <Text style={styles.statusLabel}>
              {syllable.needsPractice ? 'Practice' : 'Great!'}
            </Text>
          </TouchableOpacity>
        ))}
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
    marginBottom: 4,
    letterSpacing: fonts.letterSpacing.normal,
  },
  subtitle: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    marginBottom: 16,
    letterSpacing: fonts.letterSpacing.normal,
  },
  syllablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  syllableCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border,
  },
  syllableCardSelected: {
    backgroundColor: colors.info,
    transform: [{ scale: 1.05 }],
  },
  syllableScoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  syllableScoreText: {
    fontSize: 12,
    fontFamily: fonts.primaryBold,
    color: colors.cardBackground,
  },
  syllableText: {
    fontSize: fonts.sizes.xlarge,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 8,
    letterSpacing: fonts.letterSpacing.wide,
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
});

export default SyllableBreakdown;
