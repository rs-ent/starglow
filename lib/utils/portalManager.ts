/// lib/utils/portalManager.ts

"use client";

/**
 * 포털 계층 관리를 위한 싱글톤 매니저
 * 각 포털이 독립적인 컨테이너를 가지도록 하여 렌더링 충돌을 방지합니다.
 */
export class PortalManager {
    private static instance: PortalManager;
    private portals: Map<string, { element: HTMLElement; zIndex: number }> =
        new Map();

    // 레이어별 기본 zIndex 정의
    private readonly layerZIndex = {
        modal: 1000,
        popup: 2000,
        overlay: 3000,
        tooltip: 4000,
    } as const;

    static getInstance(): PortalManager {
        if (!PortalManager.instance) {
            PortalManager.instance = new PortalManager();
        }
        return PortalManager.instance;
    }

    /**
     * 포털 컨테이너를 생성하고 관리합니다.
     */
    createPortalContainer(
        id: string,
        layer: keyof typeof this.layerZIndex = "modal",
        customZIndex?: number
    ): HTMLElement {
        const fullId = `portal-${layer}-${id}`;

        // 이미 존재하는 컨테이너 반환
        if (this.portals.has(fullId)) {
            return this.portals.get(fullId)!.element;
        }

        const zIndex = customZIndex || this.layerZIndex[layer];
        const container = this.createElement(fullId, zIndex);

        document.body.appendChild(container);
        this.portals.set(fullId, { element: container, zIndex });

        return container;
    }

    /**
     * 포털 컨테이너를 제거합니다.
     */
    removePortalContainer(
        id: string,
        layer: keyof typeof this.layerZIndex = "modal"
    ): void {
        const fullId = `portal-${layer}-${id}`;
        const portal = this.portals.get(fullId);

        if (portal && document.body.contains(portal.element)) {
            document.body.removeChild(portal.element);
            this.portals.delete(fullId);
        }
    }

    /**
     * 모든 포털 컨테이너를 정리합니다.
     */
    cleanup(): void {
        this.portals.forEach((portal) => {
            if (document.body.contains(portal.element)) {
                document.body.removeChild(portal.element);
            }
        });
        this.portals.clear();
    }

    /**
     * 현재 활성화된 포털 목록을 반환합니다.
     */
    getActivePortals(): string[] {
        return Array.from(this.portals.keys());
    }

    private createElement(id: string, zIndex: number): HTMLElement {
        const container = document.createElement("div");
        container.id = id;
        container.style.cssText = `z-index: ${zIndex};`;

        return container;
    }
}

// 전역 인스턴스 접근을 위한 헬퍼 함수들
export const getPortalManager = () => PortalManager.getInstance();

export const createPortal = (
    id: string,
    layer: "modal" | "popup" | "overlay" | "tooltip" = "modal",
    customZIndex?: number
) => {
    return getPortalManager().createPortalContainer(id, layer, customZIndex);
};

export const removePortal = (
    id: string,
    layer: "modal" | "popup" | "overlay" | "tooltip" = "modal"
) => {
    getPortalManager().removePortalContainer(id, layer);
};
