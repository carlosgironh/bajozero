/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0066b2', // Existing blue
          secondary: '#004c8c', // Darker blue for hover
          accent: '#00a3ff', // Lighter blue for highlights
          light: '#e6f2fa', // Very light blue for hover backgrounds
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Modern font
      }
    },
  },
  plugins: [],
}
