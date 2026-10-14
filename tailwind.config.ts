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
        cream: "#0B0D14",
        paper: "#171A24",
        surfaceAlt: "#1D2130",
        hairline: "rgba(255,255,255,0.08)",
        minny: {
          DEFAULT: "#5B8DD9",
          soft: "rgba(91,141,217,0.18)",
          text: "#9CC3F2",
        },
        msg: {
          DEFAULT: "#EC6A94",
          soft: "rgba(236,106,148,0.18)",
          text: "#F5A3C2",
        },
        sleep: {
          DEFAULT: "#6B5B95",
          soft: "rgba(107,91,149,0.35)",
          text: "#B9ACDA",
        },
        accent: {
          DEFAULT: "#D9A441",
          soft: "rgba(217,164,65,0.18)",
          text: "#E8C277",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        cozy: "0 8px 24px -8px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
