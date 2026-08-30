/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#090909',
        surface: '#121212',
        'surface-hi': '#ECEAE5',
        'surface-3': '#202020',
        bg2: '#121212',
        bg3: '#202020',
        ink: '#F5F2EB',
        'ink-2': '#AAA59B',
        'ink-3': '#8C877E',
        ink2: '#AAA59B',
        ink3: '#8C877E',
        accent: '#FF6600',
        accenth: '#FF8A00',
        verify: '#4ADE80',
        stock: '#4ADE80',
        rating: '#FBBF24',
        urgent: '#FB7185',
        line: '#252525',
        'line-hi': '#3A3A3A',
        border: '#252525',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      transitionTimingFunction: {
        nav: 'cubic-bezier(.6,0,.4,1)',
        primary: 'cubic-bezier(.3,1,.3,1)',
        smooth: 'cubic-bezier(.7,0,.3,1)',
      },
      transitionDuration: {
        nav: '500ms',
        primary: '500ms',
        smooth: '700ms',
        fast: '300ms',
        short: '200ms',
      },
      borderRadius: {
        DEFAULT: '12px',
      },
    },
  },
  plugins: [],
};
