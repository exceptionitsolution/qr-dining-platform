/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Fraunces', 'serif'],
        display: ['Fraunces', 'Cormorant Garamond', 'serif'],
        sans: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
      },
      colors: {
        gold: {
          light: '#F8DC9C',
          DEFAULT: '#E5A93C',
          dark: '#B87B22',
          glow: 'rgba(229, 169, 60, 0.35)',
        },
        obsidian: {
          950: '#070605',
          900: '#0C0A09',
          850: '#13100E',
          800: '#1C1815',
          700: '#2A2420',
          600: '#3D352F',
        },
        parchment: {
          50: '#FAF8F5',
          100: '#F5EFEB',
          200: '#E6DDD4',
          300: '#C9BDB0',
          400: '#9C8F80',
        },
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(229, 169, 60, 0.3)',
        'gold-sm': '0 0 15px -3px rgba(229, 169, 60, 0.25)',
        'luxury': '0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(229, 169, 60, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
