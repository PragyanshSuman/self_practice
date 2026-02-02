import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LetterDisplayProps {
  letter: string;
  phoneme?: string;
  size?: number;
  color?: string;
}

const LetterDisplay: React.FC<LetterDisplayProps> = ({
  letter,
  phoneme,
  size = 120,
  color = '#333',
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.letter, { fontSize: size, color }]}>{letter.toUpperCase()}</Text>
      {phoneme && (
        <Text style={[styles.phoneme, { color }]}>/{phoneme}/</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  letter: {
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'System',
  },
  phoneme: {
    fontSize: 24,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default LetterDisplay;
