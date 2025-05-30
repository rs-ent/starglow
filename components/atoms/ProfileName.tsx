/// components/atoms/ProfileName.tsx

"use client";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { User } from "next-auth";
import { getProviderIdentity } from "@/lib/utils/get/provider-identity";
import { Provider, ProviderType } from "@/app/types/auth";
import { Player } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import UserSettings from "../user/User.Settings";

interface ProfileNameProps {
    size?: number;
}

export default function ProfileName({ size = 20 }: ProfileNameProps) {
    const { data: session } = useSession();

    const [showUserSettings, setShowUserSettings] = useState<boolean>(false);

    const { textClass, frameClass, iconClass } = useMemo(() => {
        return {
            textClass: getResponsiveClass(size).textClass,
            frameClass: getResponsiveClass(size + 5).frameClass,
            iconClass: getResponsiveClass(size - 5).frameClass,
        };
    }, [size]);

    const { nickname, icon, color, provider } = useMemo(() => {
        const user = session?.user as User & { provider?: ProviderType };
        if (!user) {
            return {
                nickname: "",
                icon: "",
                color: "",
                provider: "",
            };
        }
        const provider = user.provider as ProviderType | undefined;
        const { icon, color } = getProviderIdentity(provider);
        const player = session?.player as Player;
        const nickname = player.nickname || user.name || user.email || "";
        return {
            nickname,
            icon,
            color,
            provider,
        };
    }, [session]);

    return (
        <>
            {showUserSettings && (
                <UserSettings
                    user={session?.user as User}
                    player={session?.player as Player}
                    onClose={() => setShowUserSettings(false)}
                    showImage={false}
                />
            )}
            <div
                className="flex flex-row gap-[5px] items-center justify-center group cursor-pointer"
                onClick={() => {
                    setShowUserSettings(true);
                }}
            >
                {icon && (
                    <div
                        className={cn(
                            "rounded-full p-[2px]",
                            "flex items-center justify-center",
                            color,
                            frameClass
                        )}
                    >
                        <img
                            src={icon}
                            alt={`${provider} icon`}
                            className={cn(
                                "w-full h-full object-cover",
                                iconClass
                            )}
                        />
                    </div>
                )}
                <p className={cn("text-[rgba(255,255,255,0.7)]", textClass)}>
                    {nickname}
                </p>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <img
                        src="/ui/edit.svg"
                        alt="Edit"
                        className={cn(getResponsiveClass(5).frameClass)}
                    />
                </div>
            </div>
        </>
    );
}
