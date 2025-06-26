/// components/atoms/InviteFriends.Modal.tsx

"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import QRCodeModal from "./QRCode";

import type { Player } from "@prisma/client";

interface InviteFriendsModalProps {
    player: Player | null;
    onClose: () => void;
}

export default function InviteFriendsModal({
    player,
    onClose,
}: InviteFriendsModalProps) {
    const refUrl = useMemo(() => {
        const code = player?.referralCode || "";
        if (typeof window !== "undefined") {
            if (typeof navigator.share === "function") {
                return code
                    ? `${window.location.origin}/invite?ref=${code}&method=webapp`
                    : `${window.location.origin}/invite`;
            } else {
                return code
                    ? `https://t.me/Waydcloud_bot?startapp=${code}`
                    : "https://t.me/Waydcloud_bot?startapp";
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
        },
    });

    return (
        <>
            <AnimatePresence>
                <div
                    className="fixed top-0 left-0 z-20 w-screen h-screen"
                    onClick={onClose}
                >
                    <motion.div
                        className={cn(
                            "absolute left-1/2 bottom-0 -translate-x-1/2",
                            "w-full max-w-[600px] rounded-t-3xl shadow-lg",
                            "flex flex-col items-center pt-[20px] pb-[100px] px-4",
                            "bg-gradient-to-br from-[rgba(164,210,252,1)] to-[rgba(143,122,250.1)]"
                        )}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 40,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src="/ui/letter.svg"
                            alt="Invite Friends Letter"
                            className="absolute -top-5 left-2 fade-in-translate-full duration-500"
                            style={{
                                width: "10vw",
                                maxWidth: "120px",
                                minWidth: "60px",
                                height: "auto",
                                transform: "scaleX(-1)",
                            }}
                            width={120}
                            height={120}
                            priority={false}
                            unoptimized={false}
                        />
                        <div className="w-full mb-4 text-center">
                            <h2
                                className={cn(getResponsiveClass(30).textClass)}
                            >
                                INVITE FRIENDS
                            </h2>
                            <p className={cn(getResponsiveClass(15).textClass)}>
                                Invite your friends to Starglow and earn
                                rewards!
                            </p>
                        </div>
                        <div
                            className={cn(
                                "flex flex-row items-start justify-center",
                                "px-6 py-4",
                                "gap-14 sm:gap-16 md:gap-18 lg:gap-20 xl:gap-22",
                                "mb-[60px] md:mb-[70px] lg:mb-[30px]",
                                "bg-[rgba(0,0,0,0.1)] inner-shadow rounded-2xl"
                            )}
                        >
                            {selection.map((item) => (
                                <button
                                    key={item.title}
                                    className="flex flex-col items-center justify-center gap-1"
                                    onClick={item.onClick}
                                >
                                    <Image
                                        src={item.icon}
                                        alt={item.title}
                                        className={cn(
                                            getResponsiveClass(40).frameClass
                                        )}
                                        width={40}
                                        height={40}
                                        priority={false}
                                        unoptimized={false}
                                    />
                                    <p
                                        className={cn(
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {item.title}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
            {showQrCode && (
                <QRCodeModal
                    url={refUrl}
                    onClose={() => setShowQrCode(false)}
                />
            )}
        </>
    );
}
