import { useRef, useEffect } from "react";
import { TextureLoader, Texture, LinearFilter } from "three";

const textureCache = new Map<string, Texture>();

export function useCachedTexture(
    url: string,
    onLoad?: (texture: Texture) => void
) {
    const textureRef = useRef<Texture | null>(null);

    if (!textureCache.has(url)) {
        const loader = new TextureLoader();
        const texture = loader.load(url, (loaded) => {
            loaded.minFilter = LinearFilter;
            loaded.magFilter = LinearFilter;
            loaded.generateMipmaps = false;
            loaded.needsUpdate = true;
            if (onLoad) onLoad(loaded);
        });
        textureCache.set(url, texture);
    }
    textureRef.current = textureCache.get(url)!;

    return textureRef.current;
}

/**
 * 여러 이미지 URL을 한 번에 미리 로드하는 프리로딩 함수
 * @param urls 이미지 URL 배열
 * @returns Promise<void> (모든 텍스처가 로드되면 resolve)
 */
export function prefetchTextures(urls: string[]): Promise<void> {
    const loader = new TextureLoader();
    const promises = urls.map((url) => {
        if (textureCache.has(url)) return Promise.resolve();
        return new Promise<void>((resolve) => {
            loader.load(url, (texture) => {
                texture.minFilter = LinearFilter;
                texture.magFilter = LinearFilter;
                texture.generateMipmaps = false;
                texture.needsUpdate = true;
                textureCache.set(url, texture);
                resolve();
            });
        });
    });
    return Promise.all(promises).then(() => {});
}
