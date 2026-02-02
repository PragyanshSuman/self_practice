// src/theme/styles.ts

import { StyleSheet } from 'react-native';
import colors from './colors';
import fonts from './fonts';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  
  buttonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.large,
    fontFamily: fonts.primaryBold,
    letterSpacing: fonts.letterSpacing.normal,
  },
  
  heading: {
    fontSize: fonts.sizes.xlarge,
    fontFamily: fonts.primaryBold,
    color: colors.text,
    letterSpacing: fonts.letterSpacing.normal,
    lineHeight: fonts.lineHeights.xlarge,
  },
  
  body: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.text,
    letterSpacing: fonts.letterSpacing.normal,
    lineHeight: fonts.lineHeights.medium,
  },
  
  secondaryText: {
    fontSize: fonts.sizes.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    letterSpacing: fonts.letterSpacing.normal,
  },
});

export default globalStyles;
