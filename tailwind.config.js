/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-prompt)', 'sans-serif'],
        serif: ['var(--font-sarabun)', 'serif'],
      },
      colors: {
        forest: {
          50: '#f2fbf5',
          100: '#e1f6e8',
          500: '#22c55e',
          700: '#15803d',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          100: '#f5f5f4',
          500: '#a8a29e',
          800: '#44403c',
          900: '#292524',
        }
      }
    },
  },
  plugins: [],
};