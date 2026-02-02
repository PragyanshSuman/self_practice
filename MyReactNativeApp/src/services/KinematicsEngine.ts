import {
  TouchPoint,
  VelocityKinematics,
  AccelerationJerkAnalysis,
  DirectionalAngularMetrics,
  SpatialAccuracyDeviation,
} from '@models/AnalyticsTypes';
import { IdealPathData } from '@models/TracingData';
import {
  calculateVelocity,
  calculateAcceleration,
  calculateJerk,
  normalizedJerkScore,
  mean,
  std,
  coefficientOfVariation,
  findPeaks,
  findValleys,
  calculateCurvature,
  calculateAngularVelocity,
  calculateTurningAngleSum,
  detectDirectionReversals,
  detectPauses,
} from '@utils/MathUtils';
import {
  calculateDeviation,
  calculateSpatialDrift,
  detectOffTrackEvents,
} from '@utils/GeometryUtils';
import { gaussianSmooth, detectTremorFrequency } from '@utils/SignalProcessing';

/**
 * Calculate complete velocity kinematics
 */
export const calculateVelocityKinematics = (touchPoints: TouchPoint[]): VelocityKinematics => {
  if (touchPoints.length < 2) {
    return {
      instantaneous_velocity: [],
      average_velocity: 0,
      velocity_coefficient_of_variation: 0,
      velocity_peaks: [],
      velocity_valleys: [],
      velocity_range: 0,
      time_in_motion: 0,
      time_paused: 0,
      fluency_ratio: 0,
    };
  }
  
  // Calculate instantaneous velocities
  const instantaneous_velocity: number[] = [];
  const timestamps: number[] = [];
  
  for (let i = 1; i < touchPoints.length; i++) {
    const vel = calculateVelocity(touchPoints[i - 1], touchPoints[i]);
    instantaneous_velocity.push(vel);
    timestamps.push(touchPoints[i].timestamp);
  }
  
  // Smooth velocities to reduce noise
  const smoothedVelocities = gaussianSmooth(instantaneous_velocity, 1.5);
  
  const average_velocity = mean(smoothedVelocities);
  const velocity_coefficient_of_variation = coefficientOfVariation(smoothedVelocities);
  
  // Find peaks and valleys
  const velocity_peaks = findPeaks(smoothedVelocities, average_velocity * 1.5, 5);
  const velocity_valleys = findValleys(smoothedVelocities, 5);
  
  const velocity_range = Math.max(...smoothedVelocities) - Math.min(...smoothedVelocities);
  
  // Detect pauses (velocity < 10 pixels/sec)
  const pauses = detectPauses(smoothedVelocities, timestamps, 10);
  
  const time_paused = pauses.reduce((sum, p) => sum + p.duration, 0);
  const totalTime = (touchPoints[touchPoints.length - 1].timestamp - touchPoints[0].timestamp) / 1000;
  const time_in_motion = totalTime - time_paused;
  const fluency_ratio = totalTime === 0 ? 0 : time_in_motion / totalTime;
  
  return {
    instantaneous_velocity: smoothedVelocities,
    average_velocity,
    velocity_coefficient_of_variation,
    velocity_peaks,
    velocity_valleys,
    velocity_range,
    time_in_motion,
    time_paused,
    fluency_ratio,
  };
};

/**
 * Calculate acceleration and jerk analysis
 */
export const calculateAccelerationJerkAnalysis = (
  touchPoints: TouchPoint[],
  velocities: number[]
): AccelerationJerkAnalysis => {
  if (touchPoints.length < 3) {
    return {
      acceleration_profile: [],
      jerk_profile: [],
      normalized_jerk_score: 0,
      acceleration_symmetry: 0,
      ballistic_movement_count: 0,
      corrective_movement_count: 0,
      mean_absolute_jerk: 0,
      peak_jerk: 0,
    };
  }
  
  // Calculate acceleration
  const acceleration_profile: number[] = [];
  
  for (let i = 1; i < velocities.length; i++) {
    const acc = calculateAcceleration(
      velocities[i - 1],
      velocities[i],
      touchPoints[i].timestamp,
      touchPoints[i + 1].timestamp
    );
    acceleration_profile.push(acc);
  }
  
  // Calculate jerk
  const jerk_profile: number[] = [];
  
  for (let i = 1; i < acceleration_profile.length; i++) {
    const jerk = calculateJerk(
      acceleration_profile[i - 1],
      acceleration_profile[i],
      touchPoints[i + 1].timestamp,
      touchPoints[i + 2].timestamp
    );
    jerk_profile.push(jerk);
  }
  
  // Calculate metrics
  const totalTime = (touchPoints[touchPoints.length - 1].timestamp - touchPoints[0].timestamp) / 1000;
  const pathLength = velocities.reduce((sum, v, i) => {
    if (i === 0) return 0;
    const dt = (touchPoints[i + 1].timestamp - touchPoints[i].timestamp) / 1000;
    return sum + v * dt;
  }, 0);
  
  const normalized_jerk_score = normalizedJerkScore(jerk_profile, totalTime, pathLength);
  
  // Calculate acceleration symmetry
  const positiveAcc = acceleration_profile.filter(a => a > 0);
  const negativeAcc = acceleration_profile.filter(a => a < 0);
  
  const avgPositive = positiveAcc.length > 0 ? mean(positiveAcc) : 0;
  const avgNegative = negativeAcc.length > 0 ? Math.abs(mean(negativeAcc)) : 0;
  
  const acceleration_symmetry = avgPositive + avgNegative === 0
    ? 1
    : 1 - Math.abs(avgPositive - avgNegative) / (avgPositive + avgNegative);
  
  // Detect ballistic vs corrective movements
  const jerkThreshold = mean(jerk_profile.map(Math.abs)) + std(jerk_profile.map(Math.abs));
  
  let ballistic_movement_count = 0;
  let corrective_movement_count = 0;
  
  for (const jerk of jerk_profile) {
    if (Math.abs(jerk) < jerkThreshold) {
      ballistic_movement_count++;
    } else {
      corrective_movement_count++;
    }
  }
  
  const mean_absolute_jerk = mean(jerk_profile.map(Math.abs));
  const peak_jerk = Math.max(...jerk_profile.map(Math.abs));
  
  return {
    acceleration_profile,
    jerk_profile,
    normalized_jerk_score,
    acceleration_symmetry,
    ballistic_movement_count,
    corrective_movement_count,
    mean_absolute_jerk,
    peak_jerk,
  };
};

/**
 * Calculate directional and angular metrics
 */
export const calculateDirectionalAngularMetrics = (touchPoints: TouchPoint[]): DirectionalAngularMetrics => {
  if (touchPoints.length < 3) {
    return {
      path_curvature: [],
      angular_velocity: [],
      direction_reversals_count: 0,
      curvature_consistency: 0,
      ideal_vs_actual_angle_deviation: [],
      mean_curvature: 0,
      curvature_std: 0,
      turning_angle_sum: 0,
    };
  }
  
  // Calculate curvature at each point
  const path_curvature: number[] = [];
  
  for (let i = 1; i < touchPoints.length - 1; i++) {
    const curvature = calculateCurvature(touchPoints[i - 1], touchPoints[i], touchPoints[i + 1]);
    path_curvature.push(curvature);
  }
  
  // Calculate angular velocity
  const angular_velocity: number[] = [];
  
  for (let i = 1; i < touchPoints.length - 1; i++) {
    const angVel = calculateAngularVelocity(touchPoints[i - 1], touchPoints[i], touchPoints[i + 1]);
    angular_velocity.push(angVel);
  }
  
  const direction_reversals_count = detectDirectionReversals(touchPoints);
  const curvature_consistency = 1 - coefficientOfVariation(path_curvature);
  
  const mean_curvature = mean(path_curvature);
  const curvature_std = std(path_curvature);
  const turning_angle_sum = calculateTurningAngleSum(touchPoints);
  
  // Ideal angle deviation would require ideal path, set to empty for now
  const ideal_vs_actual_angle_deviation: number[] = [];
  
  return {
    path_curvature,
    angular_velocity,
    direction_reversals_count,
    curvature_consistency,
    ideal_vs_actual_angle_deviation,
    mean_curvature,
    curvature_std,
    turning_angle_sum,
  };
};

/**
 * Calculate spatial accuracy and deviation
 */
export const calculateSpatialAccuracyDeviation = (
  touchPoints: TouchPoint[],
  idealPath: IdealPathData,
  tolerancePixels: number = 50
): SpatialAccuracyDeviation => {
  if (touchPoints.length === 0) {
    return {
      mean_path_deviation: 0,
      max_path_deviation: 0,
      deviation_std: 0,
      off_track_events: [],
      off_track_duration_total: 0,
      off_track_recovery_time: [],
      spatial_drift: 0,
      accuracy_score: 100,
    };
  }
  
  // Calculate deviations
  const deviations: number[] = [];
  
  for (const point of touchPoints) {
    const deviation = calculateDeviation({ x: point.x, y: point.y }, idealPath);
    deviations.push(deviation);
  }
  
  const mean_path_deviation = mean(deviations);
  const max_path_deviation = Math.max(...deviations);
  const deviation_std = std(deviations);
  
  // Detect off-track events
  const off_track_events = detectOffTrackEvents(
    touchPoints.map(p => ({ x: p.x, y: p.y })),
    idealPath,
    tolerancePixels
  );
  
  const off_track_duration_total = off_track_events.reduce((sum, e) => sum + e.duration, 0);
  
  const off_track_recovery_time = off_track_events.map(e => e.duration);
  
  const spatial_drift = calculateSpatialDrift(
    touchPoints.map(p => ({ x: p.x, y: p.y })),
    idealPath
  );
  
  // Calculate accuracy score (0-100)
  const maxDeviation = tolerancePixels * 2;
  const normalizedDeviation = Math.min(mean_path_deviation / maxDeviation, 1);
  const accuracy_score = Math.max(0, 100 * (1 - normalizedDeviation));
  
  return {
    mean_path_deviation,
    max_path_deviation,
    deviation_std,
    off_track_events: off_track_events.map(e => ({
      timestamp: touchPoints[e.startIndex].timestamp,
      duration: e.duration,
      distance: e.maxDeviation,
    })),
    off_track_duration_total,
    off_track_recovery_time,
    spatial_drift,
    accuracy_score,
  };
};

/**
 * Analyze tremor in the stroke
 */
export const analyzeTremor = (
  velocities: number[],
  samplingRate: number
): {
  tremorFrequency: number;
  tremorAmplitude: number;
  tremorPowerSpectralDensity: number[];
} => {
  const { frequency, amplitude } = detectTremorFrequency(velocities, samplingRate);
  
  return {
    tremorFrequency: frequency,
    tremorAmplitude: amplitude,
    tremorPowerSpectralDensity: [], // Would need full FFT implementation
  };
};
