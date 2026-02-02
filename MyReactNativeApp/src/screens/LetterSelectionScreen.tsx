import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ALPHABET, LETTER_PATHS } from '@constants/LetterPaths';
import LETTER_DEFINITIONS, { LetterCategories } from '@models/LetterDefinitions';
import Colors, { ColorUtils } from '@constants/Colors';
import AudioService from '@services/AudioService';
import { useAnalytics } from '@hooks/useAnalytics';
import ProgressIndicator from '@components/ProgressIndicator';

interface LetterItemProps {
  letter: string;
  onPress: (letter: string) => void;
  mastered: boolean;
  problematic: boolean;
  sessionCount: number;
  averageAccuracy?: number;
}

const LetterItem: React.FC<LetterItemProps> = ({
  letter,
  onPress,
  mastered,
  problematic,
  sessionCount,
  averageAccuracy,
}) => {
  const metadata = LETTER_DEFINITIONS[letter];
  const difficultyColor = ColorUtils.getDifficultyColor(metadata.difficulty);

  const getStatusColor = () => {
    if (mastered) return Colors.success;
    if (problematic) return Colors.error;
    if (sessionCount > 0) return Colors.warning;
    return Colors.border;
  };

  return (
    <TouchableOpacity
      style={[
        styles.letterItem,
        { borderColor: getStatusColor(), borderWidth: 2 },
      ]}
      onPress={() => onPress(letter)}
      activeOpacity={0.7}
    >
      <View style={styles.letterContent}>
        <Text style={styles.letterText}>{letter}</Text>
        
        {sessionCount > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.sessionCount}>{sessionCount}</Text>
            {averageAccuracy !== undefined && (
              <ProgressIndicator
                progress={averageAccuracy / 100}
                size={30}
                strokeWidth={3}
                showPercentage={false}
                color={ColorUtils.getScoreColor(averageAccuracy)}
              />
            )}
          </View>
        )}

        {mastered && (
          <View style={[styles.badge, { backgroundColor: Colors.success }]}>
            <Text style={styles.badgeText}>✓</Text>
          </View>
        )}

        {problematic && (
          <View style={[styles.badge, { backgroundColor: Colors.error }]}>
            <Text style={styles.badgeText}>!</Text>
          </View>
        )}

        <View
          style={[
            styles.difficultyIndicator,
            { backgroundColor: difficultyColor },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const LetterSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'learning' | 'new'>('all');

  const { summary, loading: analyticsLoading } = useAnalytics({ userId: 'demo_user_001' });

  useEffect(() => {
    // Preload audio files
    AudioService.preloadAllLetters()
      .then(() => {
        console.log('Audio files preloaded');
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to preload audio:', err);
        setLoading(false);
      });
  }, []);

  const handleLetterPress = (letter: string) => {
    navigation.navigate('Tracing' as never, { letter } as never);
  };

  const getLetterStats = (letter: string) => {
    if (!summary) return { sessionCount: 0, averageAccuracy: 0 };

    const letterSessions = summary.sessionHistory.filter(s => s.letter === letter);
    const sessionCount = letterSessions.length;
    const averageAccuracy = letterSessions.length > 0
      ? letterSessions.reduce((sum, s) => sum + s.spatial_accuracy_deviation.accuracy_score, 0) / letterSessions.length
      : 0;

    return { sessionCount, averageAccuracy };
  };

  const getFilteredLetters = () => {
    let filtered = [...ALPHABET];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(letter =>
        letter.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(letter => {
        const metadata = LETTER_DEFINITIONS[letter];
        return metadata.difficulty === filterDifficulty;
      });
    }

    // Status filter
    if (filterStatus !== 'all' && summary) {
      filtered = filtered.filter(letter => {
        const { sessionCount, averageAccuracy } = getLetterStats(letter);

        if (filterStatus === 'mastered') {
          return summary.masteredLetters.includes(letter);
        } else if (filterStatus === 'learning') {
          return sessionCount > 0 && !summary.masteredLetters.includes(letter);
        } else if (filterStatus === 'new') {
          return sessionCount === 0;
        }
        return true;
      });
    }

    return filtered;
  };

  const renderLetterItem = ({ item }: { item: string }) => {
    const { sessionCount, averageAccuracy } = getLetterStats(item);
    const mastered = summary?.masteredLetters.includes(item) || false;
    const problematic = summary?.problematicLetters.includes(item) || false;

    return (
      <LetterItem
        letter={item}
        onPress={handleLetterPress}
        mastered={mastered}
        problematic={problematic}
        sessionCount={sessionCount}
        averageAccuracy={averageAccuracy}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Letter Tracing</Text>
      <Text style={styles.subtitle}>Choose a letter to practice</Text>

      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalSessions}</Text>
              <Text style={styles.summaryLabel}>Sessions</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.masteredLetters.length}</Text>
              <Text style={styles.summaryLabel}>Mastered</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {summary.averageAccuracy.toFixed(0)}%
              </Text>
              <Text style={styles.summaryLabel}>Accuracy</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  { color: ColorUtils.getRiskColor(summary.overallRiskLevel) },
                ]}
              >
                {summary.overallRiskLevel}
              </Text>
              <Text style={styles.summaryLabel}>Risk</Text>
            </View>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search letters..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Difficulty:</Text>
        <View style={styles.filterButtons}>
          {(['all', 'easy', 'medium', 'hard'] as const).map(difficulty => (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.filterButton,
                filterDifficulty === difficulty && styles.filterButtonActive,
              ]}
              onPress={() => setFilterDifficulty(difficulty)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterDifficulty === difficulty && styles.filterButtonTextActive,
                ]}
              >
                {difficulty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.filterButtons}>
          {(['all', 'new', 'learning', 'mastered'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Mastered</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>In Progress</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
          <Text style={styles.legendText}>Needs Work</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
          <Text style={styles.legendText}>New</Text>
        </View>
      </View>
    </View>
  );

  if (loading || analyticsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredLetters = getFilteredLetters();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <FlatList
        data={filteredLetters}
        renderItem={renderLetterItem}
        keyExtractor={item => item}
        numColumns={5}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No letters found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('ProgressDashboard' as never)}
        >
          <Text style={styles.footerButtonText}>View Progress</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  filterButtonTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingBottom: 80,
  },
  letterItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    elevation: 3,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  letterContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  letterText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
  },
  sessionCount: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  difficultyIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LetterSelectionScreen;
