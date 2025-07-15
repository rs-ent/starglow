/// components/star/Star.List.tsx

"use client";

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createArtistGradients } from "@/lib/utils/artist-styles";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import Link from "next/link";
import Image from "next/image";
import type { ArtistsForStarList } from "@/app/actions/artists";
import { useBoards } from "@/app/actions/boards/hooks";
import { usePollsGet } from "@/app/hooks/usePolls";
import { useQuestGet } from "@/app/hooks/useQuest";

interface StarListProps {
    artists: ArtistsForStarList[] | null;
}

export default memo(function StarList({ artists }: StarListProps) {
    const [hoveredArtist, setHoveredArtist] = useState<string | null>(null);

    return (
        <div
            className={cn(
                "flex flex-col w-full max-w-[1400px] mx-auto",
                getResponsiveClass(20).paddingClass
            )}
        >
            <h2
                className={cn(
                    "text-center text-4xl",
                    "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                    getResponsiveClass(45).textClass
                )}
            >
                Star
            </h2>

            {/* Artists Grid */}
            <AnimatePresence mode="wait">
                {artists && artists.length > 0 ? (
                    <motion.div
                        key="artists"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                            "mt-[30px] mb-[100px] lg:mt-[40px] lg:mb-[40px]",
                            getResponsiveClass(70).gapClass
                        )}
                    >
                        {artists.map((artist, index) => (
                            <ArtistCard
                                key={artist.id}
                                artist={artist}
                                index={index}
                                isHovered={hoveredArtist === artist.id}
                                onHover={setHoveredArtist}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "morp-glass-1 inner-shadow",
                            "rounded-3xl p-12 text-center"
                        )}
                        style={{
                            background:
                                "linear-gradient(to bottom right, rgba(0,0,0,0.2), rgba(0,0,0,0.05))",
                        }}
                    >
                        <div
                            className={cn(
                                "mb-4",
                                getResponsiveClass(60).textClass
                            )}
                        >
                            🔍
                        </div>
                        <h3
                            className={cn(
                                "font-bold text-white mb-2",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            No Artists Found
                        </h3>
                        <p
                            className={cn(
                                "text-[rgba(255,255,255,0.6)]",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            Try adjusting your search or filters
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// Artist Card Component
interface ArtistCardProps {
    artist: ArtistsForStarList;
    index: number;
    isHovered: boolean;
    onHover: (id: string | null) => void;
}

const ArtistCard = memo(function ArtistCard({
    artist,
    index,
    isHovered,
    onHover,
}: ArtistCardProps) {
    const gradients = useMemo(() => createArtistGradients(artist), [artist]);
    const isHidden = useMemo(() => artist.hidden, [artist]);

    const { artistAllBoardPostCountData: totalPosts } = useBoards({
        getArtistAllBoardPostCountInput: {
            artistId: artist.id,
        },
    });

    const { artistAllActivePollCount: totalPolls } = usePollsGet({
        getArtistAllActivePollCountInput: {
            artistId: artist.id,
        },
    });

    const { artistAllActiveQuestCount: totalQuests } = useQuestGet({
        getArtistAllActiveQuestCountInput: {
            artistId: artist.id,
        },
    });

    const CardContent = (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{
                y: -8,
                scale: 1.03,
                transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                },
            }}
            onHoverStart={() => onHover(artist.id)}
            onHoverEnd={() => onHover(null)}
            className={cn(
                "relative group",
                isHidden ? "cursor-not-allowed" : "cursor-pointer",
                "morp-glass-1 transition-all duration-700 ease-out",
                "border border-white/10",
                "hover:border-white/30",
                "rounded-3xl overflow-hidden inner-shadow"
            )}
            style={{
                background: `linear-gradient(to bottom right, ${
                    isHidden ? "rgba(0,0,0,0.1)" : ArtistBG(artist, 0, 20)
                }, ${isHidden ? "rgba(0,0,0,0.05)" : ArtistBG(artist, 1, 40)})`,
                boxShadow:
                    isHovered && !isHidden
                        ? `0 25px 50px -12px ${ArtistBG(
                              artist,
                              0,
                              40
                          )}, 0 0 0 1px rgba(255,255,255,0.1)`
                        : "0 10px 25px -3px rgba(0, 0, 0, 0.1)",
            }}
        >
            {/* Background Gradient Overlay */}
            <div
                className="absolute inset-0 opacity-0 transition-all duration-1000 ease-out group-hover:opacity-15"
                style={{
                    background: `radial-gradient(circle at center, ${gradients.primary}, transparent 70%)`,
                    transform: "scale(1.1)",
                }}
            />

            {/* Artist Image */}
            <div
                className={cn(
                    "relative overflow-hidden",
                    "h-[400px] sm:h-[440px] md:h-[460px] lg:h-[500px]"
                )}
            >
                {isHidden && (
                    <div className="absolute inset-0 opacity-45 blur-xs bg-black z-20">
                        <Image
                            src="/elements/focus.webp"
                            alt="Hidden Artist"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <Image
                    src={
                        isHidden
                            ? "/elements/who-is-next.png"
                            : artist.imageUrl ||
                              artist.logoUrl ||
                              "/default-avatar.jpg"
                    }
                    alt={artist.name}
                    fill
                    loading="lazy"
                    priority={false}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 30vw, 25vw"
                    className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 transition-opacity duration-700 group-hover:from-black/40" />
            </div>

            {/* Content */}
            <div
                className={cn(
                    "relative z-10",
                    getResponsiveClass(25).paddingClass
                )}
            >
                {/* Artist Name */}
                <h3
                    className={cn(
                        "font-bold text-white mb-2 truncate",
                        getResponsiveClass(20).textClass
                    )}
                >
                    {isHidden ? "???" : artist.name}
                </h3>

                {/* Real Stats */}
                <div
                    className={cn(
                        "grid grid-cols-3 mb-4",
                        getResponsiveClass(10).gapClass
                    )}
                >
                    <div
                        className={cn(
                            "bg-[rgba(139,92,246,0.1)] rounded-lg text-center inner-shadow",
                            getResponsiveClass(10).paddingClass
                        )}
                    >
                        <p
                            className={cn(
                                "text-[rgba(139,92,246,0.9)] font-medium text-center",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            Posts
                        </p>
                        <p
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            {isHidden ? "0" : totalPosts}
                        </p>
                    </div>
                    <div
                        className={cn(
                            "bg-[rgba(59,130,246,0.1)] rounded-lg text-center inner-shadow",
                            getResponsiveClass(10).paddingClass
                        )}
                    >
                        <p
                            className={cn(
                                "text-[rgba(59,130,246,0.9)] font-medium",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            Engages
                        </p>
                        <p
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            {isHidden ? "0" : totalPolls}
                        </p>
                    </div>
                    <div
                        className={cn(
                            "bg-[rgba(16,185,129,0.1)] rounded-lg text-center inner-shadow",
                            getResponsiveClass(10).paddingClass
                        )}
                    >
                        <p
                            className={cn(
                                "text-[rgba(16,185,129,0.9)] font-medium",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            Quests
                        </p>
                        <p
                            className={cn(
                                "font-bold text-white",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            {isHidden ? "0" : totalQuests}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return isHidden ? (
        CardContent
    ) : (
        <Link href={`/star/${artist.code}`}>{CardContent}</Link>
    );
});
