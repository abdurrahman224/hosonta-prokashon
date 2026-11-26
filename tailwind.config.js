import theme from './src/theme/theme.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: theme.colors.brand,
        ink: theme.colors.ink,
        line: theme.colors.line,
        surface: theme.colors.surface,
        status: theme.colors.status,
        primary: {
          DEFAULT: theme.colors.brand.DEFAULT,
          hover: theme.colors.brand.hover,
        },
        dark: {
          DEFAULT: theme.colors.public.dark,
          gray: theme.colors.public.darkGray,
          muted: theme.colors.ink.muted,
          light: theme.colors.public.darkLight,
        },
        cream: theme.colors.public.cream,
      },
      fontFamily: theme.fontFamily,
      boxShadow: {
        '2xs': theme.boxShadow['2xs'],
        xs: theme.boxShadow.xs,
        modal: theme.boxShadow.modal,
      },
    },
  },
  plugins: [],
}
