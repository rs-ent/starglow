/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
            },
            {
                protocol: "https",
                hostname: "qvosmzgjveuikjktqknp.supabase.co",
            },
            {
                protocol: "https",
                hostname: "pv9tnti4kdvwxlot.public.blob.vercel-storage.com",
            },
            {
                protocol: "https",
                hostname: "i3.ytimg.com",
            },
            {
                protocol: "https",
                hostname: "w3s.link",
            },
        ],
    },

    allowedDevOrigins: [
        "local-origin.dev",
        "*.local-origin.dev",
        "http://localhost:3000",
        "http://admin.localhost:3000",
        "http://admin.localhost",
        "admin.localhost",
        "https://admin.starglow.io",
    ],

    experimental: {
        // 서버 액션 최적화
        serverActions: {
            bodySizeLimit: "50mb",
        },

        // PPR 설정 - Web3 앱 특성 고려
        ppr: {
            // 점진적 적용으로 안정성 확보
            incremental: true,
            // 개발 환경에서는 비활성화하여 디버깅 용이성 확보
            ...(process.env.NODE_ENV === "development" && {
                incremental: false,
            }),
        },

        // Web3 최적화를 위한 추가 설정
        optimizePackageImports: ["@wagmi/core", "@tanstack/react-query"],
    },

    // web3 관련 폴더들을 빌드에서 제외
    webpack: (config, { isServer }) => {
        // web3 관련 모듈들을 externals로 설정
        config.externals = [
            ...(config.externals || []),
            { web3: "web3" },
            { hardhat: "hardhat" },
            { ethers: "ethers" },
        ];

        // web3 관련 폴더들을 무시하도록 설정
        config.module.rules.push({
            test: /[\\/](web3|typechain-types)[\\/]/,
            exclude: /[\\/]web3[\\/]artifacts[\\/]/,
            loader: "ignore-loader",
        });

        config.module.rules.push({
            test: /\.json$/,
            type: "json",
        });

        return config;
    },

    typescript: {
        ignoreBuildErrors: true, // 빌드 시 타입 에러 무시
    },
};

module.exports = nextConfig;
