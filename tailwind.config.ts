// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            animation: { "gradient-shift": "gradient-shift 4s ease infinite" },
            keyframes: {
                "gradient-shift": {
                    "0%, 100%": { "background-position": "0% 50%" },
                    "50%": { "background-position": "100% 50%" },
                },
            },
            boxShadow: { glow: "0 0 30px var(--glow-color)" },
        },
    },
    plugins: [],
} satisfies Config;
