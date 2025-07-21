/// components/atoms/Portal.Enhanced.tsx

"use client";

import type { ReactNode } from "react";
import { memo, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

interface EnhancedPortalProps {
    children: ReactNode;
    layer?: "modal" | "popup" | "overlay" | "tooltip";
    customZIndex?: number;
    onMount?: () => void;
    onUnmount?: () => void;
    disabled?: boolean;
}

const Z_INDEX_MAP = {
    tooltip: 50,
    popup: 60,
    overlay: 70,
    modal: 80,
} as const;

function EnhancedPortal({
    children,
    layer = "modal",
    customZIndex,
    onMount,
    onUnmount,
    disabled = false,
}: EnhancedPortalProps) {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const id = useId().replace(/:/g, "-");

    useEffect(() => {
        if (disabled) return;

        const portalContainer = document.createElement("div");
        portalContainer.id = `portal-${layer}-${id}`;
        portalContainer.className = `portal-container portal-${layer}`;
        portalContainer.style.zIndex = String(
            customZIndex ?? Z_INDEX_MAP[layer]
        );
        portalContainer.style.position = "fixed";
        portalContainer.style.inset = "0";
        portalContainer.style.display = "contents";

        document.body.appendChild(portalContainer);
        setContainer(portalContainer);

        onMount?.();

        return () => {
            if (portalContainer.parentNode) {
                portalContainer.parentNode.removeChild(portalContainer);
            }
            onUnmount?.();
        };
    }, [disabled, layer, customZIndex, id, onMount, onUnmount]);

    if (disabled) {
        return <>{children}</>;
    }

    if (!container) {
        return null;
    }

    return createPortal(children, container, id);
}

export default memo(EnhancedPortal);
