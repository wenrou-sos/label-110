/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        night: "#070A12",
        surface: "#0F1420",
        elevated: "#161C2C",
        raised: "#1C2435",
        line: "rgba(148, 163, 184, 0.12)",
        ink: {
          DEFAULT: "#F1F5F9",
          muted: "#94A3B8",
          faint: "#5B6678",
        },
        amber: {
          DEFAULT: "#F5B614",
          glow: "#FFC93C",
        },
        cyan: {
          DEFAULT: "#22D3EE",
          glow: "#67E8F9",
        },
        hot: {
          up: "#00E676",
          down: "#FF2D55",
          anomaly: "#FF1744",
        },
      },
      fontFamily: {
        display: ['"Oswald"', "sans-serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 40px -20px rgba(0,0,0,0.7)",
        glowAmber: "0 0 0 1px rgba(245,182,20,0.45), 0 0 24px -4px rgba(245,182,20,0.55)",
        glowRed: "0 0 0 1px rgba(255,23,68,0.5), 0 0 26px -4px rgba(255,23,68,0.6)",
        glowGreen: "0 0 0 1px rgba(0,230,118,0.45), 0 0 22px -6px rgba(0,230,118,0.5)",
      },
      keyframes: {
        "flash-down": {
          "0%": { backgroundColor: "rgba(0,230,118,0)" },
          "20%": { backgroundColor: "rgba(0,230,118,0.28)" },
          "100%": { backgroundColor: "rgba(0,230,118,0)" },
        },
        "flash-up": {
          "0%": { backgroundColor: "rgba(255,45,85,0)" },
          "20%": { backgroundColor: "rgba(255,45,85,0.28)" },
          "100%": { backgroundColor: "rgba(255,45,85,0)" },
        },
        "pulse-anomaly": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,23,68,0.55)" },
          "50%": { boxShadow: "0 0 0 6px rgba(255,23,68,0)" },
        },
        "dot-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "flash-down": "flash-down 1.1s ease-out",
        "flash-up": "flash-up 1.1s ease-out",
        "pulse-anomaly": "pulse-anomaly 1.6s ease-out infinite",
        "dot-pulse": "dot-pulse 1.4s ease-in-out infinite",
        scan: "scan 3.5s linear infinite",
        rise: "rise 0.4s ease-out both",
        ticker: "ticker 30s linear infinite",
      },
    },
  },
  plugins: [],
};
