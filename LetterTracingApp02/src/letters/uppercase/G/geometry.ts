// src/letters/uppercase/G/geometry.ts
// Capital letter G — built from C-arc + horizontal bar + vertical bar

export const SVG_VIEWBOX = {
  width: 100,
  height: 100,
};

export const RAW_PATHS = {
  /**
   * STROKE 1 — C-like arc (main body of G)
   * Starts at top-right
   * Ends at bottom-right (centered to meet vertical bar)
   */
  gArc: 'M 70,20 C 50,15 30,25 30,50 C 30,75 50,85 70,80',

  /**
   * STROKE 2 — Horizontal bar
   * Starts slightly inside the curve
   * Goes right to connect vertical bar
   */
  horizontalBar: 'M 50,55 L 70,55',

  /**
   * STROKE 3 — Vertical bar
   * Starts at the end of horizontal bar
   * Goes downward
   */
  verticalBar: 'M 70,55 L 70,80',
};

export const STROKE_ORDER = [
  {
    name: 'G Curve',
    path: RAW_PATHS.gArc,
    description: 'Trace the big curve like letter C',
  },
  {
    name: 'Horizontal Bar',
    path: RAW_PATHS.horizontalBar,
    description: 'Draw the line inside the G',
  },
  {
    name: 'Vertical Bar',
    path: RAW_PATHS.verticalBar,
    description: 'Draw the short line down to complete G',
  },
];
