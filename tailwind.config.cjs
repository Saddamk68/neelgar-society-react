/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // All values reference CSS variables defined in App.css.
        // To change a color: update App.css only — Tailwind classes update automatically.
        primary:    "var(--color-primary)",
        secondary:  "var(--color-secondary)",
        background: "var(--color-background)",
        surface:    "var(--color-surface)",
        text: {
          primary: "var(--color-text-primary)",
          muted:   "var(--color-text-muted)",
        },
        sidebar: {
          bg:    "var(--color-sidebar-bg)",
          hover: "var(--color-sidebar-hover)",
        },
        success: "var(--color-success)",
        danger:  "var(--color-danger)",
        warning: "var(--color-warning)",
      },
    },
  },
  plugins: [],
};
