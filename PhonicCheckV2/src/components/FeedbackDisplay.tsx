// src/components/FeedbackDisplay.tsx - Display pronunciation feedback

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, fonts } from '../theme';
import { PronunciationResult } from '../types';

interface FeedbackDisplayProps {
  result: PronunciationResult | null;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ result }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (result) {
      // Animate feedback appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [result]);

  if (!result) {
    return null;
  }

  const getScoreColor = (score: number): string => {
    if (score >= 85) return colors.scoreExcellent;
    if (score >= 70) return colors.scoreGood;
    if (score >= 50) return colors.scoreFair;
    return colors.scoreNeedsPractice;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Score Circle */}
      <View
        style={[
          styles.scoreCircle,
          { backgroundColor: getScoreColor(result.overallScore) },
        ]}
      >
        <Text style={styles.scoreNumber}>{result.overallScore}</Text>
        <Text style={styles.scoreLabel}>Score</Text>
      </View>

      {/* Emoji */}
      <Text style={styles.emoji}>{result.emoji}</Text>

      {/* Feedback Message */}
      <Text style={styles.feedback}>{result.feedback}</Text>

      {/* Encouragement */}
      <Text style={styles.encouragement}>{result.encouragement}</Text>

      {/* Overall Score Bar */}
      <View style={styles.scoreBarContainer}>
        <View
          style={[
            styles.scoreBar,
            {
              width: `${result.overallScore}%`,
              backgroundColor: getScoreColor(result.overallScore),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreNumber: {
    fontSize: 40,
    fontFamily: fonts.primaryBold,
    color: colors.text,
  },
  scoreLabel: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  feedback: {
    fontSize: fonts.sizes.xlarge,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: fonts.letterSpacing.normal,
  },
  encouragement: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: fonts.letterSpacing.normal,
  },
  scoreBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: colors.phonemeInactive,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 6,
  },
});

export default FeedbackDisplay;
