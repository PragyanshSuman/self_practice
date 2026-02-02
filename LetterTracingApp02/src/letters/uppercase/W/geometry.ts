// src/letters/uppercase/M/geometry.ts
// Capital letter M — CORRECTED ORIENTATION & STROKE FLOW

export const SVG_VIEWBOX = {
  width: 210,
  height: 297,
};

/**
 * Letter grid:
 * - Left stroke   : x = 40
 * - Right stroke  : x = 170
 * - Middle peak   : x = 105
 * - Cap height    : y = 40
 * - Baseline      : y = 260
 */

export const RAW_PATHS = {
  /**
   * STROKE 1 — Left Vertical
   * Top → Bottom
   */
  leftVertical: 'M 15 40 L 40 260',

  /**
   * STROKE 2 — Diagonal Up
   * Bottom-left → Top-middle
   */
  diagonalUp: 'M 40 260 L 105 120',

  /**
   * STROKE 3 — Diagonal Down
   * Top-middle → Bottom-right
   */
  diagonalDown: 'M 105 120 L 170 260',

  /**
   * STROKE 4 — Right Vertical
   * Bottom → Top
   */
  rightVertical: 'M 170 260 L 195 40',
};

export const STROKE_ORDER = [
  {
    name: 'Left Vertical',
    path: RAW_PATHS.leftVertical,
    description: 'Trace the left vertical line from top to bottom',
  },
  {
    name: 'Diagonal Up',
    path: RAW_PATHS.diagonalUp,
    description: 'Trace the diagonal up to the top middle',
  },
  {
    name: 'Diagonal Down',
    path: RAW_PATHS.diagonalDown,
    description: 'Trace the diagonal down to the bottom right',
  },
  {
    name: 'Right Vertical',
    path: RAW_PATHS.rightVertical,
    description: 'Trace the right vertical line from bottom to top',
  },
];
