/// components/user/User.MyStar.Modal.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowBigLeft } from "lucide-react";

import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { cn } from "@/lib/utils/tailwind";

import UserMyStarModalContents from "./User.MyStar.Modal.Contents";
import Portal from "../atoms/Portal";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { Artist, Player, QuestLog, PollLog } from "@prisma/client";

interface UserMyStarModalProps {
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
    artist: Artist | null;
    verifiedSPGs: VerifiedSPG[];
    open: boolean;
    onClose: () => void;
    onSelectFeed?: (
        initialFeeds: ArtistFeedWithReactions[],
        selectedFeedIndex: number
    ) => void;
}

export default function UserMyStarModal({
    artist,
    verifiedSPGs,
    open,
    onClose,
    player,
    questLogs,
    pollLogs,
    onSelectFeed,
}: UserMyStarModalProps) {
    if (!artist) return null;

    return (
        <Portal>
            <AnimatePresence mode="wait">
                {open && (
                    <motion.div
                        className={cn(
                            "fixed inset-0 z-50 w-screen h-screen",
                            "flex items-center justify-center"
                        )}
                        style={{
                            zIndex: 1000,
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/80 -z-50 backdrop-blur-md"
                            style={{ willChange: "opacity" }}
                        />

                        <motion.div
                            initial={{
                                opacity: 0,
                                transform: "scale(0) rotate(0deg)",
                            }}
                            animate={{
                                opacity: 0.4,
                                transform: "scale(1.3) rotate(180deg)",
                            }}
                            exit={{
                                opacity: 0,
                                transform: "scale(0) rotate(0deg)",
                            }}
                            transition={{
                                duration: 1.5,
                                ease: [0.21, 1.11, 0.81, 0.99],
                            }}
                            className="fixed inset-0 -z-40 pointer-events-none"
                            style={{
                                background: `conic-gradient(from 0deg at 50% 50%, 
                                transparent 0deg, 
                                ${ArtistBG(artist, 0, 30)} 30deg, 
                                transparent 60deg,
                                transparent 120deg,
                                ${ArtistBG(artist, 1, 30)} 150deg,
                                transparent 180deg,
                                transparent 240deg,
                                ${ArtistBG(artist, 2, 30)} 270deg,
                                transparent 300deg,
                                transparent 360deg)`,
                                willChange: "transform, opacity",
                            }}
                        />

                        <motion.div
                            initial={{
                                transform: "scale(0.5)",
                                opacity: 0,
                            }}
                            animate={{
                                transform: "scale(3)",
                                opacity: [0, 0.8, 0],
                            }}
                            transition={{
                                duration: 1.2,
                                times: [0, 0.5, 1],
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="fixed inset-0 -z-30 pointer-events-none"
                            style={{
                                background: `radial-gradient(circle at 50% 50%, 
                                transparent 40%, 
                                ${ArtistBG(artist, 0, 60)} 48%, 
                                transparent 52%)`,
                                willChange: "transform, opacity",
                            }}
                        />

                        <div className="fixed inset-0 z-50 pointer-events-none">
                            {Array.from({ length: 36 }).map((_, i) => {
                                const angle = Math.random() * 360;
                                const startRadius = Math.random() * 40;
                                const endRadius = 80 + Math.random() * 180;
                                const delay = 0.1 + Math.random() * 0.5;

                                return (
                                    <motion.div
                                        key={`particle-${i}`}
                                        initial={{
                                            opacity: 0,
                                            transform: `translate(-50%, -50%) scale(0)`,
                                        }}
                                        animate={{
                                            opacity: [0, 1, 0],
                                            transform: [
                                                `translate(calc(-50% + ${
                                                    Math.cos(
                                                        (angle * Math.PI) / 180
                                                    ) * startRadius
                                                }px), calc(-50% + ${
                                                    Math.sin(
                                                        (angle * Math.PI) / 180
                                                    ) * startRadius
                                                }px)) scale(0)`,
                                                `translate(calc(-50% + ${
                                                    Math.cos(
                                                        (angle * Math.PI) / 180
                                                    ) * endRadius
                                                }px), calc(-50% + ${
                                                    Math.sin(
                                                        (angle * Math.PI) / 180
                                                    ) * endRadius
                                                }px)) scale(1)`,
                                                `translate(calc(-50% + ${
                                                    Math.cos(
                                                        (angle * Math.PI) / 180
                                                    ) *
                                                    (endRadius + 30)
                                                }px), calc(-50% + ${
                                                    Math.sin(
                                                        (angle * Math.PI) / 180
                                                    ) *
                                                    (endRadius + 30)
                                                }px)) scale(0)`,
                                            ],
                                        }}
                                        transition={{
                                            duration: 1,
                                            delay,
                                            ease: [0.08, 0.82, 0.17, 1],
                                        }}
                                        className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
                                        style={{
                                            background: ArtistBG(
                                                artist,
                                                i,
                                                100
                                            ),
                                            boxShadow: `0 0 10px ${ArtistBG(
                                                artist,
                                                i,
                                                60
                                            )}`,
                                            willChange: "transform, opacity",
                                        }}
                                    />
                                );
                            })}
                        </div>

                        <motion.div
                            initial={{
                                opacity: 0,
                                transform: "scale(0.8)",
                            }}
                            animate={{
                                opacity: 0.5,
                                transform: "scale(1)",
                            }}
                            exit={{
                                opacity: 0,
                                transform: "scale(0.8)",
                            }}
                            transition={{
                                duration: 0.6,
                                ease: [0.43, 0.13, 0.23, 0.96],
                            }}
                            className="fixed inset-0 -z-25 pointer-events-none"
                            style={{
                                background: `radial-gradient(circle at 50% 50%, 
                                ${ArtistBG(artist, 0, 30)}, 
                                ${ArtistBG(artist, 1, 15)} 50%, 
                                transparent 80%)`,
                                filter: "blur(40px)",
                                willChange: "transform, opacity",
                            }}
                        />

                        <div className="fixed top-1 left-1 z-10">
                            <ArrowBigLeft
                                className="w-8 h-8 text-white"
                                onClick={onClose}
                            />
                        </div>

                        <div className={cn("w-full h-full relative")}>
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    transform:
                                        "perspective(1200px) rotateX(-20deg) scale(0.9)",
                                }}
                                animate={{
                                    opacity: 1,
                                    transform:
                                        "perspective(1200px) rotateX(0deg) scale(1)",
                                }}
                                exit={{
                                    opacity: 0,
                                    transform:
                                        "perspective(1200px) rotateX(-20deg) scale(0.9)",
                                }}
                                transition={{
                                    duration: 0.7,
                                    delay: 0.4,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="h-full"
                                style={{
                                    willChange: "transform, opacity",
                                }}
                            >
                                <div
                                    className={cn(
                                        "relative w-full h-full overflow-hidden",
                                        "bg-gradient-to-r animate-gradient-shift"
                                    )}
                                    style={{
                                        backgroundImage: `linear-gradient(135deg, 
                                        ${ArtistBG(artist, 1, 95)}, 
                                        ${ArtistBG(artist, 0, 95)}, 
                                        ${ArtistBG(artist, 2, 95)}, 
                                        ${ArtistBG(artist, 0, 95)})`,
                                        backgroundSize: "100% 100%",
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "w-full h-full overflow-y-auto overflow-x-hidden",
                                            "backdrop-blur-xl"
                                        )}
                                        style={{
                                            boxShadow: `
                                            0 0 40px ${ArtistBG(artist, 0, 20)},
                                            inset 0 0 30px ${ArtistBG(
                                                artist,
                                                2,
                                                10
                                            )}
                                        `,
                                        }}
                                    >
                                        <UserMyStarModalContents
                                            artist={artist}
                                            verifiedSPGs={verifiedSPGs}
                                            player={player}
                                            questLogs={questLogs}
                                            pollLogs={pollLogs}
                                            onSelectFeed={onSelectFeed}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
