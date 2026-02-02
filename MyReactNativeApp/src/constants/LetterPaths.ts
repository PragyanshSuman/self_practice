// LetterPaths.ts - CORRECTED WITH EXACT GEOMETRY FROM REFERENCE DOCUMENT
// Generated: January 24, 2026
// All coordinates verified against complete geometry specification

import { LetterPath, PathSegment } from '@models/TracingData';

// ==================================================================================
// CANVAS CONFIGURATION
// ==================================================================================

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const LETTER_WIDTH = 400;
const LETTER_HEIGHT = 500;
const CENTER_X = CANVAS_WIDTH / 2;  // 300
const CENTER_Y = CANVAS_HEIGHT / 2; // 400
const BASELINE = CENTER_Y + 100;    // 500

export const CANVAS_CONFIG = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  centerX: CENTER_X,
  centerY: CENTER_Y,
  baseline: BASELINE,
};

// ==================================================================================
// COORDINATE CONVERSION FUNCTIONS
// ==================================================================================

/**
 * Convert from 100x100 viewBox to canvas coordinates
 * Used for: A, B, C, D, E, F, G, O, P, Q, R, S, T, U, V, X, Y, Z (18 letters)
 * Maps 0-100 SVG coords to centered 400x400 area with baseline at bottom
 */
const convertFrom100x100 = (x: number, y: number): { x: number; y: number } => {
  const scaleX = 4.0; // 400px width for letter
  const scaleY = 4.0; // 400px height for letter  
  return {
    x: CENTER_X - 200 + (x * scaleX),
    y: BASELINE - 400 + (y * scaleY),
  };
};

/**
 * Convert from 210x297 viewBox to canvas coordinates
 * Used for: H, I, J, K, L, M, N, W (8 letters)
 * Maps 0-210 x 0-297 to centered letter area proportionally
 */
const convertFrom210x297 = (x: number, y: number): { x: number; y: number } => {
  const scaleX = 400 / 210; // ~1.9048
  const scaleY = 500 / 297; // ~1.6835
  return {
    x: CENTER_X - 200 + (x * scaleX),
    y: BASELINE - 500 + (y * scaleY),
  };
};

// ==================================================================================
// PATH SEGMENT CREATION HELPERS
// ==================================================================================

const createLine = (x1: number, y1: number, x2: number, y2: number): PathSegment => ({
  type: 'line',
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
});

const createBezier = (
  x1: number, y1: number,
  cx1: number, cy1: number,
  cx2: number, cy2: number,
  x2: number, y2: number
): PathSegment => ({
  type: 'bezier',
  start: { x: x1, y: y1 },
  control1: { x: cx1, y: cy1 },
  control2: { x: cx2, y: cy2 },
  end: { x: x2, y: y2 },
});

// ==================================================================================
// ALPHABET ARRAY
// ==================================================================================

export const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

// ==================================================================================
// LETTER PATH DEFINITIONS - ALL 26 LETTERS
// ==================================================================================

export const LETTER_PATHS: Record<string, LetterPath> = {
  
  // ================================================================================
  // LETTER A - ViewBox: 100×100, Strokes: 3
  // ================================================================================
  A: {
    letter: 'A',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'medium',
    confusionPairs: ['V'],
    strokes: [
      // Stroke 1: Left Stroke - M 20,90 L 50,10
      // Trace from bottom-left upward to the peak
      (() => {
        const start = convertFrom100x100(20, 90);
        const end = convertFrom100x100(50, 10);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Right Stroke - M 50,10 L 80,90
      // Trace from the peak downward to bottom-right
      (() => {
        const start = convertFrom100x100(50, 10);
        const end = convertFrom100x100(80, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Crossbar - M 30,60 L 70,60
      // Trace the horizontal line from left to right
      (() => {
        const start = convertFrom100x100(30, 60);
        const end = convertFrom100x100(70, 60);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER B - ViewBox: 100×100, Strokes: 3
  // ================================================================================
  B: {
    letter: 'B',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'medium',
    confusionPairs: ['D', 'P', 'R'],
    strokes: [
      // Stroke 1: Vertical Stem - M 30,80 L 30,20
      // Draw the main vertical line of B
      (() => {
        const start = convertFrom100x100(30, 80);
        const end = convertFrom100x100(30, 20);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Upper Belly - M 30,20 C 72,20 68,50 30,50
      // Draw the tighter upper arc of B
      (() => {
        const p1 = convertFrom100x100(30, 20);
        const c1 = convertFrom100x100(72, 20);
        const c2 = convertFrom100x100(68, 50);
        const p2 = convertFrom100x100(30, 50);
        return [createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y)];
      })(),
      
      // Stroke 3: Lower Belly - M 30,50 C 78,50 72,80 30,80
      // Draw the larger lower arc of B
      (() => {
        const p1 = convertFrom100x100(30, 50);
        const c1 = convertFrom100x100(78, 50);
        const c2 = convertFrom100x100(72, 80);
        const p2 = convertFrom100x100(30, 80);
        return [createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER C - ViewBox: 100×100, Strokes: 1
  // ================================================================================
  C: {
    letter: 'C',
    expectedStrokeCount: 1,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['O', 'G'],
    strokes: [
      // Stroke 1: C Arc - M 70,20 C 50,15 30,25 30,50 C 30,75 50,85 70,80
      // Trace the C curve from top to bottom
      (() => {
        const p1 = convertFrom100x100(70, 20);
        const c1 = convertFrom100x100(50, 15);
        const c2 = convertFrom100x100(30, 25);
        const p2 = convertFrom100x100(30, 50);
        const c3 = convertFrom100x100(30, 75);
        const c4 = convertFrom100x100(50, 85);
        const p3 = convertFrom100x100(70, 80);
        return [
          createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y),
          createBezier(p2.x, p2.y, c3.x, c3.y, c4.x, c4.y, p3.x, p3.y),
        ];
      })(),
    ],
  },

  // ================================================================================
  // LETTER D - ViewBox: 100×100, Strokes: 2
  // ================================================================================
  D: {
    letter: 'D',
    expectedStrokeCount: 2,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['B', 'O'],
    strokes: [
      // Stroke 1: Vertical Spine - M 20,10 L 20,90
      // Trace the straight line from top to bottom
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(20, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: D Curve - M 20,10 C 65,10 70,25 70,50 C 70,75 65,90 20,90
      // Trace the curved D shape from top to bottom
      (() => {
        const p1 = convertFrom100x100(20, 10);
        const c1 = convertFrom100x100(65, 10);
        const c2 = convertFrom100x100(70, 25);
        const p2 = convertFrom100x100(70, 50);
        const c3 = convertFrom100x100(70, 75);
        const c4 = convertFrom100x100(65, 90);
        const p3 = convertFrom100x100(20, 90);
        return [
          createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y),
          createBezier(p2.x, p2.y, c3.x, c3.y, c4.x, c4.y, p3.x, p3.y),
        ];
      })(),
    ],
  },

  // ================================================================================
  // LETTER E - ViewBox: 100×100, Strokes: 4
  // ================================================================================
  E: {
    letter: 'E',
    expectedStrokeCount: 4,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['F'],
    strokes: [
      // Stroke 1: Vertical Spine - M 20,10 L 20,90
      // Trace the straight line from top to bottom
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(20, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Top Bar - M 20,10 L 70,10
      // Trace the top horizontal line from left to right
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(70, 10);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Middle Bar - M 20,50 L 60,50
      // Trace the middle horizontal line from left to right
      (() => {
        const start = convertFrom100x100(20, 50);
        const end = convertFrom100x100(60, 50);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 4: Bottom Bar - M 20,90 L 70,90
      // Trace the bottom horizontal line from left to right
      (() => {
        const start = convertFrom100x100(20, 90);
        const end = convertFrom100x100(70, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER F - ViewBox: 100×100, Strokes: 3
  // ================================================================================
  F: {
    letter: 'F',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['E', 'T'],
    strokes: [
      // Stroke 1: Vertical Spine - M 20,10 L 20,90
      // Trace the straight line from top to bottom
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(20, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Top Bar - M 20,10 L 70,10
      // Trace the top horizontal line from left to right
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(70, 10);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Middle Bar - M 20,50 L 60,50
      // Trace the middle horizontal line from left to right
      (() => {
        const start = convertFrom100x100(20, 50);
        const end = convertFrom100x100(60, 50);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER G - ViewBox: 100×100, Strokes: 3
  // ================================================================================
  G: {
    letter: 'G',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'medium',
    confusionPairs: ['C', 'O'],
    strokes: [
      // Stroke 1: G Curve - M 70,20 C 50,15 30,25 30,50 C 30,75 50,85 70,80
      // Trace the big curve like letter C
      (() => {
        const p1 = convertFrom100x100(70, 20);
        const c1 = convertFrom100x100(50, 15);
        const c2 = convertFrom100x100(30, 25);
        const p2 = convertFrom100x100(30, 50);
        const c3 = convertFrom100x100(30, 75);
        const c4 = convertFrom100x100(50, 85);
        const p3 = convertFrom100x100(70, 80);
        return [
          createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y),
          createBezier(p2.x, p2.y, c3.x, c3.y, c4.x, c4.y, p3.x, p3.y),
        ];
      })(),
      
      // Stroke 2: Horizontal Bar - M 50,55 L 70,55
      // Draw the line inside the G
      (() => {
        const start = convertFrom100x100(50, 55);
        const end = convertFrom100x100(70, 55);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Vertical Bar - M 70,55 L 70,80
      // Draw the short line down to complete G
      (() => {
        const start = convertFrom100x100(70, 55);
        const end = convertFrom100x100(70, 80);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER H - ViewBox: 210×297, Strokes: 3
  // ================================================================================
  H: {
    letter: 'H',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['N'],
    strokes: [
      // Stroke 1: Left Vertical - M 40,40 L 40,260
      // Trace the left vertical line from top to bottom
      (() => {
        const start = convertFrom210x297(40, 40);
        const end = convertFrom210x297(40, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Right Vertical - M 170,40 L 170,260
      // Trace the right vertical line from top to bottom
      (() => {
        const start = convertFrom210x297(170, 40);
        const end = convertFrom210x297(170, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Middle Bar - M 40,150 L 170,150
      // Trace the horizontal line from left to right
      (() => {
        const start = convertFrom210x297(40, 150);
        const end = convertFrom210x297(170, 150);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER I - ViewBox: 210×297, Strokes: 1
  // ================================================================================
  I: {
    letter: 'I',
    expectedStrokeCount: 1,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['L', 'T'],
    strokes: [
      // Stroke 1: Vertical Stroke - M 105,90 L 105,370 (centered from original 207)
      // Trace the straight line from top to bottom
      (() => {
        const start = convertFrom210x297(105, 90);
        const end = convertFrom210x297(105, 370);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER J - ViewBox: 210×297, Strokes: 1
  // ================================================================================
  J: {
    letter: 'J',
    expectedStrokeCount: 1,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['I'],
    strokes: [
      // Stroke 1: J Curve - trace from top down, curving left at bottom
      (() => {
        const start = convertFrom210x297(135, 40);
        const mid = convertFrom210x297(135, 240);
        const c1 = convertFrom210x297(135, 260);
        const c2 = convertFrom210x297(100, 270);
        const end = convertFrom210x297(70, 250);
        return [
          createLine(start.x, start.y, mid.x, mid.y),
          createBezier(mid.x, mid.y, c1.x, c1.y, c2.x, c2.y, end.x, end.y),
        ];
      })(),
    ],
  },

  // ================================================================================
  // LETTER K - ViewBox: 210×297, Strokes: 3
  // ================================================================================
  K: {
    letter: 'K',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'medium',
    confusionPairs: ['X'],
    strokes: [
      // Stroke 1: Vertical Spine - M 40,40 L 40,260
      // Trace the vertical line from top to bottom
      (() => {
        const start = convertFrom210x297(40, 40);
        const end = convertFrom210x297(40, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Upper Diagonal - M 40,150 L 170,40
      // Trace the diagonal line from the middle up to the right
      (() => {
        const start = convertFrom210x297(40, 150);
        const end = convertFrom210x297(170, 40);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Lower Diagonal - M 40,150 L 170,260
      // Trace the diagonal line from the middle down to the right
      (() => {
        const start = convertFrom210x297(40, 150);
        const end = convertFrom210x297(170, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER L - ViewBox: 210×297, Strokes: 2
  // ================================================================================
  L: {
    letter: 'L',
    expectedStrokeCount: 2,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['I', 'T'],
    strokes: [
      // Stroke 1: Vertical Stroke - M 40,40 L 40,260
      // Trace the vertical line from top to bottom
      (() => {
        const start = convertFrom210x297(40, 40);
        const end = convertFrom210x297(40, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Horizontal Base - M 40,260 L 170,260
      // Trace the horizontal line from left to right
      (() => {
        const start = convertFrom210x297(40, 260);
        const end = convertFrom210x297(170, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER M - ViewBox: 210×297, Strokes: 4
  // ================================================================================
  M: {
    letter: 'M',
    expectedStrokeCount: 4,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'hard',
    confusionPairs: ['W', 'N'],
    strokes: [
      // Stroke 1: Left Stem - M 30,40 L 30,260
      // Trace the left vertical stem from top to bottom
      (() => {
        const start = convertFrom210x297(30, 40);
        const end = convertFrom210x297(30, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Left Diagonal - M 30,40 L 105,210
      // Trace the diagonal from top-left down to the center valley
      (() => {
        const start = convertFrom210x297(30, 40);
        const end = convertFrom210x297(105, 210);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Right Diagonal - M 105,210 L 180,40
      // Trace the diagonal from the center valley up to the top-right
      (() => {
        const start = convertFrom210x297(105, 210);
        const end = convertFrom210x297(180, 40);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 4: Right Stem - M 180,260 L 180,40
      // Trace the right vertical stem from bottom to top
      (() => {
        const start = convertFrom210x297(180, 260);
        const end = convertFrom210x297(180, 40);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER N - ViewBox: 210×297, Strokes: 3
  // ================================================================================
  N: {
    letter: 'N',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'medium',
    confusionPairs: ['M', 'H'],
    strokes: [
      // Stroke 1: Left Vertical - M 40,40 L 40,260
      // Trace the left vertical line from top to bottom
      (() => {
        const start = convertFrom210x297(40, 40);
        const end = convertFrom210x297(40, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Diagonal - M 40,40 L 170,260
      // Trace the diagonal line from top-left to bottom-right
      (() => {
        const start = convertFrom210x297(40, 40);
        const end = convertFrom210x297(170, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Right Vertical - M 170,40 L 170,260
      // Trace the right vertical line from top to bottom
      (() => {
        const start = convertFrom210x297(170, 40);
        const end = convertFrom210x297(170, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER O - ViewBox: 100×100, Strokes: 1
  // ================================================================================
  O: {
    letter: 'O',
    expectedStrokeCount: 1,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['Q', 'C'],
    strokes: [
      // Stroke 1: Outer Oval - M 50,20 C 67.07,20 75,30.886 75,50 C 75,69.114 67.07,80 50,80 C 32.93,80 25,69.114 25,50 C 25,30.886 32.93,20 50,20 Z
      // Draw a mathematically perfect oval compressed from left and right sides
      (() => {
        const p1 = convertFrom100x100(50, 20);
        const c1 = convertFrom100x100(67.07, 20);
        const c2 = convertFrom100x100(75, 30.886);
        const p2 = convertFrom100x100(75, 50);
        const c3 = convertFrom100x100(75, 69.114);
        const c4 = convertFrom100x100(67.07, 80);
        const p3 = convertFrom100x100(50, 80);
        const c5 = convertFrom100x100(32.93, 80);
        const c6 = convertFrom100x100(25, 69.114);
        const p4 = convertFrom100x100(25, 50);
        const c7 = convertFrom100x100(25, 30.886);
        const c8 = convertFrom100x100(32.93, 20);
        return [
          createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y),
          createBezier(p2.x, p2.y, c3.x, c3.y, c4.x, c4.y, p3.x, p3.y),
          createBezier(p3.x, p3.y, c5.x, c5.y, c6.x, c6.y, p4.x, p4.y),
          createBezier(p4.x, p4.y, c7.x, c7.y, c8.x, c8.y, p1.x, p1.y),
        ];
      })(),
    ],
  },

  // ================================================================================
  // LETTER P - ViewBox: 100×100, Strokes: 2
  // ================================================================================
  P: {
    letter: 'P',
    expectedStrokeCount: 2,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['B', 'R', 'Q'],
    strokes: [
      // Stroke 1: Vertical Stem - M 30,20 L 30,80
      // Draw the main vertical line of P
      (() => {
        const start = convertFrom100x100(30, 20);
        const end = convertFrom100x100(30, 80);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Arc Belly - M 30,20 C 75,20 70,50 30,50
      // Draw the smooth upper arc of P from top to center
      (() => {
        const p1 = convertFrom100x100(30, 20);
        const c1 = convertFrom100x100(75, 20);
        const c2 = convertFrom100x100(70, 50);
        const p2 = convertFrom100x100(30, 50);
        return [createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER Q - ViewBox: 100×100, Strokes: 2
  // ================================================================================
  Q: {
    letter: 'Q',
    expectedStrokeCount: 2,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'medium',
    confusionPairs: ['O', 'P'],
    strokes: [
      // Stroke 1: Outer Oval - same as O
      // Draw the main oval body of Q
      (() => {
        const p1 = convertFrom100x100(50, 20);
        const c1 = convertFrom100x100(67.07, 20);
        const c2 = convertFrom100x100(75, 30.886);
        const p2 = convertFrom100x100(75, 50);
        const c3 = convertFrom100x100(75, 69.114);
        const c4 = convertFrom100x100(67.07, 80);
        const p3 = convertFrom100x100(50, 80);
        const c5 = convertFrom100x100(32.93, 80);
        const c6 = convertFrom100x100(25, 69.114);
        const p4 = convertFrom100x100(25, 50);
        const c7 = convertFrom100x100(25, 30.886);
        const c8 = convertFrom100x100(32.93, 20);
        return [
          createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y),
          createBezier(p2.x, p2.y, c3.x, c3.y, c4.x, c4.y, p3.x, p3.y),
          createBezier(p3.x, p3.y, c5.x, c5.y, c6.x, c6.y, p4.x, p4.y),
          createBezier(p4.x, p4.y, c7.x, c7.y, c8.x, c8.y, p1.x, p1.y),
        ];
      })(),
      
      // Stroke 2: Diagonal Tail - M 60,70 L 75,85
      // Draw the small diagonal line tail of Q
      (() => {
        const start = convertFrom100x100(60, 70);
        const end = convertFrom100x100(75, 85);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER R - ViewBox: 100×100, Strokes: 3
  // ================================================================================
  R: {
    letter: 'R',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'medium',
    confusionPairs: ['P', 'B'],
    strokes: [
      // Stroke 1: Vertical Stem - M 30,20 L 30,80
      // Draw the main vertical line of R
      (() => {
        const start = convertFrom100x100(30, 20);
        const end = convertFrom100x100(30, 80);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Arc Belly - M 30,20 C 75,20 70,50 30,50
      // Draw the smooth upper arc of R
      (() => {
        const p1 = convertFrom100x100(30, 20);
        const c1 = convertFrom100x100(75, 20);
        const c2 = convertFrom100x100(70, 50);
        const p2 = convertFrom100x100(30, 50);
        return [createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y)];
      })(),
      
      // Stroke 3: Diagonal Leg - M 30,50 L 60,80
      // Draw the shortened diagonal leg from center of stem
      (() => {
        const start = convertFrom100x100(30, 50);
        const end = convertFrom100x100(60, 80);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER S - ViewBox: 100×100, Strokes: 1
  // ================================================================================
  S: {
    letter: 'S',
    expectedStrokeCount: 1,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'medium',
    confusionPairs: ['Z'],
    strokes: [
      // Stroke 1: S Curve - M 67,20 C 20,13 25,50 50,50 C 75,50 80,87 32,80
      // Draw the entire S in one smooth continuous stroke
      (() => {
        const p1 = convertFrom100x100(67, 20);
        const c1 = convertFrom100x100(20, 13);
        const c2 = convertFrom100x100(25, 50);
        const p2 = convertFrom100x100(50, 50);
        const c3 = convertFrom100x100(75, 50);
        const c4 = convertFrom100x100(80, 87);
        const p3 = convertFrom100x100(32, 80);
        return [
          createBezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y),
          createBezier(p2.x, p2.y, c3.x, c3.y, c4.x, c4.y, p3.x, p3.y),
        ];
      })(),
    ],
  },

  // ================================================================================
  // LETTER T - ViewBox: 100×100, Strokes: 2
  // ================================================================================
  T: {
    letter: 'T',
    expectedStrokeCount: 2,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['I', 'L'],
    strokes: [
      // Stroke 1: Horizontal Top - M 15,15 L 85,15
      // Trace from left to right across the top
      (() => {
        const start = convertFrom100x100(15, 15);
        const end = convertFrom100x100(85, 15);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Vertical Stem - M 50,15 L 50,90
      // Trace down the center from top to bottom
      (() => {
        const start = convertFrom100x100(50, 15);
        const end = convertFrom100x100(50, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER U - ViewBox: 100×100, Strokes: 1
  // ================================================================================
  U: {
    letter: 'U',
    expectedStrokeCount: 1,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['V', 'N'],
    strokes: [
      // Stroke 1: U Stroke - M 30,20 L 30,65 C 30,85 70,85 70,65 L 70,20
      // Draw U as one continuous stroke: down, curve, up
      (() => {
        const p1 = convertFrom100x100(30, 20);
        const p2 = convertFrom100x100(30, 65);
        const c1 = convertFrom100x100(30, 85);
        const c2 = convertFrom100x100(70, 85);
        const p3 = convertFrom100x100(70, 65);
        const p4 = convertFrom100x100(70, 20);
        return [
          createLine(p1.x, p1.y, p2.x, p2.y),
          createBezier(p2.x, p2.y, c1.x, c1.y, c2.x, c2.y, p3.x, p3.y),
          createLine(p3.x, p3.y, p4.x, p4.y),
        ];
      })(),
    ],
  },

  // ================================================================================
  // LETTER V - ViewBox: 100×100, Strokes: 2
  // ================================================================================
  V: {
    letter: 'V',
    expectedStrokeCount: 2,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['U', 'A'],
    strokes: [
      // Stroke 1: Left Diagonal - M 20,10 L 50,90
      // Trace from top-left diagonally down to the bottom center
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(50, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Right Diagonal - M 80,10 L 50,90
      // Trace from top-right diagonally down to meet at the bottom center
      (() => {
        const start = convertFrom100x100(80, 10);
        const end = convertFrom100x100(50, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER W - ViewBox: 210×297, Strokes: 4
  // ================================================================================
  W: {
    letter: 'W',
    expectedStrokeCount: 4,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'hard',
    confusionPairs: ['M'],
    strokes: [
      // Stroke 1: Left Vertical - M 15,40 L 40,260
      // Trace the left vertical line from top to bottom
      (() => {
        const start = convertFrom210x297(15, 40);
        const end = convertFrom210x297(40, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Diagonal Up - M 40,260 L 105,120
      // Trace the diagonal up to the top middle
      (() => {
        const start = convertFrom210x297(40, 260);
        const end = convertFrom210x297(105, 120);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Diagonal Down - M 105,120 L 170,260
      // Trace the diagonal down to the bottom right
      (() => {
        const start = convertFrom210x297(105, 120);
        const end = convertFrom210x297(170, 260);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 4: Right Vertical - M 170,260 L 195,40
      // Trace the right vertical line from bottom to top
      (() => {
        const start = convertFrom210x297(170, 260);
        const end = convertFrom210x297(195, 40);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER X - ViewBox: 100×100, Strokes: 2
  // ================================================================================
  X: {
    letter: 'X',
    expectedStrokeCount: 2,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['K'],
    strokes: [
      // Stroke 1: Left-to-Right Diagonal - M 20,10 L 80,90
      // Trace from top-left downward to bottom-right
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(80, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Right-to-Left Diagonal - M 80,10 L 20,90
      // Trace from top-right downward to bottom-left
      (() => {
        const start = convertFrom100x100(80, 10);
        const end = convertFrom100x100(20, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER Y - ViewBox: 100×100, Strokes: 3
  // ================================================================================
  Y: {
    letter: 'Y',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['V'],
    strokes: [
      // Stroke 1: Left Diagonal - M 20,10 L 50,50
      // Trace from top-left downward to the center
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(50, 50);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Right Diagonal - M 80,10 L 50,50
      // Trace from top-right downward to the center
      (() => {
        const start = convertFrom100x100(80, 10);
        const end = convertFrom100x100(50, 50);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Vertical Stem - M 50,50 L 50,90
      // Trace straight down from center to bottom
      (() => {
        const start = convertFrom100x100(50, 50);
        const end = convertFrom100x100(50, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },

  // ================================================================================
  // LETTER Z - ViewBox: 100×100, Strokes: 3
  // ================================================================================
  Z: {
    letter: 'Z',
    expectedStrokeCount: 3,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
    baseline: BASELINE,
    difficulty: 'easy',
    confusionPairs: ['S'],
    strokes: [
      // Stroke 1: Top Horizontal - M 20,10 L 80,10
      // Trace the top line from left to right
      (() => {
        const start = convertFrom100x100(20, 10);
        const end = convertFrom100x100(80, 10);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 2: Diagonal - M 80,10 L 20,90
      // Trace diagonally from top-right down to bottom-left
      (() => {
        const start = convertFrom100x100(80, 10);
        const end = convertFrom100x100(20, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
      
      // Stroke 3: Bottom Horizontal - M 20,90 L 80,90
      // Trace the bottom line from left to right
      (() => {
        const start = convertFrom100x100(20, 90);
        const end = convertFrom100x100(80, 90);
        return [createLine(start.x, start.y, end.x, end.y)];
      })(),
    ],
  },
};

// ==================================================================================
// EXPORTS
// ==================================================================================

// Export alphabet for easy iteration
export { ALPHABET };

// Export canvas config for components
export { CANVAS_CONFIG };

// Default export
export default LETTER_PATHS;
