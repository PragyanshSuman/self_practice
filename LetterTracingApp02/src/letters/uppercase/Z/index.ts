// src/letters/uppercase/Z/index.ts

import type { LetterBuild, LetterTheme, BoundingBox } from '../../types';
import { scaleMultiplePathsToBox, pointsToPathD } from '../../utils/pathParser';
import { SVG_VIEWBOX, STROKE_ORDER } from './geometry';

export const build: LetterBuild = (box: BoundingBox) => {
  // Scale all strokes together to maintain relative positions
  const scaledPaths = scaleMultiplePathsToBox(
    STROKE_ORDER.map(stroke => ({ path: stroke.path, numPoints: 250 })),
    box,
    30  // padding
  );

  // Build segments with scaled points
  const segments = STROKE_ORDER.map((stroke, index) => {
    const points = scaledPaths[index];
    
    return {
      name: stroke.name,
      description: stroke.description,
      d: pointsToPathD(points),
      pts: points,
      start: points[0] || { x: 0, y: 0, angle: 0 },
      end: points[points.length - 1] || { x: 0, y: 0, angle: 0 },
    };
  });

  return { segments };
};

export const theme: LetterTheme = {
  id: 'Z',
  background: require('../../../../assets/images/background.png'),
  avatar: {
    idle: require('../../../../assets/images/tiger-waving.png'),
    happy: require('../../../../assets/images/tiger-happy.png'),
    surprised: require('../../../../assets/images/tiger-surprised.png'),
  },
  colors: {
    pathGradientStart: '#D97706',  // Amber for Z
    pathGradientEnd: '#FCD34D',    // Light Amber
    guideDot: '#FEF3C7',           // Very Light Amber
  },
  bee: {
    speedMsPerPoint: 5,
    pauseAtEndMs: 300,
  },
};
