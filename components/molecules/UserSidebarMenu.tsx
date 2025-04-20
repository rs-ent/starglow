/// components\molecules\UserSidebarMenu.tsx

import Button from "../atoms/Button";
import { cn } from "@/lib/utils/tailwind";

interface UserSidebarMenuProps {
    items: {
        label: string;
        key: string;
        svg?: string;
    }[];
    onSelect: (key: string) => void;
    variant?:
        | "default"
        | "space"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
    frameSize?: number;
    textSize?: number;
    paddingSize?: number;
    gapSize?: number;
    buttonGap?: number;
    isMobile?: boolean;
}

export default function UserSidebarMenu({
    items,
    onSelect,
    variant = "outline",
    frameSize = 20,
    textSize = 20,
    paddingSize = 20,
    gapSize = 20,
    buttonGap = 10,
    isMobile = false,
}: UserSidebarMenuProps) {
    if (isMobile) {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-muted flex justify-around items-center py-3 px-2 z-50">
                {items.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => onSelect(item.key)}
                        className="flex flex-col items-center gap-1 hover:opacity-100 transition-opacity"
                    >
                        {item.svg && (
                            <img
                                src={item.svg}
                                alt={item.label}
                                className="w-6 h-6 opacity-80"
                            />
                        )}
                        <span className="text-xs opacity-80">{item.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col", `gap-[${buttonGap}px]`)}>
            {items.map((item) => (
                <Button
                    key={item.key}
                    variant={variant}
                    frameSize={frameSize}
                    textSize={textSize}
                    paddingSize={paddingSize}
                    gapSize={gapSize}
                    img={item.svg}
                    onClick={() => onSelect(item.key)}
                    className="w-full"
                >
                    {item.label}
                </Button>
            ))}
        </div>
    );
}
