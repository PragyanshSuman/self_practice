// src/components/tracing/ProgressIndicator.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  label?: string;
  color?: string;
  size?: number;
}

export default function ProgressIndicator({
  progress,
  label = 'Progress',
  color = '#10B981',
  size = 120,
}: ProgressIndicatorProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: progress,
      tension: 20,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Calculate circumference
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="8"
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.textContainer}>
        <Text style={[styles.progressText, { color }]}>
          {Math.round(progress)}%
        </Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
}

// Need to import from react-native-svg
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 28,
    fontWeight: '900',
  },
  labelText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
});
