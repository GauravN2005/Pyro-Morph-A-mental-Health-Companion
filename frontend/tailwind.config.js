/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        void:    '#04040d',
        depth:   '#07071a',
        base:    '#0a0a1f',
        surface: '#0f0f28',
        elevated:'#141432',
        card:    '#191940',
      },
      width: { sidebar: '260px' },
      minWidth: { sidebar: '260px' },
      spacing: { sidebar: '260px', topbar: '72px' },
      screens: {
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}
