/// app/api/get-og/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma/client";

const CACHE_TTL = 60 * 60 * 24 * 10000; // 10 days

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        const cached = await prisma.ogImageCache.findUnique({
            where: { targetUrl: url },
        });

        const now = Date.now();

        if (cached && now - new Date(cached.createdAt).getTime() < CACHE_TTL) {
            return NextResponse.json({ imageUrl: cached.imageUrl });
        }

        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            },
            timeout: 5000,
        });

        const $ = cheerio.load(response.data);
        const ogImage = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content");

        if (!ogImage) {
            return NextResponse.json({ error: "No OG image found" }, { status: 404 });
        }

        const absoluteUrl = new URL(ogImage, url).href;

        await prisma.ogImageCache.upsert({
            where: { targetUrl: url },
            update: {
                imageUrl: absoluteUrl,
                createdAt: new Date(),
            },
            create: {
                targetUrl: url,
                imageUrl: absoluteUrl,
            },
        });

        return NextResponse.json({ imageUrl: absoluteUrl });
    } catch (error) {
        console.error("Error fetching OG image:", error);
        return NextResponse.json({ error: "Failed to fetch OG image" }, { status: 500 });
    }
}