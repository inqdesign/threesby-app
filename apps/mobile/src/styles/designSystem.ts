// Design System matching Threesby Web App
// Based on CSS variables from src/index.css

export const colors = {
  // Light mode colors (matching web app CSS variables)
  background: '#F4F4F4', // hsl(0 0% 95.7%)
  foreground: '#0A0A0A', // hsl(0 0% 3.9%)
  primary: '#171717', // hsl(0 0% 9%)
  primaryForeground: '#FAFAFA', // hsl(0 0% 98%)
  secondary: '#F5F5F5', // hsl(0 0% 96.1%) - Light grey for input fields
  secondaryForeground: '#171717', // hsl(0 0% 9%)
  muted: '#F5F5F5', // hsl(0 0% 96.1%)
  mutedForeground: '#737373', // hsl(0 0% 45.1%)
  accent: '#F5F5F5', // hsl(0 0% 96.1%)
  accentForeground: '#171717', // hsl(0 0% 9%)
  border: '#E5E5E5', // hsl(0 0% 89.8%)
  input: '#E5E5E5', // hsl(0 0% 89.8%)
  ring: '#0A0A0A', // hsl(0 0% 3.9%)
  card: '#FFFFFF', // hsl(0 0% 100%) - White cards in light mode
  cardForeground: '#0A0A0A', // hsl(0 0% 3.9%)
  destructive: '#DC2626', // hsl(0 72% 50%) - Red color for destructive actions
  destructiveForeground: '#FAFAFA', // hsl(0 0% 98%)
};

export const typography = {
  fontFamily: {
    // Note: In React Native, we'll use system fonts that match Geist's characteristics
    sans: 'System', // Will use SF Pro on iOS, Roboto on Android
    mono: 'Menlo', // Monospace font for labels
  },
  fontWeights: {
    normal: '400', // Lighter default like web app
    medium: '500', // Medium weight
    semibold: '600', // Semibold
  },
  fontSizes: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Mobile-specific utilities (matching web app mobile classes)
export const mobile = {
  container: {
    paddingHorizontal: spacing.lg, // px-4 md:px-8
  },
  py: {
    paddingVertical: spacing.lg, // py-4 md:py-8
  },
  gap: {
    gap: spacing.md, // gap-3 md:gap-6
  },
};

// Component-specific styles matching web app
export const components = {
  pickCard: {
    container: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.md,
    },
    content: {
      padding: spacing.lg,
    },
    title: {
      fontSize: typography.fontSizes.lg,
      fontWeight: typography.fontWeights.semibold,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    description: {
      fontSize: typography.fontSizes.sm,
      color: colors.mutedForeground,
      lineHeight: typography.lineHeights.relaxed,
    },
    category: {
      fontSize: typography.fontSizes.xs,
      color: colors.primary,
      backgroundColor: colors.secondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      fontWeight: typography.fontWeights.medium,
    },
  },
  button: {
    primary: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    primaryText: {
      color: colors.primaryForeground,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.medium,
    },
    secondary: {
      backgroundColor: colors.secondary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryText: {
      color: colors.foreground,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.medium,
    },
  },
}; 