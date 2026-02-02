// src/letters/uppercase/R/geometry.ts
// Capital letter R — vertical stem + arc + shortened diagonal leg

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
   * Starts at top of stem
   * Curves around
   * Ends at center of stem
   */
  arcBelly: 'M 30,20 C 75,20 70,50 30,50',

  /**
   * STROKE 3 — Shortened diagonal leg
   * Starts at end of arc (center of stem)
   * Ends just below the apex of the belly
   */
  diagonalLeg: 'M 30,50 L 60,80',
};

export const STROKE_ORDER = [
  {
    name: 'Vertical Stem',
    path: RAW_PATHS.verticalStem,
    description: 'Draw the main vertical line of R',
  },
  {
    name: 'Arc Belly',
    path: RAW_PATHS.arcBelly,
    description: 'Draw the smooth upper arc of R',
  },
  {
    name: 'Diagonal Leg',
    path: RAW_PATHS.diagonalLeg,
    description: 'Draw the shortened diagonal leg from center of stem just below the apex of belly',
  },
];
