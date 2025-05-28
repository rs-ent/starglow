/// components/user/User.Navigation.tsx

"use client";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import UserSettings from "./User.Settings";
import { Player } from "@prisma/client";
import { User } from "next-auth";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

interface UserNavigationProps {
    user: User | null;
    player: Player | null;
    onClose: () => void;
}

const navigationItems = [
    {
        label: "Profile",
        value: "profile",
    },
    {
        label: "Sign Out",
        value: "sign-out",
    },
];

export default function UserNavigation({
    user,
    player,
    onClose,
}: UserNavigationProps) {
    const pathname = usePathname();
    const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<string>("");

    useEffect(() => {
        if (selectedItem === "profile") {
            setShowUserSettings(true);
        } else if (selectedItem === "sign-out") {
            if (pathname === "/user") {
                signOut({ callbackUrl: "/?signedOut=true" });
            } else {
                signOut({ callbackUrl: pathname + "?signedOut=true" });
            }
        }
    }, [selectedItem, pathname]);

    return (
        <>
            {showUserSettings && user && player && (
                <UserSettings
                    user={user}
                    player={player}
                    onClose={() => setShowUserSettings(false)}
                />
            )}
            <div
                className="fixed inset-0 w-screen h-screen bg-black/50 z-10 flex items-center justify-center"
                onClick={onClose}
            >
                <div
                    className={cn(
                        "flex items-center justify-center",
                        "max-w-[600px] mx-auto",
                        "border border-[rgba(255,255,255,0.1)] rounded-xl",
                        "bg-gradient-to-br from-[rgba(12,12,14,0.7)] to-[rgba(14,14,15,0.8)]",
                        "backdrop-blur-md overflow-hidden"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 right-0 p-2">
                        <button onClick={onClose}>
                            <XIcon className="w-4 h-4 cursor-pointer" />
                        </button>
                    </div>
                    <div className="w-full h-full flex flex-col items-center justify-center px-8 py-6">
                        {navigationItems.map((item, index) => (
                            <>
                                <div
                                    key={item.value}
                                    className="w-full h-full p-1"
                                >
                                    <button
                                        className={cn(
                                            "w-full h-full cursor-pointer",
                                            getResponsiveClass(25).textClass
                                        )}
                                        onClick={() => {
                                            setSelectedItem(item.value);
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                </div>
                                {index !== navigationItems.length - 1 && (
                                    <div className="w-full h-[1px] bg-[rgba(255,255,255,0.3)] my-3" />
                                )}
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
