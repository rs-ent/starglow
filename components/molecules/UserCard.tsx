/// components\molecules\UserCard.tsx

import Avatar from "../atoms/Avatar";
import Username from "../atoms/Username";

interface UserCardProps {
    src?: string;
    name: string;
}

export default function UserCard({ src, name }: UserCardProps) {
    return (
        <div className="flex gap-2 items-center">
            <Avatar src={src} alt={name} />
            <Username name={name} />
        </div>
    );
}