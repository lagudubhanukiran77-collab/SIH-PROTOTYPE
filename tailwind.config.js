/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#08080b',
          900: '#0f0f13',
          850: '#15151b',
          800: '#1b1b24',
          700: '#272733',
          600: '#3a3a4d',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        ember: {
          500: '#f97316',
          600: '#ea580c',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif', 'Georgia'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
