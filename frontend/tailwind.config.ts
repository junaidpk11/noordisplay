/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        amiri: ['Amiri', 'serif'],
      },
      colors: {
        navy: {
          950: '#071020',
          900: '#0a1628',
          800: '#0f1f35',
          700: '#152840',
          600: '#1e3a5f',
        },
        gold: '#c9a84c',
      },
    },
  },
  plugins: [],
};
