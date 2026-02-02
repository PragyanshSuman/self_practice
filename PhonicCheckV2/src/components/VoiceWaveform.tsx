// src/components/VoiceWaveform.tsx - Recording waveform animation

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors } from '../theme';

interface VoiceWaveformProps {
  isRecording: boolean;
  numberOfBars?: number;
}

const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isRecording,
  numberOfBars = 20,
}) => {
  const bars = Array.from({ length: numberOfBars }, (_, i) => ({
    id: i,
    anim: useRef(new Animated.Value(0.2)).current,
  }));

  useEffect(() => {
    if (isRecording) {
      // Start animation for each bar with different delays
      bars.forEach((bar, index) => {
        const animate = () => {
          Animated.sequence([
            Animated.timing(bar.anim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 200 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(bar.anim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 200 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ]).start(() => {
            if (isRecording) {
              animate();
            }
          });
        };
        
        setTimeout(() => {
          if (isRecording) animate();
        }, index * 20);
      });

    } else {
      // Reset all bars
      bars.forEach(bar => {
        bar.anim.stopAnimation();
        Animated.timing(bar.anim, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: false, // height property doesn't support native driver
        }).start();
      });
    }

    // Cleanup function to stop animations when component unmounts or isRecording changes
    return () => {
      bars.forEach(bar => bar.anim.stopAnimation());
    };
  }, [isRecording]);

  return (
    <View style={styles.container}>
      {bars.map((bar) => (
        <Animated.View
          key={bar.id}
          style={[
            styles.bar,
            {
              height: bar.anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['20%', '100%'],
              }),
              backgroundColor: isRecording
                ? colors.recordingActive
                : colors.phonemeInactive,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 3,
    paddingHorizontal: 20,
  },
  bar: {
    flex: 1,
    borderRadius: 10,
    minHeight: 10,
  },
});

export default VoiceWaveform;
