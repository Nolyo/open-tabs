/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './options.html',
    './options.tsx',
    './popup.tsx',
    './background.ts',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
