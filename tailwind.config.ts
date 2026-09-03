import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        muted: "#F5F5F5",
        mutedForeground: "#525252",
        border: "#000000",
        borderLight: "#E5E5E5",
        card: "#FFFFFF",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ['"Source Serif 4"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        "7xl": "6rem",
        "8xl": "8rem",
        "9xl": "10rem",
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "9999px", // preserved only for perfectly circular elements (e.g. avatars)
      },
      transitionDuration: {
        instant: "100ms",
      },
    },
  },
  plugins: [],
};
export default config;
