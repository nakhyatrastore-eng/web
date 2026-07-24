const { withUt } = require('uploadthing/tw');

/** @type {import('tailwindcss').Config} */
module.exports = withUt({
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        bg2: '#171717',
        ink: '#f7f5f0',
        ink2: '#b5b5b5',
        ink3: '#777777',
        accent: '#ff0000',
        'accent-h': '#cc0000',
        border: '#2a2a2a',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
      },
    },
  },
  plugins: [],
});
