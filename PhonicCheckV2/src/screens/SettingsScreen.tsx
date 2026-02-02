// src/screens/SettingsScreen.tsx - App settings screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, globalStyles } from '../theme';
import { StorageService } from '../services/storageService';
import { TTSService } from '../services/ttsService';
import { AppSettings } from '../types';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  MedicalReport: undefined;
};

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [settings, setSettings] = useState<AppSettings>({
    ttsConfig: {
      voice: '',
      rate: 0.5,
      pitch: 1.0,
      language: 'en-US',
    },
    hapticEnabled: true,
    darkMode: false,
    dyslexicMode: false,
    highContrast: false,
    fontSize: 'large',
    difficultyLevel: 'beginner',
  });

  const storageService = new StorageService();
  const ttsService = new TTSService();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await storageService.loadSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    await storageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleSpeechRateChange = async (rate: number) => {
    const newSettings = {
      ...settings,
      ttsConfig: { ...settings.ttsConfig, rate },
    };
    await saveSettings(newSettings);
    await ttsService.setRate(rate);
  };

  const handleFontSizeChange = async (fontSize: 'small' | 'medium' | 'large') => {
    const newSettings = { ...settings, fontSize };
    await saveSettings(newSettings);
  };

  const handleDifficultyChange = async (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    const newSettings = { ...settings, difficultyLevel: difficulty };
    await saveSettings(newSettings);
  };

  const handleHapticToggle = async (value: boolean) => {
    const newSettings = { ...settings, hapticEnabled: value };
    await saveSettings(newSettings);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearAllData();
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const testSpeech = async () => {
    await ttsService.speak('This is how the voice sounds at this speed.');
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Voice Speed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Speed 🔊</Text>
          
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>
              Speech Rate: {settings.ttsConfig.rate.toFixed(1)}x
            </Text>
            
            <View style={styles.speedButtons}>
              {[0.3, 0.5, 0.7, 1.0].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[
                    styles.speedButton,
                    settings.ttsConfig.rate === rate && styles.speedButtonActive,
                  ]}
                  onPress={() => handleSpeechRateChange(rate)}
                >
                  <Text
                    style={[
                      styles.speedButtonText,
                      settings.ttsConfig.rate === rate && styles.speedButtonTextActive,
                    ]}
                  >
                    {rate}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.testButton} onPress={testSpeech}>
              <Text style={styles.testButtonText}>Test Voice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Font Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Size 📝</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.optionButtons}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.optionButton,
                    settings.fontSize === size && styles.optionButtonActive,
                  ]}
                  onPress={() => handleFontSizeChange(size)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      settings.fontSize === size && styles.optionButtonTextActive,
                    ]}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Default Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Difficulty 🎯</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.optionButtons}>
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    settings.difficultyLevel === level && styles.optionButtonActive,
                  ]}
                  onPress={() => handleDifficultyChange(level)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      settings.difficultyLevel === level && styles.optionButtonTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility ♿</Text>
          
          <View style={styles.settingCard}>
            <View style={[styles.switchRow, { marginBottom: 20 }]}>
              <View>
                <Text style={styles.switchLabel}>Dyslexic Font</Text>
                <Text style={styles.switchSubtext}>
                  Use OpenDyslexic style font
                </Text>
              </View>
              <Switch
                value={settings.dyslexicMode}
                onValueChange={async (val) => {
                   const newSettings = { ...settings, dyslexicMode: val };
                   await saveSettings(newSettings);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.cardBackground}
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>High Contrast</Text>
                <Text style={styles.switchSubtext}>
                  Enhance visibility and text contrast
                </Text>
              </View>
              <Switch
                value={settings.highContrast}
                onValueChange={async (val) => {
                   const newSettings = { ...settings, highContrast: val };
                   await saveSettings(newSettings);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.cardBackground}
              />
            </View>
          </View>
        </View>

        {/* Clinical Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Tools 🩺</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity 
              style={styles.clinicalButton} 
              onPress={() => navigation.navigate('MedicalReport')}
            >
              <Text style={styles.clinicalButtonText}>Generate Clinical Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Haptic Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences ⚙️</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Vibration Feedback</Text>
                <Text style={styles.switchSubtext}>
                  Feel vibrations when recording
                </Text>
              </View>
              <Switch
                value={settings.hapticEnabled}
                onValueChange={handleHapticToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.cardBackground}
              />
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About 📱</Text>
          
          <View style={styles.settingCard}>
            <Text style={styles.infoText}>Phonic Check v1.0.0</Text>
            <Text style={styles.infoSubtext}>
              Pronunciation practice app for dyslexic learners
            </Text>
            <Text style={styles.infoSubtext}>
              Built with ❤️ for inclusive learning
            </Text>
          </View>
        </View>

        {/* Clear Data */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primary,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingLabel: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.text,
    marginBottom: 16,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  speedButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  speedButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  speedButtonText: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.text,
  },
  speedButtonTextActive: {
    color: colors.cardBackground,
    fontFamily: fonts.primaryBold,
  },
  testButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primaryBold,
    color: colors.cardBackground,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.text,
  },
  optionButtonTextActive: {
    color: colors.cardBackground,
    fontFamily: fonts.primaryBold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.text,
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
  infoText: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  clinicalButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clinicalButtonText: {
    color: '#FFF',
    fontFamily: fonts.primaryBold,
    fontSize: fonts.sizes.medium,
  },
  dangerButton: {
    backgroundColor: colors.recordingActive,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primaryBold,
    color: colors.cardBackground,
  },
});

export default SettingsScreen;
