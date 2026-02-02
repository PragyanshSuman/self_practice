/**
 * Color palette for the application
 * Following Material Design and accessibility guidelines
 */

export const Colors = {
  // Primary colors
  primary: '#2196F3',
  primaryLight: '#64B5F6',
  primaryDark: '#1976D2',
  
  // Secondary colors
  secondary: '#4CAF50',
  secondaryLight: '#81C784',
  secondaryDark: '#388E3C',
  
  // Accent colors
  accent: '#FF9800',
  accentLight: '#FFB74D',
  accentDark: '#F57C00',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Risk level colors
  riskLow: '#4CAF50',
  riskMild: '#8BC34A',
  riskModerate: '#FF9800',
  riskHigh: '#FF5722',
  riskSevere: '#F44336',
  
  // Tracing colors
  tracingCorrect: '#2196F3',
  tracingIncorrect: '#F44336',
  tracingGuideline: '#888888',
  tracingBackground: '#FAFAFA',
  
  // UI colors
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F0F0',
  
  // Text colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  // Border colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#BDBDBD',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Graph colors
  graphLine1: '#2196F3',
  graphLine2: '#4CAF50',
  graphLine3: '#FF9800',
  graphLine4: '#9C27B0',
  graphLine5: '#F44336',
  
  // Gradient colors
  gradientStart: '#2196F3',
  gradientEnd: '#1976D2',
  
  // Letter difficulty colors
  difficultyEasy: '#4CAF50',
  difficultyMedium: '#FF9800',
  difficultyHard: '#F44336',
  
  // Feedback colors
  feedbackExcellent: '#4CAF50',
  feedbackGood: '#8BC34A',
  feedbackAverage: '#FF9800',
  feedbackPoor: '#FF5722',
  feedbackVeryPoor: '#F44336',
  
  // Special colors
  highlight: '#FFEB3B',
  link: '#2196F3',
  transparent: 'transparent',
  
  // Shadow colors (iOS/Android)
  shadowColor: '#000000',
  
  // Confusion matrix colors (for letter pairs)
  confusionB_D: '#FF5722',
  confusionP_Q: '#FF5722',
  confusionN_U: '#FF9800',
  confusionM_W: '#FF9800',
};

/**
 * Color utility functions
 */
export const ColorUtils = {
  /**
   * Get color based on percentage score (0-100)
   */
  getScoreColor: (score: number): string => {
    if (score >= 90) return Colors.feedbackExcellent;
    if (score >= 75) return Colors.feedbackGood;
    if (score >= 60) return Colors.feedbackAverage;
    if (score >= 40) return Colors.feedbackPoor;
    return Colors.feedbackVeryPoor;
  },

  /**
   * Get risk level color
   */
  getRiskColor: (riskLevel: string): string => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
      case 'typical':
        return Colors.riskLow;
      case 'mild':
        return Colors.riskMild;
      case 'moderate':
        return Colors.riskModerate;
      case 'high':
        return Colors.riskHigh;
      case 'severe':
        return Colors.riskSevere;
      default:
        return Colors.textSecondary;
    }
  },

  /**
   * Get difficulty color
   */
  getDifficultyColor: (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return Colors.difficultyEasy;
      case 'medium':
        return Colors.difficultyMedium;
      case 'hard':
        return Colors.difficultyHard;
      default:
        return Colors.textSecondary;
    }
  },

  /**
   * Add alpha channel to hex color
   */
  addAlpha: (color: string, alpha: number): string => {
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${color}${alphaHex}`;
  },

  /**
   * Lighten a color by percentage
   */
  lighten: (color: string, percent: number): string => {
    // Simple implementation - would need color parsing for production
    return color;
  },

  /**
   * Darken a color by percentage
   */
  darken: (color: string, percent: number): string => {
    // Simple implementation - would need color parsing for production
    return color;
  },
};

/**
 * Theme configuration
 */
export const Theme = {
  light: {
    background: Colors.background,
    surface: Colors.surface,
    text: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    primary: Colors.primary,
    secondary: Colors.secondary,
    error: Colors.error,
    border: Colors.border,
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    primary: Colors.primaryLight,
    secondary: Colors.secondaryLight,
    error: Colors.error,
    border: '#2C2C2C',
  },
};

export default Colors;
