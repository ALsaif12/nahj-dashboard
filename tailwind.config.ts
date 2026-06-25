import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1440px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Brand palette — kept for charts and named accents.
        nahj: {
          'navy-deepest': '#050B14',  // background bottom
          'navy-deep': '#0A1628',     // background top
          navy: '#11253D',
          teal: '#3A8A9D',
          'teal-soft': '#5FB3C6',
          gold: '#D4B96A',            // brightened gold for dark mode
          'gold-deep': '#B89A4D',
          'gold-soft': '#E8D38F',
          ivory: '#F5F1E6',
          cream: '#F0E8D2',
        },
        rag: {
          green: '#10B981',
          'green-soft': 'rgba(16,185,129,0.12)',
          amber: '#F59E0B',
          'amber-soft': 'rgba(245,158,11,0.12)',
          red: '#EF4444',
          'red-soft': 'rgba(239,68,68,0.12)',
        },
        // Glass tokens (used directly in components for fine control).
        glass: {
          bg: 'rgba(255,255,255,0.05)',
          'bg-strong': 'rgba(255,255,255,0.08)',
          'bg-stronger': 'rgba(255,255,255,0.12)',
          border: 'rgba(255,255,255,0.10)',
          'border-strong': 'rgba(255,255,255,0.18)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-cairo)', 'Tahoma', 'Arial', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      backdropBlur: {
        glass: '24px',
        'glass-strong': '32px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Glass surfaces use these directly via .glass utilities below.
        glow: '0 0 24px -4px rgba(212,185,106,0.5)',
        'glow-green': '0 0 24px -4px rgba(16,185,129,0.45)',
        'glow-amber': '0 0 24px -4px rgba(245,158,11,0.45)',
        'glow-red': '0 0 24px -4px rgba(239,68,68,0.45)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
