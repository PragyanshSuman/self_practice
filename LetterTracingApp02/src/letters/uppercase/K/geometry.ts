// src/letters/uppercase/K/geometry.ts
// Capital letter K — GEOMETRICALLY PERFECT, CONNECTED, TRACE-READY

export const SVG_VIEWBOX = {
  width: 210,
  height: 297,
};

/**
 * Letter grid:
 * - Cap height : y = 40
 * - Baseline   : y = 260
 * - Midline    : y = 150
 * - Left spine : x = 40
 * - Right arm  : x = 170
 */

export const RAW_PATHS = {
  /**
   * STROKE 1 — Vertical Spine
   * Top → Bottom
   */
  verticalSpine: 'M 40 40 L 40 260',

  /**
   * STROKE 2 — Upper Diagonal
   * Middle-left → Top-right
   * MUST start exactly on the spine midpoint
   */
  upperDiagonal: 'M 40 150 L 170 40',

  /**
   * STROKE 3 — Lower Diagonal
   * Middle-left → Bottom-right
   * MUST start exactly on the same midpoint
   */
  lowerDiagonal: 'M 40 150 L 170 260',
};

export const STROKE_ORDER = [
  {
    name: 'Vertical Spine',
    path: RAW_PATHS.verticalSpine,
    description: 'Trace the vertical line from top to bottom',
  },
  {
    name: 'Upper Diagonal',
    path: RAW_PATHS.upperDiagonal,
    description: 'Trace the diagonal line from the middle up to the right',
  },
  {
    name: 'Lower Diagonal',
    path: RAW_PATHS.lowerDiagonal,
    description: 'Trace the diagonal line from the middle down to the right',
  },
];
