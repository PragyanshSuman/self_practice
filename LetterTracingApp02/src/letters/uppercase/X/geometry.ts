// src/letters/uppercase/X/geometry.ts
// Capital letter X with two diagonal strokes that cross in the middle

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Simple, clean letter X that will scale perfectly
// Two diagonal lines crossing at the center
export const RAW_PATHS = {
  // STROKE 1: Top-left to bottom-right diagonal (main stroke)
  leftToRightDiagonal: 'M 20,10 L 80,90',
  
  // STROKE 2: Top-right to bottom-left diagonal (crossing stroke)
  rightToLeftDiagonal: 'M 80,10 L 20,90',
};

// Stroke order for letter X
export const STROKE_ORDER = [
  {
    name: 'Left-to-Right Diagonal',
    path: RAW_PATHS.leftToRightDiagonal,
    description: 'Trace from top-left downward to bottom-right'
  },
  {
    name: 'Right-to-Left Diagonal',
    path: RAW_PATHS.rightToLeftDiagonal,
    description: 'Trace from top-right downward to bottom-left'
  },
];
