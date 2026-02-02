import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TracingScreen from './src/screens/TracingScreen';
// import AudioService from './src/services/AudioService';
import { ALPHABET } from './src/constants/LetterPaths';
import WritingAssessmentScreen from './src/screens/WritingAssessmentScreen';

const Stack = createStackNavigator();
const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const GRID_PADDING = 20;
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (width - (GRID_PADDING * 2)) / COLUMN_COUNT - (ITEM_MARGIN * 2);

// Letter Selection Screen
const LetterSelectionScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Preload audio files
    const timer = setTimeout(() => {
      console.log('Audio files preloaded (simulated)');
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLetterPress = (letter: string) => {
    navigation.navigate('Tracing', { letter });
  };

  const renderLetterItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.letterButton}
      onPress={() => handleLetterPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.letterButtonText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Letter Mastery</Text>
        <Text style={styles.subtitle}>Select a letter to begin practice</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading audio files...</Text>
        </View>
      ) : (
        <FlatList
          data={ALPHABET}
          renderItem={renderLetterItem}
          keyExtractor={item => item}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.letterGrid}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Designed for children with dyslexia
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Tracing Screen Wrapper
const TracingScreenWrapper = ({ route, navigation }: any) => {
  const { letter } = route.params;

  const handleComplete = (analytics: any) => {
    console.log('Session completed:', analytics);
  };

  const handleExit = () => {
    navigation.goBack();
  };

  return (
    <TracingScreen
      letter={letter}
      userId="demo_user_001"
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
};

// Main App
const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LetterSelection"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="LetterSelection"
          component={LetterSelectionScreen}
        />
        <Stack.Screen
          name="Tracing"
          component={TracingScreenWrapper}
        />
        <Stack.Screen
          name="Assessment"
          component={WritingAssessmentScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Slightly cooler grey for better contrast
  },
  headerContainer: {
    paddingTop: 60, // More top space for status bar
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    marginBottom: 24,
    zIndex: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#283593', // Deep, authoritative blue
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7986CB', // Soft indigo
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9FA8DA',
    marginTop: 12,
  },
  letterGrid: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 40,
  },
  letterButton: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.1, // Fixed Aspect Ratio (vertical rectangle)
    backgroundColor: '#FFFFFF',
    margin: ITEM_MARGIN,
    borderRadius: 24, // Very round, pebble-like
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#303F9F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Stronger pop
    shadowRadius: 6,
    borderWidth: 0, // Removed border for cleaner look
  },
  letterButtonText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#3949AB',
    fontFamily: 'sans-serif-medium', // Cleaner font on Android
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#B0BEC5',
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

export default App;
