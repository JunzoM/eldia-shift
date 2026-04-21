import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      'var(--brand-bg)',
          surface: 'var(--brand-surface)',
          surface2:'var(--brand-surface2)',
          border:  'var(--brand-border)',
          accent:  'var(--brand-accent)',
          text:    'var(--brand-text)',
          muted:   'var(--brand-muted)',
          red:     'var(--brand-red)',
          yellow:  'var(--brand-yellow)',
          green:   'var(--brand-green)',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
        '200': '200',
        '9000': '9000',
        '9500': '9500',
        '9999': '9999',
      },
    },
  },
  plugins: [forms],
} satisfies Config
