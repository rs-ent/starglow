/// components\user\User.Settings.Profile.Modal.tsx

"use client";

import { XIcon } from "lucide-react";

import UserSettingsProfile from "./User.Settings.Profile";
import EnhancedPortal from "../atoms/Portal.Enhanced";

import type { Player } from "@prisma/client";
import type { User } from "next-auth";

interface UserSettingsProfileModalProps {
    player: Player;
    user: User;
    showNickname?: boolean;
    showImage?: boolean;
    onClose: () => void;
}

export default function UserSettingsProfileModal({
    player,
    user,
    showNickname = true,
    showImage = true,
    onClose,
}: UserSettingsProfileModalProps) {
    return (
        <EnhancedPortal layer="modal">
            <div
                className="fixed inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center z-50 p-2"
                onClick={onClose}
            >
                <div
                    className="relative w-screen max-w-[1000px] mx-auto rounded-lg overflow-hidden bg-[rgba(0,0,0,1)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <XIcon
                        className="absolute top-4 right-4 cursor-pointer"
                        onClick={onClose}
                    />
                    <UserSettingsProfile
                        player={player}
                        user={user}
                        showNickname={showNickname}
                        showImage={showImage}
                    />
                </div>
            </div>
        </EnhancedPortal>
    );
}
