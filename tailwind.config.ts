import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#07080F", 900: "#0C0F1C", 800: "#131729", 700: "#1C2238", 600: "#2A3150", 500: "#4A5378" },
        neon: { lime: "#C6FF3D", cyan: "#3DE8FF", pink: "#FF3D9A", gold: "#FFC93D" },
      },
      fontFamily: {
        display: ['"Black Han Sans"', '"Noto Sans KR"', "system-ui", "sans-serif"],
        sans: ['"Noto Sans KR"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)", opacity: "1" } },
        pulseRing: { "0%": { boxShadow: "0 0 0 0 rgba(198,255,61,.5)" }, "100%": { boxShadow: "0 0 0 14px rgba(198,255,61,0)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        rise: "rise .5s ease-out both",
        pop: "pop .45s cubic-bezier(.2,.9,.3,1.3) both",
        pulseRing: "pulseRing 1.6s ease-out infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
