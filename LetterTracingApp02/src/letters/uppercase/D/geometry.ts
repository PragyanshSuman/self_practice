// src/letters/uppercase/D/geometry.ts
// Capital letter D with proper stroke order

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Letter D paths - TWO STROKES (vertical spine + curved bump)
export const RAW_PATHS = {
  // VERTICAL SPINE: Straight line from top to bottom (left edge)
  verticalSpine: 'M 20,10 L 20,90',
  
  // D-CURVE: Starts at top of spine, curves right like a D, ends at bottom of spine
  // This creates the curved part of the D
  dCurve: 'M 20,10 C 65,10 70,25 70,50 C 70,75 65,90 20,90',
};

// Stroke order for letter D
export const STROKE_ORDER = [
  { 
    name: 'Vertical Spine', 
    path: RAW_PATHS.verticalSpine, 
    description: 'Trace the straight line from top to bottom' 
  },
  { 
    name: 'D Curve', 
    path: RAW_PATHS.dCurve, 
    description: 'Trace the curved D shape from top to bottom' 
  },
];
