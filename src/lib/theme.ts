// Ascelstack design tokens (mirrors the brand site: ink / accent / tint / paper).
export const colors = {
  ink: '#1D2D3D',
  inkDeep: '#142130',
  inkRaised: '#23374B',
  accent: '#5980A6',
  tint: '#94BCE3',
  tintSoft: '#E4EEF8',
  paper: '#F2F2F3',
  paperRaised: '#FAFAFB',
  paperSunk: '#E8E8EA',
  white: '#FFFFFF',
  text: '#1D1F20',
  textMuted: '#5D5D60',
  textFaint: '#8C8C91',
  onInk: '#F2F2F3',
  onInkMuted: '#9FB0C1',
  line: 'rgba(29,45,61,0.10)',
  lineStrong: 'rgba(29,45,61,0.18)',
  lineOnInk: 'rgba(242,242,243,0.12)',
  success: '#2F8F6B',
  successSoft: '#E3F2EC',
  danger: '#C2483D',
  dangerSoft: '#F8E6E4',
  warn: '#B7832F',
  warnSoft: '#F7EEDC',
  // App surfaces (light blue-grey canvas with white cards, derived from the brand tint).
  canvas: '#EDF2F8',
  card: '#FFFFFF',
  gold: '#D7A93F',
  goldSoft: '#FBF1DA',
};

export const fonts = {
  display: 'InterTight_700Bold',
  body: 'InterTight_400Regular',
  medium: 'InterTight_500Medium',
  semibold: 'InterTight_600SemiBold',
  bold: 'InterTight_700Bold',
  // One family across the app. Kept as aliases so numbers line up without a second font.
  mono: 'InterTight_500Medium',
  monoMedium: 'InterTight_600SemiBold',
};

export const radius = { s: 10, m: 14, l: 22, xl: 28, pill: 999 };
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 28 };

export const shadow = {
  card: {
    shadowColor: '#1D2D3D',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  lift: {
    shadowColor: '#1D2D3D',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
};
