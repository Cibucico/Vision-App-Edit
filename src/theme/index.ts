// ─── SibrixVision Design System ───────────────────────────────────────────────

export const Colors = {
  // Backgrounds
  bg:       '#08090D',
  surface:  '#0F1118',
  surface2: '#161922',
  surface3: '#1D2230',

  // Borders
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.12)',

  // Brand
  blue:     '#3B6EF8',
  blueDim:  'rgba(59,110,248,0.15)',
  blueGlow: 'rgba(59,110,248,0.35)',
  cyan:     '#06D6DA',

  // Semantic
  green:    '#10E68A',
  red:      '#FF4455',
  redDim:   'rgba(255,68,85,0.15)',
  amber:    '#FFAA00',
  amberDim: 'rgba(255,170,0,0.15)',
  purple:   '#9B7FFF',

  // Text
  text:     '#F0F2F8',
  muted:    '#6B7491',
  dim:      '#3A3F55',

  // Transparent overlays
  overlay:  'rgba(4,5,10,0.97)',
};

export const Typography = {
  // Font families — add to your project via react-native-vector-icons + Google Fonts
  display: 'Syne-Bold',
  displayMed: 'Syne-Medium',
  body: 'DMSans-Regular',
  bodyMed: 'DMSans-Medium',

  sizes: {
    xs:   10,
    sm:   11,
    base: 13,
    md:   15,
    lg:   18,
    xl:   22,
    xxl:  26,
    hero: 36,
  },
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
