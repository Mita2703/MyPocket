/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─── Palet Warna Dusty Rose (sesuai PRD § 4) ──────────────────────────
      colors: {
        rose: {
          50:  '#FDF8F8',  // Extra-light bg / kartu tipis
          100: '#EEBAB7',  // Rose muda  — aksen icon, bg avatar
          300: '#E68A8D',  // Rose medium — progress bar aktif
          500: '#C96068',  // Rose utama  — CTA button, hero card
          700: '#AB4543',  // Rose tua    — teks angka penting, icon kategori
          900: '#9B4443',  // Rose gelap  — heading & title
        },
      },

      // ─── Tipografi ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // ─── Border Radius Sesuai PRB § 3.2 ──────────────────────────────────
      borderRadius: {
        '3xl': '24px',  // Modal overlay backdrop
        '2xl': '16px',  // Card & modal container
        'xl':  '12px',  // Input, button, pill
        'lg':  '10px',  // Small chip
      },

      // ─── Custom Box Shadows ───────────────────────────────────────────────
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px 0 rgba(0,0,0,0.08)',
        'rose':    '0 4px 16px 0 rgba(201,96,104,0.30)',
        'fab':     '0 6px 24px 0 rgba(201,96,104,0.40)',
      },

      // ─── Animasi & Keyframes ──────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-in': {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '60%':  { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'progress-fill': {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--progress-width, 0%)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.25s ease-out both',
        'fade-up':    'fade-up 0.30s ease-out both',
        'slide-up':   'slide-up 0.30s cubic-bezier(0.32,0.72,0,1) both',
        'slide-down': 'slide-down 0.25s ease-out both',
        'scale-in':   'scale-in 0.20s ease-out both',
        'bounce-in':  'bounce-in 0.40s ease-out both',
        'shimmer':    'shimmer 1.5s infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
