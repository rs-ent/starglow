export const formatCurrency = (
    amount: number,
    currency: string,
    usdMultiples = 0.01
) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.replace("CURRENCY_", ""),
        minimumFractionDigits: currency === "CURRENCY_KRW" ? 0 : 2,
    }).format(currency === "CURRENCY_KRW" ? amount : amount * usdMultiples);
};

export const getTimeUntilEnd = (endDate: Date): string => {
    if (!endDate) return "N/A";

    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h left`;
};

export function formatDate(date: Date, withTime: boolean = true) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return withTime
        ? `${yyyy}.${mm}.${dd} ${hh}:${min}`
        : `${yyyy}.${mm}.${dd}`;
}

export function formatWaitTime(seconds: number): string {
    if (seconds <= 0) return "now";
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= 24 * 3600;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    const parts = [];
    if (days) parts.push(`${days} Days`);
    if (hours) parts.push(`${hours} Hours`);
    if (minutes) parts.push(`${minutes} Minutes`);
    if (seconds) parts.push(`${seconds} Seconds`);
    return parts.join(" ");
}

export function formatHexToRGBA(input: string, alpha: number = 1): string {
    const hex = input.replace("#", "");
    let r, g, b, a;

    if (hex.length === 3) {
        // e.g. #abc
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
        a = alpha;
    } else if (hex.length === 6) {
        // e.g. #aabbcc
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = alpha;
    } else if (hex.length === 8) {
        // e.g. #aabbccdd
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16) / 255;
    } else {
        throw new Error("Invalid hex color format");
    }

    return `rgba(${r},${g},${b},${a})`;
}

export function formatColor(mainColorInput: string) {
    const mainColor = mainColorInput.replace("#", "");
    const r = parseInt(mainColor.slice(0, 2), 16);
    const g = parseInt(mainColor.slice(2, 4), 16);
    const b = parseInt(mainColor.slice(4, 6), 16);

    const backgroundColor = `rgb(${r},${g},${b})`;

    // RGB를 HSL로 변환
    const [h, s, l] = rgbToHsl(r, g, b);

    // 밝기에 따라 적절한 대비 색상 선택
    const foregroundColor =
        l > 0.5
            ? hslToRgb(h, Math.min(1, s + 0.2), Math.max(0.2, l - 0.3))
            : hslToRgb(h, Math.min(1, s + 0.2), Math.min(0.8, l + 0.3));

    return { backgroundColor, foregroundColor };
}

// RGB를 HSL로 변환하는 함수
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

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

    return [h, s, l];
}

// HSL을 RGB로 변환하는 함수
function hslToRgb(h: number, s: number, l: number): string {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(
        b * 255
    )})`;
}

export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}

export function formatTimeAgo(
    date: Date | string,
    short: boolean = false
): string {
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

    // 미래 날짜인 경우 처리
    if (diffInSeconds < 0) {
        return short ? "now" : "just now";
    }

    // 각 시간 단위별 초 단위
    const intervals = [
        { label: "year", short: "y", seconds: 31536000 }, // 365 * 24 * 60 * 60
        { label: "month", short: "mo", seconds: 2592000 }, // 30 * 24 * 60 * 60
        { label: "week", short: "w", seconds: 604800 }, // 7 * 24 * 60 * 60
        { label: "day", short: "d", seconds: 86400 }, // 24 * 60 * 60
        { label: "hour", short: "h", seconds: 3600 }, // 60 * 60
        { label: "minute", short: "m", seconds: 60 },
        { label: "second", short: "s", seconds: 1 },
    ];

    // 각 간격을 확인하여 적절한 단위 찾기
    for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);

        if (count >= 1) {
            if (short) {
                return `${count}${interval.short}`;
            } else {
                // 단수/복수 처리
                const pluralLabel =
                    count === 1 ? interval.label : `${interval.label}s`;
                return `${count} ${pluralLabel} ago`;
            }
        }
    }

    // 1초 미만인 경우
    return short ? "now" : "just now";
}

// 별도의 짧은 형태 함수 (편의성을 위해)
export function formatTimeAgoShort(date: Date | string): string {
    return formatTimeAgo(date, true);
}

export function formatWeiToEther(
    weiValue: bigint | string | number,
    decimals: number = 18
): number {
    try {
        const bigIntValue = BigInt(weiValue);
        const divisor = BigInt(10 ** decimals);

        // 정수 부분
        const integerPart = bigIntValue / divisor;

        // 소수점 부분 계산
        const remainder = bigIntValue % divisor;
        const decimalPart = Number(remainder) / 10 ** decimals;

        return Number(integerPart) + decimalPart;
    } catch (error) {
        console.warn(
            "Failed to convert wei to ether:",
            error,
            "Value:",
            weiValue
        );
        return 0;
    }
}

export function formatEtherToWei(
    etherValue: number | string,
    decimals: number = 18
): bigint {
    try {
        const numValue =
            typeof etherValue === "string"
                ? parseFloat(etherValue)
                : etherValue;

        // 소수점 처리를 위해 문자열로 변환 후 처리
        const etherStr = numValue.toFixed(decimals);
        const [integerPart, decimalPart = ""] = etherStr.split(".");

        // 소수점 부분을 적절한 길이로 패딩
        const paddedDecimal = decimalPart
            .padEnd(decimals, "0")
            .slice(0, decimals);
        const fullIntegerStr = integerPart + paddedDecimal;

        return BigInt(fullIntegerStr);
    } catch (error) {
        console.warn(
            "Failed to convert ether to wei:",
            error,
            "Value:",
            etherValue
        );
        return BigInt(0);
    }
}

/**
 * BigInt 값을 안전하게 포맷팅 (천 단위 구분자 포함)
 * @param value BigInt 값
 * @param decimals 표시할 소수점 자릿수 (기본값: 18)
 * @returns 포맷된 문자열
 */
export function formatBigIntWithCommas(
    value: bigint,
    decimals: number = 18
): string {
    const etherValue = formatWeiToEther(value, decimals);
    return etherValue.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6, // 최대 6자리까지만 표시
    });
}

/**
 * BigInt 값을 단순히 숫자로 안전하게 변환 (wei 변환 없이)
 * @param value BigInt 또는 문자열 값
 * @returns 숫자 값
 */
export function safeBigIntToNumber(value: bigint | string | number): number {
    try {
        if (typeof value === "number") {
            return value;
        }

        const bigIntValue = BigInt(value);

        // BigInt가 Number의 안전한 범위를 벗어나는지 확인
        if (bigIntValue > BigInt(Number.MAX_SAFE_INTEGER)) {
            console.warn(
                "BigInt value exceeds safe integer range, precision may be lost:",
                bigIntValue
            );
            return Number(bigIntValue);
        }

        return Number(bigIntValue);
    } catch (error) {
        console.warn(
            "Failed to convert BigInt to number:",
            error,
            "Value:",
            value
        );
        return 0;
    }
}
