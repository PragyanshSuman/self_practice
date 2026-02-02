/**
 * Styles for PronunciationCard component
 * 
 * DESIGN PRINCIPLES:
 * - Dyslexia-friendly: high contrast, large text, clear spacing
 * - Google-like: clean, minimal, professional
 * - Accessible: touch targets > 44px, clear visual feedback
 * 
 * COLOR PALETTE:
 * - Primary: #1A73E8 (Google Blue)
 * - Success: #34A853 (Google Green)
 * - Text: #202124 (Google Dark Gray)
 * - Background: #FFFFFF / #F8F9FA
 */

import { StyleSheet, Platform } from 'react-native';

/**
 * Dyslexia-friendly font configuration
 * 
 * WHY THESE CHOICES:
 * - OpenDyslexic is hard to integrate on mobile (requires bundling)
 * - System fonts with increased spacing work well
 * - San Francisco (iOS) and Roboto (Android) are highly readable
 */
export const DYSLEXIA_FRIENDLY_FONT = Platform.select({
  ios: 'San Francisco',
  android: 'Roboto',
  default: 'System',
});

export const styles = StyleSheet.create({
  /**
   * Card container
   * Bubbly, colorful, friendly
   */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginVertical: 12,
    marginHorizontal: 16,
    borderWidth: 3,
    borderColor: '#4D96FF', // Playful Blue

    // Soft, colorful shadow
    ...Platform.select({
      ios: {
        shadowColor: '#4D96FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 0, // Flat design preferred for "sticker" look, or subtle
      },
    }),
  },

  /**
   * Word Image (Visual Association)
   */
  imageContainer: {
    width: 180,
    height: 180,
    borderRadius: 90, // Circular
    backgroundColor: '#F0F4F8',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#4D96FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', // Ensure centering
  },

  wordImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  /**
   * Word display (main heading)
   */
  wordContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },

  wordText: {
    fontSize: 42, // Larger for kids
    fontWeight: '800',
    color: '#2B3A55', // Ink Blue (softer than black)
    fontFamily: DYSLEXIA_FRIENDLY_FONT,
    letterSpacing: 2.0,
    textTransform: 'lowercase', // Friendlier
  },

  /**
   * Phonetic notation (IPA)
   */
  phoneticContainer: {
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E8F0FE', // Light blue bg
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D2E3FC',
  },

  phoneticLabel: {
    fontSize: 14,
    color: '#1A73E8',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 1.0,
  },

  phoneticText: {
    fontSize: 28,
    color: '#1A73E8',
    fontFamily: DYSLEXIA_FRIENDLY_FONT,
    fontWeight: '500',
  },

  /**
   * Syllable breakdown
   */
  syllableContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  syllable: {
    fontSize: 32,
    color: '#2B3A55',
    fontFamily: DYSLEXIA_FRIENDLY_FONT,
    fontWeight: '700',
    paddingHorizontal: 6,
    letterSpacing: 1.0,
  },

  syllableSeparator: {
    fontSize: 32,
    color: '#FF6B6B', // Red separator (playful)
    fontWeight: '900',
    paddingHorizontal: 4,
  },

  /**
   * Control buttons (play, slow toggle)
   */
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 8,
  },

  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B', // Playful Red
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100, // Fully round pill

    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  playButtonPressed: {
    backgroundColor: '#EE5253',
    transform: [{ scale: 0.95 }],
  },

  playButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 1.0,
  },

  /**
   * Slow mode toggle
   */
  slowToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6', // Light Orange
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#FFD93D', // Yellow/Orange border
  },

  slowToggleActive: {
    backgroundColor: '#FFD93D',
    borderColor: '#FFC107',
  },

  slowToggleText: {
    fontSize: 16,
    color: '#FF9F43', // Orange text
    marginLeft: 8,
    fontWeight: '700',
  },

  slowToggleTextActive: {
    color: '#5E4005', // Dark brown
  },

  /**
   * Metadata footer
   */
  metadataContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#F0F4F8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  metadataText: {
    fontSize: 12,
    color: '#AAB0B6',
    fontWeight: '600',
  },

  confidenceBadge: {
    display: 'none', // Hide confidence for kids to declutter
  },

  // Keep these for type safety but hide them
  confidenceBadgeHigh: {},
  confidenceBadgeLow: {},
  confidenceText: {},
  confidenceTextHigh: {},
  confidenceTextLow: {},

  /**
   * Status states
   */
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#4D96FF',
    fontWeight: '600',
  },

  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },

  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '600',
  },

  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: 'hidden',
  },
});
