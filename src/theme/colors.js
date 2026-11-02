/**
 * AlibiHub Design System - Colors & Styling Tokens
 * Professional, modern smartphone utility identity
 * Clean slate/neutral dark theme with reliable utility accents
 */

export const colors = {
  // Brand Palette - Clean Utility Blue
  primary: '#2563EB', // Professional Royal Blue
  primaryHover: '#1D4ED8',
  accent: '#38BDF8', // Sky Blue
  accentLight: '#93C5FD',
  accentGlow: 'rgba(37, 99, 235, 0.15)',

  // Backgrounds - Professional Neutral Dark Surfaces
  bgDark: '#0B0F19', // Main background (deep slate/charcoal)
  bgCard: '#131B2E', // Main surface card
  bgCardElevated: '#1E293B', // Elevated modal / popover card
  bgCardBorder: '#233048', // Subtle border
  bgInput: '#0F172A', // Input background

  // Call Specific Colors (Native Android / iOS inspired)
  callAccept: '#22C55E', // Phone Green
  callAcceptHover: '#16A34A',
  callAcceptGlow: 'rgba(34, 197, 94, 0.25)',
  callDecline: '#EF4444', // Phone Red
  callDeclineHover: '#DC2626',
  callDeclineGlow: 'rgba(239, 68, 68, 0.25)',
  callActive: '#3B82F6', // Active Call Blue

  // Specific Appearance Styles
  zaloBlue: '#0068FF', // Zalo signature clean blue
  zaloBlueDark: '#0052CC',
  zaloSurface: 'rgba(255, 255, 255, 0.18)',
  iosDark: '#1C1C1E', // iOS Dark Surface

  // Status & Feedback
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#38BDF8',

  // Typography
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B', // Slate 500
  textInverse: '#0F172A', // Slate 900

  // Category Badges (Subtle & clean)
  tagWork: '#3B82F6', // Công sở
  tagFamily: '#EC4899', // Gia đình
  tagFriends: '#10B981', // Bạn bè
  tagParty: '#F59E0B', // Tiệc tùng / Hẹn hò
  tagEmergency: '#EF4444', // Khẩn cấp
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
