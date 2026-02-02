// src/letters/uppercase/P/geometry.ts
// Capital letter P — vertical stem + single arc

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

export const RAW_PATHS = {
  /**
   * STROKE 1 — Vertical stem
   * Starts at top-left
   * Goes down to bottom-left
   */
  verticalStem: 'M 30,20 L 30,80',

  /**
   * STROKE 2 — Arc (belly of P)
   * Starts at top of stem (30,20)
   * Curves around
   * Ends at center of stem (30,50)
   */
  arcBelly: 'M 30,20 C 75,20 70,50 30,50',
};

export const STROKE_ORDER = [
  {
    name: 'Vertical Stem',
    path: RAW_PATHS.verticalStem,
    description: 'Draw the main vertical line of P',
  },
  {
    name: 'Arc Belly',
    path: RAW_PATHS.arcBelly,
    description: 'Draw the smooth upper arc of P from top to center',
  },
];
