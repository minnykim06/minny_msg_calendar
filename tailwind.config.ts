import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#FFF8F3",
        paper: "#FFFDFB",
        minny: {
          DEFAULT: "#E8846B",
          soft: "#FBE4DC",
          text: "#9A3E25",
        },
        msg: {
          DEFAULT: "#6E8FD1",
          soft: "#E3EAF8",
          text: "#2E4C8A",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        cozy: "0 8px 24px -8px rgba(154, 107, 83, 0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
