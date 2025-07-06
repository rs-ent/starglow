/// app\layout.tsx

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import type { Metadata } from "next";
import "./globals.css";

import Toast from "@/components/atoms/Toast";

import Providers from "./Providers";

import Loading from "@/components/atoms/Loading";
import Navigation from "@/components/navigation/Navigation";
import GlobalNotificationManager from "@/components/notifications/GlobalNotificationManager";

export const metadata: Metadata = {
    // 기본 메타데이터
    title: {
        default:
            "Starglow: The Next-Gen Web3 Platform for K-POP & Fan Engagement",
        template: "%s | Starglow",
    },
    description:
        "Starglow is a next-generation Web3 entertainment platform revolutionizing K-POP fan engagement and artist valuation through blockchain, NFTs, and real-world asset integration. Join a global community where fans and artists grow together, transparently and securely.",
    keywords: [
        "Web3",
        "Blockchain",
        "NFT",
        "K-POP",
        "Fan Engagement",
        "FanFi",
        "Real World Assets",
        "Starglow",
        "DAO",
        "DeFi",
        "Artist Valuation",
        "Music Platform",
        "Entertainment",
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
        title: "Starglow: The Next-Gen Web3 Platform for K-POP & Fan Engagement",
        description:
            "Starglow is a next-generation Web3 entertainment platform for K-POP, connecting fans and artists through blockchain, NFTs, and real-world assets.",
        images: [
            {
                url: "https://starglow.io/default-og-image.png",
                width: 1087,
                height: 614,
                alt: "Starglow - Web3 K-POP Platform",
            },
        ],
    },

    // Twitter
    twitter: {
        card: "summary_large_image",
        title: "Starglow: The Next-Gen Web3 Platform for K-POP & Fan Engagement",
        description:
            "Revolutionizing K-POP fan engagement and artist valuation with blockchain, NFTs, and real-world assets. Join Starglow today.",
        creator: "@starglowP",
        images: ["https://starglow.io/default-og-image.png"],
        site: "@starglowP",
    },

    icons: {
        apple: [
            {
                url: "/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
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
                    <Loading />
                    <Toast />
                    <SpeedInsights />
                    <Analytics />
                    <Navigation />
                    <GlobalNotificationManager />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
