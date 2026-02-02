// src/letters/uppercase/Z/geometry.ts
// Capital letter Z with top horizontal, diagonal, and bottom horizontal

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Simple, clean letter Z that will scale perfectly
// Top line, diagonal, bottom line
export const RAW_PATHS = {
  // STROKE 1: Top horizontal line - Left to right
  topHorizontal: 'M 20,10 L 80,10',
  
  // STROKE 2: Diagonal - Top-right to bottom-left
  diagonal: 'M 80,10 L 20,90',
  
  // STROKE 3: Bottom horizontal line - Left to right
  bottomHorizontal: 'M 20,90 L 80,90',
};

// Stroke order for letter Z
export const STROKE_ORDER = [
  {
    name: 'Top Horizontal',
    path: RAW_PATHS.topHorizontal,
    description: 'Trace the top line from left to right'
  },
  {
    name: 'Diagonal',
    path: RAW_PATHS.diagonal,
    description: 'Trace diagonally from top-right down to bottom-left'
  },
  {
    name: 'Bottom Horizontal',
    path: RAW_PATHS.bottomHorizontal,
    description: 'Trace the bottom line from left to right'
  },
];
