// src/components/WordDisplay.tsx - Display word with speaker button

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, fonts } from '../theme';

interface WordDisplayProps {
  word: string;
  syllables: string[];
  onPlaySound: () => void;
  fontSize?: 'small' | 'medium' | 'large';
}

const WordDisplay: React.FC<WordDisplayProps> = ({
  word,
  syllables,
  onPlaySound,
  fontSize = 'large',
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePress = () => {
    // Animate speaker button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPlaySound();
  };

  const getFontSize = () => {
    switch (fontSize) {
      case 'small': return fonts.sizes.xlarge;
      case 'medium': return fonts.sizes.xxlarge;
      case 'large': return 56;
      default: return fonts.sizes.xxlarge;
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Word Display */}
      <View style={styles.wordContainer}>
        <Text style={[styles.word, { fontSize: getFontSize() }]}>
          {word}
        </Text>
        
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            style={styles.speakerButton}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <Text style={styles.speakerIcon}>🔊</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Syllable Breakdown */}
      <View style={styles.syllablesContainer}>
        {syllables.map((syllable, index) => (
          <React.Fragment key={index}>
            <Text style={styles.syllable}>{syllable}</Text>
            {index < syllables.length - 1 && (
              <Text style={styles.syllableSeparator}>·</Text>
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>
        Tap the speaker to hear the word
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  word: {
    fontFamily: fonts.primaryBold,
    color: colors.text,
    letterSpacing: fonts.letterSpacing.wide,
  },
  speakerButton: {
    backgroundColor: colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  speakerIcon: {
    fontSize: 32,
  },
  syllablesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  syllable: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primary,
    color: colors.primary,
    letterSpacing: fonts.letterSpacing.normal,
  },
  syllableSeparator: {
    fontSize: fonts.sizes.large,
    color: colors.textSecondary,
    marginHorizontal: 4,
  },
  instruction: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: fonts.letterSpacing.normal,
  },
});

export default WordDisplay;
