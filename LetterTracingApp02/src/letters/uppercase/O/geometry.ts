// src/letters/uppercase/O/geometry.ts
// Capital letter O — horizontally compressed perfect oval

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

export const RAW_PATHS = {
  /**
   * STROKE 1 — Compressed oval
   * Starts at top-center (50,20)
   * Four cubic Bezier curves for a symmetric oval compressed horizontally
   */
  outerOval: `
    M 50,20
    C 67.07,20 75,30.886 75,50
    C 75,69.114 67.07,80 50,80
    C 32.93,80 25,69.114 25,50
    C 25,30.886 32.93,20 50,20
    Z
  `,
};

export const STROKE_ORDER = [
  {
    name: 'Outer Oval',
    path: RAW_PATHS.outerOval,
    description: 'Draw a mathematically perfect oval compressed from left and right sides, fully symmetric',
  },
];
