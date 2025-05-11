/// app\layout.tsx

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import "./globals.css";

import Toast from "@/components/atoms/Toast";
import Providers from "./Providers";
import Loading from "@/components/organisms/Loading";
import Navigation from "@/components/templates/Navigation";
export const metadata: Metadata = {
    title: "Starglow",
    description: "Starglow",
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
                    {children}
                </Providers>
            </body>
        </html>
    );
}
