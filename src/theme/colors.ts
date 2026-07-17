/**
 * OffPay's own visual identity — same palette as the web app's tailwind
 * config, not any competitor's branding.
 */
export const colors = {
  ink: '#0E2230',
  ink700: '#173445',
  ink600: '#22495D',
  paper: '#F3F5F4',
  card: '#FFFFFF',
  slate: '#5B6472',
  line: '#E2E6E4',
  lock: '#FFB020',
  lockDim: '#FFE1AC',
  unlock: '#1F9D74',
  unlockDim: '#BEE9D9',
  danger: '#C0392B',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSizes = {
  xs: 11,
  sm: 12.5,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
} as const;
