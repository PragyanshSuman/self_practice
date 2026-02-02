// src/types/tracing.ts

/**
 * Tracing Mode Types
 */
export type TracingMode = 'guided' | 'memory';
export type LetterCase = 'uppercase' | 'lowercase';
export type FeedbackType = 'visual' | 'audio' | 'both' | 'none';

/**
 * Letter Configuration
 */
export interface LetterConfig {
  letter: string;
  case: LetterCase;
  svgPath: string;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  strokeWidth: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Touch Point Data
 */
export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
  force?: number;
}

/**
 * Stroke Data (one continuous touch sequence)
 */
export interface Stroke {
  id: string;
  points: TouchPoint[];
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Tracing Session Data
 */
export interface TracingSession {
  sessionId: string;
  letter: string;
  letterCase: LetterCase;
  mode: TracingMode;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  strokes: Stroke[];
  touchPoints: TouchPoint[];
  metadata: {
    childId?: string;
    age?: number;
    attemptNumber: number;
    deviceInfo?: any;
  };
}

/**
 * Real-time Tracing Metrics
 */
export interface TracingMetrics {
  // Precision
  accuracyScore: number; // 0-100
  deviationFromPath: number; // Average distance in pixels
  pathCoverage: number; // 0-100% of path traced
  
  // Timing
  totalTime: number; // milliseconds
  averageSpeed: number; // pixels per second
  
  // Strokes
  strokeCount: number;
  averageStrokeLength: number;
  
  // Pressure (if available)
  averagePressure?: number;
  pressureVariability?: number;
  
  // Real-time status
  isOnPath: boolean;
  currentDeviation: number;
}

/**
 * ML Feature Set (47 features from Notebook 03)
 */
export interface MLFeatures {
  // Temporal features (11)
  total_duration: number;
  mean_velocity: number;
  std_velocity: number;
  mean_acceleration: number;
  std_acceleration: number;
  mean_jerk: number;
  std_jerk: number;
  num_strokes: number;
  mean_stroke_duration: number;
  std_stroke_duration: number;
  total_path_length: number;
  
  // Spatial features (12)
  mean_deviation_from_path: number;
  std_deviation_from_path: number;
  max_deviation_from_path: number;
  path_coverage_percentage: number;
  mean_curvature: number;
  std_curvature: number;
  smoothness_index: number;
  tremor_frequency: number;
  direction_changes: number;
  mean_angle_variance: number;
  spatial_accuracy_score: number;
  boundary_violations: number;
  
  // Pressure features (8)
  mean_pressure: number;
  std_pressure: number;
  pressure_variability: number;
  mean_pressure_change_rate: number;
  pressure_smoothness: number;
  light_pressure_ratio: number;
  heavy_pressure_ratio: number;
  pressure_consistency_score: number;
  
  // Stroke pattern features (8)
  stroke_overlap_ratio: number;
  mean_stroke_straightness: number;
  stroke_start_end_distance: number;
  stroke_retracing_ratio: number;
  stroke_fluency_score: number;
  inter_stroke_pause_mean: number;
  inter_stroke_pause_std: number;
  stroke_completion_ratio: number;
  
  // Reversal indicators (8)
  b_d_reversal_likelihood: number;
  p_q_reversal_likelihood: number;
  orientation_error_score: number;
  mirror_symmetry_error: number;
  left_right_confusion_score: number;
  vertical_flip_tendency: number;
  rotation_error_degree: number;
  reversal_confidence_score: number;
}

/**
 * ML Prediction Result
 */
export interface MLPrediction {
  prediction: 'normal' | 'dyslexia';
  probability: number; // 0.0 - 1.0
  confidence: number; // 0.0 - 1.0
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  interpretation: string;
  modelName: string;
  features: MLFeatures;
}

/**
 * Clinical Report
 */
export interface ClinicalReport {
  reportId: string;
  generatedAt: number;
  
  // Patient info
  patientInfo: {
    id?: string;
    name?: string;
    age?: number;
    gender?: string;
  };
  
  // Session summary
  sessionSummary: {
    totalSessions: number;
    lettersAttempted: string[];
    dateRange: { start: number; end: number };
  };
  
  // Performance metrics
  performanceMetrics: {
    overallAccuracy: number;
    averageSpeed: number;
    consistencyScore: number;
    improvementRate: number;
  };
  
  // ML analysis
  mlAnalysis: {
    dyslexiaRiskScore: number;
    predictions: MLPrediction[];
    keyIndicators: string[];
    concernAreas: string[];
  };
  
  // Detailed metrics
  detailedMetrics: {
    byLetter: Record<string, TracingMetrics[]>;
    bySession: TracingMetrics[];
  };
  
  // Recommendations
  recommendations: string[];
  requiresFollowUp: boolean;
  confidenceLevel: 'low' | 'medium' | 'high';
}

/**
 * Tracing Settings
 */
export interface TracingSettings {
  mode: TracingMode;
  showGuide: boolean;
  showPhonics: boolean;
  showVisualCue: boolean;
  feedbackType: FeedbackType;
  strokeColor: string;
  strokeWidth: number;
  pathColor: string;
  pathOpacity: number;
  enableSound: boolean;
  enableVibration: boolean;
  difficultyLevel: 'easy' | 'medium' | 'hard';
}
