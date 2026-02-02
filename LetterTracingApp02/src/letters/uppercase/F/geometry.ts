// src/letters/uppercase/F/geometry.ts
// Capital letter F with proper stroke order

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Letter F paths - THREE STROKES (vertical spine + 2 horizontal lines)
export const RAW_PATHS = {
  // VERTICAL SPINE: Straight line from top to bottom (left edge)
  verticalSpine: 'M 20,10 L 20,90',
  
  // TOP BAR: Horizontal line from top of spine extending right
  topBar: 'M 20,10 L 70,10',
  
  // MIDDLE BAR: Horizontal line from middle of spine extending right (shorter)
  middleBar: 'M 20,50 L 60,50',
};

// Stroke order for letter F
export const STROKE_ORDER = [
  { 
    name: 'Vertical Spine', 
    path: RAW_PATHS.verticalSpine, 
    description: 'Trace the straight line from top to bottom' 
  },
  { 
    name: 'Top Bar', 
    path: RAW_PATHS.topBar, 
    description: 'Trace the top horizontal line from left to right' 
  },
  { 
    name: 'Middle Bar', 
    path: RAW_PATHS.middleBar, 
    description: 'Trace the middle horizontal line from left to right' 
  },
];
