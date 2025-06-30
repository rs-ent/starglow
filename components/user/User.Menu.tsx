/// components/user/User.Menu.tsx

"use client";

import { memo } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

const menuItems = [
    {
        label: "Rewards",
        icon: "/ui/user/user-rewards.svg",
        href: "/user/rewards",
    },
    {
        label: "XGLOWs",
        icon: "/ui/user/user-tweets.svg",
        href: "/user/glows",
    },
    {
        label: "Discord",
        icon: "/icons/providers/discord.svg",
        href: "/user/discord",
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
        <div className="w-full flex justify-center">
            <div
                className={cn(
                    "grid grid-cols-4 gap-1 sm:gap-2 md:gap-3 lg:gap-4 w-full max-w-[800px]",
                    "pt-6 sm:pt-3 md:pt-4 lg:pt-6",
                    "px-4 sm:px-3 md:px-4 lg:px-6",
                    "pb-[20px]"
                )}
            >
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group relative flex flex-col items-center justify-center gap-1 cursor-pointer",
                            "bg-gradient-to-br from-white/10 to-white/5",
                            "border border-white/20 backdrop-blur-sm",
                            "rounded-[12px] transition-all duration-300 ease-out",
                            "hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10",
                            "hover:border-white/30 hover:shadow-lg hover:shadow-white/10",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            "py-[5px] sm:py-[7px] md:py-[10px] lg:py-[12px]",
                            pathname === item.href && [
                                "bg-gradient-to-br from-white/25 to-white/15",
                                "border-white/40 shadow-lg shadow-white/15",
                                "scale-[1.02]",
                            ]
                        )}
                    >
                        {/* Background glow effect */}
                        <div className="absolute inset-0 rounded-[12px] bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Icon container */}
                        <div
                            className={cn(
                                "relative z-10 flex items-center justify-center",
                                "rounded-[8px] bg-white/10 backdrop-blur-sm",
                                "border border-white/20 transition-all duration-300",
                                "group-hover:bg-white/20 group-hover:border-white/30",
                                "group-hover:shadow-md group-hover:shadow-white/20",
                                "p-2 sm:p-2 md:p-2.5 lg:p-3"
                            )}
                        >
                            <img
                                src={item.icon}
                                alt={item.label}
                                className={cn(
                                    "w-6 h-6 transition-transform duration-300",
                                    "group-hover:scale-110 filter brightness-100",
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                        </div>

                        {/* Label */}
                        <span
                            className={cn(
                                "relative z-10 font-medium text-white/90",
                                "transition-all duration-300",
                                "group-hover:text-white group-hover:scale-105",
                                getResponsiveClass(10).textClass
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
