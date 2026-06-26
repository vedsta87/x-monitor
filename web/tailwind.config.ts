import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "'Noto Sans JP'",
          "'Hiragino Kaku Gothic Pro'", "'MS PGothic'", "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
