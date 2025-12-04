/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#0B0C15",
        accent: "#8B5CFF",
        cyan: "#24c0f7",
      },
      blur: {
        glass: "12px",
      },
    },
  },
  plugins: [],
};
