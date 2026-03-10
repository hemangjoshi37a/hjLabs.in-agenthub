/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        's2': '#1e1e1e',
        border: '#222222',
        'border-2': '#2e2e2e',
        tx: '#e0e0e0',
        muted: '#666666',
        hash: '#f0c674',
        agent: '#81a2be',
        msg: '#b5bd68',
        chan: '#7aa2f7',
        danger: '#cc6666',
      },
      fontFamily: {
        mono: ['"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
