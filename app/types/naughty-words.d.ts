declare module "naughty-words" {
    interface NaughtyWords {
        en: string[];
        ko?: string[];
        [key: string]: string[] | undefined;
    }
    export const naughty: NaughtyWords;
}
