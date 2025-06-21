"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
    useReportWebVitals(async (metric) => {
        if (process.env.NODE_ENV === "production") {
            const body = JSON.stringify(metric);
            const url = "/api/metrics";

            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, body);
            } else {
                await fetch(url, { body, method: "POST", keepalive: true });
            }
        }
    });

    return null;
}
