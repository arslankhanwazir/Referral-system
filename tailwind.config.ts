import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        paper: "#F7F7F5",
        line: "#E3E1DB",
        accent: "#2F6F5E",
        accentDark: "#204F42",
        warn: "#B3541E",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
        body: ["-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Consolas", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;