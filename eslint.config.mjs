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
        ignores: [
            "**/web3/artifacts/**",
            "**/web3/typechain-types/**",
            "**/web3/cache/**",
            "**/node_modules/**",
            "**/.next/**",
            "**/dist/**",
            "**/*.test.ts",
            "**/*.test.tsx",
        ],
        rules: {
            // 성능에 중요한 핵심 규칙만 유지
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

            // Web3/블록체인 관련 중요 규칙
            "@typescript-eslint/no-floating-promises": "error",

            // React 성능 관련 핵심 규칙
            "react-hooks/exhaustive-deps": "warn",

            // 개발 편의성
            "no-console": ["warn", { allow: ["warn", "error", "info"] }],
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];

export default eslintConfig;
