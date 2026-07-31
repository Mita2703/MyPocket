/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#FDF8F8',   // Extra light background
          100: '#EEBAB7',  // Light dusty rose (Icon bg, avatar)
          300: '#E68A8D',  // Medium rose (Active progress bar)
          500: '#C96068',  // Primary rose (Main CTA, hero card)
          700: '#AB4543',  // Dark rose (Category icons, important numbers)
          900: '#9B4443',  // Darkest rose (Headings)
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
