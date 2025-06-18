/// app\invite\page.tsx

import { Suspense } from "react";
import InvitePage from "@/components/invite/InvitePage";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";

export default function InviteAuthPage() {
    return (
        <Suspense
            fallback={
                <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
                    <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                    <PartialLoadingServer text="Welcome to Starglow 🚀" />
                </div>
            }
        >
            <InvitePage />
        </Suspense>
    );
}
