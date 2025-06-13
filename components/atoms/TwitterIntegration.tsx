// components/atoms/TwitterIntegration.tsx
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";

export const TwitterIntegration = () => {
    const { data: session } = useSession();

    const handleTwitterConnect = async () => {
        try {
            // Twitter 로그인 페이지로 리다이렉트
            await signIn("twitter", {
                callbackUrl: "/auth/twitter-callback", // 콜백 URL 설정
            });
        } catch (error) {
            console.error("Twitter 연동 중 오류 발생:", error);
        }
    };

    return (
        <button
            onClick={handleTwitterConnect}
            className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter Integration
        </button>
    );
};
