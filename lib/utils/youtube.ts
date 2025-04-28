/// lib/utils/youtube.ts

export function getYoutubeVideoId(url: string): string | null {
    const regex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

export async function getYoutubeThumbnailUrl(url: string): Promise<string> {
    const videoId = getYoutubeVideoId(url);
    if (!videoId) return "";

    const maxresUrl = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    const hqdefaultUrl = `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    try {
        const response = await fetch(maxresUrl);
        if (response.ok) {
            return maxresUrl;
        }
        return hqdefaultUrl;
    } catch {
        return hqdefaultUrl;
    }
}
