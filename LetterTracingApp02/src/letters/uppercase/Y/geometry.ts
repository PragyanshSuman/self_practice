// src/letters/uppercase/Y/geometry.ts
// Capital letter Y with two diagonal strokes meeting at center and vertical stem

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Simple, clean letter Y that will scale perfectly
// Two diagonals meeting at center, plus vertical line down
export const RAW_PATHS = {
  // STROKE 1: Left diagonal - Top-left to center
  leftDiagonal: 'M 20,10 L 50,50',
  
  // STROKE 2: Right diagonal - Top-right to center
  rightDiagonal: 'M 80,10 L 50,50',
  
  // STROKE 3: Vertical stem - Center down to bottom
  verticalStem: 'M 50,50 L 50,90',
};

// Stroke order for letter Y
export const STROKE_ORDER = [
  {
    name: 'Left Diagonal',
    path: RAW_PATHS.leftDiagonal,
    description: 'Trace from top-left downward to the center'
  },
  {
    name: 'Right Diagonal',
    path: RAW_PATHS.rightDiagonal,
    description: 'Trace from top-right downward to the center'
  },
  {
    name: 'Vertical Stem',
    path: RAW_PATHS.verticalStem,
    description: 'Trace straight down from center to bottom'
  },
];
