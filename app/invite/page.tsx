/// app\invite\page.tsx

import { Suspense } from "react";
import InvitePage from "@/components/invite/InvitePage";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";

export default function InviteAuthPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <PartialLoadingServer text="Welcome to Starglow 🚀" />
                </div>
            }
        >
            <InvitePage />
        </Suspense>
    );
}
