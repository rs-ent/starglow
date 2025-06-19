/// components/user/User.Menu.tsx

"use client";

import { memo } from "react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
    {
        label: "My Star",
        icon: "/ui/user/user-mystar.svg",
        href: "/user/mystar",
    },
    {
        label: "Rewards",
        icon: "/ui/user/user-rewards.svg",
        href: "/user/rewards",
    },
    {
        label: "Tweets",
        icon: "/ui/user/user-tweets.svg",
        href: "/user/tweets",
    },
    {
        label: "Settings",
        icon: "/ui/settings.svg",
        href: "/user/settings",
    },
];

export default memo(function UserMenu() {
    const pathname = usePathname();

    return (
        <div>
            <div
                className={cn(
                    "grid grid-cols-2 gap-2 w-screen max-w-[1000px]",
                    "py-4 px-6 sm:py-6 sm:px-8 md:py-8 md:px-12 lg:py-10 lg:px-12"
                )}
            >
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center justify-center gap-2 cursor-pointer",
                            "border border-[rgba(255,255,255,0.3)]",
                            "rounded-[6px] hover:bg-[rgba(255,255,255,0.1)]",
                            getResponsiveClass(20).paddingClass,
                            pathname === item.href &&
                                "bg-[rgba(255,255,255,0.1)]"
                        )}
                    >
                        <img
                            src={item.icon}
                            alt={item.label}
                            className={cn(getResponsiveClass(25).frameClass)}
                        />
                        <span
                            className={cn(
                                getResponsiveClass(20).textClass,
                                "text-white"
                            )}
                        >
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
});
