import { TremorMetrics } from '@services/analytics/TremorAnalyzer';
import { SpatialAccuracyMetrics } from '@services/analytics/SpatialAnalyzer';
import { ShapeQualityMetrics } from '@services/analytics/ShapeAnalyzer';

// Basic Geometric Types
export interface Point {
  x: number;
  y: number;
}

export interface BezierCurve {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

export interface PathSegment {
  type: 'line' | 'bezier' | 'arc';
  start: Point;
  end: Point;
  control1?: Point;
  control2?: Point;
  radius?: number;
}

export interface LetterPath {
  letter: string;
  strokes: PathSegment[][];
  expectedStrokeCount: number;
  width: number;
  height: number;
  baseline: number;
  difficulty: 'easy' | 'medium' | 'hard';
  confusionPairs: string[];
}

export interface GuidelinePoint {
  x: number;
  y: number;
  index: number;
  normalX: number;
  normalY: number;
}

export interface IdealPathData {
  points: GuidelinePoint[];
  totalLength: number;
  strokeBoundaries: number[];
}

// ==========================================
// NEW: SHADOW ANALYTICS & VALIDATION MODELS
// ==========================================

export interface RawTouchPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure: number;
}

export interface StrokeFeatureSummary {
  strokeId: number;
  // Temporal
  initiationDelay: number;
  strokeDuration: number;
  pauseCount: number;
  avgPauseDuration: number;

  // Kinematic
  avgVelocity: number;
  avgPressure: number;
  maxAcceleration: number;
  normalizedJerk: number;
  velocityPeaks: number;
  velocityValleys: number;
  samplingRate: number;
  isBallistic: boolean;
  ballisticScore: number;

  // Advanced Analytics (Ported)
  tremor: TremorMetrics;
  spatial: SpatialAccuracyMetrics;

  // Legacy/Simplified
  baselineDeviation: number; // Kept for compatibility, mapped from spatial
  convexityHullArea: number;
  reversalsCount: number; // To be moved to DirectionalAnalyzer maybe? 
  isDirectionCorrect: boolean;
}

// ML Analysis Features
export interface MLFeatures {
  predictedChar: string;
  expectedChar: string;
  isCorrect: boolean;
  confidence: number;
  topPredictions: Array<{ char: string; confidence: number }>;
  reversalDetected: boolean;
  reversalType?: 'horizontal_flip' | 'vertical_flip' | 'rotation_180';
  reversalConfidence?: number;
  analysisTimestamp: string;
}

// ==========================================
// CLINICAL ANALYTICS DATA MODEL (Domains I-XIII)
// ==========================================

export interface ClinicalFeatures {
  // 1. Raw Data Quality
  dataQuality: {
    samplingRate: number; // Hz
    completenessScore: number; // 0-1
    totalSamples: number;
    pointsDropped: number;
  };

  // 2. Kinematics (Velocity)
  kinematics: {
    avgVelocity: number;
    peakVelocity: number;
    velocityCoV: number; // Coefficient of Variation
    velocityPeaks: number; // Count of accelerations
    velocityValleys: number; // Count of hesitations
    timeInMotion: number;
    timePaused: number;
    fluencyRatio: number; // Motion / Total Time
  };

  // 3. Dynamics (Acceleration/Jerk)
  dynamics: {
    maxAcceleration: number;
    avgJerk: number;
    normalizedJerk: number; // Dimensionless smoothness
    accelerationSymmetry: number; // 0-1
    ballisticMovements: number; // Count of smooth strokes
  };

  // 4. Graphomotor (Tremor/Pressure)
  graphomotor: {
    tremorFrequency: number;
    tremorAmplitude: number;
    tremorPower: number;
    avgPressure: number;
    pressureVariance: number;
    strokeWidthMean: number;
    strokeWidthVariance: number;
  };

  // 5. Spatial & Shape (Geometric)
  shape: ShapeQualityMetrics & {
    pathVariance: number; // Deviation from ideal (background calc)
    spatialDrift: number;
    offTrackEvents: number;
    closureSuccess: boolean;
  };

  // 6. Stroke Sequencing (Planning)
  sequencing: {
    strokeCountActual: number;
    strokeCountExpected: number;
    extraStrokes: number;
    missingStrokes: number;
    strokeSequenceCorrect: boolean;
    liftOffCount: number;
    avgInterStrokeLatency: number; // Planning time
  };

  // 10. Reversals (Dyslexia Markers)
  orientation: {
    reversalDetected: boolean;
    reversalType?: 'horizontal' | 'vertical' | 'rotation';
    mirrorConfusionScore: number; // 0-1 probability
    orientationConsistency: number;
  };
}

export interface SessionFeatureSummary {
  sessionId: string;
  letter: string;
  timestamp: string;

  // High-level "Report Card"
  overview: {
    isCorrect: boolean;
    completionTime: number;
    score: number; // 0-100 composite
    status: 'completed' | 'abandoned' | 'timeout';
  };

  // Detailed Clinical Data
  clinical: ClinicalFeatures;

  // ML Context
  ml: MLFeatures;

  // Device Context
  context: {
    inputType: 'finger' | 'stylus';
    screenSize: 'small' | 'medium' | 'large';
    userAgeMonths?: number;
    handedness?: 'left' | 'right';
  };
}

export interface ValidationResult {
  isValid: boolean;
  feedbackType: 'correct' | 'wrong_direction' | 'wrong_order' | 'too_far' | 'none';
  snapToPoint?: Point;
}


// Re-export for convenience
export type { TremorMetrics, SpatialAccuracyMetrics, ShapeQualityMetrics };

