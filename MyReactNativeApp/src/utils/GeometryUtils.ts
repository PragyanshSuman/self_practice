import { Point, PathSegment, GuidelinePoint, IdealPathData } from '@models/TracingData';
import { distance, bezierPoint, perpendicularNormal, pointToLineDistance } from './MathUtils';

/**
 * Generate ideal path points from letter path segments
 */
export const generateIdealPath = (strokes: PathSegment[][], samplesPerSegment: number = 30): IdealPathData => {
  const allPoints: GuidelinePoint[] = [];
  const strokeBoundaries: number[] = [0];
  let totalLength = 0;
  let globalIndex = 0;
  
  for (const stroke of strokes) {
    for (const segment of stroke) {
      const segmentPoints = sampleSegment(segment, samplesPerSegment);
      
      for (let i = 0; i < segmentPoints.length; i++) {
        const point = segmentPoints[i];
        
        // Calculate normal vector for this point
        let normal = { x: 0, y: 1 };
        
        if (i > 0 && i < segmentPoints.length - 1) {
          const prev = segmentPoints[i - 1];
          const next = segmentPoints[i + 1];
          normal = perpendicularNormal(prev, next);
        } else if (i === 0 && segmentPoints.length > 1) {
          const next = segmentPoints[i + 1];
          normal = perpendicularNormal(point, next);
        } else if (i === segmentPoints.length - 1 && segmentPoints.length > 1) {
          const prev = segmentPoints[i - 1];
          normal = perpendicularNormal(prev, point);
        }
        
        allPoints.push({
          x: point.x,
          y: point.y,
          index: globalIndex++,
          normalX: normal.x,
          normalY: normal.y,
        });
        
        if (i > 0) {
          totalLength += distance(segmentPoints[i - 1], point);
        }
      }
    }
    
    strokeBoundaries.push(allPoints.length);
  }
  
  return {
    points: allPoints,
    totalLength,
    strokeBoundaries,
  };
};

/**
 * Sample points along a path segment
 */
const sampleSegment = (segment: PathSegment, samples: number): Point[] => {
  const points: Point[] = [];
  
  if (segment.type === 'line') {
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      points.push({
        x: segment.start.x + t * (segment.end.x - segment.start.x),
        y: segment.start.y + t * (segment.end.y - segment.start.y),
      });
    }
  } else if (segment.type === 'bezier' && segment.control1 && segment.control2) {
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      points.push(bezierPoint(t, segment.start, segment.control1, segment.control2, segment.end));
    }
  }
  
  return points;
};

/**
 * Find closest point on ideal path to a given point
 */
export const findClosestPathPoint = (point: Point, idealPath: IdealPathData): { point: GuidelinePoint; distance: number; index: number } => {
  let minDist = Infinity;
  let closestPoint = idealPath.points[0];
  let closestIndex = 0;
  
  for (let i = 0; i < idealPath.points.length; i++) {
    const pathPoint = idealPath.points[i];
    const dist = distance(point, { x: pathPoint.x, y: pathPoint.y });
    
    if (dist < minDist) {
      minDist = dist;
      closestPoint = pathPoint;
      closestIndex = i;
    }
  }
  
  return { point: closestPoint, distance: minDist, index: closestIndex };
};

/**
 * Calculate deviation from ideal path
 */
export const calculateDeviation = (touchPoint: Point, idealPath: IdealPathData): number => {
  const { distance: dist } = findClosestPathPoint(touchPoint, idealPath);
  return dist;
};

/**
 * Calculate spatial drift (gradual shift from ideal path)
 */
export const calculateSpatialDrift = (touchPoints: Point[], idealPath: IdealPathData): number => {
  if (touchPoints.length < 10) return 0;
  
  const deviations: number[] = [];
  
  for (const point of touchPoints) {
    deviations.push(calculateDeviation(point, idealPath));
  }
  
  // Calculate trend in deviations
  const xValues = Array.from({ length: deviations.length }, (_, i) => i);
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = deviations.length;
  
  for (let i = 0; i < n; i++) {
    sumX += xValues[i];
    sumY += deviations[i];
    sumXY += xValues[i] * deviations[i];
    sumX2 += xValues[i] * xValues[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  return Math.abs(slope);
};

/**
 * Detect off-track events (distance exceeds tolerance)
 */
export const detectOffTrackEvents = (
  touchPoints: Point[],
  idealPath: IdealPathData,
  tolerance: number = 50
): Array<{ startIndex: number; endIndex: number; maxDeviation: number; duration: number }> => {
  const events: Array<{ startIndex: number; endIndex: number; maxDeviation: number; duration: number }> = [];
  let eventStart = -1;
  let maxDev = 0;
  
  for (let i = 0; i < touchPoints.length; i++) {
    const deviation = calculateDeviation(touchPoints[i], idealPath);
    
    if (deviation > tolerance) {
      if (eventStart === -1) {
        eventStart = i;
        maxDev = deviation;
      } else {
        maxDev = Math.max(maxDev, deviation);
      }
    } else {
      if (eventStart !== -1) {
        events.push({
          startIndex: eventStart,
          endIndex: i - 1,
          maxDeviation: maxDev,
          duration: i - eventStart,
        });
        eventStart = -1;
        maxDev = 0;
      }
    }
  }
  
  if (eventStart !== -1) {
    events.push({
      startIndex: eventStart,
      endIndex: touchPoints.length - 1,
      maxDeviation: maxDev,
      duration: touchPoints.length - eventStart,
    });
  }
  
  return events;
};

/**
 * Calculate shape similarity using Hausdorff distance
 */
export const hausdorffDistance = (shape1: Point[], shape2: Point[]): number => {
  const dist1to2 = Math.max(...shape1.map(p1 => Math.min(...shape2.map(p2 => distance(p1, p2)))));
  const dist2to1 = Math.max(...shape2.map(p2 => Math.min(...shape1.map(p1 => distance(p1, p2)))));
  
  return Math.max(dist1to2, dist2to1);
};

/**
 * Calculate Fréchet distance (better for curves)
 */
export const frechetDistance = (curve1: Point[], curve2: Point[]): number => {
  // Simplified discrete Fréchet distance
  const n = curve1.length;
  const m = curve2.length;
  
  if (n === 0 || m === 0) return Infinity;
  
  const ca: number[][] = Array(n).fill(null).map(() => Array(m).fill(-1));
  
  const computeCA = (i: number, j: number): number => {
    if (ca[i][j] > -1) return ca[i][j];
    
    const dist = distance(curve1[i], curve2[j]);
    
    if (i === 0 && j === 0) {
      ca[i][j] = dist;
    } else if (i > 0 && j === 0) {
      ca[i][j] = Math.max(computeCA(i - 1, 0), dist);
    } else if (i === 0 && j > 0) {
      ca[i][j] = Math.max(computeCA(0, j - 1), dist);
    } else if (i > 0 && j > 0) {
      ca[i][j] = Math.max(
        Math.min(
          computeCA(i - 1, j),
          computeCA(i - 1, j - 1),
          computeCA(i, j - 1)
        ),
        dist
      );
    } else {
      ca[i][j] = Infinity;
    }
    
    return ca[i][j];
  };
  
  return computeCA(n - 1, m - 1);
};

/**
 * Calculate bounding box
 */
export const calculateBoundingBox = (points: Point[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } => {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Calculate convex hull (Graham scan)
 */
export const convexHull = (points: Point[]): Point[] => {
  if (points.length < 3) return points;
  
  // Find the point with lowest y-coordinate
  let lowest = points[0];
  for (const point of points) {
    if (point.y < lowest.y || (point.y === lowest.y && point.x < lowest.x)) {
      lowest = point;
    }
  }
  
  // Sort points by polar angle
  const sorted = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - lowest.y, a.x - lowest.x);
    const angleB = Math.atan2(b.y - lowest.y, b.x - lowest.x);
    return angleA - angleB;
  });
  
  const hull: Point[] = [sorted[0], sorted[1]];
  
  for (let i = 2; i < sorted.length; i++) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2];
      const b = hull[hull.length - 1];
      const c = sorted[i];
      
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      
      if (cross <= 0) {
        hull.pop();
      } else {
        break;
      }
    }
    
    hull.push(sorted[i]);
  }
  
  return hull;
};

/**
 * Calculate area of polygon using shoelace formula
 */
export const polygonArea = (points: Point[]): number => {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2;
};

/**
 * Check if shape is horizontally mirrored (for b/d confusion)
 */
export const isHorizontallyMirrored = (shape1: Point[], shape2: Point[]): number => {
  if (shape1.length === 0 || shape2.length === 0) return 0;
  
  // Mirror shape1 horizontally
  const bbox1 = calculateBoundingBox(shape1);
  const centerX = (bbox1.minX + bbox1.maxX) / 2;
  
  const mirrored = shape1.map(p => ({ x: 2 * centerX - p.x, y: p.y }));
  
  // Calculate similarity
  const dist = hausdorffDistance(mirrored, shape2);
  const maxDim = Math.max(bbox1.width, bbox1.height);
  
  return maxDim === 0 ? 0 : Math.max(0, 1 - dist / maxDim);
};

/**
 * Calculate rotation similarity
 */
export const rotationSimilarity = (shape1: Point[], shape2: Point[], angleDegrees: number): number => {
  if (shape1.length === 0 || shape2.length === 0) return 0;
  
  const bbox = calculateBoundingBox(shape1);
  const centerX = (bbox.minX + bbox.maxX) / 2;
  const centerY = (bbox.minY + bbox.maxY) / 2;
  
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const rotated = shape1.map(p => {
    const x = p.x - centerX;
    const y = p.y - centerY;
    return {
      x: x * cos - y * sin + centerX,
      y: x * sin + y * cos + centerY,
    };
  });
  
  const dist = hausdorffDistance(rotated, shape2);
  const maxDim = Math.max(bbox.width, bbox.height);
  
  return maxDim === 0 ? 0 : Math.max(0, 1 - dist / maxDim);
};
