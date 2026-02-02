// src/letters/types.ts

export interface Point {
  x: number;
  y: number;
  angle: number;
}

export interface Segment {
  name: string;
  d: string;
  pts: Point[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface LetterBuildResult {
  segments: Segment[];
}

export interface LetterTheme {
  id: string;
  background: any;
  avatar: {
    idle: any;
    happy: any;
    surprised: any;
  };
  colors: {
    pathGradientStart: string;
    pathGradientEnd: string;
    guideDot: string;
  };
  bee: {
    speedMsPerPoint: number;
    pauseAtEndMs: number;
  };
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type LetterBuild = (box: BoundingBox) => LetterBuildResult;

export interface LetterDefinition {
  build: LetterBuild;
  theme: LetterTheme;
}
