/// components/user/User.MyStar.Modal.tsx

"use client";

import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { AnimatePresence, motion } from "framer-motion";
import { Artist, Player, QuestLog, PollLog } from "@prisma/client";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";
import type { VerifiedCollection } from "@/app/actions/collectionContracts";
import UserMyStarModalContents from "./User.MyStar.Modal.Contents";
interface UserMyStarModalProps {
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
    artist: Artist | null;
    verifiedCollections: VerifiedCollection[];
    open: boolean;
    onClose: () => void;
}

export default function UserMyStarModal({
    artist,
    verifiedCollections,
    open,
    onClose,
    player,
    questLogs,
    pollLogs,
}: UserMyStarModalProps) {
    if (!artist) return null;

    return (
        <AnimatePresence mode="wait">
            {open && (
                <motion.div
                    className={cn(
                        "fixed inset-0 z-50 w-screen h-screen overflow-y-auto",
                        "flex items-center justify-center"
                    )}
                >
                    <motion.div
                        initial={{
                            clipPath: "circle(0% at 50% 50%)",
                            scale: 0.95,
                        }}
                        animate={{
                            clipPath: "circle(150% at 50% 50%)",
                            scale: 1,
                        }}
                        exit={{
                            clipPath: "circle(0% at 50% 50%)",
                            scale: 0.95,
                        }}
                        transition={{
                            duration: 0.8,
                            ease: [0.65, 0, 0.35, 1],
                        }}
                        className={cn(
                            "fixed inset-0",
                            "-z-50",
                            "bg-gradient-to-br"
                        )}
                        style={{
                            background: `linear-gradient(to bottom right, 
                                ${ArtistBG(artist, 0, 100)}, 
                                ${ArtistBG(artist, 1, 100)}
                            )`,
                        }}
                    />
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                        onClick={onClose}
                        className={cn(
                            "absolute top-2 right-2",
                            "p-2 rounded-full",
                            "transition-colors duration-200",
                            `text-[${ArtistFG(artist, 0, 100)}]`
                        )}
                    >
                        <XIcon className="w-6 h-6" />
                    </motion.button>
                    <div className={cn("w-full h-full max-w-[1000px] mx-auto")}>
                        <UserMyStarModalContents
                            artist={artist}
                            verifiedCollections={verifiedCollections}
                            player={player}
                            questLogs={questLogs}
                            pollLogs={pollLogs}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
