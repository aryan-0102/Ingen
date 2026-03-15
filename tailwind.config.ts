import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        accent: { DEFAULT: '#0EA5E9', light: '#38BDF8', dark: '#0284C7' },
        surface: { DEFAULT: 'rgba(255,255,255,0.7)', dark: 'rgba(26,26,46,0.8)' },
      },
      backdropBlur: { xl: '24px' },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      boxShadow: {
        glass: '0 8px 30px rgb(0 0 0 / 0.06)',
        'glass-dark': '0 8px 30px rgb(0 0 0 / 0.3)',
        glow: '0 0 20px rgba(14, 165, 233, 0.15)',
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-dot': 'bounceDot 1.4s infinite ease-in-out both',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
