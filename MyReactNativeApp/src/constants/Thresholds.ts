/**
 * Threshold values for analytics and risk assessment
 * Based on research and clinical guidelines for dyslexia/dysgraphia assessment
 */

export const Thresholds = {
  // ========================================================================
  // SPATIAL ACCURACY THRESHOLDS
  // ========================================================================
  spatial: {
    // Deviation from ideal path (pixels)
    excellentDeviation: 20,
    goodDeviation: 35,
    averageDeviation: 50,
    poorDeviation: 75,
    
    // Accuracy scores (0-100)
    excellentAccuracy: 90,
    goodAccuracy: 75,
    averageAccuracy: 60,
    poorAccuracy: 40,
    
    // Off-track tolerance
    offTrackTolerance: 50, // pixels
    maxOffTrackEvents: 3,
    maxOffTrackDuration: 2.0, // seconds
  },

  // ========================================================================
  // VELOCITY & KINEMATICS THRESHOLDS
  // ========================================================================
  velocity: {
    // Velocity ranges (pixels/second)
    minNormalVelocity: 30,
    maxNormalVelocity: 150,
    averageVelocity: 80,
    
    // Fluency
    minFluencyRatio: 0.7, // 70% time in motion
    excellentFluencyRatio: 0.9,
    
    // Pause detection
    pauseVelocityThreshold: 10, // px/s
    maxPauseDuration: 3.0, // seconds
    maxPauseFrequency: 5,
  },

  // ========================================================================
  // ACCELERATION & JERK THRESHOLDS
  // ========================================================================
  acceleration: {
    // Normalized jerk score (lower is smoother)
    excellentJerk: 0.01,
    goodJerk: 0.05,
    averageJerk: 0.1,
    poorJerk: 0.2,
    
    // Acceleration symmetry
    minSymmetry: 0.7,
    
    // Ballistic vs corrective movements
    ballisticRatio: 0.7, // 70% should be ballistic
  },

  // ========================================================================
  // STROKE ANALYSIS THRESHOLDS
  // ========================================================================
  strokes: {
    // Stroke count accuracy
    maxExtraStrokes: 2,
    
    // Stroke order accuracy
    minStrokeOrderScore: 0.8, // 80%
    
    // Inter-stroke latency (seconds)
    minLatency: 0.1,
    maxLatency: 3.0,
    averageLatency: 0.8,
    
    // Stroke planning time
    maxPlanningTime: 2.0,
    
    // Line continuity
    maxGapSize: 20, // pixels
    maxGapsAllowed: 2,
  },

  // ========================================================================
  // TEMPORAL THRESHOLDS
  // ========================================================================
  temporal: {
    // Session duration (seconds)
    minSessionDuration: 5,
    maxSessionDuration: 120,
    averageSessionDuration: 30,
    
    // Reaction time (seconds)
    fastReactionTime: 0.5,
    normalReactionTime: 1.5,
    slowReactionTime: 3.0,
    
    // Active tracing time ratio
    minActiveRatio: 0.5, // 50% of session
  },

  // ========================================================================
  // TREMOR DETECTION THRESHOLDS
  // ========================================================================
  tremor: {
    // Frequency range (Hz)
    minTremorFrequency: 3,
    maxTremorFrequency: 12,
    
    // Amplitude (pixels)
    minTremorAmplitude: 3,
    maxAcceptableAmplitude: 8,
    
    // Tremor severity
    mildTremorAmplitude: 5,
    moderateTremorAmplitude: 8,
    severeTremorAmplitude: 12,
  },

  // ========================================================================
  // DYSLEXIA RISK THRESHOLDS
  // ========================================================================
  dyslexia: {
    // Reversal detection (0-1 similarity)
    horizontalMirrorThreshold: 0.6,
    rotationThreshold: 0.5,
    
    // Confusion probabilities
    bDConfusionThreshold: 0.3,
    pQConfusionThreshold: 0.3,
    
    // Overall risk scores (0-100)
    lowRisk: 20,
    mildRisk: 40,
    moderateRisk: 60,
    highRisk: 80,
    
    // Stroke sequencing issues
    maxSequenceViolations: 1,
  },

  // ========================================================================
  // DYSGRAPHIA RISK THRESHOLDS
  // ========================================================================
  dysgraphia: {
    // Overall risk scores (0-100)
    lowRisk: 20,
    mildRisk: 40,
    moderateRisk: 60,
    highRisk: 80,
    
    // Pressure modulation
    minPressureModulation: 60, // score 0-100
    
    // Line quality
    minLineContinuity: 70, // score 0-100
    minShapeQuality: 65,
    
    // Motor control indicators
    maxAcceptableTremor: 5,
    minCoordinationScore: 60,
  },

  // ========================================================================
  // ATTENTION & FOCUS THRESHOLDS
  // ========================================================================
  attention: {
    // Focus score (0-100)
    minFocusScore: 60,
    excellentFocusScore: 85,
    
    // Impulsivity (reaction time)
    impulsiveReactionTime: 0.5,
    
    // Distraction events
    maxDistractionEvents: 3,
    
    // Task abandonment
    abandonmentThreshold: 0.3, // 30% completion
  },

  // ========================================================================
  // WORKING MEMORY THRESHOLDS
  // ========================================================================
  workingMemory: {
    // Memory span (number of strokes)
    minMemorySpan: 3,
    averageMemorySpan: 5,
    excellentMemorySpan: 7,
    
    // Stroke recall accuracy
    minRecallAccuracy: 0.7,
    
    // Multi-stroke performance
    minMultiStrokeScore: 0.6,
  },

  // ========================================================================
  // FATIGUE THRESHOLDS
  // ========================================================================
  fatigue: {
    // Performance degradation (per sample)
    maxDegradationSlope: 0.1,
    
    // Speed degradation
    maxSpeedDropoff: -2.0, // px/s per sample
    
    // Session tolerance
    normalToleranceDuration: 60, // seconds
    
    // Fatigue index (0-100)
    lowFatigueIndex: 30,
    moderateFatigueIndex: 60,
    highFatigueIndex: 80,
  },

  // ========================================================================
  // LEARNING & PROGRESS THRESHOLDS
  // ========================================================================
  learning: {
    // Improvement rate (per session)
    minImprovementRate: 0.05, // 5%
    goodImprovementRate: 0.15, // 15%
    
    // Mastery criteria
    masteryAccuracy: 85,
    masteryConsistency: 3, // sessions
    
    // Plateau detection
    plateauSessions: 5,
    plateauVariation: 0.05, // 5%
    
    // Retention (0-1)
    minRetention24h: 0.7,
    minRetention1week: 0.6,
  },

  // ========================================================================
  // SHAPE ANALYSIS THRESHOLDS
  // ========================================================================
  shape: {
    // Aspect ratio (width/height)
    minAspectRatio: 0.5,
    maxAspectRatio: 2.0,
    
    // Compactness
    maxCompactness: 20,
    
    // Symmetry (0-1)
    minSymmetry: 0.6,
    
    // Baseline adherence (0-1)
    minBaselineAdherence: 0.5,
    
    // Shape similarity (0-1)
    minSimilarity: 0.6,
    excellentSimilarity: 0.85,
  },

  // ========================================================================
  // SAMPLING & DATA QUALITY THRESHOLDS
  // ========================================================================
  dataQuality: {
    // Sampling rate (Hz)
    minSamplingRate: 30,
    optimalSamplingRate: 60,
    
    // Data completeness (%)
    minCompleteness: 90,
    
    // Minimum touch points
    minTouchPoints: 10,
    
    // Lift-off detection (ms)
    liftOffThreshold: 200,
  },

  // ========================================================================
  // CLINICAL ALERT THRESHOLDS
  // ========================================================================
  clinicalAlerts: {
    // Standard deviations below norm
    immediateReferralSD: 3,
    monitorCloselySD: 2,
    
    // Multiple risk factors
    maxConcurrentRisks: 2,
    
    // Severity thresholds
    severityMild: 25,
    severityModerate: 50,
    severitySevere: 75,
  },

  // ========================================================================
  // AGE-BASED NORMS (Simplified)
  // ========================================================================
  ageNorms: {
    age5_6: {
      averageAccuracy: 60,
      averageVelocity: 50,
      averageDuration: 45,
    },
    age7_8: {
      averageAccuracy: 70,
      averageVelocity: 70,
      averageDuration: 35,
    },
    age9_10: {
      averageAccuracy: 80,
      averageVelocity: 90,
      averageDuration: 25,
    },
    age11_plus: {
      averageAccuracy: 85,
      averageVelocity: 110,
      averageDuration: 20,
    },
  },

  // ========================================================================
  // FEEDBACK DISPLAY THRESHOLDS
  // ========================================================================
  feedback: {
    // When to show warnings
    showAccuracyWarning: 60,
    showSpeedWarning: 40,
    showFluencyWarning: 0.6,
    
    // When to show encouragement
    showEncouragement: 75,
    showExcellence: 90,
    
    // Haptic feedback frequency (ms)
    hapticCooldown: 200,
  },
};

/**
 * Threshold utility functions
 */
export const ThresholdUtils = {
  /**
   * Get risk level from score
   */
  getRiskLevel: (score: number, type: 'dyslexia' | 'dysgraphia'): string => {
    const thresholds = type === 'dyslexia' ? Thresholds.dyslexia : Thresholds.dysgraphia;
    
    if (score < thresholds.lowRisk) return 'low';
    if (score < thresholds.mildRisk) return 'mild';
    if (score < thresholds.moderateRisk) return 'moderate';
    if (score < thresholds.highRisk) return 'high';
    return 'severe';
  },

  /**
   * Get accuracy rating
   */
  getAccuracyRating: (accuracy: number): string => {
    if (accuracy >= Thresholds.spatial.excellentAccuracy) return 'excellent';
    if (accuracy >= Thresholds.spatial.goodAccuracy) return 'good';
    if (accuracy >= Thresholds.spatial.averageAccuracy) return 'average';
    if (accuracy >= Thresholds.spatial.poorAccuracy) return 'poor';
    return 'very poor';
  },

  /**
   * Get velocity rating
   */
  getVelocityRating: (velocity: number): string => {
    if (velocity < Thresholds.velocity.minNormalVelocity) return 'too slow';
    if (velocity > Thresholds.velocity.maxNormalVelocity) return 'too fast';
    return 'normal';
  },

  /**
   * Check if session meets minimum quality standards
   */
  isSessionValid: (
    touchPoints: number,
    duration: number,
    samplingRate: number,
    completeness: number
  ): boolean => {
    return (
      touchPoints >= Thresholds.dataQuality.minTouchPoints &&
      duration >= Thresholds.temporal.minSessionDuration &&
      samplingRate >= Thresholds.dataQuality.minSamplingRate &&
      completeness >= Thresholds.dataQuality.minCompleteness
    );
  },

  /**
   * Get age-appropriate norms
   */
  getAgeNorms: (ageYears: number) => {
    if (ageYears <= 6) return Thresholds.ageNorms.age5_6;
    if (ageYears <= 8) return Thresholds.ageNorms.age7_8;
    if (ageYears <= 10) return Thresholds.ageNorms.age9_10;
    return Thresholds.ageNorms.age11_plus;
  },

  /**
   * Check if clinical alert should be triggered
   */
  shouldTriggerAlert: (
    riskScores: { dyslexia: number; dysgraphia: number; reversal: number },
    concernFlags: string[]
  ): boolean => {
    const avgRisk = (riskScores.dyslexia + riskScores.dysgraphia + riskScores.reversal) / 3;
    
    return (
      avgRisk >= Thresholds.clinicalAlerts.severitySevere ||
      concernFlags.length >= Thresholds.clinicalAlerts.maxConcurrentRisks
    );
  },
};

export default Thresholds;
