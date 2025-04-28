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
