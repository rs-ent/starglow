"use client";

import { AdminUsersDashboardAnalytics } from "@/components/admin/users/Admin.Users.Dashboard.Analytics";
import { use } from "react";

interface AnalyticsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
    const params = use(searchParams);
    const nonce = params.nonce;

    if (nonce !== "000123") {
        return <div>Invalid soft nonce</div>;
    }

    return <AdminUsersDashboardAnalytics />;
}
