// src/letters/uppercase/Q/geometry.ts
// Capital letter Q — oval + small diagonal tail

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

export const RAW_PATHS = {
  /**
   * STROKE 1 — Perfectly compressed oval (same as O)
   */
  outerOval: `
    M 50,20
    C 67.07,20 75,30.886 75,50
    C 75,69.114 67.07,80 50,80
    C 32.93,80 25,69.114 25,50
    C 25,30.886 32.93,20 52,20
    Z
  `,

  /**
   * STROKE 2 — Diagonal tail
   * Starts near bottom-right of oval
   * Ends slightly outside for Q's tail
   */
  diagonalTail: 'M 60,70 L 75,85',
};

export const STROKE_ORDER = [
  {
    name: 'Outer Oval',
    path: RAW_PATHS.outerOval,
    description: 'Draw the main oval body of Q',
  },
  {
    name: 'Diagonal Tail',
    path: RAW_PATHS.diagonalTail,
    description: 'Draw the small diagonal line tail of Q',
  },
];
