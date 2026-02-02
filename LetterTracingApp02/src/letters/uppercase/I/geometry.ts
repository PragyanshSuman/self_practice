// src/letters/uppercase/I/geometry.ts
// Capital letter I — CENTERED in 100x100 viewBox

export const SVG_VIEWBOX = {
  width: 210,
  height: 297,
};

/**
 * Letter grid:
 * - Center X     : x = 50
 * - Cap height   : y = 10
 * - Baseline     : y = 90
 */

export const RAW_PATHS = {
  /**
   * STROKE 1 — Vertical Stroke
   * Top → Bottom
   */
  vertical: 'M 207 90 L 207 370',
};

export const STROKE_ORDER = [
  {
    name: 'Vertical Stroke',
    path: RAW_PATHS.vertical,
    description: 'Trace the straight line from top to bottom',
  },
];
