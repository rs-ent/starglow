"use client";

import UserCard from "../molecules/UserCard";

interface UserHeaderProps {
    src?: string;
    name: string;
}

export default function UserHeader({
    src,
    name,
}: UserHeaderProps) {
    
    
    return (
        <header className="p-4 shadow-sm bg-card flex justify-between items-center">
            <UserCard src={src} name={name} />        
        </header>
    );
};