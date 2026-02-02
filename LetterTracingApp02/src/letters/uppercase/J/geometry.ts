// src/letters/uppercase/J/geometry.ts
// Capital letter J with proper stroke order - EXACT paths from SVG

export const SVG_VIEWBOX = {
  width: 210,
  height: 297,
};

// Letter J paths - ONE STROKE extracted from traced-letter-j.svg
export const RAW_PATHS = {
  // STROKE 1: Vertical line that curves left at the bottom (hook shape)
  // Starts from top, goes down vertically, then curves to the left
  jCurve: 'm 30.650575,17.542206 c 1.232913,18.860465 1.0193,23.224119 -4.540608,24.252988 -3.11819,0.577025 -7.174712,-1.152139 -7.672036,-6.799782',
};

// Stroke order for letter J
export const STROKE_ORDER = [
  { 
    name: 'J Curve', 
    path: RAW_PATHS.jCurve, 
    description: 'Trace the line from top down, curving left at the bottom' 
  },
];
