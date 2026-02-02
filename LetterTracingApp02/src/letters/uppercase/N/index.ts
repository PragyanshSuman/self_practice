// src/letters/uppercase/N/index.ts

import type { LetterBuild, LetterTheme, BoundingBox } from '../../types';
import { scaleMultiplePathsToBox, pointsToPathD } from '../../utils/pathParser';
import { SVG_VIEWBOX, STROKE_ORDER } from './geometry';

export const build: LetterBuild = (box: BoundingBox) => {
  // Scale all strokes together to maintain relative positions
  const scaledPaths = scaleMultiplePathsToBox(
    STROKE_ORDER.map(stroke => ({ path: stroke.path, numPoints: 600 })), // Increased for smooth tracing
    box,
    30  // padding
  );

  // Build segments with scaled points
  const segments = STROKE_ORDER.map((stroke, index) => {
    const points = scaledPaths[index];

    // Define lag distance (points behind the real end)
    const lagDistance = 15; // Adjust for more/less lag

    return {
      name: stroke.name,
      description: stroke.description,
      d: pointsToPathD(points),
      pts: points,
      start: points[0] || { x: 0, y: 0, angle: 0 },
      end: points[points.length - 1] || { x: 0, y: 0, angle: 0 },
      // New property for animation lag
      lagPts: points.slice(0, points.length - lagDistance),
    };
  });

  return { segments };
};

export const theme: LetterTheme = {
  id: 'N',
  background: require('../../../../assets/images/background.png'),
  avatar: {
    idle: require('../../../../assets/images/tiger-waving.png'),
    happy: require('../../../../assets/images/tiger-happy.png'),
    surprised: require('../../../../assets/images/tiger-surprised.png'),
  },
  colors: {
    pathGradientStart: '#6366F1',  // Indigo for N
    pathGradientEnd: '#818CF8',    // Light Indigo
    guideDot: '#E0E7FF',           // Very Light Indigo
  },
  bee: {
    speedMsPerPoint: 1,
    pauseAtEndMs: 400,
  },
};
