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
            {
                protocol: "https",
                hostname: "starglow-six.vercel.app",
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

        config.ignoreWarnings = [
            { module: /node_modules\/@opentelemetry\/instrumentation/ },
            { module: /node_modules\/prisma-instrumentation/ },
            {
                message:
                    /Critical dependency: the request of a dependency is an expression/,
            },
        ];

        return config;
    },

    typescript: {
        ignoreBuildErrors: true, // 빌드 시 타입 에러 무시
    },

    experimental: {
        serverActions: {
            bodySizeLimit: "100mb",
            allowedOrigins: [
                "https://starglow.io",
                "https://starglow-six.vercel.app",
                "http://localhost:3000",
            ],
        },
    },
};

module.exports = nextConfig;
