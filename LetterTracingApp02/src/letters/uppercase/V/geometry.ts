// src/letters/uppercase/V/geometry.ts
// Capital letter V with two diagonal strokes forming a V shape

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Letter V - two diagonal strokes that meet at the bottom center
export const RAW_PATHS = {
  // STROKE 1: Left diagonal - Top-left down to bottom center
  leftDiagonal: 'M 20,10 L 50,90',
  
  // STROKE 2: Right diagonal - Top-right down to bottom center  
  rightDiagonal: 'M 80,10 L 50,90',
};

// Stroke order for letter V
export const STROKE_ORDER = [
  {
    name: 'Left Diagonal',
    path: RAW_PATHS.leftDiagonal,
    description: 'Trace from top-left diagonally down to the bottom center'
  },
  {
    name: 'Right Diagonal',
    path: RAW_PATHS.rightDiagonal,
    description: 'Trace from top-right diagonally down to meet at the bottom center'
  },
];
