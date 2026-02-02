// src/components/tracing/LetterPath.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LetterConfig } from '../../types/tracing';

interface LetterPathProps {
  config: LetterConfig;
  width: number;
  height: number;
  showGuide: boolean;
  pathColor?: string;
  pathOpacity?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export default function LetterPath({
  config,
  width,
  height,
  showGuide,
  pathColor = '#60A5FA',
  pathOpacity = 0.5,
  strokeWidth = 12,
  animated = false,
}: LetterPathProps) {
  if (!showGuide) return null;

  // Scale path from 0-100 coordinate system to screen dimensions
  const scaledPath = scalePathToScreen(config.svgPath, width, height);

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#60A5FA" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#93C5FD" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* Outer glow effect */}
        <Path
          d={scaledPath}
          stroke="url(#pathGradient)"
          strokeWidth={strokeWidth + 8}
          strokeOpacity={pathOpacity * 0.3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main path */}
        <Path
          d={scaledPath}
          stroke={pathColor}
          strokeWidth={strokeWidth}
          strokeOpacity={pathOpacity}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={animated ? "10, 5" : undefined}
        />

        {/* Inner highlight */}
        <Path
          d={scaledPath}
          stroke="#FFFFFF"
          strokeWidth={strokeWidth - 4}
          strokeOpacity={pathOpacity * 0.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

/**
 * Scale path from 0-100 coordinate system to screen dimensions
 */
function scalePathToScreen(
  svgPath: string,
  targetWidth: number,
  targetHeight: number,
  padding: number = 40
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

  // Parse and transform path
  let transformedPath = '';
  let currentX = 0;
  let currentY = 0;
  let isXCoord = true;

  // Split path into commands and coordinates
  const pathParts = svgPath.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?[\d.]+/g) || [];

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];

    // Check if it's a command letter
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(part)) {
      transformedPath += part + ' ';
      isXCoord = true;
      continue;
    }

    // It's a number - transform it
    const num = parseFloat(part);
    let transformedNum: number;

    if (isXCoord) {
      transformedNum = num * scale + offsetX;
      currentX = transformedNum;
    } else {
      transformedNum = num * scale + offsetY;
      currentY = transformedNum;
    }

    transformedPath += transformedNum.toFixed(2) + ' ';
    isXCoord = !isXCoord;
  }

  return transformedPath.trim();
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
