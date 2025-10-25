import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  daisyui: {
    themes: [
      {
        "custom-theme": { // Your custom theme name
          "primary": "#604652",          // Example: A bright blue
          "secondary": "#735557",        // Example: A muted gray
          "accent": "#9EBC8A",           // Example: A teal color
          "neutral": "#343a40",         // Example: A dark gray
          "base-100": "#ffffff",         // Base page color (usually white or off-white)
          "info": "#17a2b8",             // Info messages color
          "success": "#28a745",         // Success messages color
          "warning": "#ffc107",         // Warning messages color
          "error": "#dc3545",           // Error messages color
          // Dark theme inspired by the image
        },
      },
    ],
  },
  plugins: [daisyui],
};
export default config;
