/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FDB82E',
          hover: '#E5A316',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          gray: '#262626',
          muted: '#525252',
          light: '#A3A3A3',
        },
        cream: '#FAF7F0',
      },
      fontFamily: {
        heading: ['Anek Bangla', 'sans-serif'],
        sans: ['Hind Siliguri', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

