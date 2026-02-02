import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAnalytics } from '@hooks/useAnalytics';
import Colors, { ColorUtils } from '@constants/Colors';
import ProgressIndicator from '@components/ProgressIndicator';
import VisualizationService from '@services/VisualizationService';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  color = Colors.primary,
  trend,
}) => (
  <View style={[styles.metricCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    {trend !== undefined && (
      <View style={styles.trendContainer}>
        <Text
          style={[
            styles.trendText,
            { color: trend >= 0 ? Colors.success : Colors.error },
          ]}
        >
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </Text>
      </View>
    )}
  </View>
);

const ProgressDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { summary, analytics, loading, getPerformanceTrend } = useAnalytics({
    userId: 'demo_user_001',
  });

  const [selectedView, setSelectedView] = useState<'overview' | 'details' | 'risk'>('overview');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!summary || analytics.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptyText}>
            Complete some tracing sessions to see your progress!
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Start Practicing</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverview = () => {
    const masteryProgress = summary.masteredLetters.length / 26;

    return (
      <View>
        {/* Overall Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <View style={styles.progressContainer}>
            <ProgressIndicator
              progress={masteryProgress}
              size={120}
              strokeWidth={12}
              color={Colors.success}
              label="Mastery"
            />
            <View style={styles.progressDetails}>
              <Text style={styles.progressText}>
                {summary.masteredLetters.length} / 26 Letters Mastered
              </Text>
              <Text style={styles.progressSubtext}>
                {summary.problematicLetters.length} letters need more practice
              </Text>
            </View>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Sessions"
              value={summary.totalSessions}
              color={Colors.primary}
            />
            <MetricCard
              title="Avg Accuracy"
              value={`${summary.averageAccuracy.toFixed(0)}%`}
              color={ColorUtils.getScoreColor(summary.averageAccuracy)}
            />
            <MetricCard
              title="Avg Duration"
              value={`${summary.averageDuration.toFixed(0)}s`}
              color={Colors.accent}
            />
            <MetricCard
              title="Risk Level"
              value={summary.overallRiskLevel}
              color={ColorUtils.getRiskColor(summary.overallRiskLevel)}
            />
          </View>
        </View>

        {/* Performance Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accuracy Trend</Text>
          {analytics.length >= 2 && (
            <LineChart
              data={{
                labels: analytics.slice(-10).map((_, i) => `S${i + 1}`),
                datasets: [
                  {
                    data: getPerformanceTrend('accuracy').slice(-10),
                  },
                ],
              }}
              width={SCREEN_WIDTH - 40}
              height={220}
              chartConfig={{
                backgroundColor: Colors.surface,
                backgroundGradientFrom: Colors.surface,
                backgroundGradientTo: Colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: Colors.primary,
                },
              }}
              bezier
              style={styles.chart}
            />
          )}
        </View>

        {/* Letter Mastery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Letter Mastery</Text>
          {summary.masteredLetters.length + summary.problematicLetters.length > 0 && (
            <PieChart
              data={[
                {
                  name: 'Mastered',
                  count: summary.masteredLetters.length,
                  color: Colors.success,
                  legendFontColor: Colors.textPrimary,
                  legendFontSize: 14,
                },
                {
                  name: 'Learning',
                  count: 26 - summary.masteredLetters.length - summary.problematicLetters.length,
                  color: Colors.warning,
                  legendFontColor: Colors.textPrimary,
                  legendFontSize: 14,
                },
                {
                  name: 'Struggling',
                  count: summary.problematicLetters.length,
                  color: Colors.error,
                  legendFontColor: Colors.textPrimary,
                  legendFontSize: 14,
                },
              ]}
              width={SCREEN_WIDTH - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          )}
        </View>

        {/* Mastered Letters */}
        {summary.masteredLetters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mastered Letters 🎉</Text>
            <View style={styles.lettersList}>
              {summary.masteredLetters.map(letter => (
                <View key={letter} style={[styles.letterBadge, { backgroundColor: Colors.success }]}>
                  <Text style={styles.letterBadgeText}>{letter}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Problematic Letters */}
        {summary.problematicLetters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Needs More Practice</Text>
            <View style={styles.lettersList}>
              {summary.problematicLetters.map(letter => (
                <TouchableOpacity
                  key={letter}
                  style={[styles.letterBadge, { backgroundColor: Colors.error }]}
                  onPress={() =>
                    navigation.navigate('Tracing' as never, { letter } as never)
                  }
                >
                  <Text style={styles.letterBadgeText}>{letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderDetails = () => {
    return (
      <View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session History</Text>
          {summary.sessionHistory.slice(0, 10).map((session, index) => (
            <TouchableOpacity
              key={session.session_id}
              style={styles.sessionCard}
              onPress={() =>
                navigation.navigate('SessionSummary' as never, { sessionId: session.session_id } as never)
              }
            >
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionLetter}>{session.letter}</Text>
                <Text style={styles.sessionDate}>
                  {new Date(session.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.sessionMetrics}>
                <View style={styles.sessionMetric}>
                  <Text style={styles.sessionMetricLabel}>Accuracy</Text>
                  <Text
                    style={[
                      styles.sessionMetricValue,
                      {
                        color: ColorUtils.getScoreColor(
                          session.spatial_accuracy_deviation.accuracy_score
                        ),
                      },
                    ]}
                  >
                    {session.spatial_accuracy_deviation.accuracy_score.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.sessionMetric}>
                  <Text style={styles.sessionMetricLabel}>Duration</Text>
                  <Text style={styles.sessionMetricValue}>
                    {session.time_based_performance.total_session_duration.toFixed(0)}s
                  </Text>
                </View>
                <View style={styles.sessionMetric}>
                  <Text style={styles.sessionMetricLabel}>Strokes</Text>
                  <Text style={styles.sessionMetricValue}>
                    {session.stroke_count_sequencing.actual_stroke_count_used}/
                    {session.stroke_count_sequencing.expected_stroke_count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderRiskAssessment = () => {
    const latestSession = summary.sessionHistory[0];

    return (
      <View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <Text style={styles.sectionSubtitle}>Based on latest session data</Text>

          <View style={styles.riskCard}>
            <Text style={styles.riskTitle}>Overall Risk Level</Text>
            <Text
              style={[
                styles.riskLevel,
                { color: ColorUtils.getRiskColor(summary.overallRiskLevel) },
              ]}
            >
              {summary.overallRiskLevel.toUpperCase()}
            </Text>
          </View>

          {latestSession && (
            <>
              <View style={styles.riskMetrics}>
                <RiskMetric
                  label="Dyslexia Risk"
                  value={latestSession.automated_risk_assessment.dyslexia_risk_score}
                />
                <RiskMetric
                  label="Dysgraphia Risk"
                  value={latestSession.automated_risk_assessment.dysgraphia_risk_score}
                />
                <RiskMetric
                  label="Reversal Risk"
                  value={latestSession.automated_risk_assessment.reversal_risk_score}
                />
                <RiskMetric
                  label="Attention Deficit"
                  value={latestSession.automated_risk_assessment.attention_deficit_risk_score}
                />
                <RiskMetric
                  label="Processing Speed"
                  value={latestSession.automated_risk_assessment.processing_speed_deficit_score}
                />
                <RiskMetric
                  label="Working Memory"
                  value={latestSession.automated_risk_assessment.working_memory_deficit_score}
                />
              </View>

              {latestSession.clinical_alert_flags.specific_concern_flags.length > 0 && (
                <View style={styles.alertsSection}>
                  <Text style={styles.alertsTitle}>⚠️ Areas of Concern</Text>
                  {latestSession.clinical_alert_flags.specific_concern_flags.map((flag, index) => (
                    <View key={index} style={styles.alertItem}>
                      <Text style={styles.alertText}>{flag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  <Text style={styles.disclaimerBold}>Important: </Text>
                  This assessment is for educational purposes only and does not constitute
                  a clinical diagnosis. Consult a qualified healthcare professional for
                  proper evaluation.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {(['overview', 'details', 'risk'] as const).map(view => (
          <TouchableOpacity
            key={view}
            style={[styles.tab, selectedView === view && styles.tabActive]}
            onPress={() => setSelectedView(view)}
          >
            <Text
              style={[
                styles.tabText,
                selectedView === view && styles.tabTextActive,
              ]}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'details' && renderDetails()}
        {selectedView === 'risk' && renderRiskAssessment()}
      </ScrollView>
    </SafeAreaView>
  );
};

const RiskMetric: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getRiskColor = (score: number) => {
    if (score < 20) return Colors.riskLow;
    if (score < 40) return Colors.riskMild;
    if (score < 60) return Colors.riskModerate;
    if (score < 80) return Colors.riskHigh;
    return Colors.riskSevere;
  };

  return (
    <View style={styles.riskMetricCard}>
      <Text style={styles.riskMetricLabel}>{label}</Text>
      <View style={styles.riskBar}>
        <View
          style={[
            styles.riskBarFill,
            { width: `${value}%`, backgroundColor: getRiskColor(value) },
          ]}
        />
      </View>
      <Text style={[styles.riskMetricValue, { color: getRiskColor(value) }]}>
        {value.toFixed(0)}%
      </Text>
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  progressDetails: {
    flex: 1,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surfaceVariant,
    padding: 16,
    borderRadius: 12,
  },
  metricTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  trendContainer: {
    marginTop: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  lettersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  letterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  letterBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionCard: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionLetter: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sessionDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sessionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionMetric: {
    alignItems: 'center',
  },
  sessionMetricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  sessionMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  riskCard: {
    backgroundColor: Colors.surfaceVariant,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  riskTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  riskLevel: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  riskMetrics: {
    gap: 12,
  },
  riskMetricCard: {
    backgroundColor: Colors.surfaceVariant,
    padding: 16,
    borderRadius: 12,
  },
  riskMetricLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  riskBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  alertsSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.error + '20',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 12,
  },
  alertItem: {
    paddingVertical: 8,
  },
  alertText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  disclaimerBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  disclaimerBold: {
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProgressDashboard;
