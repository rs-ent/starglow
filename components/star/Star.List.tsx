/// components/star/Star.List.tsx

"use client";

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Rocket } from "lucide-react";
import { createArtistGradients } from "@/lib/utils/artist-styles";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import type { ArtistWithSPG } from "@/app/actions/artists";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import Link from "next/link";

interface StarListProps {
    artists: ArtistWithSPG[];
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
                {artists.length > 0 ? (
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
    artist: ArtistWithSPG;
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

    const stats = useMemo(() => {
        const totalCollections = artist.story_spg?.length || 0;
        const totalCirculation =
            artist.story_spg?.reduce((sum, spg) => sum + spg.circulation, 0) ||
            0;
        const activeCollections =
            artist.story_spg?.filter((spg) => {
                const now = new Date();
                return (
                    spg.saleStart &&
                    spg.saleEnd &&
                    new Date(spg.saleStart) <= now &&
                    new Date(spg.saleEnd) >= now
                );
            }).length || 0;

        // Real data from artist
        const totalPolls = artist.polls?.length || 0;
        const totalQuests = artist.quests?.length || 0;

        return {
            totalCollections,
            totalCirculation,
            activeCollections,
            totalPolls,
            totalQuests,
        };
    }, [artist]);

    return (
        <Link href={`/star/${artist.id}`}>
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
                    "relative group cursor-pointer",
                    "morp-glass-1 transition-all duration-700 ease-out",
                    "border border-white/10 hover:border-white/30",
                    "rounded-3xl overflow-hidden inner-shadow"
                )}
                style={{
                    background: `linear-gradient(to bottom right, ${ArtistBG(
                        artist,
                        0,
                        25
                    )}, ${ArtistBG(artist, 1, 30)})`,
                    boxShadow: isHovered
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
                    <img
                        src={
                            artist.imageUrl ||
                            artist.logoUrl ||
                            "/default-avatar.jpg"
                        }
                        alt={artist.name}
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
                        {artist.name}
                    </h3>

                    {/* Description */}
                    {artist.description && (
                        <p
                            className={cn(
                                "text-[rgba(255,255,255,0.6)] mb-4 line-clamp-2",
                                getResponsiveClass(12).textClass
                            )}
                        >
                            {artist.description}
                        </p>
                    )}

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
                                NFTs
                            </p>
                            <p
                                className={cn(
                                    "font-bold text-white",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {stats.totalCollections}
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
                                Polls
                            </p>
                            <p
                                className={cn(
                                    "font-bold text-white",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {stats.totalPolls}
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
                                {stats.totalQuests}
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <motion.button
                        whileHover={{
                            scale: 1.02,
                            y: -2,
                            transition: {
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                            },
                        }}
                        whileTap={{
                            scale: 0.98,
                            transition: { duration: 0.1 },
                        }}
                        className={cn(
                            "w-full text-white font-bold rounded-lg",
                            "transition-all duration-500 ease-out inner-shadow",
                            "flex items-center justify-center relative overflow-hidden",
                            "hover:shadow-lg hover:shadow-purple-500/25",
                            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                            "before:translate-x-[-200%] before:transition-transform before:duration-700",
                            "hover:before:translate-x-[200%]",
                            getResponsiveClass(14).textClass,
                            getResponsiveClass(15).paddingClass,
                            getResponsiveClass(10).gapClass
                        )}
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(139,92,246,1), rgba(168,85,247,0.9))",
                        }}
                    >
                        <motion.div
                            whileHover={{
                                rotate: 15,
                                transition: { duration: 0.3 },
                            }}
                        >
                            <Rocket
                                className={cn(
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                        </motion.div>
                        Glow!
                    </motion.button>
                </div>

                {/* Activity Preview (on hover) */}
                <AnimatePresence>
                    {isHovered &&
                        (stats.totalCollections > 0 ||
                            stats.totalPolls > 0 ||
                            stats.totalQuests > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 right-0 mb-2 z-20"
                            >
                                <div
                                    className={cn(
                                        "morp-glass-1 inner-shadow rounded-lg p-3 max-w-xs mx-auto"
                                    )}
                                    style={{
                                        background:
                                            "linear-gradient(to bottom right, rgba(0,0,0,0.9), rgba(139,92,246,0.1))",
                                    }}
                                >
                                    <p
                                        className={cn(
                                            "font-bold text-[rgba(139,92,246,0.9)] mb-2 text-center",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        🌟 {artist.name} Activity
                                    </p>

                                    <div
                                        className={cn(
                                            "space-y-2",
                                            getResponsiveClass(10).gapClass
                                        )}
                                    >
                                        {/* Collections */}
                                        {stats.totalCollections > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className={cn(
                                                        "flex items-center",
                                                        getResponsiveClass(5)
                                                            .gapClass
                                                    )}
                                                >
                                                    <Gem
                                                        className={cn(
                                                            "text-[rgba(139,92,246,0.9)]",
                                                            getResponsiveClass(
                                                                15
                                                            ).frameClass
                                                        )}
                                                    />
                                                    <span
                                                        className={cn(
                                                            "text-white",
                                                            getResponsiveClass(
                                                                10
                                                            ).textClass
                                                        )}
                                                    >
                                                        Collections
                                                    </span>
                                                </div>
                                                <span
                                                    className={cn(
                                                        "font-bold text-[rgba(139,92,246,0.9)]",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    {stats.totalCollections}
                                                </span>
                                            </div>
                                        )}

                                        {/* Active Polls */}
                                        {stats.totalPolls > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className={cn(
                                                        "flex items-center",
                                                        getResponsiveClass(5)
                                                            .gapClass
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            getResponsiveClass(
                                                                15
                                                            ).textClass
                                                        )}
                                                    >
                                                        📊
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-white",
                                                            getResponsiveClass(
                                                                10
                                                            ).textClass
                                                        )}
                                                    >
                                                        Active Polls
                                                    </span>
                                                </div>
                                                <span
                                                    className={cn(
                                                        "font-bold text-[rgba(59,130,246,0.9)]",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    {stats.totalPolls}
                                                </span>
                                            </div>
                                        )}

                                        {/* Available Quests */}
                                        {stats.totalQuests > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className={cn(
                                                        "flex items-center",
                                                        getResponsiveClass(5)
                                                            .gapClass
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            getResponsiveClass(
                                                                15
                                                            ).textClass
                                                        )}
                                                    >
                                                        🎯
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-white",
                                                            getResponsiveClass(
                                                                10
                                                            ).textClass
                                                        )}
                                                    >
                                                        Quests
                                                    </span>
                                                </div>
                                                <span
                                                    className={cn(
                                                        "font-bold text-[rgba(16,185,129,0.9)]",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    {stats.totalQuests}
                                                </span>
                                            </div>
                                        )}

                                        {/* Latest Collection Preview */}
                                        {artist.story_spg &&
                                            artist.story_spg.length > 0 && (
                                                <div
                                                    className={cn(
                                                        "border-t border-[rgba(255,255,255,0.1)]",
                                                        getResponsiveClass(10)
                                                            .paddingClass,
                                                        "pt-2"
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "flex items-center",
                                                            getResponsiveClass(
                                                                10
                                                            ).gapClass
                                                        )}
                                                    >
                                                        <img
                                                            src={
                                                                artist
                                                                    .story_spg[0]
                                                                    .imageUrl ||
                                                                ""
                                                            }
                                                            alt={
                                                                artist
                                                                    .story_spg[0]
                                                                    .name
                                                            }
                                                            className={cn(
                                                                "rounded object-cover",
                                                                getResponsiveClass(
                                                                    25
                                                                ).frameClass
                                                            )}
                                                        />
                                                        <span
                                                            className={cn(
                                                                "text-[rgba(255,255,255,0.7)] truncate flex-1",
                                                                getResponsiveClass(
                                                                    10
                                                                ).textClass
                                                            )}
                                                        >
                                                            {
                                                                artist
                                                                    .story_spg[0]
                                                                    .name
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
});
