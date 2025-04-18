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
