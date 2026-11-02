/**
 * AlibiHub Design System - Colors & Styling Tokens
 * Warm, elegant, minimal smartphone utility identity
 * Inspired by warm ivory, terracotta, olive green, and dark brown
 */

export const colors = {
  // Brand Palette - Warm Terracotta & Earthy Tones
  primary: '#C66A2B', // Terracotta / Burnt Orange
  primaryHover: '#B25920',
  primaryLight: '#FBECE3',
  primaryMuted: '#E5A475',

  secondary: '#62694B', // Muted Olive Green
  secondaryHover: '#52583E',
  secondaryLight: '#EBF0E4',

  accent: '#D97D3E',
  accentLight: '#F5E6DC',
  accentGlow: 'rgba(198, 106, 43, 0.12)',

  // Backgrounds - Warm Ivory & Soft Beige
  bgDark: '#F8F1E5', // Main app background (warm ivory / cream)
  bgCard: '#FFFDF8', // Main card / surface (soft warm cream surface)
  bgCardElevated: '#FFFFFF', // Elevated surface / modal
  bgCardBorder: '#E9DDCB', // Soft warm beige border
  bgInput: '#FFFFFF', // Clean input field surface
  bgMuted: '#EFE7D8', // Muted container background

  // Typography - Rich Warm Dark Browns
  textPrimary: '#352A21', // Dark Brown (high contrast, ultra readable)
  textSecondary: '#6B5B4E', // Medium warm brown
  textMuted: '#948272', // Soft muted warm brown
  textInverse: '#FFFDF8', // Off-white on terracotta/dark badges

  // Status & Feedback - Harmonized with warm palette
  success: '#3F7A4D', // Forest warm green
  successLight: '#E8F3EA',
  warning: '#C27803', // Warm amber
  warningLight: '#FEF6E7',
  error: '#C53030', // Deep warm red
  errorLight: '#FDECEC',
  info: '#4B7B94', // Muted slate blue
  infoLight: '#E9F2F7',

  // Category Badges (Warm, elegant tones)
  tagWork: '#4A6984', // Công sở (slate blue)
  tagFamily: '#A85A48', // Gia đình (warm rust)
  tagFriends: '#597552', // Bạn bè (olive green)
  tagParty: '#B26F2C', // Tiệc tùng / Hẹn hò (warm amber)
  tagEmergency: '#B9382B', // Khẩn cấp (crimson terracotta)

  // CALL SPECIFIC COLORS - PROTECTED (DO NOT CHANGE)
  callAccept: '#22C55E', // Phone Green
  callAcceptHover: '#16A34A',
  callAcceptGlow: 'rgba(34, 197, 94, 0.25)',
  callDecline: '#EF4444', // Phone Red
  callDeclineHover: '#DC2626',
  callDeclineGlow: 'rgba(239, 68, 68, 0.25)',
  callActive: '#3B82F6', // Active Call Blue

  // Specific Call Appearance Styles - PROTECTED
  zaloBlue: '#0068FF',
  zaloBlueDark: '#0052CC',
  zaloSurface: 'rgba(255, 255, 255, 0.18)',
  iosDark: '#1C1C1E',
};

export const typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 26,
    display: 34,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 9999,
};
