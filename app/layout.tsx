/// app\layout.tsx

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebVitals } from "@/lib/tools/web-vitals";
import type { Metadata } from "next";
import "./globals.css";

import Toast from "@/components/atoms/Toast";
import Providers from "./Providers";
import Loading from "@/components/atoms/Loading";
import Navigation from "@/components/navigation/Navigation";

export const metadata: Metadata = {
    // 기본 메타데이터
    title: {
        default: "Starglow: RWA K-POP FanFi",
        template: "%s | Starglow",
    },
    description: "✨ Glow and Grow Together with Your Star! 🌟",
    keywords: [
        "Web3",
        "Blockchain",
        "NFT",
        "Story Protocol",
        "Decentralized",
        "Starglow",
        "RWA",
        "K-POP",
        "FanFi",
        "DAO",
        "DeFi",
    ],
    authors: [{ name: "Starglow Team" }],
    creator: "Starglow",
    publisher: "Starglow",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },

    // Open Graph / Facebook
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://starglow.io",
        siteName: "Starglow",
        title: "Starglow: RWA K-POP FanFi",
        description: "✨ Glow and Grow Together with Your Star! 🌟",
        images: [
            {
                url: "https://starglow.io/default-og-image.png",
                width: 1087,
                height: 614,
                alt: "Starglow - RWA K-POP FanFi",
            },
        ],
    },

    // Twitter
    twitter: {
        card: "summary_large_image",
        title: "Starglow: RWA K-POP FanFi",
        description: "✨ Glow and Grow Together with Your Star! 🌟",
        creator: "@starglowP",
        images: ["https://starglow.io/default-og-image.png"],
        site: "@starglowP",
    },

    // Icons
    icons: {
        icon: [
            {
                url: "/favicon-gradient.svg",
                sizes: "16x16",
                type: "image/svg+xml",
                rel: "icon",
            },
            {
                url: "/favicon-gradient.svg",
                sizes: "32x32",
                type: "image/svg+xml",
            },
            {
                url: "/favicon-gradient.svg",
                sizes: "96x96",
                type: "image/svg+xml",
            },
            {
                url: "/favicon-gradient.svg",
                sizes: "192x192",
                type: "image/svg+xml",
            },
            {
                url: "/favicon-gradient.svg",
                sizes: "512x512",
                type: "image/svg+xml",
            },
        ],
        apple: [
            {
                url: "/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
        ],
        other: [
            {
                rel: "mask-icon",
                url: "/favicon-gradient.svg",
                color: "#000000",
            },
        ],
    },

    // Apple specific
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Starglow",
        startupImage: [
            {
                url: "/web-app-manifest-512x512.png",
                media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/web-app-manifest-512x512.png",
                media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/web-app-manifest-192x192.png",
                media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
        ],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <Providers>
                    <WebVitals />
                    <Loading />
                    <Toast />
                    <SpeedInsights />
                    <Analytics />
                    <Navigation />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
