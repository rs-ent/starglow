import { z } from "zod";

const envSchema = z.object({
    POSTGRES_PRISMA_URL: z.string().url(),
    DIRECT_URL: z.string().url(),

    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    TWITTER_CLIENT_ID: z.string().min(1),
    TWITTER_CLIENT_SECRET: z.string().min(1),

    KAKAO_CLIENT_ID: z.string().min(1),
    KAKAO_CLIENT_SECRET: z.string().min(1),

    TELEGRAM_BOT_TOKEN: z.string().min(1),

    ENCRYPTION_METHOD: z.string().min(1),
    ENCRYPTION_SECRET: z.string().min(32),

    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    PORTONE_MID: z.string().min(1),
    PORTONE_V2_API_SECRET: z.string().min(1),
    PAYMENT_SECRET: z.string().min(1),

    PORTONE_PAYPAL: z.string().min(1),
    PORTONE_CARD: z.string().min(1),
    PORTONE_INTERCARD: z.string().min(1),
    PORTONE_TOSS: z.string().min(1),
    PORTONE_KAKAO: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("[ENV][Error] ", parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;
