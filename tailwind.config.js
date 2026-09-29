/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ice: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
        peach: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          900: '#881337',
        }
      }
    },
  },
  plugins: [],
};
