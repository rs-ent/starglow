"use client";

import UserCard from "../molecules/UserCard";

interface UserHeaderProps {
    src?: string;
    name: string;
    walletAddress?: string;
}

export default function UserHeader({
    src,
    name,
    walletAddress,
}: UserHeaderProps) {
    
    
    return (
        <header className="p-10 shadow-sm flex justify-between items-center">
            <UserCard src={src} name={name} walletAddress={walletAddress} />        
        </header>
    );
};