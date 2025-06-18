/// components/user/User.Menu.tsx

import { memo, useCallback } from "react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

export type Tab = "mystar" | "rewards" | "tweets" | "settings";

const menuItems = [
    {
        label: "My Star",
        icon: "/ui/user/user-mystar.svg",
        value: "mystar" as Tab,
    },
    {
        label: "Rewards",
        icon: "/ui/user/user-rewards.svg",
        value: "rewards" as Tab,
    },
    {
        label: "Tweets",
        icon: "/ui/user/user-tweets.svg",
        value: "tweets" as Tab,
    },
    {
        label: "Settings",
        icon: "/ui/settings.svg",
        value: "settings" as Tab,
    },
];

interface UserMenuProps {
    selectedTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export default memo(function UserMenu({
    selectedTab,
    onTabChange,
}: UserMenuProps) {
    const handleTabChange = useCallback(
        (tab: Tab) => {
            onTabChange(tab);
        },
        [onTabChange]
    );

    return (
        <div>
            <div
                className={cn(
                    "grid grid-cols-2 gap-2 w-screen max-w-[1000px]",
                    "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                )}
            >
                {menuItems.map((item) => (
                    <div
                        key={item.value}
                        className={cn(
                            "flex items-center justify-center gap-2 cursor-pointer",
                            "border border-[rgba(255,255,255,0.3)]",
                            "rounded-[6px] hover:bg-[rgba(255,255,255,0.1)]",
                            getResponsiveClass(20).paddingClass,
                            selectedTab === item.value &&
                                "bg-[rgba(255,255,255,0.1)]"
                        )}
                        onClick={() => handleTabChange(item.value)}
                    >
                        <img
                            src={item.icon}
                            alt={item.label}
                            className={cn(getResponsiveClass(25).frameClass)}
                        />
                        <span
                            className={cn(
                                getResponsiveClass(20).textClass,
                                selectedTab === item.value && "text-white"
                            )}
                        >
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});
