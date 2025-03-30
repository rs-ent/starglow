/// app\layout.tsx

import type { Metadata } from "next";
import "./globals.css";

import Toast from "@/components/atoms/Toast";
import Providers from "./Providers";
import Loading from "@/components/organisms/Loading";

export const metadata: Metadata = {
  title: "Starglow",
  description: "Starglow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Loading />
          {children}
        </Providers>
      </body>
    </html>
  );
}