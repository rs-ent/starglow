"use client";

import { useMemo, useState } from "react";
import { H3 } from "./Typography";
import { Player } from "@prisma/client";
import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import QRCodeModal from "./QRCode";

const InviteFriendsModal = ({
    refUrl,
    onClose,
    setShowQrCode,
}: {
    refUrl: string;
    onClose: () => void;
    setShowQrCode: (showQrCode: boolean) => void;
}) => {
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
};

interface InviteFriendsProps {
    player: Player;
}

export default function InviteFriends({ player }: InviteFriendsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showQrCode, setShowQrCode] = useState(false);

    const refUrl = useMemo(() => {
        if (typeof window !== "undefined" && player && player.referralCode) {
            return `${window.location.origin}/invite?ref=${player.referralCode}&method=webapp`;
        }
        return "";
    }, [player?.referralCode]);

    const handleClick = () => {
        if (typeof window !== "undefined" && player && player.referralCode) {
            setIsOpen(true);
        }
    };

    return (
        <div className="relative flex w-full items-center justify-center">
            {isOpen && (
                <InviteFriendsModal
                    refUrl={refUrl}
                    onClose={() => setIsOpen(false)}
                    setShowQrCode={setShowQrCode}
                />
            )}

            {showQrCode && (
                <QRCodeModal
                    url={refUrl}
                    onClose={() => setShowQrCode(false)}
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
