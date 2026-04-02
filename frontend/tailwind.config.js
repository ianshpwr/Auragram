/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Outfit', 'ui-sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          900: '#2e1065',
        },
        aura: {
          dormant: '#6b7280',
          spark: '#eab308',
          rising: '#22c55e',
          resonant: '#14b8a6',
          influential: '#3b82f6',
          luminary: '#a855f7',
          apex: '#f59e0b',
        },
        surface: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a26',
          600: '#22223a',
          500: '#2e2e50',
        },
      },
      backgroundImage: {
        'apex-gradient': 'linear-gradient(135deg, #f59e0b, #a855f7)',
        'brand-gradient': 'linear-gradient(135deg, #7c3aed, #06b6d4)',
        'card-gradient': 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05))',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'rank-highlight': 'rankHighlight 1.5s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        rankHighlight: {
          '0%': { backgroundColor: 'rgba(124,58,237,0.4)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};
