import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import typescriptParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    // Global ignores configuration
    {
        ignores: [
            "**/web3/artifacts/**",
            "**/web3/typechain-types/**",
            "**/web3/cache/**",
            "**/node_modules/**",
            "**/.next/**",
            "**/dist/**",
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/components/magicui/**",
        ],
    },

    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: true,
            },
        },
        rules: {
            "@next/next/no-img-element": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "type-imports",
                },
            ],
            "@typescript-eslint/no-floating-promises": "error",
            "react-hooks/exhaustive-deps": "warn",
            "no-console": ["warn", { allow: ["warn", "error", "info"] }],
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];

export default eslintConfig;
