import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        foreground: "#FAFAFA",
        surface: {
          DEFAULT: "#111113",
          card: "#161618",
          cardHover: "#1C1C1F",
          secondary: "#18181B",
          border: "#27272A",
          borderSubtle: "#1F1F23",
          borderActive: "#3F3F46",
        },
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
          accent: "#8B5CF6",
          glow: "rgba(124, 58, 237, 0.25)",
        },
        muted: {
          DEFAULT: "#A1A1AA",
          dark: "#71717A",
          light: "#D4D4D8",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
          purple: "#8B5CF6",
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        "card-glow": "0 0 25px -5px rgba(124, 58, 237, 0.12)",
        "card-border": "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        "purple-glow": "0 0 20px rgba(124, 58, 237, 0.35)",
        "subtle": "0 2px 10px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(124, 58, 237, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(139, 92, 246, 0.45)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
