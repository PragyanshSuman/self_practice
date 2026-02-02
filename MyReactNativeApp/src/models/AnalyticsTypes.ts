// ============================================================================
// DOMAIN I: RAW KINEMATIC & SPATIAL METRICS
// ============================================================================

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure: number; // Contact area proxy
  force?: number; // iOS 3D Touch if available
}

export interface RawTouchData {
  touch_coordinates_array: TouchPoint[];
  touch_pressure_proxy: number[];
  sampling_rate: number; // Actual Hz achieved
  data_completeness_score: number; // % of expected samples
  session_start_timestamp: number;
  session_end_timestamp: number;
}

export interface VelocityKinematics {
  instantaneous_velocity: number[]; // mm/s at each point
  average_velocity: number;
  velocity_coefficient_of_variation: number; // Std/Mean
  velocity_peaks: Array<{ index: number; value: number }>;
  velocity_valleys: Array<{ index: number; value: number }>;
  velocity_range: number; // Max - Min
  time_in_motion: number; // seconds
  time_paused: number; // seconds
  fluency_ratio: number; // motion_time / total_time
}

export interface AccelerationJerkAnalysis {
  acceleration_profile: number[];
  jerk_profile: number[]; // CRITICAL for fluency
  normalized_jerk_score: number; // Standardized smoothness
  acceleration_symmetry: number; // Similar on up/down strokes
  ballistic_movement_count: number; // Fast pre-planned segments
  corrective_movement_count: number;
  mean_absolute_jerk: number;
  peak_jerk: number;
}

export interface DirectionalAngularMetrics {
  path_curvature: number[]; // Radius at each point
  angular_velocity: number[]; // How fast direction changes
  direction_reversals_count: number; // U-turns
  curvature_consistency: number; // Smooth vs jagged
  ideal_vs_actual_angle_deviation: number[]; // Off correct tangent
  mean_curvature: number;
  curvature_std: number;
  turning_angle_sum: number;
}

export interface StrokeData {
  stroke_id: number;
  start_index: number;
  end_index: number;
  points: TouchPoint[];
  duration: number;
  length: number;
  is_correct_order: boolean;
  is_correct_direction: boolean;
  deviation_from_ideal: number;
}

export interface StrokeCountSequencing {
  expected_stroke_count: number; // Standard for this letter
  actual_stroke_count_used: number;
  extra_strokes: number; // Redrawing/uncertainty
  missing_strokes: number;
  stroke_order_correctness: boolean[];
  stroke_sequence_violations: string[];
  lift_off_count: number;
  stroke_planning_latency: number[]; // Pause before each stroke
  strokes: StrokeData[];
  stroke_order_score: number; // 0-1
}

export interface SpatialAccuracyDeviation {
  mean_path_deviation: number; // Average distance from ideal
  max_path_deviation: number; // Worst excursion
  deviation_std: number;
  off_track_events: Array<{ timestamp: number; duration: number; distance: number }>;
  off_track_duration_total: number;
  off_track_recovery_time: number[];
  spatial_drift: number; // Gradual shift from ideal
  accuracy_score: number; // 0-100
}

// ============================================================================
// DOMAIN II: TEMPORAL & BEHAVIORAL PATTERNS
// ============================================================================

export interface TimeBasedPerformance {
  total_session_duration: number; // seconds
  active_tracing_time: number;
  pause_time_total: number;
  pause_frequency: number;
  pause_duration_distribution: number[];
  inter_stroke_latency: number[];
  initial_reaction_time: number; // Screen load → first touch
  time_per_stroke: number[];
}

export interface CompletionPersistence {
  letter_completion_status: 'completed' | 'abandoned' | 'timed_out' | 'in_progress';
  attempts_to_complete: number;
  partial_completion_percentage: number;
  frustration_quit_indicator: boolean;
  time_to_first_successful_completion: number;
  retry_pattern: 'immediate' | 'delayed' | 'none';
  retry_count: number;
}

export interface ErrorDetectionSelfCorrection {
  self_initiated_corrections: number;
  uncorrected_errors_count: number;
  error_to_correction_latency: number[];
  error_awareness_percentage: number;
  correction_success_rate: number;
  monitoring_behavior_score: number; // 0-100
  correction_events: Array<{
    timestamp: number;
    error_type: string;
    was_corrected: boolean;
    correction_time: number;
  }>;
}

// ============================================================================
// DOMAIN III: DYSLEXIA-SPECIFIC DIAGNOSTIC MARKERS
// ============================================================================

export interface LetterReversalOrientation {
  horizontal_mirror_similarity: number; // b↔d, p↔q (0-1)
  vertical_flip_similarity: number;
  diagonal_flip_similarity: number;
  rotation_90_similarity: number; // u→n
  rotation_180_similarity: number;
  rotation_270_similarity: number;
  mirror_confusion_composite_score: number; // Weighted reversal risk
  orientation_consistency_score: number;
  left_right_confusion_indicator: boolean;
  actual_orientation_angle: number; // degrees from upright
}

export interface LetterConfusionMatrix {
  b_d_confusion_probability: number;
  p_q_confusion_probability: number;
  n_u_confusion_probability: number;
  m_w_confusion_probability: number;
  six_nine_confusion_probability: number;
  confusion_pattern_consistency: number; // Same errors repeatedly
  confused_letter_pairs: Array<{ letter1: string; letter2: string; probability: number }>;
}

export interface PhonologicalAwarenessIntegration {
  letter_name_recall_accuracy: number; // 0-1
  letter_sound_association: number; // 0-1
  rhyme_recognition_score: number;
  phoneme_segmentation_ability: number;
  audio_playback_count: number;
  audio_to_trace_latency: number;
}

// ============================================================================
// DOMAIN IV: GRAPHOMOTOR QUALITY (DYSGRAPHIA)
// ============================================================================

export interface StrokeQualityConsistency {
  stroke_width_mean: number;
  stroke_width_variance: number;
  stroke_width_range: number;
  tremor_frequency: number; // Hz
  tremor_amplitude: number; // pixels
  tremor_power_spectral_density: number[];
  pressure_modulation_score: number;
  line_straightness_score: number; // For straight segments
}

export interface LineContinuityClosure {
  endpoint_count: number; // Broken strokes
  junction_count: number; // Overwritten/crossed lines
  gap_count: number; // Unintentional breaks
  overlap_count: number; // Retraced areas
  closure_success_rate: number; // For closed shapes
  closure_gap_size: number[];
  line_continuity_score: number; // 0-100
}

export interface ShapeFormationQuality {
  corner_sharpness_score: number[]; // Per corner
  curve_smoothness_score: number[]; // Per curve
  aspect_ratio: number; // Width/Height
  compactness_score: number; // Perimeter²/Area
  symmetry_score: number; // Left/right balance
  baseline_adherence: number; // Stays on horizontal
  proportions_score: number; // 0-100
  shape_similarity_to_ideal: number; // 0-1 (correlation)
}

// ============================================================================
// DOMAIN V: COGNITIVE & EXECUTIVE FUNCTION
// ============================================================================

export interface AttentionFocus {
  distraction_event_count: number;
  random_scribble_detection: number;
  task_abandonment_frequency: number;
  sustained_attention_duration: number; // Longest focused period
  attention_lapses: number[];
  impulsivity_score: number; // Rushed starts
  focus_score: number; // 0-100
}

export interface WorkingMemoryLoad {
  stroke_sequence_recall_accuracy: number;
  multi_stroke_letter_performance: number;
  memory_span_estimate: number;
  interference_susceptibility: number;
  working_memory_score: number; // 0-100
}

export interface CognitiveFatigueEndurance {
  performance_degradation_slope: number;
  speed_degradation_slope: number;
  error_rate_increase_over_time: number;
  session_tolerance_duration: number;
  recovery_after_break: number;
  fatigue_index: number; // 0-100
}

// ============================================================================
// DOMAIN VI: LEARNING & ADAPTATION
// ============================================================================

export interface LongitudinalProgressTracking {
  total_session_count: number;
  improvement_rate_per_session: number;
  plateau_detection_flag: boolean;
  retention_score_24hr: number;
  retention_score_1week: number;
  skill_transfer_coefficient: number;
  learning_curve_slope: number;
}

export interface LetterSpecificMastery {
  mastered_letters_list: string[];
  problematic_letters_list: string[];
  mastery_timeline: Array<{ letter: string; date: string; score: number }>;
  forgetting_curve_data: Array<{ letter: string; decay_rate: number }>;
  mastery_percentage: number;
}

export interface AdaptiveLearningIndicators {
  strategy_changes_detected: number;
  error_pattern_evolution: string; // 'improving' | 'same' | 'declining'
  self_regulation_score: number;
  learning_efficiency: number;
}

// ============================================================================
// DOMAIN VII: CONTEXTUAL & ENVIRONMENTAL
// ============================================================================

export interface SessionContext {
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  day_of_week: string;
  session_duration_preference: 'short' | 'medium' | 'long';
  device_type: 'phone' | 'tablet';
  screen_size_inches: number;
  input_method: 'finger' | 'stylus' | 'apple_pencil';
  screen_orientation: 'portrait' | 'landscape';
  ambient_noise_level?: number; // dB if available
  session_id: string;
  letter: string;
}

export interface UserDemographicsHistory {
  chronological_age: number; // years
  chronological_age_months: number; // total months
  developmental_age_estimate?: number;
  handedness: 'left' | 'right' | 'ambidextrous';
  prior_dyslexia_diagnosis: 'confirmed' | 'suspected' | 'none';
  comorbid_conditions: string[]; // ADHD, dysgraphia, DCD, ASD
  intervention_history: string[];
  native_language: string;
  language_of_instruction: string;
  user_id: string;
}

// ============================================================================
// DOMAIN VIII: ADVANCED COMPUTED FEATURES
// ============================================================================

export interface ComputerVisionFeatures {
  hog_features: number[]; // Histogram of Oriented Gradients
  edge_density_map: number[][];
  contour_complexity: number;
  perimeter_to_area_ratio: number;
  bounding_box_area: number;
  convex_hull_area: number;
  solidity: number; // Area/ConvexHullArea
  extent: number; // Area/BoundingBoxArea
  eccentricity: number;
}

export interface StatisticalShapeDescriptors {
  fourier_descriptors: number[];
  hu_moments: number[]; // 7 invariant moments
  central_moments: number[][];
  normalized_central_moments: number[][];
  shape_complexity_index: number;
}

// ============================================================================
// DOMAIN IX: SENSORY-MOTOR INTEGRATION
// ============================================================================

export interface VisualMotorCoordination {
  eye_hand_coordination_proxy: number;
  visual_feedback_dependency: number;
  visual_tracking_smoothness: number;
  coordination_score: number; // 0-100
}

export interface HapticFeedbackResponse {
  vibration_response_latency: number;
  haptic_learning_curve: number;
  haptic_preference_score: number;
  haptic_enabled: boolean;
}

// ============================================================================
// DOMAIN X: LINGUISTIC & LITERACY CONNECTIONS
// ============================================================================

export interface LetterSoundCorrespondence {
  grapheme_phoneme_mapping_accuracy: number;
  letter_name_fluency: number; // Speed of naming
  phonological_awareness_composite: number;
  rapid_automatized_naming_proxy: number;
}

export interface ReadingReadinessIndicators {
  letter_recognition_speed: number;
  alphabet_knowledge_score: number;
  print_awareness: number;
}

// ============================================================================
// DOMAIN XI: BEHAVIORAL & EMOTIONAL
// ============================================================================

export interface EngagementMotivation {
  voluntary_practice_frequency: number;
  session_completion_rate: number;
  positive_feedback_response: number;
  challenge_seeking_behavior: number;
  frustration_tolerance_score: number;
}

export interface EmotionalRegulation {
  rage_quit_incidents: number;
  help_seeking_behavior: number;
  anxiety_indicators: number;
  confidence_trajectory: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// DOMAIN XII: CLINICAL RISK SCORING & REPORTING
// ============================================================================

export interface AutomatedRiskAssessment {
  dyslexia_risk_score: number; // 0-100
  dysgraphia_risk_score: number;
  reversal_risk_score: number;
  attention_deficit_risk_score: number;
  processing_speed_deficit_score: number;
  working_memory_deficit_score: number;
  overall_risk_level: 'low' | 'mild' | 'moderate' | 'high' | 'severe';
}

export interface NormativeComparisons {
  age_norm_percentile: number;
  grade_norm_percentile: number;
  improvement_rate_percentile: number;
  severity_classification: 'typical' | 'mild' | 'moderate' | 'severe';
}

export interface ClinicalAlertFlags {
  immediate_referral_flag: boolean; // >3 SD below norm
  monitor_closely_flag: boolean; // 1-2 SD below norm
  typical_development_flag: boolean;
  specific_concern_flags: string[];
  flagged_metrics: Array<{ metric: string; value: number; threshold: number }>;
}

// ============================================================================
// COMPREHENSIVE SESSION ANALYTICS
// ============================================================================

export interface ComprehensiveTracingAnalytics {
  // Meta
  session_id: string;
  user_id: string;
  letter: string;
  timestamp: string;
  version: string; // Analytics engine version

  // Domain I
  raw_touch_data: RawTouchData;
  velocity_kinematics: VelocityKinematics;
  acceleration_jerk_analysis: AccelerationJerkAnalysis;
  directional_angular_metrics: DirectionalAngularMetrics;
  stroke_count_sequencing: StrokeCountSequencing;
  spatial_accuracy_deviation: SpatialAccuracyDeviation;

  // Domain II
  time_based_performance: TimeBasedPerformance;
  completion_persistence: CompletionPersistence;
  error_detection_self_correction: ErrorDetectionSelfCorrection;

  // Domain III
  letter_reversal_orientation: LetterReversalOrientation;
  letter_confusion_matrix: LetterConfusionMatrix;
  phonological_awareness_integration: PhonologicalAwarenessIntegration;

  // Domain IV
  stroke_quality_consistency: StrokeQualityConsistency;
  line_continuity_closure: LineContinuityClosure;
  shape_formation_quality: ShapeFormationQuality;

  // Domain V
  attention_focus: AttentionFocus;
  working_memory_load: WorkingMemoryLoad;
  cognitive_fatigue_endurance: CognitiveFatigueEndurance;

  // Domain VI
  longitudinal_progress_tracking: LongitudinalProgressTracking;
  letter_specific_mastery: LetterSpecificMastery;
  adaptive_learning_indicators: AdaptiveLearningIndicators;

  // Domain VII
  session_context: SessionContext;
  user_demographics_history: UserDemographicsHistory;

  // Domain VIII
  computer_vision_features: ComputerVisionFeatures;
  statistical_shape_descriptors: StatisticalShapeDescriptors;

  // Domain IX
  visual_motor_coordination: VisualMotorCoordination;
  haptic_feedback_response: HapticFeedbackResponse;

  // Domain X
  letter_sound_correspondence: LetterSoundCorrespondence;
  reading_readiness_indicators: ReadingReadinessIndicators;

  // Domain XI
  engagement_motivation: EngagementMotivation;
  emotional_regulation: EmotionalRegulation;

  // Domain XII
  automated_risk_assessment: AutomatedRiskAssessment;
  normative_comparisons: NormativeComparisons;
  clinical_alert_flags: ClinicalAlertFlags;
}

// ============================================================================
// EXPORT DATA FORMATS
// ============================================================================

export interface PDFClinicalSummary {
  patient_info: UserDemographicsHistory;
  summary_scores: {
    overall_performance: number;
    risk_level: string;
    key_concerns: string[];
  };
  visual_reports: {
    heatmap_url: string;
    velocity_graph_url: string;
    progress_chart_url: string;
  };
  recommendations: string[];
  generated_date: string;
}

export interface CSVRawDataExport {
  headers: string[];
  rows: any[][];
  metadata: Record<string, any>;
}

export interface JSONAPIResponse {
  status: 'success' | 'error';
  data: ComprehensiveTracingAnalytics;
  metadata: {
    api_version: string;
    timestamp: string;
  };
}
