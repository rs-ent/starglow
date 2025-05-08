/// components/atoms/InviteFriends.Modal.tsx

"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import QRCodeModal from "./QRCode";
import { Player } from "@prisma/client";

interface InviteFriendsModalProps {
    player: Player;
    onClose: () => void;
}

export default function InviteFriendsModal({
    player,
    onClose,
}: InviteFriendsModalProps) {
    const refUrl = useMemo(() => {
        const code = player.referralCode;
        if (typeof window !== "undefined") {
            if (typeof navigator.share === "function") {
                return `${window.location.origin}/invite?ref=${code}&method=webapp`;
            } else {
                return `https://t.me/Waydcloud_bot?startapp=${code}`;
            }
        }
        return "";
    }, [player?.referralCode]);

    const [showQrCode, setShowQrCode] = useState(false);

    const toast = useToast();
    const selection = [];

    if (navigator.share) {
        selection.push({
            title: "Share",
            icon: "/icons/share.svg",
            onClick: async () => {
                await navigator.share({ url: refUrl });
                onClose();
            },
        });
    } else {
        selection.push({
            title: "Share",
            icon: "/icons/share.svg",
            onClick: () => {
                const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
                    refUrl
                )}&text=${encodeURIComponent("🔥 Join Starglow!")}`;
                window.open(shareUrl, "_blank");
                onClose();
            },
        });
    }

    selection.push({
        title: "Copy Link",
        icon: "/icons/copyurl.svg",
        onClick: async () => {
            await navigator.clipboard.writeText(refUrl);
            toast.success("Link copied to clipboard");
            onClose();
        },
    });

    selection.push({
        title: "QR Code",
        icon: "/icons/qrcode.svg",
        onClick: () => {
            setShowQrCode(true);
            onClose();
        },
    });

    if (showQrCode) {
        return (
            <QRCodeModal url={refUrl} onClose={() => setShowQrCode(false)} />
        );
    }

    return (
        <div
            className="fixed top-0 left-0 z-50 w-screen h-screen bg-[rgba(0,0,0,0.6)]"
            onClick={() => {
                onClose();
            }}
        >
            <div
                className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row items-start",
                    "gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-14"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                {selection.map((item) => (
                    <button
                        key={item.title}
                        className="flex flex-col items-center justify-center gap-1 shadow"
                        onClick={item.onClick}
                    >
                        <img
                            src={item.icon}
                            alt={item.title}
                            className={cn(getResponsiveClass(50).frameClass)}
                        />
                        <p className={cn(getResponsiveClass(10).textClass)}>
                            {item.title}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
