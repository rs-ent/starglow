/// components/nfts/NFT.WhatYouGet.tsx

"use client";

import React from "react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import Image from "next/image";

interface Benefit {
    id: string;
    title: string;
    description: string;
    icon: string;
    gradient: string;
    highlight?: string;
}

interface NFTBenefitsProps {
    sharePercentage?: number;
    airdropAmount?: number;
    totalSupply?: number;
    className?: string;
}

export default React.memo(function NFTBenefits({
    sharePercentage = 10,
    airdropAmount = 2000,
    totalSupply = 1000,
    className,
}: NFTBenefitsProps) {
    const benefits: Benefit[] = [
        {
            id: "revenue",
            title: "Artist's Revenue",
            description: `Share goes to holders during project`,
            icon: "/elements/distribution.png",
            gradient: "from-purple-600 via-purple-400 to-pink-500",
            highlight: `${sharePercentage}%`,
        },
        {
            id: "airdrop",
            title: "Airdrop",
            description: `Token drops per number of purchase`,
            icon: "/elements/parachute.png",
            gradient: "from-blue-600 via-purple-400 to-purple-500",
            highlight: `${airdropAmount.toLocaleString()} $SGT`,
        },
        {
            id: "membership",
            title: "Membership",
            description: "Private events to join for holders only",
            icon: "/elements/card.png",
            gradient: "from-purple-600 via-purple-400 to-purple-500",
            highlight: "VIP Access",
        },
        {
            id: "limited",
            title: "Limited Edition",
            description: `Few amount of NFT minted only`,
            icon: "/elements/money.png",
            gradient: "from-yellow-600 via-purple-400 to-purple-500",
            highlight: `${totalSupply.toLocaleString()} Only`,
        },
    ];

    return (
        <div className={cn("w-full", className)}>
            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {benefits.map((benefit, index) => (
                    <BenefitCard
                        key={benefit.id}
                        benefit={benefit}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
});

interface BenefitCardProps {
    benefit: Benefit;
    index: number;
}

function BenefitCard({ benefit, index }: BenefitCardProps) {
    const { title, description, icon, gradient } = benefit;

    return (
        <div
            className={cn(
                "group relative overflow-hidden",
                "bg-gradient-to-br",
                gradient,
                "rounded-2xl p-[1px]",
                "hover:scale-[1.02] transition-all duration-300",
                "animate-in slide-in-from-bottom-4"
            )}
            style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: "backwards",
            }}
        >
            {/* Card Content */}
            <div className="relative h-full bg-background/95 backdrop-blur-sm rounded-2xl p-4 md:p-6">
                {/* Gradient Overlay */}
                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-br",
                        gradient,
                        "opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                    )}
                />

                {/* Icon Container */}
                <div className="flex flex-row gap-3 md:flex-col md:items-start">
                    <div
                        className={cn(
                            "inline-flex items-center justify-center",
                            "w-fit h-fit rounded-xl p-[5px]",
                            "bg-gradient-to-br",
                            "gradient-border",
                            "from-[rgba(0,0,0,0.2)] via-[rgb(255,255,255,0.1)] to-[rgb(0,0,0,0.4)]",
                            "shadow-lg group-hover:shadow-purple-500/25 transition-shadow duration-300"
                        )}
                    >
                        <Image
                            src={icon}
                            alt={title}
                            width={120}
                            height={120}
                            className={cn(
                                "object-contain",
                                getResponsiveClass(90).frameClass
                            )}
                        />
                    </div>

                    {/* Content */}
                    <div className="relative">
                        <h3
                            className={cn(
                                "font-bold mb-1 rainbow-text",
                                getResponsiveClass(35).textClass,
                                "text-foreground group-hover:text-purple-300 transition-colors duration-300"
                            )}
                        >
                            {title}
                        </h3>
                        <p
                            className={cn(
                                "text-foreground/70 leading-relaxed",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            {description}
                        </p>
                    </div>
                </div>

                {/* Hover Glow Effect */}
                <div
                    className={cn(
                        "absolute -inset-1 bg-gradient-to-r",
                        gradient,
                        "rounded-2xl opacity-0 group-hover:opacity-20",
                        "blur-xl transition-all duration-300 -z-10"
                    )}
                />
            </div>
        </div>
    );
}
