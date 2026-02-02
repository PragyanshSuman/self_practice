import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Colors from '@constants/Colors';

interface FeedbackOverlayProps {
  visible: boolean;
  type: 'success' | 'warning' | 'error' | 'info' | 'encouragement';
  message: string;
  submessage?: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  dismissTimeout?: number;
}

const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
  visible,
  type,
  message,
  submessage,
  onDismiss,
  autoDismiss = true,
  dismissTimeout = 3000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, dismissTimeout);

        return () => clearTimeout(timer);
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, autoDismiss, dismissTimeout]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.success,
          icon: '✓',
          textColor: '#fff',
        };
      case 'warning':
        return {
          backgroundColor: Colors.warning,
          icon: '⚠',
          textColor: '#fff',
        };
      case 'error':
        return {
          backgroundColor: Colors.error,
          icon: '✕',
          textColor: '#fff',
        };
      case 'encouragement':
        return {
          backgroundColor: Colors.secondary,
          icon: '🌟',
          textColor: '#fff',
        };
      case 'info':
      default:
        return {
          backgroundColor: Colors.info,
          icon: 'ℹ',
          textColor: '#fff',
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: typeStyles.backgroundColor,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{typeStyles.icon}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.message, { color: typeStyles.textColor }]}>
              {message}
            </Text>
            {submessage && (
              <Text style={[styles.submessage, { color: typeStyles.textColor }]}>
                {submessage}
              </Text>
            )}
          </View>

          {!autoDismiss && (
            <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
              <Text style={[styles.dismissText, { color: typeStyles.textColor }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  container: {
    maxWidth: Dimensions.get('window').width - 40,
    minWidth: 280,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  submessage: {
    fontSize: 14,
    opacity: 0.9,
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default FeedbackOverlay;
