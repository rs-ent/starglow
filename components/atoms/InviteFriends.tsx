"use client";

import { useState } from "react";

import Image from "next/image";
import InviteFriendsModal from "./InviteFriends.Modal";
import { H3 } from "./Typography";

import type { Player } from "@prisma/client";

interface InviteFriendsProps {
    player: Player | null;
    bgColorFrom?: string;
    bgColorTo?: string;
}

export default function InviteFriends({
    player,
    bgColorFrom = "#A5D7FB",
    bgColorTo = "#8E76FA",
}: InviteFriendsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        if (typeof window !== "undefined") {
            setIsOpen(true);
        }
    };

    return (
        <div className="relative flex w-full items-center justify-center">
            {isOpen && (
                <InviteFriendsModal
                    player={player}
                    onClose={() => setIsOpen(false)}
                />
            )}

            <div
                className="relative w-full rounded-2xl cursor-pointer"
                style={{
                    background: `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`,
                }}
                onClick={handleClick}
            >
                <H3 size={25} className="text-start p-4">
                    Invite Friends!
                </H3>
                <Image
                    src="/ui/letter.svg"
                    alt="Invite Friends Letter"
                    className="absolute -top-5 right-2"
                    style={{
                        width: "7vw",
                        maxWidth: "120px",
                        minWidth: "100px",
                        height: "auto",
                    }}
                    width={120}
                    height={120}
                    priority={false}
                    unoptimized={false}
                />
            </div>
        </div>
    );
}
