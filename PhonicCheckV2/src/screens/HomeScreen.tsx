// src/screens/HomeScreen.tsx - Category selection screen

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, globalStyles } from '../theme';
import { wordDatabase, WordCategory } from '../data/wordDatabase';
import { StorageService } from '../services/storageService';
import ProgressTracker from '../components/ProgressTracker';

type RootStackParamList = {
  Home: undefined;
  Practice: { categoryId: string; difficulty: string };
  Progress: undefined;
  Settings: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<WordCategory[]>([]);
  const [statistics, setStatistics] = useState({
    totalWords: 0,
    averageScore: 0,
    bestScore: 0,
    recentImprovement: 0,
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const storageService = new StorageService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load categories
    const allCategories = wordDatabase.getAllCategories();
    setCategories(allCategories);

    // Load statistics
    const stats = await storageService.getStatistics();
    setStatistics(stats);
  };

  const handleCategoryPress = (categoryId: string) => {
    navigation.navigate('Practice', {
      categoryId,
      difficulty: selectedDifficulty,
    });
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleProgressPress = () => {
    navigation.navigate('Progress');
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Phonic Check 🎯</Text>
            <Text style={styles.subtitle}>Practice pronunciation with fun!</Text>
          </View>
          
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Tracker */}
        {statistics.totalWords > 0 && (
          <TouchableOpacity onPress={handleProgressPress} activeOpacity={0.9}>
            <ProgressTracker {...statistics} />
          </TouchableOpacity>
        )}

        {/* Difficulty Selector */}
        <View style={styles.difficultyContainer}>
          <Text style={styles.sectionTitle}>Choose Difficulty</Text>
          <View style={styles.difficultyButtons}>
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  selectedDifficulty === level && styles.difficultyButtonActive,
                ]}
                onPress={() => setSelectedDifficulty(level)}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    selectedDifficulty === level && styles.difficultyTextActive,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Choose a Category</Text>
          
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: category.color }]}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {category.words.filter(w => w.difficulty === selectedDifficulty).length} words
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  title: {
    fontSize: fonts.sizes.xxlarge,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    letterSpacing: fonts.letterSpacing.normal,
  },
  subtitle: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    marginTop: 4,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
  difficultyContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  difficultyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyText: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.text,
  },
  difficultyTextActive: {
    color: colors.cardBackground,
    fontFamily: fonts.primaryBold,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
});

export default HomeScreen;
