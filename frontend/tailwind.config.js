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
          50: '#eaffed',
          100: '#cbffcc',
          400: '#66ff4d',
          500: '#39ff14',
          600: '#29cc0e',
          700: '#1d990a',
          900: '#0a3303',
        },
        neon: {
          DEFAULT: '#39FF14',
          glow: 'rgba(57, 255, 20, 0.5)',
          dark: '#1a4d10'
        },
        surface: {
          900: '#000000',
          800: '#080808',
          700: '#111111',
          600: '#1a1a1a',
          500: '#222222',
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
      },
      backgroundImage: {
        'apex-gradient': 'linear-gradient(135deg, #f59e0b, #a855f7)',
        'brand-gradient': 'linear-gradient(135deg, #39ff14, #0cbaba)',
        'card-gradient': 'linear-gradient(135deg, rgba(57,255,20,0.1), rgba(12,186,186,0.05))',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 3s infinite',
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
          '0%': { backgroundColor: 'rgba(57,255,20,0.4)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.8' },
          '22%': { opacity: '0.9' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 10px rgba(57,255,20,0.2), 0 0 20px rgba(57,255,20,0.1)',
            opacity: '1' 
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.3)',
            opacity: '0.8'
          },
        }
      },
      boxShadow: {
        'neon': '0 0 5px theme("colors.brand.500"), 0 0 20px theme("colors.brand.500")',
        'neon-strong': '0 0 10px theme("colors.brand.500"), 0 0 30px theme("colors.brand.500"), 0 0 50px theme("colors.brand.500")',
      }
    },
  },
  plugins: [],
};
