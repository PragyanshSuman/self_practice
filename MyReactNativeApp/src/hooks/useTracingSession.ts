import { useState, useRef, useCallback } from 'react';
import { LetterPath, Point, ValidationResult } from '@models/TracingData';
import { SessionFeatureSummary } from '@models/TracingData';
import { ShadowFeatureExtractor } from '@services/ShadowFeatureExtractor';
import { StrokeValidator } from '@services/StrokeValidator';
import StorageService from '@services/StorageService';
import { generateIdealPath } from '@utils/GeometryUtils';

interface UseTracingSessionProps {
  letterPath: LetterPath;
  userId: string;
  userDemographics: any;
}

export const useTracingSession = ({
  letterPath,
  userId,
  userDemographics,
}: UseTracingSessionProps) => {
  const [isActive, setIsActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [activeStrokeIndex, setActiveStrokeIndex] = useState(0);
  const [feedback, setFeedback] = useState<ValidationResult>({ isValid: true, feedbackType: 'none' });

  // Refs for engines
  const shadowEngineRef = useRef<ShadowFeatureExtractor>(new ShadowFeatureExtractor());
  const idealPathRef = useRef<any>(null); // Legacy prop, kept if needed by canvas but we use direct strokes now

  /**
   * Initialize session
   */
  const initializeSession = useCallback(() => {
    shadowEngineRef.current.startSession();

    // Generate ideal path for Canvas rendering/validation logic
    const idealPath = generateIdealPath(letterPath.strokes, 30);
    idealPathRef.current = idealPath;

    setSessionStarted(true);
    setActiveStrokeIndex(0);
    setFeedback({ isValid: true, feedbackType: 'none' });
  }, [letterPath]);

  /**
   * Start tracing
   */
  const startTracing = useCallback(() => {
    if (!sessionStarted) {
      initializeSession();
    }
    setIsActive(true);
  }, [sessionStarted, initializeSession]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((x: number, y: number, pressure: number) => {
    if (!isActive) return;

    const point: Point = { x, y };

    // 1. Shadow Engine (Background)
    shadowEngineRef.current.addPoint({
      x, y,
      timestamp: Date.now(),
      pressure
    });

    // 2. Stroke Validator (UI Critical)
    const currentStroke = letterPath.strokes[activeStrokeIndex];
    if (currentStroke) {
      const validation = StrokeValidator.validatePoint(point, currentStroke);
      setFeedback(validation);

      // If totally off track, maybe snap back? Implementation depends on Canvas
    }
  }, [isActive, activeStrokeIndex, letterPath]);

  /**
   * Advance to next stroke
   */
  const advanceStroke = useCallback(() => {
    // Notify shadow engine stroke is done
    shadowEngineRef.current.endStroke(activeStrokeIndex);

    setActiveStrokeIndex(prev => prev + 1);
    setFeedback({ isValid: true, feedbackType: 'none' });
  }, [activeStrokeIndex]);

  /**
   * Handle audio playback (Tracked as feature?)
   */
  const handleAudioPlay = useCallback(() => {
    // shadowEngineRef.current.logEvent('audio_play'); // If we had event logging
  }, []);

  /**
   * End session and calculate analytics
   */
  const endSession = useCallback(async (
    completionStatus: 'completed' | 'abandoned' | 'timed_out'
  ) => {
    setIsActive(false);

    // Finalize last stroke if needed
    if (completionStatus === 'completed') {
      shadowEngineRef.current.endStroke(activeStrokeIndex);
    }

    const report = shadowEngineRef.current.generateSessionSummary(
      `session_${Date.now()}`,
      letterPath.letter,
      {
        inputType: 'finger',
        screenSize: 'medium' // placeholder
      }
    );

    // Save to storage
    try {
      if (completionStatus === 'completed') {
        await StorageService.saveAnalytics(report);
      }
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }

    return report;
  }, [activeStrokeIndex, letterPath]);

  /**
   * Reset session
   */
  const resetSession = useCallback(() => {
    setIsActive(false);
    setSessionStarted(false);
    setActiveStrokeIndex(0);
    setFeedback({ isValid: true, feedbackType: 'none' });
  }, []);

  return {
    isActive,
    sessionStarted,
    analytics: null, // Legacy prop compatibility
    idealPath: idealPathRef.current, // Legacy prop compatibility
    activeStrokeIndex,
    feedback, // NEW: Expose feedback state
    startTracing,
    handleTouchMove,
    advanceStroke,
    handleAudioPlay,
    endSession,
    resetSession,
    initializeSession,
  };
};

