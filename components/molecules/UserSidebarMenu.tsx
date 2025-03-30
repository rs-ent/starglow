/// components\molecules\UserSidebarMenu.tsx

import Button from "../atoms/Button";

interface UserSidebarMenuProps {
    items: {
        label: string;
        key: string;
        svg?: string;
    }[];
    onSelect: (key: string) => void;
    variant?: "default" | "space" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    frameSize?: number;
    textSize?: number;
    paddingSize?: number;
    gapSize?: number;
    buttonGap?: number;
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
}: UserSidebarMenuProps
) {
    return (
        <div className={`flex flex-col gap-[${buttonGap}px]`}>
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