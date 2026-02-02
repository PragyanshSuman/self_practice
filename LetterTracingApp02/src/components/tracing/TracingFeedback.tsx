// src/components/tracing/TracingFeedback.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TracingMetrics } from '../../types/tracing';

interface TracingFeedbackProps {
  metrics: TracingMetrics;
  isTracing: boolean;
}

export default function TracingFeedback({ metrics, isTracing }: TracingFeedbackProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // Pulse animation for accuracy indicator
    if (isTracing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTracing]);

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  // Determine feedback color based on accuracy
  const getFeedbackColor = () => {
    if (metrics.accuracyScore >= 80) return '#10B981'; // Green
    if (metrics.accuracyScore >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // Determine feedback message
  const getFeedbackMessage = () => {
    if (!isTracing) return 'Start tracing!';
    if (metrics.isOnPath) return 'Great! Stay on the path';
    return 'Try to follow the guide';
  };

  const feedbackColor = getFeedbackColor();
  const feedbackMessage = getFeedbackMessage();

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Accuracy Indicator */}
      <Animated.View
        style={[
          styles.accuracyContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={[styles.accuracyCircle, { borderColor: feedbackColor }]}>
          <Text style={[styles.accuracyText, { color: feedbackColor }]}>
            {Math.round(metrics.accuracyScore)}%
          </Text>
        </View>
      </Animated.View>

      {/* Feedback Message */}
      <View style={[styles.messageContainer, { backgroundColor: feedbackColor }]}>
        <Text style={styles.messageText}>{feedbackMessage}</Text>
      </View>

      {/* Metrics Bar */}
      <View style={styles.metricsBar}>
        <MetricItem
          label="Coverage"
          value={`${Math.round(metrics.pathCoverage)}%`}
          color="#60A5FA"
        />
        <MetricItem
          label="Speed"
          value={`${Math.round(metrics.averageSpeed)}`}
          color="#A78BFA"
        />
        <MetricItem
          label="Strokes"
          value={`${metrics.strokeCount}`}
          color="#F472B6"
        />
      </View>

      {/* Real-time Path Indicator */}
      {isTracing && (
        <View style={styles.pathIndicator}>
          <View
            style={[
              styles.pathDot,
              {
                backgroundColor: metrics.isOnPath ? '#10B981' : '#EF4444',
              },
            ]}
          />
          <Text style={styles.pathIndicatorText}>
            {metrics.isOnPath ? 'On Path' : 'Off Path'}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  color: string;
}

function MetricItem({ label, value, color }: MetricItemProps) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={[styles.metricValueContainer, { backgroundColor: color }]}>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 100,
  },
  accuracyContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  accuracyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  accuracyText: {
    fontSize: 24,
    fontWeight: '900',
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pathIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pathDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  pathIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
});
