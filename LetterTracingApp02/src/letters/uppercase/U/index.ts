// src/letters/uppercase/U/index.ts

import type { LetterBuild, LetterTheme, BoundingBox } from '../../types';
import { scaleMultiplePathsToBox, pointsToPathD } from '../../utils/pathParser';
import { SVG_VIEWBOX, STROKE_ORDER } from './geometry';

export const build: LetterBuild = (box: BoundingBox) => {
  // Scale the U-curve stroke to the bounding box
  const scaledPaths = scaleMultiplePathsToBox(
    STROKE_ORDER.map(stroke => ({ path: stroke.path, numPoints: 300 })),
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
  id: 'U',
  background: require('../../../../assets/images/background.png'),
  avatar: {
    idle: require('../../../../assets/images/tiger-waving.png'),
    happy: require('../../../../assets/images/tiger-happy.png'),
    surprised: require('../../../../assets/images/tiger-surprised.png'),
  },
  colors: {
    pathGradientStart: '#9333EA',  // Purple for U
    pathGradientEnd: '#D8B4FE',    // Light Purple
    guideDot: '#F3E8FF',           // Very Light Purple
  },
  bee: {
    speedMsPerPoint: 5,
    pauseAtEndMs: 400,
  },
};
