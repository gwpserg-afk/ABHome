/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1217",
        charcoal: "#171D25",
        slatey: "#2A323D",
        brand: {
          DEFAULT: "#F2640A",
          dark: "#C94E04",
          soft: "#FF8534",
        },
        cloud: "#F5F6F8",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        display: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px -8px rgb(14 18 23 / 0.12)",
        lift: "0 24px 50px -20px rgb(14 18 23 / 0.35)",
        brand: "0 12px 30px -10px rgb(242 100 10 / 0.5)",
      },
    },
  },
  plugins: [],
};
