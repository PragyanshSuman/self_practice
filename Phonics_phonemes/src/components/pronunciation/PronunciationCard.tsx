/**
 * PronunciationCard: Reusable pronunciation UI component
 * 
 * DESIGN PHILOSOPHY:
 * - Declarative API: just pass a word, everything else is automatic
 * - Self-contained: manages its own loading, error, and play states
 * - Accessible: supports screen readers, large touch targets
 * - Responsive: adapts to tablet/phone screen sizes
 * 
 * USAGE:
 * ```tsx
 * <PronunciationCard word="apple" />
 * <PronunciationCard word="banana" showMetadata={false} />
 * ```
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  AccessibilityInfo,
  Image,
} from 'react-native';
import { pronunciationEngine } from '../../services/pronunciation/PronunciationEngine';
import { segmentWord } from '../../services/pronunciation/GraphemeMapper';
import { audioEngine } from '../../services/audio/AudioEngine';
import { ProcessedPronunciation } from '../../types/pronunciation.types';
import { styles } from './PronunciationCard.styles';

/**
 * Component props
 */
interface PronunciationCardProps {
  word: string; // The word to display and pronounce
  showMetadata?: boolean; // Show source/confidence info (default: true)
  autoPlay?: boolean; // Auto-play on mount (default: false)
  dyslexicMode?: boolean; // Use OpenDyslexic font
  onPlayStart?: () => void; // Callback when audio starts
  onPlayEnd?: () => void; // Callback when audio ends
  onError?: (error: string) => void; // Callback on error
}

/**
 * Component state
 */
  interface CardState {
    pronunciation: ProcessedPronunciation | null;
    isLoading: boolean;
    error: string | null;
    isPlaying: boolean;
    slowMode: boolean;
    imageError: boolean;
    playingSyllableIndex: number | null;
    focusMode: boolean; // Reading Ruler / Focus Mode
  }

/**
 * Main component
 */
export const PronunciationCard: React.FC<PronunciationCardProps> = ({
  word,
  showMetadata = true, // Default to showing metadata
  autoPlay = false,
  dyslexicMode = false,
  onPlayStart,
  onPlayEnd,
  onError,
}) => {
  // Font override style
  const fontStyle = dyslexicMode ? { fontFamily: 'OpenDyslexic-Regular' } : {};

  const [state, setState] = useState<CardState>({
    pronunciation: null,
    isLoading: true,
    error: null,
    isPlaying: false,
    slowMode: false,
    imageError: false,
    playingSyllableIndex: null,
    focusMode: false,
  });

  // ...

  /**
   * Handles syllable press (Interactive Phonics)
   */
  const handleSyllablePress = useCallback(async (syllable: string, index: number) => {
    if (state.isPlaying || state.playingSyllableIndex !== null) return;

    try {
      setState(prev => ({ ...prev, playingSyllableIndex: index }));
      
      // Announce for accessibility
      AccessibilityInfo.announceForAccessibility(`Syllable: ${syllable}`);

      // Speak just this syllable slowly
      await audioEngine.speak(syllable, { rate: 0.2 });

      setState(prev => ({ ...prev, playingSyllableIndex: null }));
    } catch (error) {
      console.error('Syllable play error:', error);
      setState(prev => ({ ...prev, playingSyllableIndex: null }));
    }
  }, [state.isPlaying, state.playingSyllableIndex]);

  /**
   * Handles slow mode toggle
   */
  const handleSlowToggle = useCallback(() => {
    setState(prev => ({ ...prev, slowMode: !prev.slowMode }));
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(
      `Slow mode ${!state.slowMode ? 'enabled' : 'disabled'}`
    );
  }, [state.slowMode]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const isMounted = useRef(true);

  /**
   * Effect: Track mount state
   */
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Effect: Load pronunciation and image when word changes
   */
  useEffect(() => {
    loadPronunciation();
    loadImage();
  }, [word]);

  /**
   * Loads image - Strict Accuracy Strategy
   * Strategy:
   * 1. Try English Wikipedia Summary API (Most accurate, provides thumb)
   * 2. If fail/empty, Try Wikimedia Commons direct file match (Fallback)
   * 3. If both fail, show NOTHING (Medical Standard)
   */
  const loadImage = useCallback(async () => {
    setImageUrl(null); 
    setState(prev => ({ ...prev, imageError: false }));

    const searchWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

    try {
      // 1. Try Standard Wikipedia API
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchWord)}`,
        {
          headers: {
            'User-Agent': 'PhonicsApp/1.0 (dyslexia_support@example.com)'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (isMounted.current && data.thumbnail?.source) {
          setImageUrl(data.thumbnail.source);
          return;
        }
      }
      
      // 2. API failed or no thumb? Fallback to Direct File match
      // This is a "Hail Mary" for common words like "Cat", "Dog"
      throw new Error('No API thumb');

    } catch (error) {
      if (isMounted.current) {
         console.warn('[PronunciationCard] Wiki API failed, trying direct fallback');
         // Fallback: Direct Wikimedia match
         // Note: matches "File:Cat.jpg"
         setImageUrl(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(searchWord)}.jpg`);
      }
    }
  }, [word]);

  /**
   * Effect: Auto-play if enabled
   */
  useEffect(() => {
    if (autoPlay && state.pronunciation && !state.error) {
      handlePlayPress();
    }
  }, [autoPlay, state.pronunciation]);

  /**
   * Loads pronunciation data from engine
   */
  const loadPronunciation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, imageError: false }));

      const result = await pronunciationEngine.getPronunciation({ word });

      if (isMounted.current) {
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Failed to load pronunciation');
        }

        setState(prev => ({
          ...prev,
          pronunciation: result.data!,
          isLoading: false,
        }));
      }

    } catch (error) {
      if (isMounted.current) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[PronunciationCard] Load error:', errorMessage);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        onError?.(errorMessage);
      }
    }
  }, [word, onError]);

  /**
   * Handles play button press
   */
  const handlePlayPress = useCallback(async () => {
    if (!state.pronunciation || state.isPlaying) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isPlaying: true }));
      onPlayStart?.();

      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(
        `Pronouncing ${word} at ${state.slowMode ? 'slow' : 'normal'} speed`
      );

      // Play audio
      const rate = state.slowMode ? 0.15 : 0.5;
      await audioEngine.speak(word, { rate });

      setState(prev => ({ ...prev, isPlaying: false }));
      onPlayEnd?.();

    } catch (error) {
      console.error('[PronunciationCard] Play error:', error);
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [word, state.pronunciation, state.isPlaying, state.slowMode, onPlayStart, onPlayEnd]);



  /**
   * Renders loading state
   */
  if (state.isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
          <Text style={styles.loadingText}>Loading pronunciation...</Text>
        </View>
      </View>
    );
  }

  /**
   * Renders error state
   */
  if (state.error || !state.pronunciation) {
    return (
      <View style={styles.card}>
        <View style={styles.errorContainer}>
          <Text style={styles.wordText}>{word}</Text>
          <Text style={styles.errorText}>
            {state.error || 'Could not load pronunciation'}
          </Text>
          <TouchableOpacity
            onPress={loadPronunciation}
            style={[styles.playButton, { marginTop: 16 }]}
            accessibilityLabel="Retry loading pronunciation"
          >
            <Text style={styles.playButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { pronunciation } = state;

  /**
   * Renders main content
   */
  return (
    <View
      style={styles.card}
      accessibilityLabel={`Pronunciation card for ${word}`}
      accessibilityRole="none"
    >
      {/* Visual Association Image - Dim in Focus Mode */}
      {imageUrl && (
        <View style={[styles.imageContainer, state.focusMode && { opacity: 0.1 }]}>
          <Image
            source={{ 
              uri: imageUrl,
              headers: {
                'User-Agent': 'PhonicsApp/1.0 (Educational App)'
              }
            }}
            style={styles.wordImage}
            accessibilityLabel={`Illustration of ${word}`}
            onError={(e) => {
              if (isMounted.current) {
                console.warn('[PronunciationCard] Image load error:', e.nativeEvent.error);
                setState(prev => ({ ...prev, imageError: true }));
                setImageUrl(null); // Remove invalid image immediately
              }
            }}
          />
        </View>
      )}

      {/* Word display (Color Coded Phonics) - Highlight in Focus Mode */}
      <View 
        style={[
          styles.wordContainer, 
          state.focusMode && { 
            backgroundColor: '#FFF9C4', // Highlight yellow
            paddingHorizontal: 20,
            borderRadius: 16,
            transform: [{ scale: 1.1 }],
            // Add a "reading ruler" bottom border
            borderBottomWidth: 4,
            borderBottomColor: '#FDD835',
          }
        ]}
      >
        <Text
          style={[styles.wordText, fontStyle]}
          accessibilityLabel={`Word: ${word}`}
          accessibilityRole="header"
        >
          {segmentWord(pronunciation.word).map((segment, index) => (
            <Text key={index} style={{ color: segment.color }}>
              {segment.text}
            </Text>
          ))}
        </Text>
      </View>

      {/* IPA notation - Dim in Focus Mode */}
      <View style={[styles.phoneticContainer, state.focusMode && { opacity: 0.1 }]}>
        <Text style={styles.phoneticLabel}>Pronunciation</Text>
        <Text
          style={[styles.phoneticText, fontStyle]}
          accessibilityLabel={`Phonetic notation: ${pronunciation.ipaNotation}`}
        >
          {pronunciation.ipaNotation}
        </Text>
      </View>

      {/* Syllable breakdown - Dim in Focus Mode */}
      <View
        style={[styles.syllableContainer, state.focusMode && { opacity: 0.1 }]}
        accessibilityLabel={`Syllables: ${pronunciation.syllables.join(', ')}`}
      >
        {pronunciation.syllables.map((syllable, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              onPress={() => handleSyllablePress(syllable, index)}
              accessibilityLabel={`Play syllable ${syllable}`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.syllable,
                  fontStyle,
                  state.playingSyllableIndex === index && { color: '#FF6B6B', transform: [{ scale: 1.1 }] }
                ]}
              >
                {syllable}
              </Text>
            </TouchableOpacity>
            
            {index < pronunciation.syllables.length - 1 && (
              <Text style={styles.syllableSeparator}>·</Text>
            )}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.controlsContainer}>
        {/* Play button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            state.isPlaying && styles.playButtonPressed,
          ]}
          onPress={handlePlayPress}
          disabled={state.isPlaying}
          accessibilityLabel={`Play pronunciation ${state.slowMode ? 'slowly' : 'at normal speed'}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: state.isPlaying }}
        >
          {state.isPlaying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.playButtonText}>▶</Text>
          )}
          <Text style={styles.playButtonText}>
            {state.isPlaying ? 'Playing...' : 'Play'}
          </Text>
        </TouchableOpacity>

        {/* Slow mode toggle */}
        <TouchableOpacity
          style={[
            styles.slowToggleContainer,
            state.slowMode && styles.slowToggleActive,
          ]}
          onPress={handleSlowToggle}
          accessibilityLabel="Toggle slow mode"
          accessibilityRole="switch"
          accessibilityState={{ checked: state.slowMode }}
        >
          <Text
            style={[
              styles.slowToggleText,
              state.slowMode && styles.slowToggleTextActive,
            ]}
          >
            🐢
          </Text>
        </TouchableOpacity>

        {/* Focus Mode Toggle */}
        <TouchableOpacity
          style={[
            styles.slowToggleContainer,
            state.focusMode && { backgroundColor: '#E1BEE7', borderColor: '#BA68C8' },
          ]}
          onPress={() => setState(prev => ({ ...prev, focusMode: !prev.focusMode }))}
          accessibilityLabel="Toggle focus mode"
          accessibilityRole="switch"
          accessibilityState={{ checked: state.focusMode }}
        >
          <Text style={[styles.slowToggleText, state.focusMode && { color: '#4A148C' }]}>
            📏 Focus
          </Text>
        </TouchableOpacity>
      </View>

      {/* Metadata (optional) - Hide in focus mode */}
      {showMetadata && !state.focusMode && (
        <View style={styles.metadataContainer}>
          <Text style={styles.metadataText}>
            Source: {pronunciation.metadata.source === 'dictionary' ? '📖 Dictionary' : '🧠 Rule-based'}
          </Text>
          
          <View
            style={[
              styles.confidenceBadge,
              pronunciation.metadata.confidence >= 0.9
                ? styles.confidenceBadgeHigh
                : pronunciation.metadata.confidence < 0.7
                ? styles.confidenceBadgeLow
                : {},
            ]}
          >
            <Text
              style={[
                styles.confidenceText,
                pronunciation.metadata.confidence >= 0.9
                  ? styles.confidenceTextHigh
                  : pronunciation.metadata.confidence < 0.7
                  ? styles.confidenceTextLow
                  : {},
              ]}
            >
              {Math.round(pronunciation.metadata.confidence * 100)}% confident
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

/**
 * FUTURE ENHANCEMENTS:
 * 
 * 1. Add waveform visualization during playback
 * 2. Add recording button for pronunciation practice
 * 3. Add scoring system (compare user audio vs. correct pronunciation)
 * 4. Add letter tracing integration
 * 5. Add gamification (stars, badges for correct pronunciations)
 * 
 * Example recording feature:
 * ```tsx
 * const [isRecording, setIsRecording] = useState(false);
 * 
 * const handleRecord = async () => {
 *   if (isRecording) {
 *     const audioFile = await stopRecording();
 *     const score = await scorePronunciation(audioFile, word);
 *     showFeedback(score);
 *   } else {
 *     await startRecording();
 *     setIsRecording(true);
 *   }
 * };
 * 
 * <TouchableOpacity onPress={handleRecord}>
 *   <Text>{isRecording ? '⏹️ Stop' : '🎤 Record'}</Text>
 * </TouchableOpacity>
 * ```
 */

export default PronunciationCard;
