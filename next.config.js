/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb", // 서버 액션 본문 크기 제한을 10MB로 설정
        },
    },
    // 기타 Next.js 설정...
};

module.exports = nextConfig;
