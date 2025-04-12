/// app\admin\onchain\page.tsx

import OnChainDashboard from "@/components/admin/onchain/OnChain.Dashboard";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function OnChainPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">On Chain Management</h1>

            <div className="space-y-8">
                <Suspense fallback={<LoadingState />}>
                    <OnChainDashboard />
                </Suspense>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading...</span>
        </div>
    );
}
