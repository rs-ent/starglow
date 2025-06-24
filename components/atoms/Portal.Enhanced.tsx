/// components/atoms/Portal.Enhanced.tsx

"use client";

import type { ReactNode } from "react";
import { memo, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { getPortalManager } from "@/lib/utils/portalManager";

interface EnhancedPortalProps {
    children: ReactNode;
    layer?: "modal" | "popup" | "overlay" | "tooltip";
    customZIndex?: number;
    onMount?: () => void;
    onUnmount?: () => void;
    disabled?: boolean;
}

function EnhancedPortal({
    children,
    layer = "modal",
    customZIndex,
    onMount,
    onUnmount,
    disabled = false,
}: EnhancedPortalProps) {
    const [mounted, setMounted] = useState(false);
    const id = useId().replace(/:/g, "-");

    useEffect(() => {
        setMounted(true);
        onMount?.();

        return () => {
            onUnmount?.();
        };
    }, [onMount, onUnmount]);

    const portalManager = getPortalManager();

    useEffect(() => {
        if (!mounted) return;

        return () => {
            portalManager.removePortalContainer(id, layer);
        };
    }, [mounted, id, layer, portalManager, customZIndex]);

    if (!mounted) return null;

    if (disabled) {
        return <>{children}</>;
    }

    const container = portalManager.createPortalContainer(
        id,
        layer,
        customZIndex
    );

    return createPortal(children, container, id);
}

export default memo(EnhancedPortal);
