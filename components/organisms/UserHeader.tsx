"use client";

import UserCard from "../molecules/UserCard";

interface UserHeaderProps {
    src?: string;
    name: string;
    isOwner: boolean;
}

export default function UserHeader({
    src,
    name,
    isOwner
}: UserHeaderProps) {
    return (
        <header className="p-4 shadow-sm bg-card flex justify-between items-center">
            <UserCard src={src} name={name} />
            {isOwner && <span className="text-sm text-primary">(You)</span>}
        </header>
    );
};