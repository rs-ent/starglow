/// components\user\User.Settings.Profile.tsx

"use client";

import { useMemo, useState } from "react";

import { usePlayerGet, usePlayerSet } from "@/app/hooks/usePlayer";
import { useToast } from "@/app/hooks/useToast";
import FileUploader from "@/components/atoms/FileUploader";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { Player } from "@prisma/client";
import type { User } from "next-auth";
import Image from "next/image";

interface UserSettingsProfileProps {
    player: Player;
    user: User;
    showNickname?: boolean;
    showImage?: boolean;
}

export default function UserSettingsProfile({
    player,
    user,
    showNickname = true,
    showImage = true,
}: UserSettingsProfileProps) {
    const toast = useToast();
    const { updatePlayerSettings, isUpdatePlayerSettingsPending } =
        usePlayerSet();

    const { playerProfile, refetchPlayerProfile } = usePlayerGet({
        getPlayerProfileInput: {
            playerId: player.id,
        },
    });

    const { initialNickname, initialImage } = useMemo(() => {
        return {
            initialNickname:
                playerProfile?.name ||
                player.nickname ||
                user.name ||
                user.email ||
                "",
            initialImage:
                playerProfile?.image || player.image || user.image || "",
        };
    }, [playerProfile, player, user]);

    const [nickname, setNickname] = useState(initialNickname);
    const [image, setImage] = useState(initialImage);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await updatePlayerSettings({
            playerId: player.id,
            nickname,
            image,
        });
        if (!result) {
            toast.error("Failed to update player settings");
        } else {
            toast.success("Successfully updated!");
            refetchPlayerProfile().catch((error) => {
                console.error("Error refetching player image:", error);
            });
        }
    };

    const handleImageUpload = (files: { id: string; url: string }[]) => {
        if (files.length > 0) {
            setImage(files[0].url);
        }
    };

    return (
        <section
            className={cn(
                "rounded-[10px]",
                "bg-gradient-to-br from-[rgba(5,5,6,0.6)] to-[rgba(10,10,12,0.4)]",
                getResponsiveClass(20).paddingClass
            )}
        >
            <div className="space-y-2">
                <h2
                    className={cn(
                        "font-semibold",
                        getResponsiveClass(20).textClass
                    )}
                >
                    Edit Profile
                </h2>
                <p
                    className={cn(
                        "text-gray-400",
                        getResponsiveClass(10).textClass
                    )}
                >
                    Update your profile information
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-4 my-2">
                    {showImage && (
                        <div className="flex w-full items-center justify-center gap-4">
                            {image && (
                                <div className="mt-2 flex-shrink-0 flex items-center justify-center">
                                    <Image
                                        src={image || "/default-avatar.jpg"}
                                        alt="Profile preview"
                                        width={100}
                                        height={100}
                                        className={cn(
                                            "rounded-full object-cover",
                                            getResponsiveClass(70).frameClass
                                        )}
                                        unoptimized={true}
                                    />
                                </div>
                            )}
                            <FileUploader
                                purpose="profile"
                                bucket="profiles"
                                onComplete={handleImageUpload}
                                multiple={false}
                                maxSize={5 * 1024 * 1024}
                                className="flex-1 bg-[rgba(255,255,255,0.1)]"
                            />
                        </div>
                    )}
                    {showNickname && (
                        <div>
                            <input
                                type="text"
                                id="nickname"
                                value={nickname}
                                placeholder="Nickname"
                                onChange={(e) => setNickname(e.target.value)}
                                className={cn(
                                    "w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] rounded-lg",
                                    getResponsiveClass(20).textClass
                                )}
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isUpdatePlayerSettingsPending}
                        className={cn(
                            "w-full py-2 border border-[rgba(255,255,255,0.3)]",
                            "rounded-[10px]",
                            "hover:bg-[rgba(255,255,255,0.1)]",
                            "disabled:opacity-50",
                            "transition-all duration-300",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        {isUpdatePlayerSettingsPending
                            ? "Saving..."
                            : "Save Changes"}
                    </button>
                </div>
            </form>
        </section>
    );
}
