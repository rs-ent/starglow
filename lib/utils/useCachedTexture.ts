"use client";

import { useMemo, useRef } from "react";

import { CanvasTexture, LinearFilter, TextureLoader } from "three";

import type { Texture } from "three";

interface TextureData {
    texture: Texture;
    isLoaded: boolean;
    error?: Error;
}

const textureCache = new Map<string, TextureData>();

export function useCachedTexture(
    url: string,
    onLoad?: (texture: Texture) => void
) {
    const textureRef = useRef<Texture | null>(null);

    if (!textureCache.has(url)) {
        const loader = new TextureLoader();
        const texture = loader.load(
            url,
            (loaded) => {
                loaded.minFilter = LinearFilter;
                loaded.magFilter = LinearFilter;
                loaded.generateMipmaps = false;
                loaded.needsUpdate = true;

                // 캐시에서 로딩 완료 상태 업데이트
                const cached = textureCache.get(url);
                if (cached) {
                    cached.isLoaded = true;
                    if (onLoad) onLoad(loaded);
                }
            },
            undefined,
            (error) => {
                console.error(`Failed to load texture: ${url}`, error);
                const cached = textureCache.get(url);
                if (cached) {
                    cached.error =
                        error instanceof Error
                            ? error
                            : new Error(String(error));
                }
            }
        );

        // 로딩 중인 텍스처를 캐시에 저장 (isLoaded: false)
        textureCache.set(url, {
            texture,
            isLoaded: false,
        });
    }

    const cached = textureCache.get(url)!;
    // 로딩이 완료된 텍스처만 반환
    textureRef.current = cached.isLoaded ? cached.texture : null;

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
        // 이미 로딩 완료된 텍스처는 스킵
        const cached = textureCache.get(url);
        if (cached?.isLoaded) return Promise.resolve();

        return new Promise<void>((resolve) => {
            const texture = loader.load(
                url,
                (loaded) => {
                    loaded.minFilter = LinearFilter;
                    loaded.magFilter = LinearFilter;
                    loaded.generateMipmaps = false;
                    loaded.needsUpdate = true;

                    // 캐시에 로딩 완료된 텍스처 저장
                    textureCache.set(url, {
                        texture: loaded,
                        isLoaded: true,
                    });
                    resolve();
                },
                undefined,
                (error) => {
                    console.error(`Failed to prefetch texture: ${url}`, error);
                    textureCache.set(url, {
                        texture: texture,
                        isLoaded: false,
                        error:
                            error instanceof Error
                                ? error
                                : new Error(String(error)),
                    });
                    // 개별 텍스처 실패해도 전체 프로세스는 계속 진행
                    resolve();
                }
            );
        });
    });
    return Promise.all(promises).then(() => {});
}

const blurredTextureCache = new Map<string, Texture>();

export interface BlurOptions {
    blur?: number; // 블러 강도 (기본: 20)
    brightness?: number; // 밝기 (기본: 1)
    contrast?: number; // 대비 (기본: 1)
    opacity?: number; // 투명도 (기본: 1)
}

export function useBlurredTexture(
    url: string,
    options: BlurOptions = {},
    onLoad?: (texture: Texture) => void
) {
    const textureRef = useRef<Texture | null>(null);

    const { blur = 20, brightness = 1, contrast = 1, opacity = 1 } = options;

    const cacheKey = `${url}_blur_${blur}_br_${brightness}_co_${contrast}_op_${opacity}`;

    const blurredTexture = useMemo(() => {
        if (blurredTextureCache.has(cacheKey)) {
            return blurredTextureCache.get(cacheKey)!;
        }

        // 임시 빈 텍스처 생성 (로딩 중 표시용)
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 1;
        tempCanvas.height = 1;
        const tempTexture = new CanvasTexture(tempCanvas);
        blurredTextureCache.set(cacheKey, tempTexture);

        const loader = new TextureLoader();

        loader.load(
            url,
            (originalTexture) => {
                try {
                    const image = originalTexture.image;

                    // Canvas 생성 및 설정
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    if (!ctx) {
                        console.error("Canvas context not available");
                        return;
                    }

                    canvas.width = image.width;
                    canvas.height = image.height;

                    // 필터 조합 생성
                    const filters = [];
                    if (blur > 0) filters.push(`blur(${blur}px)`);
                    if (brightness !== 1)
                        filters.push(`brightness(${brightness})`);
                    if (contrast !== 1) filters.push(`contrast(${contrast})`);

                    ctx.filter = filters.join(" ") || "none";
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(image, 0, 0);

                    // 블러된 Canvas로 새 텍스처 생성
                    const blurTexture = new CanvasTexture(canvas);
                    blurTexture.minFilter = LinearFilter;
                    blurTexture.magFilter = LinearFilter;
                    blurTexture.generateMipmaps = false;
                    blurTexture.needsUpdate = true;

                    // 캐시 업데이트
                    blurredTextureCache.set(cacheKey, blurTexture);

                    if (onLoad) onLoad(blurTexture);
                } catch (error) {
                    console.error("Error creating blurred texture:", error);
                }
            },
            undefined,
            (error) => {
                console.error("Error loading texture for blur:", error);
            }
        );

        return tempTexture;
    }, [url, cacheKey, onLoad, blur, brightness, contrast, opacity]);

    textureRef.current = blurredTexture;
    return textureRef.current;
}

// 캐시 정리 유틸리티
export function clearBlurredTextureCache() {
    blurredTextureCache.forEach((texture) => texture.dispose());
    blurredTextureCache.clear();
}

// 디버깅을 위한 유틸리티 함수들
export function getTextureLoadingStatus(
    url: string
): "loaded" | "loading" | "failed" | "not_found" {
    const cached = textureCache.get(url);
    if (!cached) return "not_found";
    if (cached.error) return "failed";
    if (cached.isLoaded) return "loaded";
    return "loading";
}

export function getTextureCacheStats(): {
    totalTextures: number;
    loadedTextures: number;
    loadingTextures: number;
    failedTextures: number;
} {
    let loaded = 0;
    let loading = 0;
    let failed = 0;

    textureCache.forEach((data) => {
        if (data.error) {
            failed++;
        } else if (data.isLoaded) {
            loaded++;
        } else {
            loading++;
        }
    });

    return {
        totalTextures: textureCache.size,
        loadedTextures: loaded,
        loadingTextures: loading,
        failedTextures: failed,
    };
}
