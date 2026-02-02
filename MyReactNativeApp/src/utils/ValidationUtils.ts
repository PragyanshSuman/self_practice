import { ComprehensiveTracingAnalytics, TouchPoint } from '@models/AnalyticsTypes';
import { Thresholds } from '@constants/Thresholds';

/**
 * Validation utilities for data quality and integrity
 */

export const ValidationUtils = {
  /**
   * Validate touch point data
   */
  validateTouchPoint: (point: TouchPoint): boolean => {
    return (
      typeof point.x === 'number' &&
      typeof point.y === 'number' &&
      typeof point.timestamp === 'number' &&
      typeof point.pressure === 'number' &&
      !isNaN(point.x) &&
      !isNaN(point.y) &&
      !isNaN(point.timestamp) &&
      !isNaN(point.pressure) &&
      point.pressure >= 0 &&
      point.pressure <= 1
    );
  },

  /**
   * Validate touch points array
   */
  validateTouchPoints: (points: TouchPoint[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!Array.isArray(points)) {
      errors.push('Touch points must be an array');
      return { valid: false, errors };
    }

    if (points.length < Thresholds.dataQuality.minTouchPoints) {
      errors.push(
        `Insufficient touch points: ${points.length} (minimum: ${Thresholds.dataQuality.minTouchPoints})`
      );
    }

    const invalidPoints = points.filter(p => !ValidationUtils.validateTouchPoint(p));
    if (invalidPoints.length > 0) {
      errors.push(`${invalidPoints.length} invalid touch points detected`);
    }

    // Check for temporal consistency
    for (let i = 1; i < points.length; i++) {
      if (points[i].timestamp < points[i - 1].timestamp) {
        errors.push('Touch points are not in chronological order');
        break;
      }
    }

    // Check for duplicate timestamps
    const timestamps = new Set(points.map(p => p.timestamp));
    if (timestamps.size !== points.length) {
      errors.push('Duplicate timestamps detected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate session data quality
   */
  validateSessionQuality: (analytics: ComprehensiveTracingAnalytics): {
    valid: boolean;
    warnings: string[];
    errors: string[];
  } => {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check sampling rate
    if (analytics.raw_touch_data.sampling_rate < Thresholds.dataQuality.minSamplingRate) {
      warnings.push(
        `Low sampling rate: ${analytics.raw_touch_data.sampling_rate.toFixed(1)} Hz`
      );
    }

    // Check data completeness
    if (analytics.raw_touch_data.data_completeness_score < Thresholds.dataQuality.minCompleteness) {
      warnings.push(
        `Low data completeness: ${analytics.raw_touch_data.data_completeness_score.toFixed(1)}%`
      );
    }

    // Check session duration
    const duration = analytics.time_based_performance.total_session_duration;
    if (duration < Thresholds.temporal.minSessionDuration) {
      errors.push(`Session too short: ${duration.toFixed(1)}s`);
    } else if (duration > Thresholds.temporal.maxSessionDuration) {
      warnings.push(`Session unusually long: ${duration.toFixed(1)}s`);
    }

    // Check for data anomalies
    if (analytics.velocity_kinematics.average_velocity === 0) {
      errors.push('Zero average velocity detected');
    }

    if (analytics.spatial_accuracy_deviation.mean_path_deviation === 0) {
      warnings.push('Zero path deviation - possible tracking issue');
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  },

  /**
   * Validate numeric value
   */
  validateNumeric: (value: any, min?: number, max?: number): boolean => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return false;
    }

    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;

    return true;
  },

  /**
   * Validate percentage (0-100)
   */
  validatePercentage: (value: number): boolean => {
    return ValidationUtils.validateNumeric(value, 0, 100);
  },

  /**
   * Validate probability (0-1)
   */
  validateProbability: (value: number): boolean => {
    return ValidationUtils.validateNumeric(value, 0, 1);
  },

  /**
   * Sanitize user input
   */
  sanitizeString: (input: string, maxLength: number = 100): string => {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, ''); // Remove potential HTML
  },

  /**
   * Validate letter input
   */
  validateLetter: (letter: string): boolean => {
    return /^[A-Z]$/i.test(letter);
  },

  /**
   * Validate user ID
   */
  validateUserId: (userId: string): boolean => {
    return (
      typeof userId === 'string' &&
      userId.length >= 3 &&
      userId.length <= 50 &&
      /^[a-zA-Z0-9_-]+$/.test(userId)
    );
  },

  /**
   * Validate age
   */
  validateAge: (age: number): boolean => {
    return ValidationUtils.validateNumeric(age, 3, 18);
  },

  /**
   * Check for outliers using IQR method
   */
  detectOutliers: (values: number[]): { outliers: number[]; indices: number[] } => {
    if (values.length < 4) return { outliers: [], indices: [] };

    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers: number[] = [];
    const indices: number[] = [];

    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });

    return { outliers, indices };
  },

  /**
   * Check data consistency across sessions
   */
  checkConsistency: (sessions: ComprehensiveTracingAnalytics[]): {
    consistent: boolean;
    issues: string[];
  } => {
    const issues: string[] = [];

    if (sessions.length < 2) {
      return { consistent: true, issues: [] };
    }

    // Check for same user ID
    const userIds = new Set(sessions.map(s => s.user_id));
    if (userIds.size > 1) {
      issues.push('Multiple user IDs detected across sessions');
    }

    // Check for demographic consistency
    const ages = sessions.map(s => s.user_demographics_history.chronological_age);
    const ageVariation = Math.max(...ages) - Math.min(...ages);
    if (ageVariation > 2) {
      issues.push(`Large age variation: ${ageVariation} years`);
    }

    // Check for temporal consistency
    const timestamps = sessions.map(s => new Date(s.timestamp).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] < timestamps[i - 1]) {
        issues.push('Sessions not in chronological order');
        break;
      }
    }

    return {
      consistent: issues.length === 0,
      issues,
    };
  },

  /**
   * Validate analytics completeness
   */
  validateAnalyticsCompleteness: (analytics: ComprehensiveTracingAnalytics): {
    complete: boolean;
    missingFields: string[];
  } => {
    const missingFields: string[] = [];

    const requiredFields = [
      'session_id',
      'user_id',
      'letter',
      'timestamp',
      'raw_touch_data',
      'velocity_kinematics',
      'spatial_accuracy_deviation',
      'stroke_count_sequencing',
      'time_based_performance',
      'automated_risk_assessment',
    ];

    requiredFields.forEach(field => {
      if (!(field in analytics) || analytics[field as keyof ComprehensiveTracingAnalytics] === null) {
        missingFields.push(field);
      }
    });

    return {
      complete: missingFields.length === 0,
      missingFields,
    };
  },

  /**
   * Calculate data quality score (0-100)
   */
  calculateQualityScore: (analytics: ComprehensiveTracingAnalytics): number => {
    let score = 100;

    // Sampling rate factor (30%)
    const samplingRatio = Math.min(
      analytics.raw_touch_data.sampling_rate / Thresholds.dataQuality.optimalSamplingRate,
      1
    );
    score *= 0.7 + 0.3 * samplingRatio;

    // Data completeness factor (30%)
    score *= analytics.raw_touch_data.data_completeness_score / 100;

    // Touch point count factor (20%)
    const touchPointRatio = Math.min(
      analytics.raw_touch_data.touch_coordinates_array.length / 100,
      1
    );
    score *= 0.8 + 0.2 * touchPointRatio;

    // Session duration factor (20%)
    const duration = analytics.time_based_performance.total_session_duration;
    const durationScore =
      duration < Thresholds.temporal.minSessionDuration ? 0 :
      duration > Thresholds.temporal.maxSessionDuration ? 0.5 :
      1;
    score *= 0.8 + 0.2 * durationScore;

    return Math.max(0, Math.min(100, score));
  },

  /**
   * Generate validation report
   */
  generateValidationReport: (analytics: ComprehensiveTracingAnalytics): {
    qualityScore: number;
    isValid: boolean;
    warnings: string[];
    errors: string[];
    recommendations: string[];
  } => {
    const qualityValidation = ValidationUtils.validateSessionQuality(analytics);
    const completeness = ValidationUtils.validateAnalyticsCompleteness(analytics);
    const qualityScore = ValidationUtils.calculateQualityScore(analytics);

    const recommendations: string[] = [];

    if (qualityScore < 60) {
      recommendations.push('Consider redoing the session for better data quality');
    }

    if (analytics.raw_touch_data.sampling_rate < Thresholds.dataQuality.optimalSamplingRate) {
      recommendations.push('Improve device performance for better sampling rate');
    }

    if (analytics.time_based_performance.total_session_duration < 10) {
      recommendations.push('Encourage longer practice sessions');
    }

    return {
      qualityScore,
      isValid: qualityValidation.valid && completeness.complete,
      warnings: [...qualityValidation.warnings, ...completeness.missingFields.map(f => `Missing field: ${f}`)],
      errors: qualityValidation.errors,
      recommendations,
    };
  },
};

export default ValidationUtils;
