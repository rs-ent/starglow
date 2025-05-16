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

export function formatDate(date: Date) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
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
    const fullHex =
        hex.length === 3
            ? hex
                  .split("")
                  .map((char) => char + char)
                  .join("")
            : hex;

    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
}