import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f4eee5",
        ivory: "#fffaf2",
        ink: "#171717",
        ember: "#d9472b",
        rust: "#9f311b",
        bronze: "#9f7a56",
        steel: "#5f656c",
        fog: "#d8d4cd"
      },
      fontFamily: {
        sans: ["var(--font-manrope)"],
        display: ["var(--font-barlow-condensed)"]
      },
      boxShadow: {
        card: "0 20px 60px rgba(23, 23, 23, 0.08)"
      },
      backgroundImage: {
        "garage-grid":
          "linear-gradient(rgba(23, 23, 23, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(23, 23, 23, 0.04) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
