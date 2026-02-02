import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Vibration,
} from 'react-native';
import Svg, { Path, Circle, Line, G, Defs, Marker, Polygon } from 'react-native-svg';
import { IdealPathData, Point, ValidationResult } from '@models/TracingData';
import { CANVAS_CONFIG } from '@constants/LetterPaths';

interface TracingCanvasProps {
  idealPath: IdealPathData;
  activeStrokeIndex: number;
  letterStrokes: any[]; // The structured stroke data from LetterPaths
  onTouchStart?: () => void;
  onTouchMove?: (x: number, y: number, pressure: number) => void;
  onTouchEnd?: () => void;
  showGuidelines?: boolean;
  showFeedback?: boolean;
  validationFeedback?: ValidationResult;
  tolerancePixels?: number;
  onStrokeComplete?: (strokeIndex: number) => void;
}

const TracingCanvas: React.FC<TracingCanvasProps> = ({
  idealPath,
  activeStrokeIndex,
  letterStrokes,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  showGuidelines = true,
  showFeedback = true,
  validationFeedback,
  tolerancePixels = 60, // Increased tolerance for kids
  onStrokeComplete,
}) => {
  const [userPath, setUserPath] = useState<Array<{ x: number; y: number }>>([]);
  const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number } | null>(null);
  const [isOnTrack, setIsOnTrack] = useState(true);
  
  // Track completed strokes visually
  const [permanentPaths, setPermanentPaths] = useState<string[]>([]);
  
  const pathRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastVibrateRef = useRef<number>(0);
  
  // Reset when letter changes
  useEffect(() => {
    setPermanentPaths([]);
    setUserPath([]);
    pathRef.current = [];
  }, [idealPath]);
  
  // NOTE: Removed the useEffect that cleared paths on activeStrokeIndex change
  // This was causing strokes to disappear when advancing to next stroke
  // Strokes are now saved in onPanResponderRelease instead

  /**
   * Check if point is within tolerance of current stroke
   */
  const checkOnTrack = useCallback((x: number, y: number): boolean => {
    // BLANK CANVAS MODE: If guidelines are hidden, we accept ANY position
    if (!showGuidelines) return true;

    // Only verify against points in the CURRENT active stroke range
    // We need to map activeStrokeIndex to indices in idealPath.points
    // This is approximate if we don't have exact index ranges, but assuming 
    // idealPath.strokeBoundaries maps to this:
    
    let startIndex = 0;
    let endIndex = idealPath.points.length - 1;
    
    if (idealPath.strokeBoundaries && idealPath.strokeBoundaries.length > 0) {
      // Logic to find start/end for activeStrokeIndex
      // If strokeBoundaries = [0, 50, 100], then stroke 0 is 0-50, stroke 1 is 50-100
      if (activeStrokeIndex < idealPath.strokeBoundaries.length) {
         startIndex = activeStrokeIndex === 0 ? 0 : idealPath.strokeBoundaries[activeStrokeIndex - 1];
         endIndex = idealPath.strokeBoundaries[activeStrokeIndex];
      }
    }

    let minDistance = Infinity;
    
    // Check closest point only within the active stroke segment
    const searchEnd = Math.min(endIndex + 5, idealPath.points.length); // +5 buffer
    const searchStart = Math.max(0, startIndex - 5);

    for (let i = searchStart; i < searchEnd; i++) {
        const point = idealPath.points[i];
        if (!point) continue;
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        minDistance = Math.min(minDistance, distance);
    }

    return minDistance <= tolerancePixels;
  }, [idealPath, tolerancePixels, activeStrokeIndex, showGuidelines]);

  /**
   * Pan responder for touch handling
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        
        pathRef.current = [{ x: locationX, y: locationY }];
        setUserPath([{ x: locationX, y: locationY }]);
        setCurrentPosition({ x: locationX, y: locationY });
        
        onTouchStart?.();
      },

      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        const force = (evt.nativeEvent as any).force || 1;

        pathRef.current.push({ x: locationX, y: locationY });
        setUserPath([...pathRef.current]);
        setCurrentPosition({ x: locationX, y: locationY });

        // Check if on track
        const onTrack = checkOnTrack(locationX, locationY);
        setIsOnTrack(onTrack);

        // Haptic feedback when off track
        if (!onTrack && showFeedback) {
          const now = Date.now();
          if (now - lastVibrateRef.current > 200) {
            Vibration.vibrate(50);
            lastVibrateRef.current = now;
          }
        }

        onTouchMove?.(locationX, locationY, force);
      },

      onPanResponderRelease: () => {
        const wasOnTrack = isOnTrack;
        const pathLength = pathRef.current.length;
        
        // CRITICAL FIX: Capture points immediately to avoid reference issues
        const pointsToSave = [...pathRef.current];
        
        if (pointsToSave.length > 5) {
          const newPath = generateSVGPath(pointsToSave);
          // Force update with new path
          setPermanentPaths(prev => {
              const updated = [...prev, newPath];
              console.log('Adding permanent path, count:', updated.length);
              return updated;
          });
        }
        
        // Clear current path
        setUserPath([]);
        pathRef.current = [];
        setCurrentPosition(null);
        onTouchEnd?.();
        
        // Simple heuristic: if path is long enough and ended on track, complete stroke
        if (wasOnTrack && pathLength > 20) {
            onStrokeComplete?.(activeStrokeIndex);
        }
      },

      onPanResponderTerminate: () => {
        // Save stroke before clearing (in case of interruption)
        const pointsToSave = [...pathRef.current];
        if (pointsToSave.length > 5) {
          const newPath = generateSVGPath(pointsToSave);
          setPermanentPaths(prev => [...prev, newPath]);
        }
        
        setUserPath([]);
        pathRef.current = [];
        setCurrentPosition(null);
        onTouchEnd?.();
      },
    })
  ).current;

  /**
   * Generate SVG path from points
   */
  const generateSVGPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  /**
   * Generate SVG path for a specific stroke from IdealPathData
   */
  const getStrokePath = (index: number): string => {
      // This helper functions looks at idealPath.strokeBoundaries to slice points
      if (!idealPath.strokeBoundaries || idealPath.strokeBoundaries.length === 0) return '';
      
      const start = index === 0 ? 0 : idealPath.strokeBoundaries[index - 1];
      const end = idealPath.strokeBoundaries[index];
      
      const segmentPoints = idealPath.points.slice(start, end + 1);
      
      if (segmentPoints.length === 0) return '';
      
      return segmentPoints.reduce((path, pt, i) => {
          return i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
      }, '');
  };
  
  // Calculate arrow position (end of current stroke)
  const getArrowInfo = () => {
      if (activeStrokeIndex >= idealPath.strokeBoundaries.length) return null;
      
      const endIdx = idealPath.strokeBoundaries[activeStrokeIndex];
      const startIdx = activeStrokeIndex === 0 ? 0 : idealPath.strokeBoundaries[activeStrokeIndex - 1];
      
      // Get last few points to calculate angle
      if (endIdx < 3 || endIdx >= idealPath.points.length) return null;
      
      const p2 = idealPath.points[endIdx];
      const p1 = idealPath.points[endIdx - 5]; // 5 points back
      
      if (!p1 || !p2) return null;
      
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      
      return { x: p2.x, y: p2.y, rotation: angle };
  };
  
  const arrowInfo = getArrowInfo();

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Svg width={CANVAS_CONFIG.width} height={CANVAS_CONFIG.height} style={styles.svg}>
        <Defs>
            <Marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
            >
                <Path d="M 0 0 L 10 5 L 0 10 z" fill="#2196F3" />
            </Marker>
        </Defs>

        {/* Background Grid - Dark Theme */}
        {showGuidelines && (
          <G opacity={0.2}>
            <Line
              x1={0}
              y1={CANVAS_CONFIG.baseline}
              x2={CANVAS_CONFIG.width}
              y2={CANVAS_CONFIG.baseline}
              stroke="#52656d"
              strokeWidth={2}
              strokeDasharray="10,10"
            />
            <Line
              x1={CANVAS_CONFIG.centerX}
              y1={0}
              x2={CANVAS_CONFIG.centerX}
              y2={CANVAS_CONFIG.height}
              stroke="#52656d"
              strokeWidth={2}
              strokeDasharray="10,10"
            />
          </G>
        )}

        {/* Future Strokes (Dashed, Inactive) */}
        {showGuidelines && idealPath.strokeBoundaries.map((_, idx) => {
            if (idx <= activeStrokeIndex) return null; // Only render future strokes
            return (
                <Path
                    key={`future-${idx}`}
                    d={getStrokePath(idx)}
                    stroke="#37464F" // Dark grey for inactive
                    strokeWidth={18}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="20,20"
                />
            );
        })}

        {/* Current Active Stroke Guide (Solid or Dashed with Arrow) */}
        {showGuidelines && activeStrokeIndex < idealPath.strokeBoundaries.length && (
            <G>
                <Path
                    d={getStrokePath(activeStrokeIndex)}
                    stroke="#2b3b45" // Slightly lighter grey background for active
                    strokeWidth={22}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d={getStrokePath(activeStrokeIndex)}
                    stroke="#2196F3" // Blue guide
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="15,10"
                    opacity={0.8}
                />
                {/* Arrow at the end of stroke */}
                {arrowInfo && (
                    <G x={arrowInfo.x} y={arrowInfo.y} rotation={arrowInfo.rotation}>
                         <Polygon
                            points="0,0 -10,-8 -10,8"
                            fill="#2196F3"
                         />
                    </G>
                )}
            </G>
        )}
        
        {/* Previously Completed Strokes (Permanent, Green) */}
        {permanentPaths.map((path, index) => (
             <Path
                key={`perm-${index}`}
                d={path}
                stroke="#58CC02" // Duolingo Green
                strokeWidth={20}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
             />
        ))}

        {/* Current User Draw Path */}
        <Path
          d={generateSVGPath(userPath)}
          stroke={(validationFeedback?.isValid ?? isOnTrack) ? '#58CC02' : '#FF4B4B'} // Green if good, Red if bad
          strokeWidth={20}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current touch position halo */}
        {currentPosition && (
          <Circle
            cx={currentPosition.x}
            cy={currentPosition.y}
            r={25}
            fill={(validationFeedback?.isValid ?? isOnTrack) ? '#58CC02' : '#FF4B4B'}
            opacity={0.3}
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CANVAS_CONFIG.width,
    height: CANVAS_CONFIG.height,
    backgroundColor: '#131F24', // Duolingo-style dark background
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#37464F',
  },
  svg: {
    backgroundColor: 'transparent',
  },
});

export default TracingCanvas;
