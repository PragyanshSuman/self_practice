import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ComprehensiveTracingAnalytics } from '@models/AnalyticsTypes';
import StorageService from '@services/StorageService';
import VisualizationService from '@services/VisualizationService';
import Colors, { ColorUtils } from '@constants/Colors';
import ProgressIndicator from '@components/ProgressIndicator';
import ValidationUtils from '@utils/ValidationUtils';

interface RouteParams {
  sessionId: string;
}

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

const DetailSection: React.FC<DetailSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

interface MetricRowProps {
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, color, subtitle }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.metricValueContainer}>
      <Text style={[styles.metricValue, color && { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  color?: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, maxScore = 100, color }) => {
  const percentage = (score / maxScore) * 100;
  const displayColor = color || ColorUtils.getScoreColor(percentage);

  return (
    <View style={styles.scoreCard}>
      <ProgressIndicator
        progress={percentage / 100}
        size={80}
        strokeWidth={8}
        color={displayColor}
        showPercentage={false}
      />
      <View style={styles.scoreCardText}>
        <Text style={styles.scoreCardTitle}>{title}</Text>
        <Text style={[styles.scoreCardValue, { color: displayColor }]}>
          {score.toFixed(1)}
          {maxScore === 100 ? '%' : ''}
        </Text>
      </View>
    </View>
  );
};

const SessionSummary: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params as RouteParams;

  const [analytics, setAnalytics] = useState<ComprehensiveTracingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'detailed' | 'diagnostic'>('overview');

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getAnalytics(sessionId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load session:', error);
      Alert.alert('Error', 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!analytics) return;

    try {
      const jsonPath = await StorageService.exportToJSON(analytics);
      const csvPath = await StorageService.exportToCSV(analytics);

      Alert.alert(
        'Export Successful',
        `Session data exported to:\n${jsonPath}\n${csvPath}`,
        [
          {
            text: 'Share',
            onPress: () => shareSessionData(jsonPath),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export session data');
    }
  };

  const shareSessionData = async (filePath: string) => {
    try {
      await Share.share({
        title: 'Tracing Session Data',
        message: `Session data for letter ${analytics?.letter}`,
        url: `file://${filePath}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleRetry = () => {
    if (!analytics) return;
    navigation.navigate('Tracing' as never, { letter: analytics.letter } as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading session data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate data quality
  const validationReport = ValidationUtils.generateValidationReport(analytics);

  const renderOverview = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.letterDisplay}>{analytics.letter}</Text>
        <Text style={styles.dateText}>
          {new Date(analytics.timestamp).toLocaleString()}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {analytics.completion_persistence.letter_completion_status}
          </Text>
        </View>
      </View>

      {/* Key Performance Indicators */}
      <DetailSection title="Performance Summary">
        <View style={styles.scoreCardsContainer}>
          <ScoreCard
            title="Accuracy"
            score={analytics.spatial_accuracy_deviation.accuracy_score}
          />
          <ScoreCard
            title="Fluency"
            score={analytics.velocity_kinematics.fluency_ratio * 100}
          />
          <ScoreCard
            title="Stroke Order"
            score={analytics.stroke_count_sequencing.stroke_order_score * 100}
          />
          <ScoreCard
            title="Quality"
            score={validationReport.qualityScore}
          />
        </View>
      </DetailSection>

      {/* Session Metrics */}
      <DetailSection title="Session Metrics">
        <MetricRow
          label="Total Duration"
          value={`${analytics.time_based_performance.total_session_duration.toFixed(1)}s`}
        />
        <MetricRow
          label="Active Tracing Time"
          value={`${analytics.time_based_performance.active_tracing_time.toFixed(1)}s`}
        />
        <MetricRow
          label="Average Velocity"
          value={`${analytics.velocity_kinematics.average_velocity.toFixed(1)} px/s`}
        />
        <MetricRow
          label="Initial Reaction Time"
          value={`${analytics.time_based_performance.initial_reaction_time.toFixed(2)}s`}
        />
        <MetricRow
          label="Pause Frequency"
          value={analytics.time_based_performance.pause_frequency}
        />
      </DetailSection>

      {/* Spatial Accuracy */}
      <DetailSection title="Spatial Accuracy">
        <MetricRow
          label="Mean Deviation"
          value={`${analytics.spatial_accuracy_deviation.mean_path_deviation.toFixed(1)} px`}
        />
        <MetricRow
          label="Max Deviation"
          value={`${analytics.spatial_accuracy_deviation.max_path_deviation.toFixed(1)} px`}
        />
        <MetricRow
          label="Off-Track Events"
          value={analytics.spatial_accuracy_deviation.off_track_events.length}
        />
        <MetricRow
          label="Spatial Drift"
          value={analytics.spatial_accuracy_deviation.spatial_drift.toFixed(3)}
        />
      </DetailSection>

      {/* Stroke Analysis */}
      <DetailSection title="Stroke Analysis">
        <MetricRow
          label="Expected Strokes"
          value={analytics.stroke_count_sequencing.expected_stroke_count}
        />
        <MetricRow
          label="Actual Strokes"
          value={analytics.stroke_count_sequencing.actual_stroke_count_used}
          color={
            analytics.stroke_count_sequencing.actual_stroke_count_used ===
            analytics.stroke_count_sequencing.expected_stroke_count
              ? Colors.success
              : Colors.warning
          }
        />
        <MetricRow
          label="Extra Strokes"
          value={analytics.stroke_count_sequencing.extra_strokes}
        />
        <MetricRow
          label="Missing Strokes"
          value={analytics.stroke_count_sequencing.missing_strokes}
        />
        <MetricRow
          label="Stroke Order Score"
          value={`${(analytics.stroke_count_sequencing.stroke_order_score * 100).toFixed(0)}%`}
          color={ColorUtils.getScoreColor(
            analytics.stroke_count_sequencing.stroke_order_score * 100
          )}
        />
      </DetailSection>

      {/* Self-Correction */}
      <DetailSection title="Self-Correction & Monitoring">
        <MetricRow
          label="Self-Initiated Corrections"
          value={analytics.error_detection_self_correction.self_initiated_corrections}
        />
        <MetricRow
          label="Uncorrected Errors"
          value={analytics.error_detection_self_correction.uncorrected_errors_count}
        />
        <MetricRow
          label="Error Awareness"
          value={`${analytics.error_detection_self_correction.error_awareness_percentage.toFixed(0)}%`}
        />
        <MetricRow
          label="Monitoring Score"
          value={`${analytics.error_detection_self_correction.monitoring_behavior_score.toFixed(0)}`}
        />
      </DetailSection>
    </ScrollView>
  );

  const renderDetailed = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Kinematics */}
      <DetailSection title="Velocity & Kinematics">
        <MetricRow
          label="Average Velocity"
          value={`${analytics.velocity_kinematics.average_velocity.toFixed(2)} px/s`}
        />
        <MetricRow
          label="Velocity CoV"
          value={analytics.velocity_kinematics.velocity_coefficient_of_variation.toFixed(3)}
          subtitle="Lower is more consistent"
        />
        <MetricRow
          label="Velocity Range"
          value={`${analytics.velocity_kinematics.velocity_range.toFixed(1)} px/s`}
        />
        <MetricRow
          label="Velocity Peaks"
          value={analytics.velocity_kinematics.velocity_peaks.length}
        />
        <MetricRow
          label="Velocity Valleys"
          value={analytics.velocity_kinematics.velocity_valleys.length}
        />
      </DetailSection>

      {/* Acceleration & Jerk */}
      <DetailSection title="Acceleration & Jerk">
        <MetricRow
          label="Normalized Jerk Score"
          value={analytics.acceleration_jerk_analysis.normalized_jerk_score.toFixed(4)}
          subtitle="Lower = smoother movement"
          color={
            analytics.acceleration_jerk_analysis.normalized_jerk_score < 0.05
              ? Colors.success
              : analytics.acceleration_jerk_analysis.normalized_jerk_score < 0.1
              ? Colors.warning
              : Colors.error
          }
        />
        <MetricRow
          label="Acceleration Symmetry"
          value={`${(analytics.acceleration_jerk_analysis.acceleration_symmetry * 100).toFixed(0)}%`}
        />
        <MetricRow
          label="Ballistic Movements"
          value={analytics.acceleration_jerk_analysis.ballistic_movement_count}
        />
        <MetricRow
          label="Corrective Movements"
          value={analytics.acceleration_jerk_analysis.corrective_movement_count}
        />
        <MetricRow
          label="Peak Jerk"
          value={analytics.acceleration_jerk_analysis.peak_jerk.toFixed(2)}
        />
      </DetailSection>

      {/* Directional & Angular */}
      <DetailSection title="Directional Metrics">
        <MetricRow
          label="Direction Reversals"
          value={analytics.directional_angular_metrics.direction_reversals_count}
        />
        <MetricRow
          label="Mean Curvature"
          value={analytics.directional_angular_metrics.mean_curvature.toFixed(4)}
        />
        <MetricRow
          label="Curvature Consistency"
          value={`${(analytics.directional_angular_metrics.curvature_consistency * 100).toFixed(0)}%`}
        />
        <MetricRow
          label="Turning Angle Sum"
          value={`${(analytics.directional_angular_metrics.turning_angle_sum * (180 / Math.PI)).toFixed(1)}°`}
        />
      </DetailSection>

      {/* Stroke Quality */}
      <DetailSection title="Stroke Quality">
        <MetricRow
          label="Mean Stroke Width"
          value={analytics.stroke_quality_consistency.stroke_width_mean.toFixed(2)}
        />
        <MetricRow
          label="Stroke Width Variance"
          value={analytics.stroke_quality_consistency.stroke_width_variance.toFixed(3)}
        />
        <MetricRow
          label="Pressure Modulation"
          value={`${analytics.stroke_quality_consistency.pressure_modulation_score.toFixed(0)}`}
        />
        <MetricRow
          label="Tremor Frequency"
          value={`${analytics.stroke_quality_consistency.tremor_frequency.toFixed(2)} Hz`}
        />
        <MetricRow
          label="Tremor Amplitude"
          value={`${analytics.stroke_quality_consistency.tremor_amplitude.toFixed(2)} px`}
          color={
            analytics.stroke_quality_consistency.tremor_amplitude < 5
              ? Colors.success
              : analytics.stroke_quality_consistency.tremor_amplitude < 8
              ? Colors.warning
              : Colors.error
          }
        />
      </DetailSection>

      {/* Shape Formation */}
      <DetailSection title="Shape Formation">
        <MetricRow
          label="Aspect Ratio"
          value={analytics.shape_formation_quality.aspect_ratio.toFixed(2)}
        />
        <MetricRow
          label="Compactness"
          value={analytics.shape_formation_quality.compactness_score.toFixed(2)}
        />
        <MetricRow
          label="Symmetry Score"
          value={`${(analytics.shape_formation_quality.symmetry_score * 100).toFixed(0)}%`}
        />
        <MetricRow
          label="Baseline Adherence"
          value={`${(analytics.shape_formation_quality.baseline_adherence * 100).toFixed(0)}%`}
        />
        <MetricRow
          label="Shape Similarity"
          value={`${(analytics.shape_formation_quality.shape_similarity_to_ideal * 100).toFixed(0)}%`}
        />
      </DetailSection>

      {/* Cognitive Metrics */}
      <DetailSection title="Cognitive & Executive Function">
        <MetricRow
          label="Focus Score"
          value={`${analytics.attention_focus.focus_score.toFixed(0)}`}
          color={ColorUtils.getScoreColor(analytics.attention_focus.focus_score)}
        />
        <MetricRow
          label="Impulsivity Score"
          value={`${analytics.attention_focus.impulsivity_score.toFixed(0)}`}
        />
        <MetricRow
          label="Working Memory Score"
          value={`${analytics.working_memory_load.working_memory_score.toFixed(0)}`}
        />
        <MetricRow
          label="Fatigue Index"
          value={`${analytics.cognitive_fatigue_endurance.fatigue_index.toFixed(0)}`}
        />
      </DetailSection>

      {/* Data Quality */}
      <DetailSection title="Data Quality">
        <MetricRow
          label="Quality Score"
          value={`${validationReport.qualityScore.toFixed(0)}%`}
          color={ColorUtils.getScoreColor(validationReport.qualityScore)}
        />
        <MetricRow
          label="Sampling Rate"
          value={`${analytics.raw_touch_data.sampling_rate.toFixed(1)} Hz`}
        />
        <MetricRow
          label="Data Completeness"
          value={`${analytics.raw_touch_data.data_completeness_score.toFixed(1)}%`}
        />
        <MetricRow
          label="Touch Points"
          value={analytics.raw_touch_data.touch_coordinates_array.length}
        />
      </DetailSection>
    </ScrollView>
  );

  const renderDiagnostic = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Overall Risk Assessment */}
      <DetailSection title="Risk Assessment">
        <View style={styles.riskLevelCard}>
          <Text style={styles.riskLevelLabel}>Overall Risk Level</Text>
          <Text
            style={[
              styles.riskLevelValue,
              {
                color: ColorUtils.getRiskColor(
                  analytics.automated_risk_assessment.overall_risk_level
                ),
              },
            ]}
          >
            {analytics.automated_risk_assessment.overall_risk_level.toUpperCase()}
          </Text>
        </View>
      </DetailSection>

      {/* Individual Risk Scores */}
      <DetailSection title="Detailed Risk Scores">
        <RiskScoreBar
          label="Dyslexia Risk"
          score={analytics.automated_risk_assessment.dyslexia_risk_score}
        />
        <RiskScoreBar
          label="Dysgraphia Risk"
          score={analytics.automated_risk_assessment.dysgraphia_risk_score}
        />
        <RiskScoreBar
          label="Reversal Risk"
          score={analytics.automated_risk_assessment.reversal_risk_score}
        />
        <RiskScoreBar
          label="Attention Deficit"
          score={analytics.automated_risk_assessment.attention_deficit_risk_score}
        />
        <RiskScoreBar
          label="Processing Speed Deficit"
          score={analytics.automated_risk_assessment.processing_speed_deficit_score}
        />
        <RiskScoreBar
          label="Working Memory Deficit"
          score={analytics.automated_risk_assessment.working_memory_deficit_score}
        />
      </DetailSection>

      {/* Letter Reversal Analysis */}
      <DetailSection title="Letter Reversal Analysis">
        <MetricRow
          label="Horizontal Mirror Similarity"
          value={`${(analytics.letter_reversal_orientation.horizontal_mirror_similarity * 100).toFixed(0)}%`}
          subtitle="b ↔ d, p ↔ q"
        />
        <MetricRow
          label="90° Rotation Similarity"
          value={`${(analytics.letter_reversal_orientation.rotation_90_similarity * 100).toFixed(0)}%`}
          subtitle="u ↔ n"
        />
        <MetricRow
          label="180° Rotation Similarity"
          value={`${(analytics.letter_reversal_orientation.rotation_180_similarity * 100).toFixed(0)}%`}
        />
        <MetricRow
          label="Orientation Consistency"
          value={`${(analytics.letter_reversal_orientation.orientation_consistency_score * 100).toFixed(0)}%`}
        />
      </DetailSection>

      {/* Phonological Awareness */}
      <DetailSection title="Phonological Awareness">
        <MetricRow
          label="Letter Name Recall"
          value={`${(analytics.phonological_awareness_integration.letter_name_recall_accuracy * 100).toFixed(0)}%`}
        />
        <MetricRow
          label="Letter-Sound Association"
          value={`${(analytics.phonological_awareness_integration.letter_sound_association * 100).toFixed(0)}%`}
        />
        <MetricRow
          label="Audio Playback Count"
          value={analytics.phonological_awareness_integration.audio_playback_count}
        />
        <MetricRow
          label="Audio to Trace Latency"
          value={`${analytics.phonological_awareness_integration.audio_to_trace_latency.toFixed(2)}s`}
        />
      </DetailSection>

      {/* Clinical Alerts */}
      {analytics.clinical_alert_flags.specific_concern_flags.length > 0 && (
        <DetailSection title="Clinical Alerts">
          <View style={styles.alertBox}>
            {analytics.clinical_alert_flags.immediate_referral_flag && (
              <View style={[styles.alertItem, { backgroundColor: Colors.error + '20' }]}>
                <Text style={[styles.alertText, { color: Colors.error }]}>
                  ⚠️ Immediate Referral Recommended
                </Text>
              </View>
            )}
            {analytics.clinical_alert_flags.monitor_closely_flag && (
              <View style={[styles.alertItem, { backgroundColor: Colors.warning + '20' }]}>
                <Text style={[styles.alertText, { color: Colors.warning }]}>
                  👁️ Monitor Closely
                </Text>
              </View>
            )}
            {analytics.clinical_alert_flags.specific_concern_flags.map((flag, index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertText}>• {flag}</Text>
              </View>
            ))}
          </View>
        </DetailSection>
      )}

      {/* Validation Report */}
      {(validationReport.warnings.length > 0 || validationReport.errors.length > 0) && (
        <DetailSection title="Data Quality Report">
          {validationReport.errors.map((error, index) => (
            <View key={`error-${index}`} style={styles.validationItem}>
              <Text style={[styles.validationText, { color: Colors.error }]}>
                ❌ {error}
              </Text>
            </View>
          ))}
          {validationReport.warnings.map((warning, index) => (
            <View key={`warning-${index}`} style={styles.validationItem}>
              <Text style={[styles.validationText, { color: Colors.warning }]}>
                ⚠️ {warning}
              </Text>
            </View>
          ))}
          {validationReport.recommendations.map((rec, index) => (
            <View key={`rec-${index}`} style={styles.validationItem}>
              <Text style={[styles.validationText, { color: Colors.info }]}>
                💡 {rec}
              </Text>
            </View>
          ))}
        </DetailSection>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>⚕️ Medical Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          This assessment is for educational and screening purposes only. It does not
          constitute a clinical diagnosis. The metrics provided should be interpreted by
          qualified healthcare professionals (educational psychologists, occupational
          therapists, or pediatricians) in conjunction with other assessment tools and
          clinical observations. If risk scores are elevated, please consult with a
          qualified professional for comprehensive evaluation.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Details</Text>
        <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['overview', 'detailed', 'diagnostic'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'detailed' && renderDetailed()}
      {selectedTab === 'diagnostic' && renderDiagnostic()}

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
          <Text style={styles.secondaryButtonText}>Practice Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const RiskScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const getRiskColor = (value: number) => {
    if (value < 20) return Colors.riskLow;
    if (value < 40) return Colors.riskMild;
    if (value < 60) return Colors.riskModerate;
    if (value < 80) return Colors.riskHigh;
    return Colors.riskSevere;
  };

  const color = getRiskColor(score);

  return (
    <View style={styles.riskScoreContainer}>
      <Text style={styles.riskScoreLabel}>{label}</Text>
      <View style={styles.riskScoreBarContainer}>
        <View style={styles.riskScoreBarBackground}>
          <View
            style={[
              styles.riskScoreBarFill,
              { width: `${score}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={[styles.riskScoreValue, { color }]}>{score.toFixed(0)}%</Text>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.error,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  exportButton: {
    padding: 8,
  },
  exportButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
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
  headerCard: {
    backgroundColor: Colors.surface,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  letterDisplay: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: Colors.surface,
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  scoreCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  scoreCardText: {
    flex: 1,
  },
  scoreCardTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  scoreCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  metricValueContainer: {
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  metricSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  riskLevelCard: {
    backgroundColor: Colors.surfaceVariant,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  riskLevelLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  riskLevelValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  riskScoreContainer: {
    marginBottom: 16,
  },
  riskScoreLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  riskScoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskScoreBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.borderLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  riskScoreBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  riskScoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 45,
    textAlign: 'right',
  },
  alertBox: {
    gap: 12,
  },
  alertItem: {
    padding: 12,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  validationItem: {
    paddingVertical: 8,
  },
  validationText: {
    fontSize: 14,
  },
  disclaimerBox: {
    margin: 20,
    padding: 16,
    backgroundColor: Colors.info + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SessionSummary;
