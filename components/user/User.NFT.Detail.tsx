/// components/user/User.NFT.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { CollectionContract, Player } from "@prisma/client";
import { METADATA_TYPE } from "@/app/actions/metadata";
import ImageMetadata from "../atoms/ImageMetadata";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useMemo, useState } from "react";
import { formatHexToRGBA } from "@/lib/utils/format";
import PublicPrivateTab from "../molecules/PublicPrivateTab";
import { User } from "next-auth";
import { TokenGateResult } from "@/app/actions/blockchain";
import UserNFTDetailStaking from "./User.NFT.Detail.Staking";
import UserNFTDetailMission from "./User.NFT.Detail.Mission";
interface UserNFTDetailProps {
    collection: CollectionContract;
    metadata: METADATA_TYPE;
    tokenGateResult: TokenGateResult;
    onClose: () => void;
    user: User | null;
    player: Player | null;
}

export default function UserNFTDetail({
    collection,
    metadata,
    tokenGateResult,
    onClose,
    user,
    player,
}: UserNFTDetailProps) {
    const [isMission, setIsMission] = useState(true);

    const { bg1, bg2, bg3 } = useMemo(() => {
        const bg = metadata?.background_color?.replace("#", "") || "000000";
        const bg1 = formatHexToRGBA(bg, 0.6);
        const bg2 = formatHexToRGBA(bg, 0.4);
        const bg3 = formatHexToRGBA(bg, 0.9);

        return { bg1, bg2, bg3 };
    }, [metadata]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{
                    opacity: 0,
                    y: -20,
                    scale: 0.98,
                    filter: "blur(10px)",
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: "blur(0px)",
                }}
                exit={{
                    opacity: 0,
                    y: 20,
                    scale: 0.98,
                    filter: "blur(10px)",
                }}
                transition={{
                    type: "spring",
                    duration: 0.6,
                    damping: 25,
                    stiffness: 120,
                    mass: 0.8,
                }}
                className={cn(
                    "fixed inset-0 w-screen h-screen backdrop-blur-3xl z-30"
                )}
                style={{
                    background: `linear-gradient(to bottom right, ${bg1}, ${bg2}, ${bg3})`,
                }}
            >
                <div className="absolute top-0 right-0 p-3">
                    <button onClick={onClose}>
                        <XIcon className="text-white" />
                    </button>
                </div>
                <div
                    className={cn(
                        "flex flex-col items-center justify-center h-full",
                        "max-w-[600px] w-screen mx-auto",
                        "py-14 px-3"
                    )}
                >
                    <h2
                        className={cn(
                            "break-words w-full text-center px-6 mb-6",
                            getResponsiveClass(35).textClass
                        )}
                    >
                        {metadata.name}
                    </h2>
                    <div
                        className={cn(
                            "flex-1 w-full overflow-y-auto",
                            "py-4 px-3"
                        )}
                    >
                        <div
                            className={cn(
                                "w-full gradient-border p-[10px] white-glow-smooth",
                                "rounded-[12px]"
                            )}
                            style={{
                                background: `linear-gradient(to bottom right, ${bg3}, ${bg2}, ${bg1})`,
                            }}
                        >
                            <ImageMetadata
                                metadata={metadata}
                                className="w-full rounded-[12px]"
                            />
                        </div>
                        <div className={cn("mt-6 mb-4 sm:mt-10 sm:mb-6")}>
                            <PublicPrivateTab
                                isPublic={isMission}
                                onPublic={() => setIsMission(true)}
                                onPrivate={() => setIsMission(false)}
                                textSize={25}
                                frameSize={20}
                                gapSize={10}
                                publicText="Mission"
                                privateText="Staking"
                            />
                        </div>
                        {isMission ? (
                            <UserNFTDetailMission
                                user={user}
                                player={player}
                                collection={collection}
                                tokenGateResult={tokenGateResult}
                            />
                        ) : (
                            <UserNFTDetailStaking
                                user={user}
                                player={player}
                                collection={collection}
                                tokenGateResult={tokenGateResult}
                            />
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
