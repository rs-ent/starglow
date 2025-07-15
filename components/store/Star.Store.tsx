///components/store/Star.Store.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Package,
    Ticket,
    Zap,
    Shield,
    Sparkles,
    Crown,
    Camera,
    Users,
    Video,
    Star,
    Heart,
    Trophy,
} from "lucide-react";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { ArtistBG } from "@/lib/utils/get/artist-colors";

interface StarStoreProps {
    backgroundColors: string[];
}

interface StoreItem {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    subIcon: React.ComponentType<{ className?: string }>;
    subIconColor: string;
    backgroundColor: string;
    gradientFrom: string;
    gradientTo: string;
    borderColor: string;
    hoverBorderColor: string;
    pulseColor: string;
    backgroundIndex: [number, number];
    delay: number;
}

export default React.memo(function StarStore({
    backgroundColors,
}: StarStoreProps) {
    const mockupItems: StoreItem[] = [
        {
            title: "Merch",
            description: "Official apparel & accessories",
            icon: Package,
            subIcon: Sparkles,
            subIconColor: "text-yellow-400",
            backgroundColor: "bg-purple-500/50",
            gradientFrom: "from-purple-500/20",
            gradientTo: "to-blue-500/20",
            borderColor: "border-purple-400/30",
            hoverBorderColor: "hover:border-purple-400/50",
            pulseColor: "bg-purple-400",
            backgroundIndex: [0, 1],
            delay: 0.9,
        },
        {
            title: "Concert Tickets",
            description: "Live concert & tour tickets",
            icon: Ticket,
            subIcon: Trophy,
            subIconColor: "text-orange-400",
            backgroundColor: "bg-red-500/50",
            gradientFrom: "from-red-500/20",
            gradientTo: "to-orange-500/20",
            borderColor: "border-red-400/30",
            hoverBorderColor: "hover:border-red-400/50",
            pulseColor: "bg-red-400",
            backgroundIndex: [1, 2],
            delay: 1.0,
        },
        {
            title: "Virtual Fan Meetings",
            description: "Metaverse fan meeting passes",
            icon: Video,
            subIcon: Sparkles,
            subIconColor: "text-cyan-400",
            backgroundColor: "bg-cyan-500/50",
            gradientFrom: "from-cyan-500/20",
            gradientTo: "to-blue-500/20",
            borderColor: "border-cyan-400/30",
            hoverBorderColor: "hover:border-cyan-400/50",
            pulseColor: "bg-cyan-400",
            backgroundIndex: [2, 0],
            delay: 1.1,
        },
        {
            title: "Fan Camp",
            description: "Exclusive fan camp invitations",
            icon: Users,
            subIcon: Heart,
            subIconColor: "text-pink-400",
            backgroundColor: "bg-green-500/50",
            gradientFrom: "from-green-500/20",
            gradientTo: "to-emerald-500/20",
            borderColor: "border-green-400/30",
            hoverBorderColor: "hover:border-green-400/50",
            pulseColor: "bg-green-400",
            backgroundIndex: [1, 3],
            delay: 1.2,
        },
        {
            title: "Showcase Passes",
            description: "Private showcase entry tickets",
            icon: Star,
            subIcon: Crown,
            subIconColor: "text-yellow-400",
            backgroundColor: "bg-yellow-500/50",
            gradientFrom: "from-yellow-500/20",
            gradientTo: "to-amber-500/20",
            borderColor: "border-yellow-400/30",
            hoverBorderColor: "hover:border-yellow-400/50",
            pulseColor: "bg-yellow-400",
            backgroundIndex: [3, 1],
            delay: 1.3,
        },
        {
            title: "Digital Content",
            description: "Behind-the-scenes & NFT collections",
            icon: Camera,
            subIcon: Shield,
            subIconColor: "text-purple-400",
            backgroundColor: "bg-pink-500/50",
            gradientFrom: "from-pink-500/20",
            gradientTo: "to-purple-500/20",
            borderColor: "border-pink-400/30",
            hoverBorderColor: "hover:border-pink-400/50",
            pulseColor: "bg-pink-400",
            backgroundIndex: [2, 3],
            delay: 1.4,
        },
    ];

    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                getResponsiveClass(20).gapClass
            )}
        >
            {mockupItems.map((item) => {
                const IconComponent = item.icon;
                const SubIconComponent = item.subIcon;

                return (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: item.delay }}
                        className={cn(
                            "relative group cursor-pointer",
                            "bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.2)]",
                            "rounded-2xl border border-white/20 overflow-hidden",
                            "hover:shadow-xl transition-all duration-300",
                            item.hoverBorderColor,
                            getResponsiveClass(25).paddingClass
                        )}
                        style={{
                            background: `linear-gradient(135deg, ${ArtistBG(
                                { backgroundColors },
                                item.backgroundIndex[0],
                                10
                            )}, ${ArtistBG(
                                { backgroundColors },
                                item.backgroundIndex[1],
                                15
                            )})`,
                        }}
                    >
                        <div
                            className={cn(
                                "flex items-center",
                                getResponsiveClass(50).gapClass,
                                getResponsiveClass(15).marginYClass
                            )}
                        >
                            <div
                                className={cn(
                                    "rounded-full relative flex items-center justify-center flex-shrink-0",
                                    "border",
                                    item.backgroundColor,
                                    item.borderColor,
                                    getResponsiveClass(50).frameClass
                                )}
                            >
                                <IconComponent
                                    className={cn(
                                        "text-white",
                                        getResponsiveClass(35).frameClass
                                    )}
                                />
                            </div>
                            <div>
                                <h3
                                    className={cn(
                                        "font-bold text-white flex items-center",
                                        getResponsiveClass(25).textClass,
                                        getResponsiveClass(10).gapClass
                                    )}
                                >
                                    {item.title}
                                    {item.title === "Virtual Fan Meetings" ? (
                                        <div
                                            className={cn(
                                                "bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text font-bold",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            VR
                                        </div>
                                    ) : (
                                        <SubIconComponent
                                            className={cn(
                                                item.subIconColor,
                                                getResponsiveClass(25)
                                                    .frameClass
                                            )}
                                        />
                                    )}
                                </h3>
                                <p
                                    className={cn(
                                        "text-white/70",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {item.description}
                                </p>
                            </div>
                        </div>

                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div
                                className={cn(
                                    "text-white rounded-lg font-medium flex items-center",
                                    getResponsiveClass(20).paddingClass,
                                    getResponsiveClass(15).textClass,
                                    getResponsiveClass(10).gapClass
                                )}
                            >
                                <Zap
                                    className={
                                        getResponsiveClass(15).frameClass
                                    }
                                />
                                Coming Soon
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
});
