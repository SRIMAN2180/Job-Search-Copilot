import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        page: "#0a0a0b",
        surface: {
          DEFAULT: "#18181b",
          secondary: "#1f1f23",
          tertiary: "#27272a",
        },
        border: {
          DEFAULT: "#27272a",
          hover: "#3f3f46",
        },
        text: {
          primary: "#fafafa",
          secondary: "#a1a1aa",
          muted: "#71717a",
        },
        accent: {
          DEFAULT: "#d97706",
          hover: "#f59e0b",
          light: "#422006",
        },
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(217,119,6,0.15)" },
          "50%": { boxShadow: "0 0 20px rgba(217,119,6,0.3)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
