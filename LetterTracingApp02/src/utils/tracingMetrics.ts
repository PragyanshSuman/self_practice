// src/utils/tracingMetrics.ts

import { TouchPoint, Stroke, TracingMetrics } from '../types/tracing';

/**
 * Calculate distance from point to nearest path point
 */
export function calculateDistanceToPath(
  point: { x: number; y: number },
  pathPoints: { x: number; y: number }[]
): number {
  if (pathPoints.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  for (const pathPoint of pathPoints) {
    const dx = point.x - pathPoint.x;
    const dy = point.y - pathPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  
  return minDistance;
}

/**
 * Calculate path coverage percentage
 */
export function calculatePathCoverage(
  touchPoints: TouchPoint[],
  pathPoints: { x: number; y: number }[],
  threshold: number = 20 // pixels
): number {
  if (pathPoints.length === 0) return 0;
  
  let coveredPoints = 0;
  
  for (const pathPoint of pathPoints) {
    const isClose = touchPoints.some(touchPoint => {
      const dx = touchPoint.x - pathPoint.x;
      const dy = touchPoint.y - pathPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= threshold;
    });
    
    if (isClose) coveredPoints++;
  }
  
  return (coveredPoints / pathPoints.length) * 100;
}

/**
 * Calculate velocity between consecutive points
 */
export function calculateVelocity(points: TouchPoint[]): number[] {
  const velocities: number[] = [];
  
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const dt = (p2.timestamp - p1.timestamp) / 1000; // Convert to seconds
    
    if (dt > 0) {
      velocities.push(distance / dt);
    }
  }
  
  return velocities;
}

/**
 * Calculate stroke length
 */
export function calculateStrokeLength(stroke: Stroke): number {
  let totalLength = 0;
  
  for (let i = 1; i < stroke.points.length; i++) {
    const p1 = stroke.points[i - 1];
    const p2 = stroke.points[i];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  
  return totalLength;
}

/**
 * Calculate real-time tracing metrics
 */
export function calculateRealTimeMetrics(
  touchPoints: TouchPoint[],
  strokes: Stroke[],
  pathPoints: { x: number; y: number }[],
  startTime: number
): TracingMetrics {
  const currentTime = Date.now();
  const totalTime = currentTime - startTime;
  
  // Calculate deviations
  const deviations = touchPoints.map(point => 
    calculateDistanceToPath(point, pathPoints)
  );
  
  const deviationFromPath = deviations.length > 0
    ? deviations.reduce((sum, d) => sum + d, 0) / deviations.length
    : 0;
  
  // Calculate accuracy score (inverse of deviation, normalized to 0-100)
  const maxDeviation = 100; // Maximum expected deviation in pixels
  const accuracyScore = Math.max(0, Math.min(100, 
    100 - (deviationFromPath / maxDeviation) * 100
  ));
  
  // Calculate path coverage
  const pathCoverage = calculatePathCoverage(touchPoints, pathPoints);
  
  // Calculate speeds
  const velocities = calculateVelocity(touchPoints);
  const averageSpeed = velocities.length > 0
    ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
    : 0;
  
  // Calculate stroke metrics
  const strokeLengths = strokes.map(calculateStrokeLength);
  const averageStrokeLength = strokeLengths.length > 0
    ? strokeLengths.reduce((sum, l) => sum + l, 0) / strokeLengths.length
    : 0;
  
  // Calculate pressure metrics (if available)
  const pressures = touchPoints
    .map(p => p.pressure)
    .filter((p): p is number => p !== undefined);
  
  const averagePressure = pressures.length > 0
    ? pressures.reduce((sum, p) => sum + p, 0) / pressures.length
    : undefined;
  
  const pressureVariability = pressures.length > 1
    ? calculateStandardDeviation(pressures)
    : undefined;
  
  // Determine if currently on path
  const currentPoint = touchPoints[touchPoints.length - 1];
  const currentDeviation = currentPoint
    ? calculateDistanceToPath(currentPoint, pathPoints)
    : 0;
  
  const isOnPath = currentDeviation < 30; // 30 pixels threshold
  
  return {
    accuracyScore,
    deviationFromPath,
    pathCoverage,
    totalTime,
    averageSpeed,
    strokeCount: strokes.length,
    averageStrokeLength,
    averagePressure,
    pressureVariability,
    isOnPath,
    currentDeviation,
  };
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate smoothness (inverse of jerk)
 */
export function calculateSmoothness(points: TouchPoint[]): number {
  if (points.length < 3) return 100;
  
  const velocities = calculateVelocity(points);
  const accelerations: number[] = [];
  
  for (let i = 1; i < velocities.length; i++) {
    const dv = velocities[i] - velocities[i - 1];
    const dt = (points[i + 1].timestamp - points[i].timestamp) / 1000;
    
    if (dt > 0) {
      accelerations.push(dv / dt);
    }
  }
  
  const jerks: number[] = [];
  for (let i = 1; i < accelerations.length; i++) {
    const da = accelerations[i] - accelerations[i - 1];
    const dt = (points[i + 2].timestamp - points[i + 1].timestamp) / 1000;
    
    if (dt > 0) {
      jerks.push(Math.abs(da / dt));
    }
  }
  
  if (jerks.length === 0) return 100;
  
  const avgJerk = jerks.reduce((sum, j) => sum + j, 0) / jerks.length;
  
  // Normalize to 0-100 (lower jerk = higher smoothness)
  const maxJerk = 10000; // Arbitrary maximum
  return Math.max(0, Math.min(100, 100 - (avgJerk / maxJerk) * 100));
}

/**
 * Detect if point is within letter bounds
 */
export function isWithinBounds(
  point: { x: number; y: number },
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  padding: number = 10
): boolean {
  return (
    point.x >= bounds.minX - padding &&
    point.x <= bounds.maxX + padding &&
    point.y >= bounds.minY - padding &&
    point.y <= bounds.maxY + padding
  );
}
