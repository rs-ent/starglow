/// components/user/User.Settings.tsx

"use client";

import { Player } from "@prisma/client";
import { User } from "next-auth";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { usePlayerSet } from "@/app/hooks/usePlayer";
import { useState } from "react";
import FileUploader from "@/components/atoms/FileUploader";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";

interface UserSettingsProps {
    user: User;
    player: Player;
    showImage?: boolean;
    showNickname?: boolean;
    onClose?: () => void;
}

export default function UserSettings({
    user,
    player,
    showImage = true,
    showNickname = true,
    onClose,
}: UserSettingsProps) {
    const toast = useToast();
    const router = useRouter();
    const { updatePlayerSettings, isUpdatePlayerSettingsPending } =
        usePlayerSet();

    const [nickname, setNickname] = useState(
        player.nickname || user.name || user.email || ""
    );
    const [image, setImage] = useState(player.image || user.image || "");

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
            onClose?.();
        }
    };

    const handleImageUpload = (files: { id: string; url: string }[]) => {
        if (files.length > 0) {
            setImage(files[0].url);
        }
    };

    return (
        <div
            className="fixed inset-0 w-screen h-screen bg-black/50 z-50 flex items-center justify-center px-[10px]"
            onClick={onClose}
        >
            <div
                className={cn(
                    "w-full flex items-center justify-center",
                    "max-w-[600px] mx-auto",
                    "border border-[rgba(255,255,255,0.1)] rounded-xl",
                    "bg-gradient-to-br from-[rgba(12,12,14,0.7)] to-[rgba(14,14,15,0.8)]",
                    "backdrop-blur-md overflow-hidden"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-full p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="absolute top-0 right-0 p-2">
                            <button onClick={onClose}>
                                <XIcon className="w-4 h-4 cursor-pointer" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 my-2">
                            {showImage && (
                                <div className="flex w-full items-center justify-center gap-4">
                                    {image && (
                                        <div className="mt-2 flex-shrink-0 flex items-center justify-center">
                                            <img
                                                src={image}
                                                alt="Profile preview"
                                                className={cn(
                                                    "rounded-full object-cover",
                                                    getResponsiveClass(70)
                                                        .frameClass
                                                )}
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
                                        onChange={(e) =>
                                            setNickname(e.target.value)
                                        }
                                        className={cn(
                                            "w-full px-3 py-2 bg-[rgba(255,255,255,0.1)] rounded-lg",
                                            getResponsiveClass(15).textClass
                                        )}
                                    />
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isUpdatePlayerSettingsPending}
                                className={cn(
                                    "w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {isUpdatePlayerSettingsPending
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
