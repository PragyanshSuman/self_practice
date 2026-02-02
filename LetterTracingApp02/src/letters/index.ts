// src/letters/index.ts

import type { LetterDefinition } from './types';
import * as LetterA from './uppercase/A';
import * as LetterB from './uppercase/B';
import * as LetterC from './uppercase/C';
import * as LetterD from './uppercase/D';
import * as LetterE from './uppercase/E';
import * as LetterF from './uppercase/F';
import * as LetterG from './uppercase/G';
import * as LetterH from './uppercase/H';
import * as LetterI from './uppercase/I';
import * as LetterJ from './uppercase/J';
import * as LetterK from './uppercase/K';
import * as LetterL from './uppercase/L';
import * as LetterM from './uppercase/M';
import * as LetterN from './uppercase/N';
import * as LetterO from './uppercase/O';
import * as LetterP from './uppercase/P';
import * as LetterQ from './uppercase/Q';
import * as LetterR from './uppercase/R';
import * as LetterS from './uppercase/S';
import * as LetterT from './uppercase/T';
import * as LetterU from './uppercase/U';
import * as LetterV from './uppercase/V';
import * as LetterW from './uppercase/W';
import * as LetterX from './uppercase/X';
import * as LetterY from './uppercase/Y';
import * as LetterZ from './uppercase/Z';

// Letter registry - all 26 uppercase letters
const LETTERS: Record<string, LetterDefinition> = {
  A: LetterA,
  B: LetterB,
  C: LetterC,
  D: LetterD,
  E: LetterE,
  F: LetterF,
  G: LetterG,
  H: LetterH,
  I: LetterI,
  J: LetterJ,
  K: LetterK,
  L: LetterL,
  M: LetterM,
  N: LetterN,
  O: LetterO,
  P: LetterP,
  Q: LetterQ,
  R: LetterR,
  S: LetterS,
  T: LetterT,
  U: LetterU,
  V: LetterV,
  W: LetterW,
  X: LetterX,
  Y: LetterY,
  Z: LetterZ,
};

/**
 * Load a letter's build function and theme
 * @param letter - The letter to load (case-insensitive)
 * @returns LetterDefinition containing build function and theme
 */
export function loadLetter(letter: string): LetterDefinition {
  const upperLetter = letter.toUpperCase();
  
  if (!LETTERS[upperLetter]) {
    console.warn(`Letter ${upperLetter} not found, falling back to A`);
    return LETTERS.A;
  }
  
  return LETTERS[upperLetter];
}

/**
 * Get list of all available letters
 * @returns Array of available letter keys (sorted alphabetically)
 */
export function getAvailableLetters(): string[] {
  return Object.keys(LETTERS).sort();
}

/**
 * Check if a letter is available
 * @param letter - The letter to check
 * @returns boolean indicating if letter exists
 */
export function isLetterAvailable(letter: string): boolean {
  return letter.toUpperCase() in LETTERS;
}

// Re-export types for convenience
export type { 
  LetterDefinition, 
  LetterBuild, 
  LetterTheme, 
  BoundingBox, 
  Segment, 
  Point 
} from './types';
