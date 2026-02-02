/**
 * App.tsx - Root component
 * 
 * RESPONSIBILITIES:
 * - Initialize TTS engine on app start
 * - Provide navigation structure (if using react-navigation)
 * - Handle app lifecycle (background/foreground)
 * - Global error boundary
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { audioEngine } from './src/services/audio/AudioEngine';
import { PronunciationDemoScreen } from './src/screens/PronunciationDemoScreen';

/**
 * App initialization states
 */
enum AppState {
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  ERROR = 'ERROR',
}

/**
 * Root App component
 */
const App = (): React.JSX.Element => {
  const [appState, setAppState] = useState<AppState>(AppState.INITIALIZING);
  const [initError, setInitError] = useState<string | null>(null);

  /**
   * Initialize app on mount
   */
  useEffect(() => {
    initializeApp();

    // Cleanup on unmount
    return () => {
      audioEngine.cleanup();
    };
  }, []);

  /**
   * App initialization logic
   */
  const initializeApp = async () => {
    try {
      console.log('[App] Starting initialization...');
      setAppState(AppState.INITIALIZING);

      // Initialize audio engine (TTS)
      await audioEngine.initialize();

      // Set language to Indian English
      await audioEngine.setLanguage('en-IN');

      console.log('[App] Initialization complete');
      setAppState(AppState.READY);

    } catch (error) {
      console.error('[App] Initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      setInitError(errorMessage);
      setAppState(AppState.ERROR);
    }
  };

  /**
   * Render loading state
   */
  if (appState === AppState.INITIALIZING) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Initializing pronunciation engine...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (appState === AppState.ERROR) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Text style={styles.errorTitle}>⚠️ Initialization Error</Text>
        <Text style={styles.errorText}>{initError}</Text>
        <Text style={styles.errorHint}>
          Make sure TTS is enabled in your device settings.
        </Text>
      </View>
    );
  }

  /**
   * Render main app
   */
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <PronunciationDemoScreen />
    </>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5F6368',
    textAlign: 'center',
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EA4335',
    marginBottom: 12,
    textAlign: 'center',
  },

  errorText: {
    fontSize: 16,
    color: '#202124',
    textAlign: 'center',
    marginBottom: 8,
  },

  errorHint: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});

export default App;
