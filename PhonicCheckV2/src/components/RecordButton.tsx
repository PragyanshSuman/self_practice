// src/components/RecordButton.tsx - Hold-to-record button

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { colors, fonts } from '../theme';

interface RecordButtonProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  onStartRecording,
  onStopRecording,
  isRecording,
  disabled = false,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [opacityAnim] = useState(new Animated.Value(0.3));

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    opacityAnim.stopAnimation();
    Animated.parallel([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    if (disabled) return;
    
    Vibration.vibrate(50);
    startPulseAnimation();
    onStartRecording();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    // Immediate UI updates
    Vibration.vibrate(50);
    stopPulseAnimation();

    // Defer heavy logic slightly to allow UI to update
    requestAnimationFrame(() => {
        onStopRecording();
    });
  };

  return (
    <View style={styles.container}>
      {/* Instruction Text */}
      <Text style={styles.instruction}>
        {isRecording ? 'Recording... Release when done' : 'Hold to speak'}
      </Text>

      {/* Record Button */}
      <View style={styles.buttonContainer}>
        {/* Pulse Effect */}
        {isRecording && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: opacityAnim,
              },
            ]}
          />
        )}

        {/* Main Button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            disabled && styles.recordButtonDisabled,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          disabled={disabled}
        >
          <Text style={styles.micIcon}>
            {isRecording ? '⏹️' : '🎤'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Text */}
      <Text style={styles.statusText}>
        {disabled
          ? 'Play the word first'
          : isRecording
          ? 'Keep holding...'
          : 'Ready to record'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  instruction: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: fonts.letterSpacing.normal,
  },
  buttonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.recordingActive,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.recordingReady,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.recordingReady,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 6,
    borderColor: colors.cardBackground,
  },
  recordButtonActive: {
    backgroundColor: colors.recordingActive,
    shadowColor: colors.recordingActive,
  },
  recordButtonDisabled: {
    backgroundColor: colors.textDisabled,
    shadowColor: colors.textDisabled,
  },
  micIcon: {
    fontSize: 48,
  },
  statusText: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    letterSpacing: fonts.letterSpacing.normal,
  },
});

export default RecordButton;
