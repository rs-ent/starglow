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
        serverActions: {
            bodySizeLimit: "50mb",
        },
    },
};

module.exports = nextConfig;
