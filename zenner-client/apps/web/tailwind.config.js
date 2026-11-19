import sharedConfig from "../../packages/ui/tailwind.config.js";

/** @type {import('tailwindcss').Config} */
export default {
  ...sharedConfig,
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/web/**/*.{ts,tsx}",
    "../../packages/core/src/**/*.{ts,tsx,json}"
  ],
};
