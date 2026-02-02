import { TouchPoint, StrokeData, StrokeCountSequencing } from '@models/AnalyticsTypes';
import { IdealPathData } from '@models/TracingData';
import { distance, mean, std, calculatePathLength } from '@utils/MathUtils';
import { calculateDeviation, findClosestPathPoint } from '@utils/GeometryUtils';

/**
 * Detect individual strokes from touch data based on lift-off events
 */
export const detectStrokes = (
  touchPoints: TouchPoint[],
  liftOffThreshold: number = 200 // ms between strokes
): StrokeData[] => {
  if (touchPoints.length === 0) return [];
  
  const strokes: StrokeData[] = [];
  let currentStroke: TouchPoint[] = [touchPoints[0]];
  let strokeId = 0;
  let startIndex = 0;
  
  for (let i = 1; i < touchPoints.length; i++) {
    const timeDiff = touchPoints[i].timestamp - touchPoints[i - 1].timestamp;
    
    if (timeDiff > liftOffThreshold) {
      // Stroke ended, save it
      if (currentStroke.length > 2) {
        const strokeLength = calculatePathLength(currentStroke);
        const duration = (currentStroke[currentStroke.length - 1].timestamp - currentStroke[0].timestamp) / 1000;
        
        strokes.push({
          stroke_id: strokeId++,
          start_index: startIndex,
          end_index: i - 1,
          points: currentStroke,
          duration,
          length: strokeLength,
          is_correct_order: false, // Will be determined later
          is_correct_direction: false,
          deviation_from_ideal: 0,
        });
      }
      
      // Start new stroke
      currentStroke = [touchPoints[i]];
      startIndex = i;
    } else {
      currentStroke.push(touchPoints[i]);
    }
  }
  
  // Add last stroke
  if (currentStroke.length > 2) {
    const strokeLength = calculatePathLength(currentStroke);
    const duration = (currentStroke[currentStroke.length - 1].timestamp - currentStroke[0].timestamp) / 1000;
    
    strokes.push({
      stroke_id: strokeId,
      start_index: startIndex,
      end_index: touchPoints.length - 1,
      points: currentStroke,
      duration,
      length: strokeLength,
      is_correct_order: false,
      is_correct_direction: false,
      deviation_from_ideal: 0,
    });
  }
  
  return strokes;
};

/**
 * Analyze stroke order correctness
 */
export const analyzeStrokeOrder = (
  strokes: StrokeData[],
  idealPath: IdealPathData,
  expectedStrokeCount: number
): StrokeCountSequencing => {
  const strokeOrderCorrectness: boolean[] = [];
  const strokeSequenceViolations: string[] = [];
  const strokePlanningLatency: number[] = [];
  
  // Analyze each stroke
  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];
    
    // Find which ideal stroke this corresponds to
    const startPoint = stroke.points[0];
    const { index: startPathIndex } = findClosestPathPoint(
      { x: startPoint.x, y: startPoint.y },
      idealPath
    );
    
    // Determine which stroke segment this should be
    let idealStrokeIndex = 0;
    for (let j = 0; j < idealPath.strokeBoundaries.length - 1; j++) {
      if (startPathIndex >= idealPath.strokeBoundaries[j] && startPathIndex < idealPath.strokeBoundaries[j + 1]) {
        idealStrokeIndex = j;
        break;
      }
    }
    
    // Check if strokes are in correct order
    const isCorrectOrder = i === idealStrokeIndex;
    strokeOrderCorrectness.push(isCorrectOrder);
    stroke.is_correct_order = isCorrectOrder;
    
    if (!isCorrectOrder) {
      strokeSequenceViolations.push(
        `Stroke ${i + 1} should be stroke ${idealStrokeIndex + 1}`
      );
    }
    
    // Calculate stroke direction correctness
    if (stroke.points.length >= 2) {
      const startIdx = 0;
      const endIdx = stroke.points.length - 1;
      
      const startIdealIndex = findClosestPathPoint(
        { x: stroke.points[startIdx].x, y: stroke.points[startIdx].y },
        idealPath
      ).index;
      
      const endIdealIndex = findClosestPathPoint(
        { x: stroke.points[endIdx].x, y: stroke.points[endIdx].y },
        idealPath
      ).index;
      
      // Correct direction means end index > start index
      stroke.is_correct_direction = endIdealIndex > startIdealIndex;
    }
    
    // Calculate planning latency (pause before stroke)
    if (i > 0) {
      const prevStroke = strokes[i - 1];
      const latency = (stroke.points[0].timestamp - prevStroke.points[prevStroke.points.length - 1].timestamp) / 1000;
      strokePlanningLatency.push(latency);
    }
    
    // Calculate deviation from ideal path
    const deviations = stroke.points.map(p =>
      calculateDeviation({ x: p.x, y: p.y }, idealPath)
    );
    stroke.deviation_from_ideal = mean(deviations);
  }
  
  // Calculate stroke order score
  const correctStrokes = strokeOrderCorrectness.filter(c => c).length;
  const strokeOrderScore = strokes.length === 0 ? 0 : correctStrokes / Math.max(strokes.length, expectedStrokeCount);
  
  return {
    expected_stroke_count: expectedStrokeCount,
    actual_stroke_count_used: strokes.length,
    extra_strokes: Math.max(0, strokes.length - expectedStrokeCount),
    missing_strokes: Math.max(0, expectedStrokeCount - strokes.length),
    stroke_order_correctness: strokeOrderCorrectness,
    stroke_sequence_violations: strokeSequenceViolations,
    lift_off_count: strokes.length - 1,
    stroke_planning_latency: strokePlanningLatency,
    strokes,
    stroke_order_score: strokeOrderScore,
  };
};

/**
 * Analyze stroke quality metrics
 */
export const analyzeStrokeQuality = (strokes: StrokeData[]): {
  strokeWidthMean: number;
  strokeWidthVariance: number;
  strokeWidthRange: number;
  pressureModulationScore: number;
} => {
  if (strokes.length === 0) {
    return {
      strokeWidthMean: 0,
      strokeWidthVariance: 0,
      strokeWidthRange: 0,
      pressureModulationScore: 0,
    };
  }
  
  // Collect all pressure values (proxy: contact area)
  const allPressures: number[] = [];
  
  for (const stroke of strokes) {
    for (const point of stroke.points) {
      allPressures.push(point.pressure);
    }
  }
  
  const strokeWidthMean = mean(allPressures);
  const pressureStd = std(allPressures);
  const strokeWidthVariance = pressureStd * pressureStd;
  
  const minPressure = Math.min(...allPressures);
  const maxPressure = Math.max(...allPressures);
  const strokeWidthRange = maxPressure - minPressure;
  
  // Pressure modulation score: consistent pressure is better for young children
  const coefficientOfVariation = strokeWidthMean === 0 ? 0 : pressureStd / strokeWidthMean;
  const pressureModulationScore = Math.max(0, 100 - coefficientOfVariation * 100);
  
  return {
    strokeWidthMean,
    strokeWidthVariance,
    strokeWidthRange,
    pressureModulationScore,
  };
};

/**
 * Detect line continuity issues
 */
export const analyzeLineContinuity = (
  strokes: StrokeData[],
  gapThreshold: number = 20
): {
  endpointCount: number;
  junctionCount: number;
  gapCount: number;
  overlapCount: number;
  lineContinuityScore: number;
} => {
  if (strokes.length === 0) {
    return {
      endpointCount: 0,
      junctionCount: 0,
      gapCount: 0,
      overlapCount: 0,
      lineContinuityScore: 100,
    };
  }
  
  let gapCount = 0;
  let overlapCount = 0;
  
  // Check gaps between consecutive strokes
  for (let i = 0; i < strokes.length - 1; i++) {
    const currentEnd = strokes[i].points[strokes[i].points.length - 1];
    const nextStart = strokes[i + 1].points[0];
    
    const gap = distance(
      { x: currentEnd.x, y: currentEnd.y },
      { x: nextStart.x, y: nextStart.y }
    );
    
    if (gap > gapThreshold) {
      gapCount++;
    } else if (gap < 5) {
      overlapCount++;
    }
  }
  
  const endpointCount = strokes.length * 2; // Each stroke has 2 endpoints
  const junctionCount = overlapCount;
  
  // Score: penalize gaps more than overlaps
  const totalTransitions = strokes.length - 1;
  const issues = gapCount * 2 + overlapCount;
  const lineContinuityScore = totalTransitions === 0 ? 100 : Math.max(0, 100 - (issues / totalTransitions) * 100);
  
  return {
    endpointCount,
    junctionCount,
    gapCount,
    overlapCount,
    lineContinuityScore,
  };
};

/**
 * Analyze closure success for letters with closed shapes
 */
export const analyzeClosureSuccess = (
  strokes: StrokeData[],
  letter: string
): {
  closureSuccessRate: number;
  closureGapSize: number[];
} => {
  const closedLetters = ['A', 'B', 'D', 'O', 'P', 'Q', 'R'];
  
  if (!closedLetters.includes(letter.toUpperCase())) {
    return { closureSuccessRate: 1, closureGapSize: [] };
  }
  
  const closureGapSize: number[] = [];
  let totalClosures = 0;
  let successfulClosures = 0;
  
  // For each stroke, check if it closes back on itself or connects to another stroke
  for (const stroke of strokes) {
    if (stroke.points.length < 10) continue;
    
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1];
    
    const gap = distance(
      { x: start.x, y: start.y },
      { x: end.x, y: end.y }
    );
    
    totalClosures++;
    closureGapSize.push(gap);
    
    if (gap < 30) {
      successfulClosures++;
    }
  }
  
  const closureSuccessRate = totalClosures === 0 ? 1 : successfulClosures / totalClosures;
  
  return { closureSuccessRate, closureGapSize };
};

/**
 * Detect self-corrections within strokes
 */
export const detectSelfCorrections = (strokes: StrokeData[]): {
  correctionCount: number;
  correctionEvents: Array<{ strokeId: number; timestamp: number }>;
} => {
  const correctionEvents: Array<{ strokeId: number; timestamp: number }> = [];
  let correctionCount = 0;
  
  for (const stroke of strokes) {
    if (stroke.points.length < 5) continue;
    
    // Look for backtracking patterns (returning to previous points)
    for (let i = 3; i < stroke.points.length; i++) {
      const current = stroke.points[i];
      const prev = stroke.points[i - 1];
      const prev2 = stroke.points[i - 2];
      const prev3 = stroke.points[i - 3];
      
      // Check if current point is closer to prev2 or prev3 than to prev
      const distToPrev = distance(
        { x: current.x, y: current.y },
        { x: prev.x, y: prev.y }
      );
      
      const distToPrev2 = distance(
        { x: current.x, y: current.y },
        { x: prev2.x, y: prev2.y }
      );
      
      const distToPrev3 = distance(
        { x: current.x, y: current.y },
        { x: prev3.x, y: prev3.y }
      );
      
      if (distToPrev2 < distToPrev * 0.5 || distToPrev3 < distToPrev * 0.5) {
        correctionCount++;
        correctionEvents.push({
          strokeId: stroke.stroke_id,
          timestamp: current.timestamp,
        });
      }
    }
  }
  
  return { correctionCount, correctionEvents };
};

/**
 * Calculate time per stroke
 */
export const calculateTimePerStroke = (strokes: StrokeData[]): number[] => {
  return strokes.map(stroke => stroke.duration);
};

/**
 * Calculate inter-stroke latency
 */
export const calculateInterStrokeLatency = (strokes: StrokeData[]): number[] => {
  const latencies: number[] = [];
  
  for (let i = 1; i < strokes.length; i++) {
    const prevEnd = strokes[i - 1].points[strokes[i - 1].points.length - 1].timestamp;
    const currentStart = strokes[i].points[0].timestamp;
    latencies.push((currentStart - prevEnd) / 1000);
  }
  
  return latencies;
};
