// src/letters/uppercase/E/geometry.ts
// Capital letter E with proper stroke order

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Letter E paths - FOUR STROKES (vertical spine + 3 horizontal lines)
export const RAW_PATHS = {
  // VERTICAL SPINE: Straight line from top to bottom (left edge)
  verticalSpine: 'M 20,10 L 20,90',
  
  // TOP BAR: Horizontal line from top of spine extending right
  topBar: 'M 20,10 L 70,10',
  
  // MIDDLE BAR: Horizontal line from middle of spine extending right
  middleBar: 'M 20,50 L 60,50',
  
  // BOTTOM BAR: Horizontal line from bottom of spine extending right
  bottomBar: 'M 20,90 L 70,90',
};

// Stroke order for letter E
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
  { 
    name: 'Bottom Bar', 
    path: RAW_PATHS.bottomBar, 
    description: 'Trace the bottom horizontal line from left to right' 
  },
];
