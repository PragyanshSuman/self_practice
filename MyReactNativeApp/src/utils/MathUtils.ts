import { Point, PathSegment } from '@models/TracingData';
import { TouchPoint } from '@models/AnalyticsTypes';

/**
 * Calculate Euclidean distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Calculate distance between touch point and ideal point
 */
export const touchDistance = (t: TouchPoint, p: Point): number => {
  return Math.sqrt(Math.pow(p.x - t.x, 2) + Math.pow(p.y - t.y, 2));
};

/**
 * Calculate angle between two vectors in radians
 */
export const angleBetween = (p1: Point, p2: Point, p3: Point): number => {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
};

/**
 * Calculate velocity between consecutive points (pixels per second)
 */
export const calculateVelocity = (p1: TouchPoint, p2: TouchPoint): number => {
  const dist = distance({ x: p1.x, y: p1.y }, { x: p2.x, y: p2.y });
  const timeDiff = (p2.timestamp - p1.timestamp) / 1000; // Convert to seconds
  
  if (timeDiff === 0) return 0;
  return dist / timeDiff;
};

/**
 * Calculate acceleration between velocities
 */
export const calculateAcceleration = (v1: number, v2: number, t1: number, t2: number): number => {
  const timeDiff = (t2 - t1) / 1000;
  if (timeDiff === 0) return 0;
  return (v2 - v1) / timeDiff;
};

/**
 * Calculate jerk (rate of change of acceleration)
 */
export const calculateJerk = (a1: number, a2: number, t1: number, t2: number): number => {
  const timeDiff = (t2 - t1) / 1000;
  if (timeDiff === 0) return 0;
  return (a2 - a1) / timeDiff;
};

/**
 * Calculate normalized jerk score (lower is smoother)
 */
export const normalizedJerkScore = (jerkProfile: number[], duration: number, pathLength: number): number => {
  if (jerkProfile.length === 0 || pathLength === 0) return 0;
  
  const sumSquaredJerk = jerkProfile.reduce((sum, j) => sum + j * j, 0);
  const normalizer = Math.pow(duration, 5) / Math.pow(pathLength, 2);
  
  return Math.sqrt(sumSquaredJerk * normalizer);
};

/**
 * Calculate mean
 */
export const mean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

/**
 * Calculate standard deviation
 */
export const std = (values: number[]): number => {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
};

/**
 * Calculate coefficient of variation (std/mean)
 */
export const coefficientOfVariation = (values: number[]): number => {
  const avg = mean(values);
  if (avg === 0) return 0;
  return std(values) / avg;
};

/**
 * Find peaks in data (local maxima above threshold)
 */
export const findPeaks = (data: number[], threshold: number = 0, minDistance: number = 5): Array<{ index: number; value: number }> => {
  const peaks: Array<{ index: number; value: number }> = [];
  
  for (let i = minDistance; i < data.length - minDistance; i++) {
    let isPeak = true;
    
    if (data[i] < threshold) continue;
    
    for (let j = 1; j <= minDistance; j++) {
      if (data[i] <= data[i - j] || data[i] <= data[i + j]) {
        isPeak = false;
        break;
      }
    }
    
    if (isPeak) {
      peaks.push({ index: i, value: data[i] });
    }
  }
  
  return peaks;
};

/**
 * Find valleys in data (local minima)
 */
export const findValleys = (data: number[], minDistance: number = 5): Array<{ index: number; value: number }> => {
  const inverted = data.map(v => -v);
  return findPeaks(inverted, -Infinity, minDistance).map(p => ({
    index: p.index,
    value: -p.value,
  }));
};

/**
 * Calculate curvature at a point (inverse of radius)
 */
export const calculateCurvature = (p1: TouchPoint, p2: TouchPoint, p3: TouchPoint): number => {
  const a = distance({ x: p1.x, y: p1.y }, { x: p2.x, y: p2.y });
  const b = distance({ x: p2.x, y: p2.y }, { x: p3.x, y: p3.y });
  const c = distance({ x: p1.x, y: p1.y }, { x: p3.x, y: p3.y });
  
  if (a === 0 || b === 0 || c === 0) return 0;
  
  const s = (a + b + c) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  
  if (area === 0) return 0;
  
  const radius = (a * b * c) / (4 * area);
  return 1 / radius;
};

/**
 * Calculate angular velocity (change in direction over time)
 */
export const calculateAngularVelocity = (p1: TouchPoint, p2: TouchPoint, p3: TouchPoint): number => {
  const angle = angleBetween(
    { x: p1.x, y: p1.y },
    { x: p2.x, y: p2.y },
    { x: p3.x, y: p3.y }
  );
  
  const timeDiff = (p3.timestamp - p1.timestamp) / 1000;
  if (timeDiff === 0) return 0;
  
  return angle / timeDiff;
};

/**
 * Calculate turning angle sum (total direction change)
 */
export const calculateTurningAngleSum = (points: TouchPoint[]): number => {
  let totalAngle = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const angle = angleBetween(
      { x: points[i - 1].x, y: points[i - 1].y },
      { x: points[i].x, y: points[i].y },
      { x: points[i + 1].x, y: points[i + 1].y }
    );
    totalAngle += angle;
  }
  
  return totalAngle;
};

/**
 * Calculate path length
 */
export const calculatePathLength = (points: TouchPoint[]): number => {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(
      { x: points[i - 1].x, y: points[i - 1].y },
      { x: points[i].x, y: points[i].y }
    );
  }
  return length;
};

/**
 * Detect direction reversals (180-degree turns)
 */
export const detectDirectionReversals = (points: TouchPoint[], threshold: number = Math.PI * 0.7): number => {
  let reversals = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const angle = angleBetween(
      { x: points[i - 1].x, y: points[i - 1].y },
      { x: points[i].x, y: points[i].y },
      { x: points[i + 1].x, y: points[i + 1].y }
    );
    
    if (angle > threshold) {
      reversals++;
    }
  }
  
  return reversals;
};

/**
 * Calculate percentile
 */
export const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

/**
 * Linear regression to calculate slope
 */
export const linearRegression = (xValues: number[], yValues: number[]): { slope: number; intercept: number; r2: number } => {
  if (xValues.length !== yValues.length || xValues.length === 0) {
    return { slope: 0, intercept: 0, r2: 0 };
  }
  
  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const yMean = sumY / n;
  const ssTotal = sumY2 - n * yMean * yMean;
  const ssResidual = yValues.reduce((sum, y, i) => {
    const yPred = slope * xValues[i] + intercept;
    return sum + Math.pow(y - yPred, 2);
  }, 0);
  
  const r2 = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);
  
  return { slope, intercept, r2 };
};

/**
 * Normalize value to 0-1 range
 */
export const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

/**
 * Clamp value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Calculate dot product
 */
export const dotProduct = (v1: Point, v2: Point): number => {
  return v1.x * v2.x + v1.y * v2.y;
};

/**
 * Calculate vector magnitude
 */
export const magnitude = (v: Point): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

/**
 * Normalize vector
 */
export const normalizeVector = (v: Point): Point => {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
};

/**
 * Calculate perpendicular normal vector
 */
export const perpendicularNormal = (p1: Point, p2: Point): Point => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  
  if (mag === 0) return { x: 0, y: 1 };
  
  return { x: -dy / mag, y: dx / mag };
};

/**
 * Point to line segment distance
 */
export const pointToLineDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  if (dx === 0 && dy === 0) {
    return distance(point, lineStart);
  }
  
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)));
  
  const closestPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
  
  return distance(point, closestPoint);
};

/**
 * Calculate bezier point at parameter t
 */
export const bezierPoint = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
};

/**
 * Sample points along a bezier curve
 */
export const sampleBezierCurve = (p0: Point, p1: Point, p2: Point, p3: Point, samples: number = 50): Point[] => {
  const points: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    points.push(bezierPoint(t, p0, p1, p2, p3));
  }
  return points;
};

/**
 * Calculate correlation coefficient
 */
export const correlation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  if (denomX === 0 || denomY === 0) return 0;
  
  return numerator / Math.sqrt(denomX * denomY);
};

/**
 * Moving average filter
 */
export const movingAverage = (data: number[], windowSize: number): number[] => {
  if (windowSize <= 1) return data;
  
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length, i + halfWindow + 1);
    const window = data.slice(start, end);
    result.push(mean(window));
  }
  
  return result;
};

/**
 * Detect pauses in motion (velocity below threshold)
 */
export const detectPauses = (
  velocities: number[],
  timestamps: number[],
  threshold: number = 10
): Array<{ startIndex: number; endIndex: number; duration: number }> => {
  const pauses: Array<{ startIndex: number; endIndex: number; duration: number }> = [];
  let pauseStart = -1;
  
  for (let i = 0; i < velocities.length; i++) {
    if (velocities[i] < threshold) {
      if (pauseStart === -1) {
        pauseStart = i;
      }
    } else {
      if (pauseStart !== -1) {
        pauses.push({
          startIndex: pauseStart,
          endIndex: i - 1,
          duration: (timestamps[i - 1] - timestamps[pauseStart]) / 1000,
        });
        pauseStart = -1;
      }
    }
  }
  
  if (pauseStart !== -1) {
    pauses.push({
      startIndex: pauseStart,
      endIndex: velocities.length - 1,
      duration: (timestamps[velocities.length - 1] - timestamps[pauseStart]) / 1000,
    });
  }
  
  return pauses;
};

/**
 * Calculate Hu Moments for shape recognition (7 invariant moments)
 */
export const calculateHuMoments = (contour: Point[]): number[] => {
  if (contour.length === 0) return [0, 0, 0, 0, 0, 0, 0];
  
  // Calculate centroid
  const cx = mean(contour.map(p => p.x));
  const cy = mean(contour.map(p => p.y));
  
  // Calculate central moments up to order 3
  const moments: { [key: string]: number } = {};
  
  for (let p = 0; p <= 3; p++) {
    for (let q = 0; q <= 3; q++) {
      let sum = 0;
      for (const point of contour) {
        sum += Math.pow(point.x - cx, p) * Math.pow(point.y - cy, q);
      }
      moments[`m${p}${q}`] = sum;
    }
  }
  
  // Normalize by area
  const m00 = moments.m00 || 1;
  const normalizer = Math.pow(m00, 1 + (2 + 0) / 2);
  
  const n20 = moments.m20 / normalizer;
  const n02 = moments.m02 / normalizer;
  const n11 = moments.m11 / normalizer;
  const n30 = moments.m30 / Math.pow(m00, 2.5);
  const n03 = moments.m03 / Math.pow(m00, 2.5);
  const n21 = moments.m21 / Math.pow(m00, 2.5);
  const n12 = moments.m12 / Math.pow(m00, 2.5);
  
  // Calculate 7 Hu moments
  const hu1 = n20 + n02;
  const hu2 = Math.pow(n20 - n02, 2) + 4 * Math.pow(n11, 2);
  const hu3 = Math.pow(n30 - 3 * n12, 2) + Math.pow(3 * n21 - n03, 2);
  const hu4 = Math.pow(n30 + n12, 2) + Math.pow(n21 + n03, 2);
  const hu5 = (n30 - 3 * n12) * (n30 + n12) * (Math.pow(n30 + n12, 2) - 3 * Math.pow(n21 + n03, 2)) +
              (3 * n21 - n03) * (n21 + n03) * (3 * Math.pow(n30 + n12, 2) - Math.pow(n21 + n03, 2));
  const hu6 = (n20 - n02) * (Math.pow(n30 + n12, 2) - Math.pow(n21 + n03, 2)) +
              4 * n11 * (n30 + n12) * (n21 + n03);
  const hu7 = (3 * n21 - n03) * (n30 + n12) * (Math.pow(n30 + n12, 2) - 3 * Math.pow(n21 + n03, 2)) -
              (n30 - 3 * n12) * (n21 + n03) * (3 * Math.pow(n30 + n12, 2) - Math.pow(n21 + n03, 2));
  
  return [hu1, hu2, hu3, hu4, hu5, hu6, hu7];
};

/**
 * Calculate aspect ratio and compactness
 */
export const calculateShapeMetrics = (contour: Point[]): { aspectRatio: number; compactness: number; eccentricity: number } => {
  if (contour.length < 3) return { aspectRatio: 1, compactness: 0, eccentricity: 0 };
  
  const xs = contour.map(p => p.x);
  const ys = contour.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  const aspectRatio = height === 0 ? 1 : width / height;
  
  // Calculate perimeter
  let perimeter = 0;
  for (let i = 0; i < contour.length; i++) {
    const next = (i + 1) % contour.length;
    perimeter += distance(contour[i], contour[next]);
  }
  
  // Calculate area using shoelace formula
  let area = 0;
  for (let i = 0; i < contour.length; i++) {
    const next = (i + 1) % contour.length;
    area += contour[i].x * contour[next].y - contour[next].x * contour[i].y;
  }
  area = Math.abs(area) / 2;
  
  const compactness = area === 0 ? 0 : (perimeter * perimeter) / area;
  
  // Simplified eccentricity calculation
  const eccentricity = Math.min(width, height) === 0 ? 1 : Math.max(width, height) / Math.min(width, height);
  
  return { aspectRatio, compactness, eccentricity };
};
