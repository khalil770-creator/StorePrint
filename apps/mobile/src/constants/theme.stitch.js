// StorePrint — Stitch Theme
// Source: Google Stitch handoff — DESIGN.md
// Primary: "StorePrint Blue" (#0052CC / #003d9b)
// Fonts: Hanken Grotesk (headlines) · Inter (body) · JetBrains Mono (data)

// ─── Colors ───────────────────────────────────────────────────────────────────

export const colors = {
  // Primary — StorePrint Blue
  primary:        '#0052CC',
  primaryDark:    '#003d9b',
  primaryLight:   '#b2c5ff',   // inverse-primary
  primaryBg:      '#dae2ff',   // primary-fixed

  // Surfaces
  background:     '#f8f9fb',
  white:          '#ffffff',
  inputBg:        '#ffffff',   // surface-container-lowest

  // Neutrals
  dark:           '#191c1e',   // on-surface
  darkGrey:       '#2e3132',   // inverse-surface
  midGrey:        '#434654',   // on-surface-variant
  lightGrey:      '#737685',   // outline
  border:         '#c3c6d6',   // outline-variant

  // Surface containers (card tints)
  surfaceLow:     '#f3f4f6',   // surface-container-low
  surfaceMid:     '#edeef0',   // surface-container
  surfaceHigh:    '#e7e8ea',   // surface-container-high

  // Semantic
  success:        '#1a8a4a',
  successBg:      '#d1fae5',
  warning:        '#F59E0B',
  warningBg:      '#FEF3C7',
  error:          '#ba1a1a',   // from design
  errorBg:        '#ffdad6',
  info:           '#0052CC',

  // Secondary (supporting icons, secondary actions)
  secondary:          '#535f73',
  secondaryBg:        '#d4e0f8',
  secondaryContainer: '#d4e0f8',
  onSecondaryContainer: '#576377',

  // Aliases used by Stitch screens
  onSurface:          '#191c1e',
  onSurfaceVariant:   '#434654',
  outlineVariant:     '#c3c6d6',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f3f4f6',
  surfaceContainer:       '#edeef0',
  surfaceContainerHigh:   '#e7e8ea',
  emerald:            '#10b981',   // clock card + active tabs (special, stays green)

  // Status chips — pill shaped, tinted backgrounds
  statusActive:       '#d1fae5',
  statusActiveText:   '#065F46',
  statusInactive:     '#edeef0',
  statusInactiveText: '#434654',
  statusWarning:      '#FEF3C7',
  statusWarningText:  '#92400E',
  statusError:        '#ffdad6',
  statusErrorText:    '#93000a',
};

// ─── Typography scale (px → RN unitless) ────────────────────────────────────
// Stitch scale: headline-lg 28 / headline-md 22 / headline-sm 18 /
//               body-lg 16 / body-md 14 / label-md 12 / data-mono 13

export const typography = {
  xs:   11,   // below label-md — captions
  sm:   12,   // label-md
  md:   14,   // body-md  (majority of UI)
  lg:   16,   // body-lg
  xl:   18,   // headline-sm
  xxl:  22,   // headline-md
  xxxl: 28,   // headline-lg
  mono: 13,   // data-mono (SKUs, timestamps, IDs)
};

// Font family tokens — used in StyleSheet fontFamily
// Requires expo-google-fonts packages (see setup note below)
export const fonts = {
  headline: 'HankenGrotesk_700Bold',    // headlines
  headlineMd: 'HankenGrotesk_600SemiBold',
  body: 'Inter_400Regular',             // body copy
  bodyMd: 'Inter_500Medium',
  label: 'Inter_600SemiBold',           // labels / caps
  mono: 'JetBrainsMono_500Medium',      // SKUs, IDs, timestamps
};

// ─── Border Radius (rem → px at 16px base) ──────────────────────────────────
// sm 0.25rem=4 · DEFAULT 0.5rem=8 · md 0.75rem=12 · lg 1rem=16 · xl 1.5rem=24

export const radius = {
  xs:   4,    // sm
  sm:   8,    // DEFAULT — buttons, inputs, standard cards
  md:   12,   // md
  lg:   16,   // lg — bottom sheets, large modals
  xl:   24,   // xl
  full: 9999, // pill — status chips only
};

// ─── Shadows (Tonal Layering, no colorful glows) ────────────────────────────
// Level 1: cards — 1px border OR soft shadow Y:2 Blur:4 Op:5%
// Level 2: modals/overlays — Y:8 Blur:16 Op:10%

export const shadow = {
  none: {},
  sm: {
    // Level 1 card shadow
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    // Level 2 modal/overlay shadow
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  // kept for backward-compat (clock card glow etc.) — now uses primary blue
  green: {
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
};

// ─── Spacing (4px base grid) ─────────────────────────────────────────────────
export const spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  edge: 16,   // horizontal safe-area margin
  gutter: 12, // between cards
};
