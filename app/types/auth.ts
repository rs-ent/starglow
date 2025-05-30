export type ProviderType =
    | "google"
    | "twitter"
    | "discord"
    | "spotify"
    | "coinbase"
    | "kakao"
    | "resend"
    | "telegram";

export type Provider = {
    id: ProviderType;
    name: string;
    type: string;
    signinUrl: string;
    callbackUrl: string;
};
