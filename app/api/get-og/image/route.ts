/// app/api/get-og/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma/client";

const CACHE_TTL = 60 * 60 * 24 * 10 * 1000;

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        new URL(url);
    } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    try {
        const cached = await prisma.storedImage.findUnique({
            where: { sourceUrl_type: { sourceUrl: url, type: "og" } },
        });

        const now = Date.now();

        if (
            cached &&
            cached.createdAt &&
            now - cached.createdAt.getTime() < CACHE_TTL
        ) {
            return NextResponse.json({ imageUrl: cached.url }, { status: 200 });
        }

        const response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            },
            timeout: 5000,
        });

        const $ = cheerio.load(response.data);
        const ogImage =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content");
        if (!ogImage) {
            return NextResponse.json(
                { error: "No OG image found" },
                { status: 404 }
            );
        }

        const absoluteUrl = new URL(ogImage, url).href;

        const storingImage = await prisma.storedImage.upsert({
            where: { sourceUrl_type: { sourceUrl: url, type: "og" } },
            update: {
                url: absoluteUrl,
                expiresAt: new Date(Date.now() + CACHE_TTL),
            },
            create: {
                url: absoluteUrl,
                sourceUrl: url,
                type: "og",
                expiresAt: new Date(Date.now() + CACHE_TTL),
            },
        });

        return NextResponse.json(
            { imageUrl: storingImage.url },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching OG image:", error);
        return NextResponse.json(
            { error: "Failed to fetch OG image" },
            { status: 500 }
        );
    }
}
