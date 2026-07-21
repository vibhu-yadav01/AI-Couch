export const Colors = {
  primary: '#6C63FF',
  primaryDark: '#5A52E0',
  secondary: '#FF6584',
  accent: '#43E97B',
  accentBlue: '#38F9D7',
  background: '#0A0A1A',
  surface: '#12122A',
  surfaceLight: '#1A1A35',
  card: '#1E1E40',
  cardGlass: 'rgba(30, 30, 64, 0.8)',
  border: 'rgba(108, 99, 255, 0.3)',
  text: '#F0F0FF',
  textSecondary: '#9999CC',
  textMuted: '#5555AA',
  success: '#43E97B',
  warning: '#F7971E',
  error: '#FF6584',
  white: '#FFFFFF',
  gradient: {
    primary: ['#6C63FF', '#FF6584'] as [string, string, ...string[]],
    accent: ['#43E97B', '#38F9D7'] as [string, string, ...string[]],
    dark: ['#0A0A1A', '#12122A'] as [string, string, ...string[]],
    card: ['#1E1E40', '#12122A'] as [string, string, ...string[]],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Typography = {
  h1: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    color: Colors.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    color: Colors.text,
  },
  h3: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  body: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    color: Colors.white,
  },
};

export const ThemeStyles = {
  floatingTabBar: {
    position: 'absolute' as const,
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 20,
    height: 64,
    paddingBottom: PlatformSelectPaddingBottom(),
    paddingTop: 8,
    backgroundColor: 'rgba(18, 18, 42, 0.92)',
    borderColor: 'rgba(108, 99, 255, 0.25)',
    borderWidth: 1.5,
    ...PlatformSelectShadow(),
  },
  glassCard: {
    backgroundColor: 'rgba(30, 30, 64, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.22)',
    padding: 16,
  },
  inputField: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(26, 26, 53, 0.8)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.15)',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  inputFieldFocused: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(30, 30, 64, 0.95)',
  },
};

// Helper function to safely load Platform values during styling without compile issues
import { Platform } from 'react-native';

function PlatformSelectPaddingBottom() {
  return Platform.OS === 'ios' ? 20 : 8;
}

function PlatformSelectShadow() {
  return Platform.select({
    web: {
      boxShadow: `0px 8px 24px rgba(108, 99, 255, 0.25)`,
    },
    default: {
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    },
  });
}
