// src/letters/utils/pathParser.ts

import { Point } from '../types';

/**
 * Parse SVG path commands and convert to points array
 * Supports M (moveto), L (lineto), C (cubic bezier), c (relative cubic)
 */
export function parseSVGPath(pathData: string, numPoints: number = 250): Point[] {
  const commands = pathData.trim().split(/(?=[MLCmlc])/);
  const points: Point[] = [];
  let currentX = 0;
  let currentY = 0;

  const allPathPoints: { x: number; y: number }[] = [];

  commands.forEach((cmd) => {
    const type = cmd[0];
    const values = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)
      .filter((n) => !isNaN(n));

    switch (type) {
      case 'M':
      case 'm':
        currentX = type === 'M' ? values[0] : currentX + values[0];
        currentY = type === 'M' ? values[1] : currentY + values[1];
        allPathPoints.push({ x: currentX, y: currentY });
        break;

      case 'L':
      case 'l':
        for (let i = 0; i < values.length; i += 2) {
          currentX = type === 'L' ? values[i] : currentX + values[i];
          currentY = type === 'L' ? values[i + 1] : currentY + values[i + 1];
          allPathPoints.push({ x: currentX, y: currentY });
        }
        break;

      case 'C':
      case 'c':
        // Cubic Bezier: C/c x1 y1, x2 y2, x y (control points and end point)
        for (let i = 0; i < values.length; i += 6) {
          const startX = currentX;
          const startY = currentY;

          const cp1x = type === 'C' ? values[i] : currentX + values[i];
          const cp1y = type === 'C' ? values[i + 1] : currentY + values[i + 1];
          const cp2x = type === 'C' ? values[i + 2] : currentX + values[i + 2];
          const cp2y = type === 'C' ? values[i + 3] : currentY + values[i + 3];
          const endX = type === 'C' ? values[i + 4] : currentX + values[i + 4];
          const endY = type === 'C' ? values[i + 5] : currentY + values[i + 5];

          // Sample bezier curve
          const steps = 50;
          for (let t = 0; t <= steps; t++) {
            const ratio = t / steps;
            const bezierPoint = cubicBezier(
              startX,
              startY,
              cp1x,
              cp1y,
              cp2x,
              cp2y,
              endX,
              endY,
              ratio
            );
            allPathPoints.push(bezierPoint);
          }

          currentX = endX;
          currentY = endY;
        }
        break;
    }
  });

  // Resample to exact number of points
  if (allPathPoints.length === 0) return [];

  const totalLength = calculatePathLength(allPathPoints);
  const segmentLength = totalLength / (numPoints - 1);

  points.push({
    x: allPathPoints[0].x,
    y: allPathPoints[0].y,
    angle: 0,
  });

  let accumulatedLength = 0;
  let targetLength = segmentLength;

  for (let i = 1; i < allPathPoints.length; i++) {
    const p1 = allPathPoints[i - 1];
    const p2 = allPathPoints[i];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);

    accumulatedLength += segLen;

    while (accumulatedLength >= targetLength && points.length < numPoints) {
      const ratio = (targetLength - (accumulatedLength - segLen)) / segLen;
      const x = p1.x + dx * ratio;
      const y = p1.y + dy * ratio;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      points.push({ x, y, angle });
      targetLength += segmentLength;
    }
  }

  // Ensure we have exactly numPoints
  while (points.length < numPoints) {
    const last = allPathPoints[allPathPoints.length - 1];
    const prev = points[points.length - 1];
    const angle = prev ? prev.angle : 0;
    points.push({ x: last.x, y: last.y, angle });
  }

  return points.slice(0, numPoints);
}

function cubicBezier(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3,
    y: mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3,
  };
}

function calculatePathLength(points: { x: number; y: number }[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Scale multiple paths together while maintaining their relative positions
 * This ensures multi-stroke letters (like A, B, K) render correctly
 * 
 * @param pathsData - Array of path strings with optional point counts
 * @param targetBox - Bounding box to fit the paths into
 * @param padding - Padding around the paths in pixels
 * @returns Array of scaled point arrays, one per input path
 */
export function scaleMultiplePathsToBox(
  pathsData: Array<{ path: string; numPoints?: number }>,
  targetBox: { x: number; y: number; w: number; h: number },
  padding: number = 40
): Point[][] {
  // Parse all paths first
  const allParsedPaths = pathsData.map(({ path, numPoints = 250 }) => 
    parseSVGPath(path, numPoints)
  );

  // Flatten all points to find global bounds
  const allPoints = allParsedPaths.flat();
  
  if (allPoints.length === 0) return [];

  // Find the bounding box of ALL paths combined
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  allPoints.forEach((p) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  const pathWidth = maxX - minX;
  const pathHeight = maxY - minY;

  // Prevent division by zero
  if (pathWidth === 0 || pathHeight === 0) {
    console.warn('scaleMultiplePathsToBox: path has zero width or height');
    return allParsedPaths;
  }

  // Calculate scale to fit in target box with padding
  const availableWidth = targetBox.w - 2 * padding;
  const availableHeight = targetBox.h - 2 * padding;
  const scale = Math.min(availableWidth / pathWidth, availableHeight / pathHeight);

  // Center the scaled paths in the target box
  const scaledWidth = pathWidth * scale;
  const scaledHeight = pathHeight * scale;
  const offsetX = targetBox.x + (targetBox.w - scaledWidth) / 2 - minX * scale;
  const offsetY = targetBox.y + (targetBox.h - scaledHeight) / 2 - minY * scale;

  // Apply the SAME transformation to all paths
  return allParsedPaths.map((points) =>
    points.map((p) => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
      angle: p.angle,
    }))
  );
}

/**
 * Scale and translate path points to fit within a bounding box
 * NOTE: For multi-stroke letters, use scaleMultiplePathsToBox instead!
 * This function is kept for backward compatibility with single-stroke letters.
 */
export function scalePathToBox(
  points: Point[],
  sourceViewBox: { width: number; height: number },
  targetBox: { x: number; y: number; w: number; h: number },
  padding: number = 40
): Point[] {
  if (points.length === 0) return [];

  // Find bounds of the path
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach((p) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  const pathWidth = maxX - minX;
  const pathHeight = maxY - minY;

  if (pathWidth === 0 || pathHeight === 0) {
    console.warn('scalePathToBox: path has zero width or height');
    return points;
  }

  // Calculate scale to fit in target box with padding
  const availableWidth = targetBox.w - 2 * padding;
  const availableHeight = targetBox.h - 2 * padding;
  const scale = Math.min(availableWidth / pathWidth, availableHeight / pathHeight);

  // Center the scaled path
  const scaledWidth = pathWidth * scale;
  const scaledHeight = pathHeight * scale;
  const offsetX = targetBox.x + (targetBox.w - scaledWidth) / 2 - minX * scale;
  const offsetY = targetBox.y + (targetBox.h - scaledHeight) / 2 - minY * scale;

  return points.map((p) => ({
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
    angle: p.angle,
  }));
}

/**
 * Create path 'd' attribute from points
 */
export function pointsToPathD(points: Point[]): string {
  if (points.length === 0) return '';
  const first = points[0];
  const rest = points.slice(1).map((p) => `L ${p.x} ${p.y}`);
  return `M ${first.x} ${first.y} ${rest.join(' ')}`;
}
