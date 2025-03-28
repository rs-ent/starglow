/// components\molecules\UserSidebarMenu.tsx

import UserSidebarButton from "../atoms/UserSidebarButton";

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
                <UserSidebarButton
                    key={item.key}
                    label={item.label}
                    onClick={() => onSelect(item.key)}
                />
            ))}
        </div>
    );
}