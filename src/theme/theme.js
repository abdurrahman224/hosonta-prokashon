/**
 * Single source of truth for the Hosonta Prokashon design system.
 * Update brand, neutral, or semantic tokens here to propagate across
 * Tailwind utilities, CSS custom properties, charts, toasts, and print templates.
 */
export const theme = {
  colors: {
    brand: {
      DEFAULT: '#FDB82E',
      hover: '#E5A316',
      active: '#CC8E0B',
      tint: '#FDE08D',
      shade: '#B7790A',
    },
    ink: {
      DEFAULT: '#111111',
      muted: '#525252',
      subtle: '#737373',
    },
    line: {
      DEFAULT: '#E5E5E5',
      strong: '#D4D4D4',
    },
    surface: {
      DEFAULT: '#FFFFFF',
      muted: '#F7F7F7',
      subtle: '#FAFAFA',
    },
    status: {
      success: '#15803D',
      warning: '#B45309',
      danger: '#DC2626',
      info: '#0F766E',
    },
    public: {
      cream: '#FAF7F0',
      dark: '#0A0A0A',
      darkGray: '#262626',
      darkLight: '#A3A3A3',
      white: '#FFFFFF',
      black: '#000000',
    },
    chart: {
      series: ['#FDB82E', '#111111', '#E5A316', '#525252', '#FDE08D', '#A3A3A3'],
      grid: '#E5E5E5',
      axis: '#525252',
      tooltipBg: '#FFFFFF',
      tooltipBorder: '#E5E5E5',
      tooltipText: '#111111',
    },
    invoice: {
      text: '#111111',
      muted: '#525252',
      border: '#E5E5E5',
      surface: '#FFFFFF',
      surfaceMuted: '#F7F7F7',
      brand: '#FDB82E',
      danger: '#DC2626',
    },
  },
  fontFamily: {
    heading: ['Anek Bangla', 'sans-serif'],
    sans: ['Hind Siliguri', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    full: '9999px',
  },
  spacing: {
    sidebar: '18rem',
    topbar: '4.5rem',
    cardPadding: '1.25rem',
    sectionGap: '1.5rem',
  },
  boxShadow: {
    '2xs': '0 1px 1px 0 rgba(17, 17, 17, 0.04)',
    xs: '0 1px 2px 0 rgba(17, 17, 17, 0.05)',
    sm: '0 1px 3px 0 rgba(17, 17, 17, 0.08), 0 1px 2px -1px rgba(17, 17, 17, 0.05)',
    md: '0 4px 6px -1px rgba(17, 17, 17, 0.08), 0 2px 4px -2px rgba(17, 17, 17, 0.05)',
    lg: '0 10px 15px -3px rgba(17, 17, 17, 0.08), 0 4px 6px -4px rgba(17, 17, 17, 0.04)',
    modal: '0 20px 35px -10px rgba(17, 17, 17, 0.16)',
  },
}

/**
 * Exposes theme tokens as CSS custom properties on :root so any dynamic CSS
 * or SVG styles can also reference var(--color-*) without duplicating values.
 */
export function applyThemeCssVariables(target = typeof document !== 'undefined' ? document.documentElement : null) {
  if (!target) return
  const { colors, borderRadius, boxShadow } = theme
  const entries = {
    '--color-brand': colors.brand.DEFAULT,
    '--color-brand-hover': colors.brand.hover,
    '--color-brand-active': colors.brand.active,
    '--color-brand-tint': colors.brand.tint,
    '--color-brand-shade': colors.brand.shade,
    '--color-ink': colors.ink.DEFAULT,
    '--color-ink-muted': colors.ink.muted,
    '--color-ink-subtle': colors.ink.subtle,
    '--color-line': colors.line.DEFAULT,
    '--color-line-strong': colors.line.strong,
    '--color-surface': colors.surface.DEFAULT,
    '--color-surface-muted': colors.surface.muted,
    '--color-surface-subtle': colors.surface.subtle,
    '--color-status-success': colors.status.success,
    '--color-status-warning': colors.status.warning,
    '--color-status-danger': colors.status.danger,
    '--color-status-info': colors.status.info,
    '--color-cream': colors.public.cream,
    '--color-dark': colors.public.dark,
    '--radius-sm': borderRadius.sm,
    '--radius-md': borderRadius.md,
    '--radius-lg': borderRadius.lg,
    '--radius-xl': borderRadius.xl,
    '--shadow-xs': boxShadow.xs,
    '--shadow-sm': boxShadow.sm,
    '--shadow-md': boxShadow.md,
    '--shadow-modal': boxShadow.modal,
  }
  for (const [key, value] of Object.entries(entries)) {
    target.style.setProperty(key, value)
  }
}

export default theme
