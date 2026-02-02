// src/letters/uppercase/C/geometry.ts
// Capital letter C - single curved arc stroke

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

// Letter C path - ONE OPEN ARC (C-shape)
// Based on the SVG: d="m 33.925112,14.813259 c -10.430436,-2.784165 -17.33153,2.108378 -16.96315,12.321683 0.469592,13.019386 8.480935,15.313609 16.796643,9.680827"
export const RAW_PATHS = {
  // C-shaped arc: starts from top-right, curves left and down, ends at bottom-right
  // This is an OPEN path (C-curve, doesn't close into a circle)
  cArc: 'M 70,20 C 50,15 30,25 30,50 C 30,75 50,85 70,80',
};

// Stroke order for letter C (just ONE stroke!)
export const STROKE_ORDER = [
  { 
    name: 'C Arc', 
    path: RAW_PATHS.cArc, 
    description: 'Trace the C curve from top to bottom' 
  },
];
