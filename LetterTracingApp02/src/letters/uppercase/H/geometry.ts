// src/letters/uppercase/H/geometry.ts
// Capital letter H — PERFECT STRAIGHT-LINE GEOMETRY, TRACE-READY

export const SVG_VIEWBOX = {
  width: 210,
  height: 297,
};

/**
 * Letter grid:
 * - Left vertical   : x = 40
 * - Right vertical  : x = 170
 * - Middle bar Y    : y = 150
 * - Cap height      : y = 40
 * - Baseline        : y = 260
 */

export const RAW_PATHS = {
  /**
   * STROKE 1 — Left Vertical
   * Top → Bottom
   */
  leftVertical: 'M 40 40 L 40 260',

  /**
   * STROKE 2 — Right Vertical
   * Top → Bottom
   */
  rightVertical: 'M 170 40 L 170 260',

  /**
   * STROKE 3 — Middle Horizontal Bar
   * Left → Right
   * Must connect EXACTLY to both verticals
   */
  middleBar: 'M 40 150 L 170 150',
};

export const STROKE_ORDER = [
  {
    name: 'Left Vertical',
    path: RAW_PATHS.leftVertical,
    description: 'Trace the left vertical line from top to bottom',
  },
  {
    name: 'Right Vertical',
    path: RAW_PATHS.rightVertical,
    description: 'Trace the right vertical line from top to bottom',
  },
  {
    name: 'Middle Bar',
    path: RAW_PATHS.middleBar,
    description: 'Trace the horizontal line from left to right',
  },
];
