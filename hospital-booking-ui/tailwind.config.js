/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F4C81",
        secondary: "#0F6E56",
        surface: "#F8FAFC"
      }
    },
  },
  plugins: [],
}
