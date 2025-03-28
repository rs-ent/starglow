/// components\molecules\UserSidebarMenu.tsx

import Button from "../atoms/Button";

interface UserSidebarMenuProps {
    items: {
        label: string;
        key: string
    }[];
    onSelect: (key: string) => void;
}

export default function UserSidebarMenu(
    { items, onSelect }: UserSidebarMenuProps
) {
    return (
        <div className="flex flex-col gap-2">
            {items.map((item) => (
                <Button
                    key={item.key}
                    variant="outline"
                    onClick={() => onSelect(item.key)}
                    className="w-full"
                >
                    {item.label}
                </Button>
            ))}
        </div>
    );
}