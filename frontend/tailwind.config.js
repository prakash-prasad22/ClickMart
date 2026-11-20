/**
 * All colours come from CSS variables in src/styles/theme.css.
 * Change the theme there — no class names need to change.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1320px' } },
    extend: {
      colors: {
        primary: { DEFAULT: token('primary'), fg: token('primary-fg'), soft: token('primary-soft'), deep: token('primary-deep') },
        accent: { DEFAULT: token('accent'), soft: token('accent-soft') },
        ink: { DEFAULT: token('ink'), soft: token('ink-soft') },
        muted: token('muted'),
        bg: token('bg'),
        surface: { DEFAULT: token('surface'), alt: token('surface-alt') },
        line: token('line'),
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
        admin: {
          sidebar: token('admin-sidebar'),
          'sidebar-line': token('admin-sidebar-line'),
          'sidebar-text': token('admin-sidebar-text'),
          bg: token('admin-bg'),
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      borderRadius: { xl: 'var(--radius)', '2xl': 'calc(var(--radius) + 6px)' },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--ink) / 0.04), 0 4px 16px -4px rgb(var(--ink) / 0.06)',
        lift: '0 2px 4px rgb(var(--ink) / 0.04), 0 18px 40px -12px rgb(var(--ink) / 0.18)',
        ring: '0 0 0 4px rgb(var(--primary) / 0.15)',
      },
      transitionTimingFunction: { quiet: 'cubic-bezier(.22,.61,.36,1)' },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in': { from: { opacity: 0, transform: 'scale(.97)' }, to: { opacity: 1, transform: 'none' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        progress: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        'ken-burns': { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.06)' } },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(.22,.61,.36,1) both',
        'fade-in': 'fade-in .4s ease both',
        'scale-in': 'scale-in .25s cubic-bezier(.22,.61,.36,1) both',
        'slide-in-right': 'slide-in-right .35s cubic-bezier(.22,.61,.36,1) both',
        'slide-in-left': 'slide-in-left .35s cubic-bezier(.22,.61,.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'ken-burns': 'ken-burns 12s ease-out both',
      },
    },
  },
  plugins: [],
};
