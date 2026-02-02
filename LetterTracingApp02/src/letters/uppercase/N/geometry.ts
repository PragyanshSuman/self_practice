// src/letters/uppercase/N/geometry.ts
// Capital letter N — GEOMETRICALLY CORRECT (TOP-LEFT → BOTTOM-RIGHT DIAGONAL)

export const SVG_VIEWBOX = {
  width: 210,
  height: 297,
};

/**
 * Letter grid:
 * - Cap height : y = 40
 * - Baseline   : y = 260
 * - Left stem  : x = 40
 * - Right stem : x = 170
 */

export const RAW_PATHS = {
  /**
   * STROKE 1 — Left Vertical
   * Top → Bottom
   */
  leftVertical: 'M 40 40 L 40 260',

  /**
   * STROKE 2 — Diagonal
   * Top-left → Bottom-right
   * MUST connect left top to right bottom
   */
  diagonal: 'M 40 40 L 170 260',

  /**
   * STROKE 3 — Right Vertical
   * Top → Bottom
   */
  rightVertical: 'M 170 40 L 170 260',
};

export const STROKE_ORDER = [
  {
    name: 'Left Vertical',
    path: RAW_PATHS.leftVertical,
    description: 'Trace the left vertical line from top to bottom',
  },
  {
    name: 'Diagonal',
    path: RAW_PATHS.diagonal,
    description: 'Trace the diagonal line from top-left to bottom-right',
  },
  {
    name: 'Right Vertical',
    path: RAW_PATHS.rightVertical,
    description: 'Trace the right vertical line from top to bottom',
  },
];
