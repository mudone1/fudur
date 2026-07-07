import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: "#F05A00",
          dark: "#C84800",
          light: "#FFF3EC",
          mid: "#FFE0CC",
        },
        green: {
          DEFAULT: "#4A7C2F",
          dark: "#3A6224",
          light: "#EFF5E8",
          mid: "#C8E0B0",
        },
        surface: {
          DEFAULT: "#F6F5F2",
          alt: "#ECEAE4",
        },
        border: "#E2E0D8",
        ink: "#1A1A18",
        muted: "#6B6B68",
      },
      borderRadius: {
        fudur: "12px",
      },
      spacing: {
        nav: "60px",
        "bottom-nav": "64px",
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};
export default config;
