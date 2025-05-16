/// components/user/User.NFT.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { CollectionContract } from "@prisma/client";
import { METADATA_TYPE } from "@/app/actions/metadata";
import ImageMetadata from "../atoms/ImageMetadata";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useMemo, useState } from "react";
import { formatHexToRGBA } from "@/lib/utils/format";
import PublicPrivateTab from "../molecules/PublicPrivateTab";

interface UserNFTDetailProps {
    collection: CollectionContract;
    metadata: METADATA_TYPE;
    onClose: () => void;
}

export default function UserNFTDetail({
    collection,
    metadata,
    onClose,
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
                    "fixed inset-0 w-screen h-screen backdrop-blur-3xl z-50"
                )}
                style={{
                    background: `linear-gradient(to bottom right, ${bg1}, ${bg2}, ${bg3})`,
                }}
            >
                <div className="absolute top-0 right-0 p-6">
                    <button onClick={onClose}>
                        <XIcon className="text-white" />
                    </button>
                </div>
                <div
                    className={cn(
                        "flex flex-col p-6 items-center justify-center h-full",
                        "max-w-[600px] w-screen mx-auto"
                    )}
                >
                    <h2
                        className={cn(
                            "fixed top-6",
                            getResponsiveClass(40).textClass
                        )}
                    >
                        {metadata.name}
                    </h2>
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
                    <div className="w-full">
                        <PublicPrivateTab
                            isPublic={isMission}
                            onPublic={() => setIsMission(true)}
                            onPrivate={() => setIsMission(false)}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
