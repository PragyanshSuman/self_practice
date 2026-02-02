// src/letters/uppercase/M/geometry.ts
// Capital letter M — corrected stroke naming (geometry unchanged)

export const SVG_VIEWBOX = {
  width: 210,
  height: 297,
};

/**
 * Letter grid:
 * - Left stem     : x = 40
 * - Right stem    : x = 170
 * - Middle valley : x = 105
 * - Cap height    : y = 40
 * - Baseline      : y = 260
 */

export const RAW_PATHS = {
  /**
   * STROKE 1 — Left Stem
   * Top → Bottom
   */
  leftStem: 'M 30 40 L 30 260',

  /**
   * STROKE 2 — Left Diagonal (Downward Inward)
   * Top-left → Bottom-middle
   */
  leftDiagonal: 'M 30 40 L 105 210',

  /**
   * STROKE 3 — Right Diagonal (Upward Outward)
   * Bottom-middle → Top-right
   */
  rightDiagonal: 'M 105 210 L 180 40',

  /**
   * STROKE 4 — Right Stem
   * Bottom → Top
   */
  rightStem: 'M 180 260 L 180 40',
};

export const STROKE_ORDER = [
  {
    name: 'Left Stem',
    path: RAW_PATHS.leftStem,
    description: 'Trace the left vertical stem from top to bottom',
  },
  {
    name: 'Left Diagonal',
    path: RAW_PATHS.leftDiagonal,
    description: 'Trace the diagonal from top-left down to the center valley',
  },
  {
    name: 'Right Diagonal',
    path: RAW_PATHS.rightDiagonal,
    description: 'Trace the diagonal from the center valley up to the top-right',
  },
  {
    name: 'Right Stem',
    path: RAW_PATHS.rightStem,
    description: 'Trace the right vertical stem from bottom to top',
  },
];
