/// components/atoms/ProfileName.tsx

"use client";

import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { User } from "next-auth";
import { getProviderIdentity } from "@/lib/utils/get/provider-identity";
import { Provider, ProviderType } from "@/app/types/auth";

interface ProfileNameProps {
    user: User & { provider?: ProviderType };
    size?: number;
}

export default function ProfileName({ user, size = 20 }: ProfileNameProps) {
    const textClass = getResponsiveClass(size).textClass;
    const frameClass = getResponsiveClass(size + 5).frameClass;

    const { icon, color } = getProviderIdentity(user.provider);

    return (
        <div className="flex flex-row gap-[5px] items-center justify-center">
            {icon && (
                <div className={cn("rounded-full p-[2px]", color, frameClass)}>
                    <img
                        src={icon}
                        alt={`${user.provider} icon`}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <p className={cn("text-[rgba(255,255,255,0.7)]", textClass)}>
                {user.name || user.email || " "}
            </p>
        </div>
    );
}
