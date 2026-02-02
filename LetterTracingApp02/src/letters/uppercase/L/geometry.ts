// src/letters/uppercase/L/geometry.ts
// Capital letter L — PERFECT STRAIGHT-LINE GEOMETRY

export const SVG_VIEWBOX = {
  width: 210,
  height: 297,
};

/**
 * Letter grid:
 * - Left margin  : x = 40
 * - Right margin : x = 170
 * - Cap height   : y = 40
 * - Baseline     : y = 260
 */

export const RAW_PATHS = {
  /**
   * STROKE 1 — Vertical Stroke
   * Top → Bottom
   */
  vertical: 'M 40 40 L 40 260',

  /**
   * STROKE 2 — Horizontal Base
   * Left → Right
   * Starts EXACTLY at the bottom of the vertical stroke
   */
  horizontal: 'M 40 260 L 170 260',
};

export const STROKE_ORDER = [
  {
    name: 'Vertical Stroke',
    path: RAW_PATHS.vertical,
    description: 'Trace the vertical line from top to bottom',
  },
  {
    name: 'Horizontal Base',
    path: RAW_PATHS.horizontal,
    description: 'Trace the horizontal line from left to right',
  },
];
