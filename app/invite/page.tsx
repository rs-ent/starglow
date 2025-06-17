/// app\invite\page.tsx

import { Suspense } from "react";
import InvitePage from "@/components/invite/InvitePage";

export default function InviteAuthPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            }
        >
            <InvitePage />
        </Suspense>
    );
}
