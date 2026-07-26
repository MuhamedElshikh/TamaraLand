/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0D0B08",
          900: "#17130D",
          800: "#241E15",
          700: "#332A1B",
        },
        gold: {
          300: "#E8CD82",
          400: "#D9B664",
          500: "#C9A24B",
          600: "#AB8638",
          700: "#8A6A26",
        },
        cream: {
          50: "#F6F0E2",
          300: "#C9BE9F",
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "'Playfair Display'", "serif"],
        body: ["'Tajawal'", "'Cairo'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #E8CD82 0%, #C9A24B 45%, #8A6A26 100%)",
        "gold-gradient-soft":
          "linear-gradient(135deg, #F6F0E2 0%, #E8CD82 40%, #C9A24B 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 40px -12px rgba(201, 162, 75, 0.45)",
      },
    },
  },
  plugins: [],
};