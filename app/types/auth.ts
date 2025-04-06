export type ProviderType = "google" | "twitter" | "kakao";

export type Provider = {
    id: ProviderType;
    name: string;
    type: string;
    signinUrl: string;
    callbackUrl: string;
};