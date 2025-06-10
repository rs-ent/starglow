/// components/polls/Poll.tsx

"use client";

import { Player, Poll, Artist, PollLog } from "@prisma/client";
import PollsListCard from "./Polls.List.Card";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { useState } from "react";
import { useToast } from "@/app/hooks/useToast";
import QRCodeModal from "../atoms/QRCode";
import { TokenGatingData } from "@/app/story/nft/actions";

interface PollProps {
    poll: Poll;
    player: Player | null;
    artist: Artist | null;
    pollLogs: PollLog[];
    tokenGating: TokenGatingData | null;
    bgColorAccentFrom?: string | undefined;
    bgColorAccentTo?: string | undefined;
}

export default function PollComponent({
    poll,
    player,
    artist,
    pollLogs,
    tokenGating,
    bgColorAccentFrom,
    bgColorAccentTo,
}: PollProps) {
    const toast = useToast();
    const [showQrCode, setShowQrCode] = useState(false);

    const selection = [];
    /*
    const refUrl = useMemo(() => {
        const code = player?.referralCode || "";
        if (typeof window !== "undefined") {
            if (typeof navigator.share === "function") {
                return code
                    ? `${window.location.origin}/polls/${poll.id}`
                    : `${window.location.origin}/polls/${poll.id}`;
            } else {
                return code
                    ? `https://t.me/Waydcloud_bot?startapp=${code}&pollId=${poll.id}`
                    : `https://t.me/Waydcloud_bot?startapp&pollId=${poll.id}`;
            }
        }
        return "";
    }, [player?.referralCode]);
    */

    const refUrl = `${window.location.origin}/polls/${poll.id}`;

    if (navigator.share) {
        selection.push({
            title: "Share",
            icon: "/icons/share.svg",
            onClick: async () => {
                await navigator.share({ url: refUrl });
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
            },
        });
    }

    selection.push({
        title: "Copy Link",
        icon: "/icons/copyurl.svg",
        onClick: async () => {
            await navigator.clipboard.writeText(refUrl);
            toast.success("Link copied to clipboard");
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
        <div
            className={cn(
                "relative flex flex-col w-full h-full overflow-hidden px-[20px] gap-[50px]",
                "py-[100px]"
            )}
        >
            <PollsListCard
                poll={poll}
                player={player || null}
                artist={artist || null}
                pollLogs={pollLogs}
                tokenGating={tokenGating}
                isSelected={true}
                bgColorAccentFrom={bgColorAccentFrom}
                bgColorAccentTo={bgColorAccentTo}
            />

            <div
                className={cn(
                    "relative w-full max-w-[600px] rounded-3xl shadow-lg mx-auto",
                    "rounded-t-3xl shadow-lg",
                    "flex flex-col items-center py-6 px-4",
                    "border border-[rgba(255,255,255,0.3)]",
                    "bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(0,0,0,0.1)]"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full mb-4 text-center">
                    <h2 className={cn(getResponsiveClass(20).textClass)}>
                        SHARE TO YOUR FRIENDS
                    </h2>
                </div>
                <div
                    className={cn(
                        "flex flex-row items-start justify-center",
                        "px-6 py-4",
                        "gap-14 sm:gap-16 md:gap-18 lg:gap-20 xl:gap-22",
                        "bg-[rgba(0,0,0,0.1)] inner-shadow rounded-2xl"
                    )}
                >
                    {selection.map((item) => (
                        <button
                            key={item.title}
                            className="flex flex-col items-center justify-center gap-1"
                            onClick={item.onClick}
                        >
                            <img
                                src={item.icon}
                                alt={item.title}
                                className={cn(
                                    getResponsiveClass(30).frameClass
                                )}
                            />
                            <p className={cn(getResponsiveClass(5).textClass)}>
                                {item.title}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
            {showQrCode && (
                <QRCodeModal
                    url={refUrl}
                    onClose={() => setShowQrCode(false)}
                />
            )}
        </div>
    );
}
