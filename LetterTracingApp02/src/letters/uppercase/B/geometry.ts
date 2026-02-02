// src/letters/uppercase/B/geometry.ts
// Capital letter B — vertical stem + upper arc + lower arc (refined proportions)

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

export const RAW_PATHS = {
  /**
   * STROKE 1 — Vertical stem
   * Drawn bottom to top
   */
  verticalStem: 'M 30,80 L 30,20',

  /**
   * STROKE 2 — Upper arc (tighter belly)
   * Starts at top of stem
   * Ends at middle of stem
   */
  upperArcBelly: 'M 30,20 C 72,20 68,50 30,50',

  /**
   * STROKE 3 — Lower arc (slightly larger belly)
   * Starts at middle of stem
   * Ends at bottom of stem
   */
  lowerArcBelly: 'M 30,50 C 78,50 72,80 30,80',
};

export const STROKE_ORDER = [
  {
    name: 'Vertical Stem',
    path: RAW_PATHS.verticalStem,
    description: 'Draw the main vertical line of B',
  },
  {
    name: 'Upper Belly',
    path: RAW_PATHS.upperArcBelly,
    description: 'Draw the tighter upper arc of B',
  },
  {
    name: 'Lower Belly',
    path: RAW_PATHS.lowerArcBelly,
    description: 'Draw the larger lower arc of B',
  },
];
