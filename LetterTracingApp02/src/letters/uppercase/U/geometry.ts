// src/letters/uppercase/U/geometry.ts
// Capital letter U — single stroke (left stem → bottom curve → right stem)

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

export const RAW_PATHS = {
  /**
   * STROKE — Single continuous U
   */
  uStroke: `
    M 30,20
    L 30,65
    C 30,85 70,85 70,65
    L 70,20
  `,
};

export const STROKE_ORDER = [
  {
    name: 'U Stroke',
    path: RAW_PATHS.uStroke.trim(),
    description: 'Draw U as one continuous stroke: down, curve, up',
  },
];
