// src/components/tracing/TracingCanvas.tsx

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TouchPoint, Stroke, TracingMetrics, LetterConfig } from '../../types/tracing';
import { calculateRealTimeMetrics } from '../../utils/tracingMetrics';
import { getIdealPathPoints } from '../../utils/letterPaths';
import LetterPath from './LetterPath';
import TracingFeedback from './TracingFeedback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TracingCanvasProps {
  letterConfig: LetterConfig;
  showGuide: boolean;
  onComplete?: (metrics: TracingMetrics, strokes: Stroke[]) => void;
  onMetricsUpdate?: (metrics: TracingMetrics) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
  showFeedback?: boolean;
}

export default function TracingCanvas({
  letterConfig,
  showGuide,
  onComplete,
  onMetricsUpdate,
  canvasWidth = SCREEN_WIDTH,
  canvasHeight = SCREEN_HEIGHT * 0.6,
  strokeColor = '#1F2937',
  strokeWidth = 8,
  showFeedback = true,
}: TracingCanvasProps) {
  // State
  const [touchPoints, setTouchPoints] = useState<TouchPoint[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<TouchPoint[]>([]);
  const [isTracing, setIsTracing] = useState(false);
  const [metrics, setMetrics] = useState<TracingMetrics>({
    accuracyScore: 0,
    deviationFromPath: 0,
    pathCoverage: 0,
    totalTime: 0,
    averageSpeed: 0,
    strokeCount: 0,
    averageStrokeLength: 0,
    isOnPath: false,
    currentDeviation: 0,
  });

  // Refs
  const sessionStartTime = useRef<number>(Date.now());
  const currentStrokeId = useRef<string>('');
  const currentStrokeStartTime = useRef<number>(0);
  const pathPoints = useRef<{ x: number; y: number }[]>([]);

  // Initialize path points
  React.useEffect(() => {
    pathPoints.current = getIdealPathPoints(
      letterConfig.letter,
      letterConfig.case,
      canvasWidth,
      canvasHeight
    );
  }, [letterConfig, canvasWidth, canvasHeight]);

  // Update metrics
  const updateMetrics = useCallback(() => {
    const newMetrics = calculateRealTimeMetrics(
      touchPoints,
      strokes,
      pathPoints.current,
      sessionStartTime.current
    );

    setMetrics(newMetrics);

    if (onMetricsUpdate) {
      onMetricsUpdate(newMetrics);
    }

    // Check if tracing is complete
    if (newMetrics.pathCoverage >= 80 && strokes.length > 0) {
      if (onComplete) {
        onComplete(newMetrics, strokes);
      }
    }
  }, [touchPoints, strokes, onMetricsUpdate, onComplete]);

  // Create pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        // Start new stroke
        setIsTracing(true);
        currentStrokeId.current = `stroke_${Date.now()}`;
        currentStrokeStartTime.current = Date.now();

        const point: TouchPoint = {
          x: gestureState.x0,
          y: gestureState.y0,
          timestamp: Date.now(),
          pressure: Platform.OS === 'ios' ? (evt.nativeEvent as any).force : undefined,
        };

        setCurrentStroke([point]);
        setTouchPoints(prev => [...prev, point]);
      },

      onPanResponderMove: (evt, gestureState) => {
        // Add point to current stroke
        const point: TouchPoint = {
          x: gestureState.moveX,
          y: gestureState.moveY,
          timestamp: Date.now(),
          pressure: Platform.OS === 'ios' ? (evt.nativeEvent as any).force : undefined,
        };

        setCurrentStroke(prev => [...prev, point]);
        setTouchPoints(prev => [...prev, point]);

        // Update metrics in real-time (throttled)
        if (touchPoints.length % 5 === 0) {
          updateMetrics();
        }
      },

      onPanResponderRelease: () => {
        // End current stroke
        setIsTracing(false);

        if (currentStroke.length > 0) {
          const stroke: Stroke = {
            id: currentStrokeId.current,
            points: currentStroke,
            startTime: currentStrokeStartTime.current,
            endTime: Date.now(),
            duration: Date.now() - currentStrokeStartTime.current,
          };

          setStrokes(prev => [...prev, stroke]);
          setCurrentStroke([]);

          // Update metrics after stroke ends
          setTimeout(updateMetrics, 100);
        }
      },
    })
  ).current;

  // Convert touch points to SVG path
  const touchPathData = React.useMemo(() => {
    if (touchPoints.length === 0) return '';

    let path = `M ${touchPoints[0].x} ${touchPoints[0].y}`;

    for (let i = 1; i < touchPoints.length; i++) {
      path += ` L ${touchPoints[i].x} ${touchPoints[i].y}`;
    }

    return path;
  }, [touchPoints]);

  // Current stroke path
  const currentStrokePathData = React.useMemo(() => {
    if (currentStroke.length === 0) return '';

    let path = `M ${currentStroke[0].x} ${currentStroke[0].y}`;

    for (let i = 1; i < currentStroke.length; i++) {
      path += ` L ${currentStroke[i].x} ${currentStroke[i].y}`;
    }

    return path;
  }, [currentStroke]);

  // Determine stroke color based on accuracy
  const getStrokeColor = () => {
    if (!isTracing) return strokeColor;
    return metrics.isOnPath ? '#10B981' : '#EF4444';
  };

  return (
    <View style={[styles.container, { width: canvasWidth, height: canvasHeight }]}>
      {/* Letter guide path */}
      <LetterPath
        config={letterConfig}
        width={canvasWidth}
        height={canvasHeight}
        showGuide={showGuide}
      />

      {/* Tracing canvas */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Svg width={canvasWidth} height={canvasHeight}>
          {/* Completed strokes */}
          {touchPathData && (
            <Path
              d={touchPathData}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )}

          {/* Current stroke with dynamic color */}
          {currentStrokePathData && (
            <Path
              d={currentStrokePathData}
              stroke={getStrokeColor()}
              strokeWidth={strokeWidth + 2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>

      {/* Real-time feedback */}
      {showFeedback && (
        <TracingFeedback metrics={metrics} isTracing={isTracing} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  canvasContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
