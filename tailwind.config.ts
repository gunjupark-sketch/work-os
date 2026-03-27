import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1A2B4C",
          light: "#2A3D62",
          dark: "#111D35",
        },
        cream: {
          DEFAULT: "#F0E3CE",
          light: "#F7F0E4",
          dark: "#E0D0B8",
        },
      },
    },
  },
  plugins: [],
};
export default config;
