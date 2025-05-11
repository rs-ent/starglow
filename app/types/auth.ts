export type ProviderType =
    | "google"
    | "twitter"
    | "spotify"
    | "coinbase"
    | "kakao";

export type Provider = {
    id: ProviderType;
    name: string;
    type: string;
    signinUrl: string;
    callbackUrl: string;
};
