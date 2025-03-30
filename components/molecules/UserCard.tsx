/// components\molecules\UserCard.tsx

import Avatar from "../atoms/Avatar";
import Username from "../atoms/Username";

interface UserCardProps {
    src?: string;
    name: string;
    walletAddress?: string;
}

export default function UserCard({ src, name, walletAddress }: UserCardProps) {
    return (
        <div className="flex gap-2 items-center">
            <Avatar src={src} alt={name} />
            <Username name={name} />
            {walletAddress && (
                <span className="text-sm text-gray-500">{walletAddress}</span>
            )}
        </div>
    );
}