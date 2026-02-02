// src/components/PhonemeVisualizer.tsx - Visualize phoneme scores

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { colors, fonts } from '../theme';
import { PhonemeScore } from '../types';

interface PhonemeVisualizerProps {
  phonemeScores: PhonemeScore[];
  showDescription?: boolean;
}

const PhonemeVisualizer: React.FC<PhonemeVisualizerProps> = ({
  phonemeScores,
  showDescription = false,
}) => {
  if (phonemeScores.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sound Breakdown 🎵</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {phonemeScores.map((phoneme, index) => (
          <PhonemeBar
            key={index}
            phoneme={phoneme}
            showDescription={showDescription}
            delay={index * 100}
          />
        ))}
      </ScrollView>
    </View>
  );
};

interface PhonemeBarProps {
  phoneme: PhonemeScore;
  showDescription: boolean;
  delay: number;
}

const PhonemeBar: React.FC<PhonemeBarProps> = ({
  phoneme,
  showDescription,
  delay,
}) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: phoneme.score,
        duration: 600,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [phoneme.score]);

  const barHeight = heightAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.phonemeContainer, { opacity: opacityAnim }]}>
      {/* Score Badge */}
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreText}>{phoneme.score}</Text>
      </View>

      {/* Bar Container */}
      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.bar,
            {
              height: barHeight,
              backgroundColor: phoneme.color,
            },
          ]}
        />
      </View>

      {/* Phoneme Label */}
      <Text style={styles.phonemeLabel}>{phoneme.phoneme}</Text>

      {/* Feedback */}
      <Text style={styles.feedback}>{phoneme.feedback}</Text>
    </Animated.View>
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
  scrollContent: {
    paddingVertical: 8,
    gap: 12,
  },
  phonemeContainer: {
    alignItems: 'center',
    width: 70,
  },
  scoreBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.primaryBold,
    color: colors.cardBackground,
  },
  barContainer: {
    width: 40,
    height: 120,
    backgroundColor: colors.phonemeInactive,
    borderRadius: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 20,
  },
  phonemeLabel: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 4,
  },
  feedback: {
    fontSize: 10,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default PhonemeVisualizer;
