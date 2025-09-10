import { Platform } from 'react-native';

// Apple Design System Colors
export const AppleColors = {
  // System Colors (iOS 17)
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D92',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',
  
  // Neutral Colors
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  quaternaryLabel: '#3C3C432E',
  
  // Background Colors
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',
  
  // Fill Colors
  systemFill: '#78788033',
  secondarySystemFill: '#78788028',
  tertiarySystemFill: '#7676801E',
  quaternarySystemFill: '#74748014',
  
  // Dark Mode
  darkLabel: '#FFFFFF',
  darkSecondaryLabel: '#EBEBF5',
  darkSystemBackground: '#000000',
  darkSecondarySystemBackground: '#1C1C1E',
  darkTertiarySystemBackground: '#2C2C2E',
  
  // Separator
  separator: '#3C3C432E',
  opaqueSeparator: '#C6C6C8',
};

// Typography System
export const AppleTypography = {
  // Large Title
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  
  // Title 1
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  
  // Title 2
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  
  // Title 3
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  
  // Headline
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.43,
  },
  
  // Body
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.43,
  },
  
  // Callout
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  
  // Subheadline
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  
  // Footnote
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  
  // Caption 1
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  
  // Caption 2
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
};

// Spacing System
export const AppleSpacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
};

// Radius System
export const AppleRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  pill: 999,
};

// Shadow System
export const AppleShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  
  medium: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  large: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5.46,
    elevation: 9,
  },
  
  extraLarge: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10.32,
    elevation: 16,
  },
};

// Animation Durations
export const AppleAnimations = {
  fast: 150,
  normal: 250,
  slow: 350,
  extraSlow: 500,
};

// Blur Effects
export const AppleBlur = {
  light: 'rgba(255, 255, 255, 0.8)',
  dark: 'rgba(0, 0, 0, 0.8)',
  ultraThin: 'rgba(255, 255, 255, 0.9)',
};

export default {
  colors: AppleColors,
  typography: AppleTypography,
  spacing: AppleSpacing,
  radius: AppleRadius,
  shadows: AppleShadows,
  animations: AppleAnimations,
  blur: AppleBlur,
};