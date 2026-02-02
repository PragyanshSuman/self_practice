// src/letters/uppercase/S/geometry.ts
// Capital letter S — single continuous stroke

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

export const RAW_PATHS = {
  /**
   * STROKE — Single continuous S curve
   * Top arc + mirrored bottom arc
   */
  sStroke: `
    M 67,20
    C 20,13 25,50 50,50
    C 75,50 80,87 32,80
  `,
};

export const STROKE_ORDER = [
  {
    name: 'S Curve',
    path: RAW_PATHS.sStroke.trim(),
    description: 'Draw the entire S in one smooth continuous stroke',
  },
];
