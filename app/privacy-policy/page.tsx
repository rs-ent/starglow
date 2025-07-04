/// app/privacy-notice/page.tsx

import Privacy from "@/components/privacy-notice/privacy";
import Policy from "@/components/privacy-notice/policy";

export default function PrivacyNotice() {
    return (
        <div className="relative">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <Policy />
            <Privacy />
        </div>
    );
}
