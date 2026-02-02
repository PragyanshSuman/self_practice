// src/screens/GuidedTracingScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type GuidedTracingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GuidedTracing'
>;

export default function GuidedTracingScreen() {
  const navigation = useNavigation<GuidedTracingScreenNavigationProp>();

  const handleGuidedPractice = () => {
    console.log('Guided Alphabet Practice clicked - Navigating to LetterMenu');
    // Navigate to LetterMenuScreen for guided practice
    navigation.navigate('LetterGuidingMenu');
  };

  const handleUnguidedPractice = () => {
    console.log('Unguided Alphabet Practice clicked');
    // Add your navigation logic here for unguided practice
    // Example: navigation.navigate('UnguidedLetterMenu');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <View style={styles.content}>
        
        {/* Guided Alphabet Practice Button */}
        <TouchableOpacity
          style={[styles.button, styles.guidedButton]}
          onPress={handleGuidedPractice}
          activeOpacity={0.85}
        >
          <View style={styles.buttonContent}>
            <View style={[styles.iconCircle, styles.guidedIconBg]}>
              <Text style={styles.icon}>👁️</Text>
            </View>
            
            <Text style={styles.buttonTitle}>Guided Alphabet Practice</Text>
            
            <Text style={styles.buttonDescription}>
              Follow visual guides to learn proper letter formation
            </Text>
            
            <View style={[styles.badge, styles.guidedBadge]}>
              <Text style={styles.badgeText}>🌟 Recommended</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Unguided Alphabet Practice Button */}
        <TouchableOpacity
          style={[styles.button, styles.unguidedButton]}
          onPress={handleUnguidedPractice}
          activeOpacity={0.85}
        >
          <View style={styles.buttonContent}>
            <View style={[styles.iconCircle, styles.unguidedIconBg]}>
              <Text style={styles.icon}>🎯</Text>
            </View>
            
            <Text style={styles.buttonTitle}>Unguided Alphabet Practice</Text>
            
            <Text style={styles.buttonDescription}>
              Practice writing letters independently from memory
            </Text>
            
            <View style={[styles.badge, styles.unguidedBadge]}>
              <Text style={styles.badgeText}>💪 Challenge Mode</Text>
            </View>
          </View>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 24,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
  },
  guidedButton: {
    borderColor: '#3B82F6',
  },
  unguidedButton: {
    borderColor: '#8B5CF6',
  },
  buttonContent: {
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidedIconBg: {
    backgroundColor: '#DBEAFE',
  },
  unguidedIconBg: {
    backgroundColor: '#EDE9FE',
  },
  icon: {
    fontSize: 42,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
  },
  buttonDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 4,
  },
  guidedBadge: {
    backgroundColor: '#EFF6FF',
  },
  unguidedBadge: {
    backgroundColor: '#F5F3FF',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
});
