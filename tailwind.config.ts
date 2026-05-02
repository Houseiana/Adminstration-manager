import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        ar: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#facc15",
          strong: "#eab308",
          soft: "#fef9c3",
        },
        ink: "#0f172a",
        muted: "#64748b",
        line: "#e5e7eb",
        "line-strong": "#d1d5db",
        surface: "#ffffff",
        bg: "#f7f8fa",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15,23,42,0.04)",
        DEFAULT:
          "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        lg: "0 10px 30px rgba(15,23,42,0.12)",
      },
      borderRadius: {
        DEFAULT: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
