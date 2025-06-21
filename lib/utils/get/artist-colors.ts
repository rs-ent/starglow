/// lib/utils/get/artist-colors.ts

import { formatHexToRGBA } from "@/lib/utils/format";

import type { Artist } from "@prisma/client";

// HSL 기반의 기본 색상
const defaultBGColors = [
    HSLToHex(260, 85, 10), // 어두운 보라
    HSLToHex(260, 70, 25), // 중간 보라
    HSLToHex(260, 55, 60), // 밝은 보라
];

const defaultFGColors = [
    HSLToHex(0, 0, 100), // 흰색
    HSLToHex(0, 0, 95), // 거의 흰색
    HSLToHex(0, 0, 90), // 매우 밝은 회색
];

const colorCache = new Map<string, [number, number, number]>();

export const ArtistBG = (
    artist: Artist,
    importance: number,
    opacity?: number
) => {
    const colors = artist.backgroundColors;
    const baseColor =
        colors.length > 0
            ? colors[importance] || makeSimilarColor(colors, importance)
            : defaultBGColors[importance];
    const alpha = (opacity ?? 100) / 100;
    return formatHexToRGBA(baseColor, alpha);
};

export const ArtistFG = (
    artist: Artist,
    importance: number,
    opacity?: number
) => {
    const colors = artist.foregroundColors;
    const baseColor =
        colors.length > 0
            ? colors[importance] || makeSimilarColor(colors, importance)
            : defaultFGColors[importance];
    const alpha = (opacity ?? 100) / 100;
    return formatHexToRGBA(baseColor, alpha);
};

function hexToHSL(hex: string): [number, number, number] {
    if (colorCache.has(hex)) {
        return colorCache.get(hex)!;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        console.warn(`Invalid hex color: ${hex}, using default color`);
        return [0, 0, 0];
    }

    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    const result: [number, number, number] = [h * 360, s * 100, l * 100];
    colorCache.set(hex, result);
    return result;
}

// HSL을 16진수로 변환
function HSLToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0");
    };

    return `#${f(0)}${f(8)}${f(4)}`;
}

// 유사 색상 생성
function makeSimilarColor(colors: string[], importance: number) {
    const targetColor = colors[colors.length - 1];
    const [h, s, l] = hexToHSL(targetColor);

    const diff = importance - colors.length - 1;

    // 더 자연스러운 색상 변화를 위한 값 조정
    const hueShift = diff * 10; // 10도씩 변화
    const saturationChange = diff * 3; // 3%씩 변화
    const lightnessChange = diff * 2; // 2%씩 변화

    const newH = (h + hueShift) % 360;
    const newS = Math.max(0, Math.min(100, s + saturationChange));
    const newL = Math.max(0, Math.min(100, l + lightnessChange));

    return HSLToHex(newH, newS, newL);
}
