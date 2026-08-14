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
        background: '#0F172A',
        card: '#1E293B',
        'card-glass': 'rgba(30, 41, 59, 0.7)',
        'primary-red': '#DC2626',
        'primary-red-hover': '#B91C1C',
        'slate-border': '#475569',
        'slate-muted': '#94A3B8',
        'success-green': '#16A34A',
        'warning-amber': '#D97706',
        'info-blue': '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radar 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(220, 38, 38, 0.8)' },
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 8px 32px 0 rgba(220, 38, 38, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
