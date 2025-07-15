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
            animation: {
                "gradient-shift": "gradient-shift 4s ease infinite",
                "pulse-slow": "pulse 4s ease-in-out infinite",
                "float-slow": "float 8s ease-in-out infinite",
                "float-slow-reverse": "float-reverse 10s ease-in-out infinite",
                "float-medium": "float 6s ease-in-out infinite",
            },
            keyframes: {
                "gradient-shift": {
                    "0%, 100%": { "background-position": "0% 50%" },
                    "50%": { "background-position": "100% 50%" },
                },
                float: {
                    "0%, 100%": {
                        transform: "translateY(0px) translateX(0px) scale(1)",
                        opacity: "0.6",
                    },
                    "33%": {
                        transform:
                            "translateY(-20px) translateX(10px) scale(1.05)",
                        opacity: "0.8",
                    },
                    "66%": {
                        transform:
                            "translateY(10px) translateX(-10px) scale(0.95)",
                        opacity: "0.4",
                    },
                },
                "float-reverse": {
                    "0%, 100%": {
                        transform: "translateY(0px) translateX(0px) scale(1)",
                        opacity: "0.5",
                    },
                    "33%": {
                        transform:
                            "translateY(15px) translateX(-15px) scale(0.9)",
                        opacity: "0.7",
                    },
                    "66%": {
                        transform:
                            "translateY(-15px) translateX(15px) scale(1.1)",
                        opacity: "0.3",
                    },
                },
            },
            boxShadow: { glow: "0 0 30px var(--glow-color)" },
        },
    },
    plugins: [],
} satisfies Config;
