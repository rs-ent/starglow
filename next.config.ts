/// next.config.ts

import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
    images: {
        domains: [
            "firebasestorage.googleapis.com",
            "qvosmzgjveuikjktqknp.supabase.co",
            "pv9tnti4kdvwxlot.public.blob.vercel-storage.com",
        ],
    },

    allowedDevOrigins: [
        "local-origin.dev",
        "*.local-origin.dev",
        "http://localhost:3000",
        "http://admin.localhost:3000",
        "http://admin.localhost",
        "admin.localhost",
        "https://admin.starglow.io",
    ],

    experimental: {
        serverActions: {
            bodySizeLimit: "50mb",
        },
    },
};

export default withAnalyzer(nextConfig);
