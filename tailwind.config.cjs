/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'navbar': '68px', // 기본 navbar 높이
        'navbar-lg': '90px', // 큰 화면에서의 navbar 높이 (2xl: 1536px+)
      }
    },
  },
  plugins: [],
}