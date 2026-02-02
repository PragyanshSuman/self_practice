// src/letters/uppercase/A/geometry.ts
// Hand-crafted Letter A with proper proportions

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Simple, clean letter A that will scale perfectly
// Forms a triangle with apex at top center and crossbar in middle
export const RAW_PATHS = {
  // LEFT STROKE: Bottom-left (20, 90) to Top center (50, 10)
  leftStroke: 'M 20,90 L 50,10',
  
  // RIGHT STROKE: Top center (50, 10) to Bottom-right (80, 90)
  rightStroke: 'M 50,10 L 80,90',
  
  // CROSSBAR: Left side (30, 60) to Right side (70, 60)
  crossbar: 'M 30,60 L 70,60',
};

// Stroke order
export const STROKE_ORDER = [
  { 
    name: 'Left Stroke', 
    path: RAW_PATHS.leftStroke, 
    description: 'Trace from bottom-left upward to the peak' 
  },
  { 
    name: 'Right Stroke', 
    path: RAW_PATHS.rightStroke, 
    description: 'Trace from the peak downward to bottom-right' 
  },
  { 
    name: 'Crossbar', 
    path: RAW_PATHS.crossbar, 
    description: 'Trace the horizontal line from left to right' 
  },
];
