// src/screens/MedicalReportScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, globalStyles } from '../theme';
import { StorageService } from '../services/storageService';
import { ReportGenerator } from '../utils/reportGenerator';
import { ClinicalReport } from '../types';

type RootStackParamList = {
  MedicalReport: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MedicalReport'>;

interface Props {
  navigation: NavigationProp;
}

const MedicalReportScreen: React.FC<Props> = ({ navigation }) => {
  const [report, setReport] = useState<ClinicalReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    try {
      const storage = new StorageService();
      const history = await storage.getPracticeHistory();
      const generator = new ReportGenerator();
      const clinicalReport = generator.generateReport(history);
      setReport(clinicalReport);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate medical report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!report) return;

    const exportText = `
CLINICAL PHONOLOGICAL ASSESSMENT REPORT
Generated: ${new Date(report.generatedAt).toLocaleDateString()}

SUMMARY STATISTICS
------------------
Total Sessions: ${report.totalSessions}
Average Accuracy: ${report.averageScore}%
Consistency Score: ${report.consistencyScore}/100
Trend: ${report.progressTrend.toUpperCase()}

PHONOLOGICAL DEFICITS (Weakest Phonemes)
----------------------------------------
${report.weakestPhonemes.map(p => `- /${p.phoneme}/ (Avg: ${p.averageScore}%, Attempts: ${p.count})`).join('\n') || 'None identified.'}

PHONOLOGICAL STRENGTHS
----------------------
${report.strongestPhonemes.map(p => `- /${p.phoneme}/ (Avg: ${p.averageScore}%, Attempts: ${p.count})`).join('\n') || 'None identified.'}

CLINICAL RECOMMENDATIONS
------------------------
${report.recommendations.map(r => `• ${r}`).join('\n')}
    `;

    try {
      await Share.share({
        message: exportText,
        title: 'PhonicCheck Clinical Report',
      });
    } catch (error) {
      console.error('Sharing error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analyzing clinical data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Clinical Report 🩺</Text>
          <View style={{ width: 60 }} />
        </View>

        {report && (
          <View style={styles.reportContainer}>
            {/* Summary Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{report.averageScore}%</Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{report.consistencyScore}</Text>
                  <Text style={styles.statLabel}>Consistency</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {report.progressTrend === 'improving' ? '↗️' : report.progressTrend === 'declining' ? '↘️' : '➡️'}
                  </Text>
                  <Text style={styles.statLabel}>Trend</Text>
                </View>
              </View>
            </View>

            {/* Weaknesses */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Areas for Intervention</Text>
              {report.weakestPhonemes.length > 0 ? (
                report.weakestPhonemes.map((p, i) => (
                  <View key={i} style={styles.phonemeRow}>
                    <View style={styles.phonemeBadge}>
                      <Text style={styles.phonemeText}>/{p.phoneme}/</Text>
                    </View>
                    <View style={styles.phonemeStats}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${p.averageScore}%`, backgroundColor: colors.scoreNeedsPractice }]} />
                      </View>
                      <Text style={styles.phonemeDetail}>{p.averageScore}% accuracy ({p.count} attempts)</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No significant deficits identified yet.</Text>
              )}
            </View>

            {/* Recommendations */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {report.recommendations.map((rec, index) => (
                <View key={index} style={styles.recRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
              <Text style={styles.exportButtonText}>Export for Specialist</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    fontSize: fonts.sizes.medium,
    color: colors.primary,
    fontFamily: fonts.primary,
  },
  title: {
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    color: colors.text,
  },
  reportContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.primaryBold,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
  phonemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phonemeBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  phonemeText: {
    fontFamily: fonts.primaryBold,
    color: colors.text,
  },
  phonemeStats: {
    flex: 1,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.phonemeInactive,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  phonemeDetail: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: fonts.primary,
  },
  emptyText: {
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
    color: colors.primary,
    fontSize: 16,
  },
  recText: {
    flex: 1,
    fontFamily: fonts.primary,
    color: colors.text,
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  exportButtonText: {
    color: '#FFF',
    fontFamily: fonts.primaryBold,
    fontSize: fonts.sizes.medium,
  },
});

export default MedicalReportScreen;
