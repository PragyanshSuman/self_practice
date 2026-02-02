// src/utils/letterPaths.ts

/**
 * SVG Paths for all 52 letters (A-Z, a-z)
 * Paths are normalized to 0-100 coordinate system
 * Origin: top-left (0,0), bottom-right (100,100)
 */

import { LetterConfig } from '../types/tracing';

/**
 * Uppercase Letter Paths (A-Z)
 */
const UPPERCASE_PATHS: Record<string, string> = {
  // A - Start bottom left, go to top, down to bottom right, cross bar
  A: 'M 20 90 L 50 10 L 80 90 M 35 60 L 65 60',
  
  // B - Vertical line, two bumps
  B: 'M 20 10 L 20 90 M 20 10 C 40 10, 60 20, 60 35 C 60 50, 40 50, 20 50 M 20 50 C 40 50, 65 60, 65 75 C 65 90, 40 90, 20 90',
  
  // C - Arc from top to bottom
  C: 'M 70 20 C 50 10, 30 10, 20 30 C 15 40, 15 60, 20 70 C 30 90, 50 90, 70 80',
  
  // D - Vertical line with curve
  D: 'M 20 10 L 20 90 M 20 10 C 50 10, 70 30, 70 50 C 70 70, 50 90, 20 90',
  
  // E - Vertical line with three horizontal lines
  E: 'M 70 10 L 20 10 L 20 90 L 70 90 M 20 50 L 60 50',
  
  // F - Vertical line with two horizontal lines at top
  F: 'M 20 10 L 70 10 M 20 10 L 20 90 M 20 50 L 60 50',
  
  // G - C shape with horizontal line
  G: 'M 70 20 C 50 10, 30 10, 20 30 C 15 40, 15 60, 20 70 C 30 90, 50 90, 70 80 L 70 50 L 50 50',
  
  // H - Two verticals with cross bar
  H: 'M 20 10 L 20 90 M 80 10 L 80 90 M 20 50 L 80 50',
  
  // I - Vertical line with top and bottom bars
  I: 'M 30 10 L 70 10 M 50 10 L 50 90 M 30 90 L 70 90',
  
  // J - Vertical with curve at bottom
  J: 'M 70 10 L 70 70 C 70 85, 60 90, 45 90 C 30 90, 20 85, 20 70',
  
  // K - Vertical with two diagonals
  K: 'M 20 10 L 20 90 M 70 10 L 20 50 L 70 90',
  
  // L - Vertical with bottom horizontal
  L: 'M 20 10 L 20 90 L 70 90',
  
  // M - Two verticals with peak
  M: 'M 15 90 L 15 10 L 50 50 L 85 10 L 85 90',
  
  // N - Two verticals with diagonal
  N: 'M 20 90 L 20 10 L 80 90 L 80 10',
  
  // O - Circle/oval
  O: 'M 50 10 C 70 10, 85 25, 85 50 C 85 75, 70 90, 50 90 C 30 90, 15 75, 15 50 C 15 25, 30 10, 50 10 Z',
  
  // P - Vertical with top loop
  P: 'M 20 90 L 20 10 C 40 10, 70 20, 70 35 C 70 50, 40 55, 20 55',
  
  // Q - O with tail
  Q: 'M 50 10 C 70 10, 85 25, 85 50 C 85 75, 70 90, 50 90 C 30 90, 15 75, 15 50 C 15 25, 30 10, 50 10 Z M 60 70 L 80 95',
  
  // R - P with diagonal leg
  R: 'M 20 90 L 20 10 C 40 10, 70 20, 70 35 C 70 50, 40 55, 20 55 M 45 55 L 75 90',
  
  // S - S curve
  S: 'M 70 25 C 70 15, 55 10, 40 10 C 25 10, 15 20, 15 30 C 15 45, 35 50, 50 50 C 65 50, 85 55, 85 70 C 85 80, 75 90, 60 90 C 45 90, 30 85, 30 75',
  
  // T - Horizontal top with vertical
  T: 'M 20 10 L 80 10 M 50 10 L 50 90',
  
  // U - Curved bottom
  U: 'M 20 10 L 20 70 C 20 85, 30 90, 50 90 C 70 90, 80 85, 80 70 L 80 10',
  
  // V - Two diagonals meeting at bottom
  V: 'M 20 10 L 50 90 L 80 10',
  
  // W - Inverted M
  W: 'M 15 10 L 30 90 L 50 50 L 70 90 L 85 10',
  
  // X - Two diagonals crossing
  X: 'M 20 10 L 80 90 M 80 10 L 20 90',
  
  // Y - Two diagonals meeting, then vertical
  Y: 'M 20 10 L 50 50 L 80 10 M 50 50 L 50 90',
  
  // Z - Horizontal, diagonal, horizontal
  Z: 'M 20 10 L 80 10 L 20 90 L 80 90',
};

/**
 * Lowercase Letter Paths (a-z)
 */
const LOWERCASE_PATHS: Record<string, string> = {
  // a - circle with vertical
  a: 'M 70 45 C 70 35, 60 30, 50 30 C 30 30, 20 40, 20 55 C 20 70, 30 75, 45 75 C 55 75, 65 72, 70 65 L 70 75',
  
  // b - vertical with circle
  b: 'M 25 10 L 25 75 M 25 45 C 25 35, 35 30, 45 30 C 60 30, 70 40, 70 55 C 70 70, 60 75, 45 75 C 35 75, 25 70, 25 60',
  
  // c - arc
  c: 'M 65 35 C 55 30, 40 30, 30 40 C 25 45, 25 60, 30 65 C 40 75, 55 75, 65 70',
  
  // d - circle with vertical on right
  d: 'M 70 10 L 70 75 M 70 45 C 70 35, 60 30, 50 30 C 35 30, 25 40, 25 55 C 25 70, 35 75, 50 75 C 60 75, 70 70, 70 60',
  
  // e - circle with cross bar
  e: 'M 25 52 L 70 52 C 70 40, 60 30, 48 30 C 35 30, 25 40, 25 52 C 25 65, 35 75, 48 75 C 60 75, 70 68, 70 60',
  
  // f - hook at top with cross bar
  f: 'M 55 10 C 50 10, 45 12, 45 20 L 45 75 M 30 40 L 60 40',
  
  // g - circle with descender
  g: 'M 70 35 C 70 35, 60 30, 50 30 C 35 30, 25 40, 25 52 C 25 65, 35 70, 50 70 C 60 70, 70 67, 70 60 L 70 82 C 70 90, 60 95, 45 95 C 35 95, 25 92, 25 85',
  
  // h - vertical with hump
  h: 'M 25 10 L 25 75 M 25 45 C 25 35, 35 30, 50 30 C 65 30, 70 35, 70 45 L 70 75',
  
  // i - dot and vertical
  i: 'M 50 20 L 50 22 M 50 32 L 50 75',
  
  // j - dot and descending curve
  j: 'M 55 20 L 55 22 M 55 32 L 55 80 C 55 90, 45 95, 35 90',
  
  // k - vertical with diagonals
  k: 'M 25 10 L 25 75 M 65 32 L 25 52 L 65 75',
  
  // l - simple vertical
  l: 'M 50 10 L 50 75',
  
  // m - three humps
  m: 'M 15 75 L 15 35 C 15 32, 20 30, 27 30 C 35 30, 38 32, 38 38 L 38 75 M 38 38 C 38 32, 45 30, 52 30 C 60 30, 63 32, 63 38 L 63 75 M 63 38 C 63 32, 70 30, 77 30 C 85 30, 88 32, 88 38 L 88 75',
  
  // n - vertical with hump
  n: 'M 25 75 L 25 35 C 25 32, 30 30, 40 30 C 55 30, 65 32, 65 40 L 65 75',
  
  // o - circle
  o: 'M 50 30 C 65 30, 75 40, 75 52 C 75 65, 65 75, 50 75 C 35 75, 25 65, 25 52 C 25 40, 35 30, 50 30 Z',
  
  // p - descending with circle
  p: 'M 25 32 L 25 95 M 25 45 C 25 35, 35 30, 45 30 C 60 30, 70 40, 70 52 C 70 65, 60 75, 45 75 C 35 75, 25 70, 25 60',
  
  // q - circle with descending vertical
  q: 'M 70 32 L 70 95 M 70 45 C 70 35, 60 30, 50 30 C 35 30, 25 40, 25 52 C 25 65, 35 75, 50 75 C 60 75, 70 70, 70 60',
  
  // r - vertical with small hump
  r: 'M 30 75 L 30 35 C 30 32, 35 30, 42 30 C 52 30, 60 32, 65 35',
  
  // s - small S curve
  s: 'M 65 38 C 65 32, 58 30, 48 30 C 38 30, 30 35, 30 42 C 30 50, 40 52, 50 52 C 60 52, 70 55, 70 63 C 70 70, 62 75, 52 75 C 42 75, 35 72, 35 67',
  
  // t - vertical with cross bar and curve
  t: 'M 45 15 L 45 65 C 45 72, 50 75, 60 75 M 30 35 L 60 35',
  
  // u - curved bottom with vertical
  u: 'M 25 32 L 25 60 C 25 70, 32 75, 45 75 C 55 75, 65 72, 70 65 L 70 32 L 70 75',
  
  // v - two diagonals
  v: 'M 25 32 L 47 75 L 70 32',
  
  // w - three diagonals
  w: 'M 20 32 L 32 75 L 47 52 L 62 75 L 75 32',
  
  // x - crossing diagonals
  x: 'M 25 32 L 70 75 M 70 32 L 25 75',
  
  // y - v with descender
  y: 'M 25 32 L 47 75 L 70 32 M 47 75 L 47 88 C 47 95, 40 98, 32 95',
  
  // z - horizontal, diagonal, horizontal
  z: 'M 30 32 L 65 32 L 30 75 L 65 75',
};

/**
 * Get letter configuration
 */
export function getLetterConfig(letter: string, letterCase: 'uppercase' | 'lowercase'): LetterConfig {
  const paths = letterCase === 'uppercase' ? UPPERCASE_PATHS : LOWERCASE_PATHS;
  const svgPath = paths[letter];
  
  if (!svgPath) {
    throw new Error(`Letter path not found for: ${letter} (${letterCase})`);
  }
  
  // Determine difficulty based on complexity
  const difficulty = getDifficulty(letter, letterCase);
  
  return {
    letter,
    case: letterCase,
    svgPath,
    bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    strokeWidth: 8,
    difficulty,
  };
}

/**
 * Determine letter difficulty
 */
function getDifficulty(letter: string, letterCase: 'uppercase' | 'lowercase'): 'easy' | 'medium' | 'hard' {
  const easyLetters = ['I', 'L', 'T', 'i', 'l', 't', 'o', 'O', 'C', 'c'];
  const hardLetters = ['M', 'W', 'K', 'R', 'S', 'Q', 'G', 'g', 'm', 'w', 'k'];
  
  const fullLetter = letterCase === 'uppercase' ? letter.toUpperCase() : letter.toLowerCase();
  
  if (easyLetters.includes(fullLetter)) return 'easy';
  if (hardLetters.includes(fullLetter)) return 'hard';
  return 'medium';
}

/**
 * Get all available letters
 */
export function getAllLetters(): { uppercase: string[]; lowercase: string[] } {
  return {
    uppercase: Object.keys(UPPERCASE_PATHS),
    lowercase: Object.keys(LOWERCASE_PATHS),
  };
}

/**
 * Convert SVG path to points for collision detection
 * This samples the path at regular intervals
 */
export function pathToPoints(svgPath: string, sampleRate: number = 2): { x: number; y: number }[] {
  // This is a simplified version - in production, use a proper SVG path parser
  // For now, we'll extract coordinates from the path string
  const points: { x: number; y: number }[] = [];
  
  // Match M, L, C commands and extract coordinates
  const coordPattern = /([MLC])\s*([\d.\s,]+)/g;
  let match;
  
  while ((match = coordPattern.exec(svgPath)) !== null) {
    const command = match[1];
    const coords = match[2].trim().split(/[\s,]+/).map(Number);
    
    // Add points based on command type
    for (let i = 0; i < coords.length; i += 2) {
      if (coords[i] !== undefined && coords[i + 1] !== undefined) {
        points.push({ x: coords[i], y: coords[i + 1] });
      }
    }
  }
  
  return points;
}

/**
 * Scale path from 0-100 coordinate system to screen dimensions
 */
export function scalePathToScreen(
  svgPath: string,
  targetWidth: number,
  targetHeight: number,
  padding: number = 20
): string {
  const availableWidth = targetWidth - padding * 2;
  const availableHeight = targetHeight - padding * 2;
  
  // Scale from 100x100 to available space
  const scaleX = availableWidth / 100;
  const scaleY = availableHeight / 100;
  
  // Use the smaller scale to maintain aspect ratio
  const scale = Math.min(scaleX, scaleY);
  
  // Calculate offsets to center
  const offsetX = padding + (availableWidth - 100 * scale) / 2;
  const offsetY = padding + (availableHeight - 100 * scale) / 2;
  
  // Transform path
  return svgPath.replace(/(\d+\.?\d*)/g, (match) => {
    const num = parseFloat(match);
    // Check if this is an X or Y coordinate based on position
    // This is simplified - proper implementation would parse the path commands
    return String(num * scale + (num < 50 ? offsetX : offsetY));
  });
}

/**
 * Get ideal path points for distance calculation
 */
export function getIdealPathPoints(
  letter: string,
  letterCase: 'uppercase' | 'lowercase',
  width: number,
  height: number
): { x: number; y: number }[] {
  const config = getLetterConfig(letter, letterCase);
  const scaledPath = scalePathToScreen(config.svgPath, width, height);
  return pathToPoints(scaledPath, 5); // Sample every 5 units
}
