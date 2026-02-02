// src/screens/PracticeScreen.tsx - Main pronunciation practice screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fonts, globalStyles } from '../theme';
import { Word, PronunciationResult } from '../types';
import { wordDatabase } from '../data/wordDatabase';
import { AudioRecorder } from '../services/audioRecorder';
import { TTSService } from '../services/ttsService';
import { StorageService } from '../services/storageService';
import { AudioProcessor } from '../utils/audioProcessor';
import { MFCCExtractor } from '../utils/mfccExtractor';
import { DTWComparator } from '../utils/dtwCompare';
import { PhonemeAnalyzer } from '../utils/phonemeAnalyzer';
import { SyllableSplitter } from '../utils/syllableSplitter';
import { WordRecognizer, RecognitionResult } from '../utils/WordRecognizer';
import DebugInspector from '../components/DebugInspector';
import { FeedbackGenerator } from '../utils/feedbackGenerator';

// Components
import WordDisplay from '../components/WordDisplay';
import RecordButton from '../components/RecordButton';
import FeedbackDisplay from '../components/FeedbackDisplay';
import PhonemeVisualizer from '../components/PhonemeVisualizer';
import SyllableBreakdown from '../components/SyllableBreakdown';
import VoiceWaveform from '../components/VoiceWaveform';

type RootStackParamList = {
  Home: undefined;
  Practice: { categoryId: string; difficulty: string };
};

type PracticeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Practice'>;
type PracticeScreenRouteProp = RouteProp<RootStackParamList, 'Practice'>;

interface PracticeScreenProps {
  navigation: PracticeScreenNavigationProp;
  route: PracticeScreenRouteProp;
}

const PracticeScreen: React.FC<PracticeScreenProps> = ({ navigation, route }) => {
  const { categoryId, difficulty } = route.params;

  // State
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [recordingPath, setRecordingPath] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  
  const addDebugLog = (msg: string) => {
      console.log(msg);
      setDebugLogs(prev => [...prev.slice(-4), msg]); // Keep last 5 logs
  };

  // Services
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [ttsService] = useState(() => new TTSService());
  const [storageService] = useState(() => new StorageService());
  const [audioProcessor] = useState(() => new AudioProcessor());
  const [wordRecognizer] = useState(() => new WordRecognizer());
  const [feedbackGenerator] = useState(() => new FeedbackGenerator());
  const [referenceFeatures, setReferenceFeatures] = useState<any>(null);

  useEffect(() => {
    initializeScreen();
    return () => {
      cleanup();
    };
  }, []);

  const initializeScreen = async () => {
    try {
      await ttsService.initialize();
      loadNewWord();
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize. Please try again.');
    }
  };

  const cleanup = async () => {
    await audioRecorder.cleanup();
    ttsService.cleanup();
  };

  const loadNewWord = () => {
    const word = wordDatabase.getRandomWord(categoryId, difficulty as any);
    if (word) {
      setCurrentWord(word);
      setHasPlayedAudio(false);
      setResult(null);
      setRecordingPath('');
      setReferenceFeatures(null);
    } else {
      Alert.alert('No Words', 'No words available for this category and difficulty.');
      navigation.goBack();
    }
  };

  const handlePlaySound = async () => {
    if (!currentWord) return;

    try {
      await ttsService.speak(currentWord.text);
      setHasPlayedAudio(true);
      
      // Generate reference MFCC features for comparison
      // Note: In production, you'd record TTS output or use pre-recorded audio
      // For now, we'll generate synthetic reference on first user recording
    } catch (error) {
      console.error('TTS error:', error);
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  const handleStartRecording = async () => {
    if (!hasPlayedAudio) {
      Alert.alert('Listen First', 'Please listen to the word before recording.');
      return;
    }

    try {
      const path = await audioRecorder.startRecording();
      setRecordingPath(path);
      setIsRecording(true);
      setResult(null);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const path = await audioRecorder.stopRecording();
      setIsRecording(false);
      setRecordingPath(path);
      
      // Process the recording
      await processRecording(path);
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to process recording.');
    }
  };

  const processRecording = async (path: string) => {
    setIsProcessing(true);
    addDebugLog('Step 1: Processing Started');
    try {
      addDebugLog(`File: ${path.split('/').pop()}`);
      
      // 1. Load Audio Data
      addDebugLog('Step 1.5: Calling AudioProcessor...');
      const childAudio = await audioProcessor.loadAudioFile(path);
      
      addDebugLog(`Step 2: Loaded ${childAudio.duration.toFixed(2)}s`);
      
      // Volume Check
      const maxAmp = Math.max(...childAudio.samples.map(Math.abs));
      const volumeParam = (maxAmp * 100).toFixed(0);
      addDebugLog(`Vol: ${volumeParam}% (MaxAmp: ${maxAmp.toFixed(4)})`);
      
      if (maxAmp < 0.01) {
          Alert.alert("Microphone Issue", "No sound detected. Check Mic.");
          return;
      }

      // 2. Fetch Word Data
      addDebugLog('Step 3: Fetching Word Data...');
      const currentWordData = wordDatabase.getAllCategories()
        .flatMap(c => c.words)
        .find(w => w.id === currentWord?.id);
        
      addDebugLog(`Word: ${currentWord?.text} (ID:${currentWord?.id})`);
      if (currentWordData?.id !== currentWord?.id) {
          addDebugLog(`MISMATCH! Found: ${currentWordData?.id}`);
      }
      
      if (!currentWord) throw new Error("No current word");

      const phonemes = currentWordData?.phonemes || currentWord.text.split('').map(c => c.toLowerCase());
      addDebugLog(`Phonemes: ${phonemes.join('-')}`);

      // 3. Analyze (Shadow Recognition)
      addDebugLog('Step 4: Recognizing...');
      const recResult = await wordRecognizer.recognize(
        childAudio,
        currentWord.text,
        phonemes
      );
      
      const result = recResult.fullAnalysis;
      
      addDebugLog(`Step 5: Winner=${recResult.capturedWord} (${recResult.winningScore})`);

      // 4. Save Session
      const session: any = {
        wordId: currentWord.id,
        word: currentWord.text,
        score: result.overallScore,
        timestamp: Date.now(),
        syllableScores: result.syllableScores,
      };

      await storageService.savePracticeSession(session);
      
      // 5. Update UI
      setResult(result);
      setRecognitionResult(recResult);

    } catch (error) {
      console.error('Processing error:', error);
      addDebugLog(`CRASH: ${error}`);
      Alert.alert('Error', `Crash: ${error}`);
    } finally {
      setIsProcessing(false);
      addDebugLog('Done.');
    }
  };



  const handleNextWord = () => {
    loadNewWord();
  };

  const handlePracticeSyllable = async (syllable: string) => {
    try {
      await ttsService.speak(syllable);
    } catch (error) {
      console.error('Syllable TTS error:', error);
    }
  };

  if (!currentWord) {
    return (
      <SafeAreaView style={[globalStyles.safeArea, globalStyles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Practice</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Word Display */}
        <WordDisplay
          word={currentWord.text}
          syllables={currentWord.syllables}
          onPlaySound={handlePlaySound}
        />

        {/* Recording Waveform */}
        <VoiceWaveform isRecording={isRecording} />

        {/* Record Button */}
        <RecordButton
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          isRecording={isRecording}
          disabled={!hasPlayedAudio || isProcessing}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Analyzing your pronunciation...</Text>
          </View>
        )}
        
        {/* Debug Info Removed for Production */ }

        {recognitionResult && result && (
             <DebugInspector 
                capturedWord={recognitionResult.capturedWord}
                targetWord={currentWord.text}
                scores={recognitionResult.distractorScores}
                phonemeScores={result.phonemeScores}
                isNativeFallback={recognitionResult.isNativeFallback}
             />
        )}

        {result && <FeedbackDisplay result={result} />}

        {/* Phoneme Visualizer */}
        {result && result.phonemeScores.length > 0 && (
          <PhonemeVisualizer phonemeScores={result.phonemeScores} />
        )}

        {/* Syllable Breakdown */}
        {result && result.syllableScores.length > 0 && (
          <SyllableBreakdown
            syllableScores={result.syllableScores}
            onPracticeSyllable={handlePracticeSyllable}
          />
        )}

        {/* Next Word Button */}
        {result && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextWord}>
            <Text style={styles.nextButtonText}>Next Word →</Text>
          </TouchableOpacity>
        )}
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
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  processingText: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    marginTop: 12,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.cardBackground,
  },
});

export default PracticeScreen;
