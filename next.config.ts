/// next.config.ts

import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
    images: {
        domains: ["firebasestorage.googleapis.com"],
    },
    async rewrites() {
        return [
            {
                source: "/:path*",
                has: [
                    {
                        type: "host",
                        value: "admin.localhost:3000",
                    },
                ],
                destination: "/admin/:path*",
            },
            {
                source: "/:path*",
                has: [
                    {
                        type: "host",
                        value: "admin.starglow.io",
                    },
                ],
                destination: "/admin/:path*",
            },
        ];
    },
    experimental: {
        allowedDevOrigins: [
            "http://localhost:3000",
            "http://admin.localhost:3000",
            "https://admin.starglow.io",
        ],
    },
};

export default withAnalyzer(nextConfig);
