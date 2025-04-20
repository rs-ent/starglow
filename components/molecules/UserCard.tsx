/// components\molecules\UserCard.tsx

import { cn } from "@/lib/utils/tailwind";
import Avatar from "../atoms/Avatar";
import Username from "../atoms/Username";

interface UserCardProps {
    src?: string;
    name: string;
    walletAddress?: string;
    avatarSize?: number;
    usernameSize?: number;
    unserNameTruncate?: boolean;
    className?: string;
}

export default function UserCard({
    src,
    name,
    walletAddress,
    avatarSize,
    usernameSize,
    unserNameTruncate,
    className,
}: UserCardProps) {
    return (
        <div
            className={cn("flex gap-2 items-center justify-center", className)}
        >
            <Avatar src={src} alt={name} size={avatarSize} />
            <Username
                name={name}
                size={usernameSize}
                truncate={unserNameTruncate}
            />
            {walletAddress && (
                <span className="text-sm text-gray-500">{walletAddress}</span>
            )}
        </div>
    );
}
