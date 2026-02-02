// src/theme/colors.ts - Dyslexia-friendly high-contrast colors

export const colors = {
  // Primary colors (high contrast)
  primary: '#4A90E2',
  primaryDark: '#2E5C8A',
  secondary: '#50C878',
  
  // Background colors (cream/off-white to reduce glare)
  background: '#FFFEF0',
  surface: '#F5F5DC',
  cardBackground: '#FFFFFF',
  
  // Text colors (high contrast black on cream)
  text: '#2C2C2C',
  textSecondary: '#5A5A5A',
  textDisabled: '#A0A0A0',
  
  // Feedback colors (no pure red/green)
  success: '#50C878',      // Emerald green
  warning: '#FFB347',      // Soft orange
  info: '#87CEEB',         // Sky blue
  encouragement: '#DDA0DD', // Plum
  
  // Score gradient colors (gentle, not alarming)
  scoreExcellent: '#98D8C8',  // Seafoam
  scoreGood: '#B8E994',       // Light green
  scoreFair: '#FFD93D',       // Soft yellow
  scoreNeedsPractice: '#FFB084', // Peach
  
  // UI elements
  border: '#D1D1D1',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Phoneme visualization
  phonemeActive: '#4A90E2',
  phonemeInactive: '#E0E0E0',
  
  // Recording states
  recordingActive: '#FF6B6B',
  recordingReady: '#4ECDC4',
};

export default colors;
