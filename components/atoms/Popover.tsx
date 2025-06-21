/// components/atoms/Popover.tsx

"use client";

import { useState, useRef, useEffect } from "react";

import { cn } from "@/lib/utils/tailwind";

interface PopoverProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    align?: "start" | "center" | "end";
    side?: "top" | "bottom" | "left" | "right";
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function Popover({
    trigger,
    children,
    className,
    align = "start",
    side = "bottom",
    open: controlledOpen,
    onOpenChange,
}: PopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // 외부 상태와 내부 상태 동기화
    useEffect(() => {
        if (controlledOpen !== undefined) {
            setIsOpen(controlledOpen);
        }
    }, [controlledOpen]);

    // 외부 상태 변경 알림
    useEffect(() => {
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    }, [isOpen, onOpenChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative">
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            <div
                ref={popoverRef}
                className={cn(
                    "absolute z-50 bg-background rounded-md border p-4",
                    "transition-all duration-200",
                    isOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-2 pointer-events-none",
                    {
                        // 수평 정렬 (align)
                        ...(side !== "left" &&
                            side !== "right" && {
                                "left-0": align === "start",
                                "left-1/2 -translate-x-1/2": align === "center",
                                "right-0": align === "end",
                            }),

                        // 수직 정렬 (side)
                        ...(side === "top" && { "bottom-0 mb-2": true }),
                        ...(side === "bottom" && { "top-0 mt-2": true }),
                        ...(side === "left" && { "right-0 mr-2": true }),
                        ...(side === "right" && { "left-0 ml-2": true }),
                    },
                    className
                )}
                style={{ display: isOpen ? "block" : "none" }}
            >
                {children}
            </div>
        </div>
    );
}
