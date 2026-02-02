// src/letters/uppercase/T/geometry.ts
// Capital letter T with horizontal top stroke and vertical stem

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Letter T - Horizontal stroke across top, then vertical stroke down the center
export const RAW_PATHS = {
  // STROKE 1: Horizontal top - Left to right across the top
  horizontalTop: 'M 15,15 L 85,15',
  
  // STROKE 2: Vertical stem - Down the center from top to bottom
  verticalStem: 'M 50,15 L 50,90',
};

// Stroke order for letter T
export const STROKE_ORDER = [
  {
    name: 'Horizontal Top',
    path: RAW_PATHS.horizontalTop,
    description: 'Trace from left to right across the top'
  },
  {
    name: 'Vertical Stem',
    path: RAW_PATHS.verticalStem,
    description: 'Trace down the center from top to bottom'
  },
];
