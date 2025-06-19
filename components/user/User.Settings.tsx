/// components/user/User.Settings.tsx

"use client";

import { Player } from "@prisma/client";
import { User } from "next-auth";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import UserSettingsProfile from "./User.Settings.Profile";
import { signOut } from "next-auth/react";

interface UserSettingsProps {
    user: User;
    player: Player;
}

export default function UserSettings({ user, player }: UserSettingsProps) {
    return (
        <div className="space-y-6 w-screen max-w-[1000px] mx-auto">
            <UserSettingsProfile player={player} user={user} />
            <section className={cn("flex items-center justify-end")}>
                <button
                    className={cn(
                        "text-[rgba(255,50,50,1)] cursor-pointer",
                        "hover:text-[rgba(255,255,255,0.8)]",
                        "transition-all duration-300",
                        getResponsiveClass(15).textClass
                    )}
                    onClick={() => {
                        signOut({ callbackUrl: "/?signedOut=true" });
                    }}
                >
                    Sign out
                </button>
            </section>
        </div>
    );
}
