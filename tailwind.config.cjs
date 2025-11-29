/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",   // blue
        secondary: "#0ea5e9", // teal
        background: "#f8fafc",
        surface: "#ffffff",
        text: {
          primary: "#111827",
          muted: "#6b7280",
        },
        sidebar: {
          bg: "#1e293b",
          hover: "#334155",
        },
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
