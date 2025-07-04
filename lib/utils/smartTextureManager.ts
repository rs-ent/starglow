import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

interface TextureData {
    texture: THREE.Texture;
    lastUsed: number;
    refCount: number;
}

interface TextureRequest {
    url: string;
    priority: number;
    onLoad?: (texture: THREE.Texture) => void;
    onError?: (error: Error) => void;
}

class SmartTextureManager {
    private static instance: SmartTextureManager;
    private textureCache = new Map<string, TextureData>();
    private loadingQueue = new Set<string>();
    private loader = new THREE.TextureLoader();
    private maxCacheSize = 20; // 최대 20개 텍스처 캐시
    private cleanupThreshold = 30000; // 30초 후 정리

    static getInstance(): SmartTextureManager {
        if (!SmartTextureManager.instance) {
            SmartTextureManager.instance = new SmartTextureManager();
        }
        return SmartTextureManager.instance;
    }

    private constructor() {
        // 주기적으로 사용되지 않는 텍스처 정리
        setInterval(() => {
            this.cleanupUnusedTextures();
        }, 10000);
    }

    private cleanupUnusedTextures(): void {
        const now = Date.now();
        const toRemove: string[] = [];

        this.textureCache.forEach((data, url) => {
            if (
                data.refCount === 0 &&
                now - data.lastUsed > this.cleanupThreshold
            ) {
                toRemove.push(url);
            }
        });

        // 캐시 크기 제한 확인
        if (this.textureCache.size > this.maxCacheSize) {
            const sorted = Array.from(this.textureCache.entries())
                .filter(([_, data]) => data.refCount === 0)
                .sort(([_a, a], [_b, b]) => a.lastUsed - b.lastUsed);

            const excess = this.textureCache.size - this.maxCacheSize;
            for (let i = 0; i < Math.min(excess, sorted.length); i++) {
                toRemove.push(sorted[i][0]);
            }
        }

        toRemove.forEach((url) => {
            const data = this.textureCache.get(url);
            if (data) {
                data.texture.dispose();
                this.textureCache.delete(url);
            }
        });
    }

    async loadTexture(
        url: string,
        priority: number = 0
    ): Promise<THREE.Texture> {
        if (!url) throw new Error("Invalid URL");

        // 캐시에서 확인
        const cached = this.textureCache.get(url);
        if (cached) {
            cached.lastUsed = Date.now();
            cached.refCount++;
            return cached.texture;
        }

        // 이미 로딩 중인지 확인
        if (this.loadingQueue.has(url)) {
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    const cached = this.textureCache.get(url);
                    if (cached) {
                        clearInterval(checkInterval);
                        cached.refCount++;
                        resolve(cached.texture);
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error("Texture loading timeout"));
                }, 10000);
            });
        }

        // 새로운 텍스처 로드
        this.loadingQueue.add(url);

        try {
            const texture = await new Promise<THREE.Texture>(
                (resolve, reject) => {
                    this.loader.load(
                        url,
                        (loadedTexture) => {
                            // 텍스처 최적화 설정
                            loadedTexture.minFilter = THREE.LinearFilter;
                            loadedTexture.magFilter = THREE.LinearFilter;
                            loadedTexture.generateMipmaps = false;
                            loadedTexture.needsUpdate = true;
                            resolve(loadedTexture);
                        },
                        undefined,
                        (error) => reject(error)
                    );
                }
            );

            // 캐시에 저장
            this.textureCache.set(url, {
                texture,
                lastUsed: Date.now(),
                refCount: 1,
            });

            return texture;
        } catch (error) {
            throw error;
        } finally {
            this.loadingQueue.delete(url);
        }
    }

    releaseTexture(url: string): void {
        const cached = this.textureCache.get(url);
        if (cached) {
            cached.refCount = Math.max(0, cached.refCount - 1);
        }
    }

    preloadTextures(urls: string[], maxConcurrent: number = 3): Promise<void> {
        return new Promise((resolve) => {
            let completed = 0;
            let index = 0;

            const loadNext = () => {
                if (index >= urls.length) {
                    if (completed === urls.length) {
                        resolve();
                    }
                    return;
                }

                const url = urls[index++];
                this.loadTexture(url)
                    .catch(() => {}) // 개별 실패는 무시
                    .finally(() => {
                        completed++;
                        if (completed === urls.length) {
                            resolve();
                        }
                        loadNext();
                    });
            };

            // 동시 로딩 시작
            for (let i = 0; i < Math.min(maxConcurrent, urls.length); i++) {
                loadNext();
            }
        });
    }

    isTextureLoaded(url: string): boolean {
        return this.textureCache.has(url);
    }

    getLoadingUrls(): string[] {
        return Array.from(this.loadingQueue);
    }

    getCacheStats(): { size: number; loading: number; maxSize: number } {
        return {
            size: this.textureCache.size,
            loading: this.loadingQueue.size,
            maxSize: this.maxCacheSize,
        };
    }
}

export const textureManager = SmartTextureManager.getInstance();

// React Hook for smart texture loading
export function useSmartTexture(url: string, priority: number = 0) {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const urlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!url) return;

        // URL이 변경된 경우 이전 텍스처 해제
        if (urlRef.current && urlRef.current !== url) {
            textureManager.releaseTexture(urlRef.current);
        }

        urlRef.current = url;

        // 이미 로드된 텍스처 확인
        if (textureManager.isTextureLoaded(url)) {
            textureManager
                .loadTexture(url, priority)
                .then(setTexture)
                .catch(setError);
            return;
        }

        setIsLoading(true);
        setError(null);

        textureManager
            .loadTexture(url, priority)
            .then((loadedTexture) => {
                setTexture(loadedTexture);
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err);
                setIsLoading(false);
            });

        return () => {
            if (urlRef.current) {
                textureManager.releaseTexture(urlRef.current);
            }
        };
    }, [url, priority]);

    return { texture, isLoading, error };
}

// Hook for managing multiple textures with viewport-based loading
export function useViewportTextureManager(
    items: Array<{ id: string; imageUrl: string }>,
    selectedIndex: number,
    visibleRange: number = 3
) {
    const [loadedTextures, setLoadedTextures] = useState<
        Map<string, THREE.Texture>
    >(new Map());
    const [loadingTextures, setLoadingTextures] = useState<Set<string>>(
        new Set()
    );
    const previousSelectedRef = useRef<number>(-1);

    const updateLoadedTextures = useCallback(() => {
        const newLoaded = new Map<string, THREE.Texture>();
        items.forEach((item) => {
            if (textureManager.isTextureLoaded(item.imageUrl)) {
                textureManager
                    .loadTexture(item.imageUrl, 0)
                    .then((texture) => {
                        newLoaded.set(item.id, texture);
                        setLoadedTextures((prev) =>
                            new Map(prev).set(item.id, texture)
                        );
                    })
                    .catch(() => {});
            }
        });
    }, [items]);

    useEffect(() => {
        if (selectedIndex === previousSelectedRef.current) return;

        previousSelectedRef.current = selectedIndex;

        // 로딩할 범위 계산
        const startIndex = Math.max(0, selectedIndex - visibleRange);
        const endIndex = Math.min(
            items.length - 1,
            selectedIndex + visibleRange
        );

        const toLoad: string[] = [];
        const currentLoading = new Set<string>();

        for (let i = startIndex; i <= endIndex; i++) {
            const item = items[i];
            if (
                item?.imageUrl &&
                !textureManager.isTextureLoaded(item.imageUrl)
            ) {
                toLoad.push(item.imageUrl);
                currentLoading.add(item.imageUrl);
            }
        }

        setLoadingTextures(currentLoading);

        if (toLoad.length > 0) {
            // 우선순위 기반 로딩 (선택된 카드가 가장 높은 우선순위)
            const priorityLoading = toLoad.map((url) => {
                const itemIndex = items.findIndex(
                    (item) => item.imageUrl === url
                );
                const distance = Math.abs(itemIndex - selectedIndex);
                const priority = Math.max(0, 10 - distance);

                return textureManager
                    .loadTexture(url, priority)
                    .then(() => {
                        setLoadingTextures((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(url);
                            return newSet;
                        });
                    })
                    .catch(() => {
                        setLoadingTextures((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(url);
                            return newSet;
                        });
                    });
            });

            Promise.all(priorityLoading).then(() => {
                updateLoadedTextures();
            });
        }

        updateLoadedTextures();
    }, [selectedIndex, items, visibleRange, updateLoadedTextures]);

    const getTexture = useCallback(
        (id: string): THREE.Texture | null => {
            return loadedTextures.get(id) || null;
        },
        [loadedTextures]
    );

    const isTextureLoading = useCallback(
        (imageUrl: string): boolean => {
            return loadingTextures.has(imageUrl);
        },
        [loadingTextures]
    );

    const isTextureLoaded = useCallback((imageUrl: string): boolean => {
        return textureManager.isTextureLoaded(imageUrl);
    }, []);

    return {
        getTexture,
        isTextureLoading,
        isTextureLoaded,
        loadedCount: loadedTextures.size,
        loadingCount: loadingTextures.size,
    };
}
