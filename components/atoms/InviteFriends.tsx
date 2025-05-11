"use client";

import { useState } from "react";
import { H3 } from "./Typography";
import { Player } from "@prisma/client";
import InviteFriendsModal from "./InviteFriends.Modal";

interface InviteFriendsProps {
    player: Player | null;
}

export default function InviteFriends({ player }: InviteFriendsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        if (typeof window !== "undefined") {
            setIsOpen(true);
        }
    };

    return (
        <div className="relative flex w-full items-center justify-center">
            {player && isOpen && (
                <InviteFriendsModal
                    player={player}
                    onClose={() => setIsOpen(false)}
                />
            )}

            <div
                className="relative w-full bg-gradient-to-br from-[#A5D7FB] to-[#8E76FA] rounded-2xl cursor-pointer"
                onClick={handleClick}
            >
                <H3 size={25} className="text-start p-4">
                    Invite Friends!
                </H3>
                <img
                    src="/ui/letter.svg"
                    alt="Invite Friends Letter"
                    className="absolute -top-5 right-2"
                    style={{
                        width: "7vw",
                        maxWidth: "120px",
                        minWidth: "100px",
                        height: "auto",
                    }}
                />
            </div>
        </div>
    );
}
