/// components\organisms\NFTs.Collection.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NFTContentsDetails from "./NFT.Contents.Details";
import NFTContentsPayment from "./NFT.Contents.Payment";
import type { Collection } from "@/app/actions/factoryContracts";
import { METADATA_TYPE } from "@/app/actions/metadata";
import NFTContentsReport from "./NFT.Contents.Report";
import NFTContentsPageImages from "./NFT.Contents.PageImages";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { CollectionParticipantType, Payment } from "@prisma/client";
import { useCollectionGet } from "@/app/hooks/useCollectionContracts";
import NFTContentsPreRegistration from "./NFT.Contents.PreRegistration";
import InteractFeedback from "../atoms/Popup.InteractFeedback";

interface NFTContentsProps {
    collection: Collection;
}

export default function NFTContents({ collection }: NFTContentsProps) {
    const metadata = collection?.metadata?.metadata as METADATA_TYPE;
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const { status, dateLabel, dateValue, participantsType } = useMemo(() => {
        const now = new Date();
        const preSaleStart = collection.preSaleStart;
        const preSaleEnd = collection.preSaleEnd;
        const saleStart = collection.saleStart;
        const saleEnd = collection.saleEnd;
        const glowStart = collection.glowStart;
        const glowEnd = collection.glowEnd;

        let status = "SCHEDULED";
        let dateLabel = "Sale Open";
        let dateValue = "Unknown";
        let participantsType: CollectionParticipantType =
            CollectionParticipantType.PREREGISTRATION;

        if (glowStart && glowEnd) {
            if (now < glowStart) {
                participantsType = CollectionParticipantType.GLOW;
                status = "GLOWING";
                dateLabel = "Glow Start";
                dateValue = formatDate(glowStart.toISOString());
            } else if (now > glowStart && now < glowEnd) {
                participantsType = CollectionParticipantType.GLOW;
                status = "GLOWING";
                dateLabel = "Glow End";
                dateValue = formatDate(glowEnd.toISOString());
            } else {
                participantsType = CollectionParticipantType.GLOW;
                status = "GLOWED";
                dateLabel = "Glow Ended";
                dateValue = formatDate(glowEnd.toISOString());
            }
        }

        if (saleStart && saleEnd) {
            if (now < saleStart) {
                participantsType = CollectionParticipantType.PRIVATESALE;
                status = "SCHEDULED";
                dateLabel = "Sale Open";
                dateValue = formatDate(saleStart.toISOString());
            } else if (now > saleStart && now < saleEnd) {
                participantsType = CollectionParticipantType.PUBLICSALE;
                status = "ONGOING";
                dateLabel = "Sale End";
                dateValue = formatDate(saleEnd.toISOString());
            }
        }

        if (preSaleStart && preSaleEnd) {
            if (now < preSaleStart) {
                participantsType = CollectionParticipantType.PREREGISTRATION;
                status = "PRE-REG";
                dateLabel = "Pre Reg Open";
                dateValue = formatDate(preSaleStart.toISOString());
            } else if (now > preSaleStart && now < preSaleEnd) {
                participantsType = CollectionParticipantType.PREREGISTRATION;
                status = "PRE-REG";
                dateLabel = "Pre Sale End";
                dateValue = formatDate(preSaleEnd.toISOString());
            }
        }

        return {
            status,
            dateLabel,
            dateValue,
            participantsType,
        };
    }, [collection]);

    const { collectionStock, collectionParticipants } = useCollectionGet({
        collectionAddress: collection.address,
        options: {
            participantsType,
        },
    });

    const handlePurchase = (quantity: number) => {
        console.log(
            `Purchasing ${quantity} NFTs from collection ${collection.address}`
        );
    };

    const handlePaymentSuccess = (payment: Payment) => {
        setShowFeedback(true);
    };

    return (
        <div className="flex flex-col items-center w-full py-6 sm:py-8 md:py-10">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <div className="w-full max-w-7xl px-4">
                {purchaseSuccess && (
                    <div className="bg-chart-1/20 border border-chart-1/30 text-chart-1 p-3 sm:p-4 rounded-lg mb-6 sm:mb-8 max-w-3xl mx-auto">
                        <p className="font-main text-center text-sm md:text-base">
                            Your purchase was successful! Check your wallet for
                            the NFT.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 mt-[50px] mb-[50px] lg:grid-cols-3 lg:gap-8 lg:mt-[0px] lg:mb-[0px]">
                    <div className="lg:col-span-2 order-1 lg:order-1 gap-6 flex flex-col">
                        <NFTContentsDetails
                            collection={collection}
                            metadata={metadata}
                            participantsType={participantsType}
                            status={status}
                            dateLabel={dateLabel}
                            dateValue={dateValue}
                            collectionStock={collectionStock}
                            collectionParticipantsNumber={
                                collectionParticipants?.length || 0
                            }
                        />
                        <NFTContentsReport metadata={metadata} />
                        <NFTContentsPageImages collection={collection} />
                    </div>

                    <div className="lg:col-span-1 order-2 lg:order-2">
                        <div
                            className="lg:sticky lg:top-[110px]"
                            id="nft-payment-section"
                        >
                            {participantsType ===
                            CollectionParticipantType.PUBLICSALE ? (
                                <NFTContentsPayment
                                    collection={collection}
                                    onPurchase={handlePurchase}
                                    collectionStock={collectionStock}
                                    onPaymentSuccess={handlePaymentSuccess}
                                />
                            ) : (
                                <NFTContentsPreRegistration
                                    collection={collection}
                                    participantsType={participantsType}
                                    status={status}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <NFTStickyPurchaseButton
                text={
                    participantsType === CollectionParticipantType.PUBLICSALE
                        ? "Buy Now"
                        : "Pre Register Now"
                }
            />
            <InteractFeedback
                open={showFeedback}
                onClose={() => setShowFeedback(false)}
                title="NFT Purchase Successful!"
                description={`You have successfully purchased ${collection.name}`}
                type="purchaseNFT"
                showConfetti={true}
                collection={collection}
            />
        </div>
    );
}

const VISIBLE_THRESHOLD = 0.1;
const HIDE_THRESHOLD = 0.7;
const MAX_OPACITY = 1;
const MID_OPACITY = 0.9;

function NFTStickyPurchaseButton({ text = "Buy Now" }: { text?: string }) {
    const [opacity, setOpacity] = useState(MAX_OPACITY);

    useEffect(() => {
        const target = document.getElementById("nft-payment-section");
        if (!target) return;

        const observer = new window.IntersectionObserver(
            ([entry]) => {
                const ratio = entry.intersectionRatio;
                if (ratio < VISIBLE_THRESHOLD) {
                    setOpacity(MAX_OPACITY);
                } else if (
                    ratio >= VISIBLE_THRESHOLD &&
                    ratio < HIDE_THRESHOLD
                ) {
                    const t =
                        (ratio - VISIBLE_THRESHOLD) /
                        (HIDE_THRESHOLD - VISIBLE_THRESHOLD); // 0~1
                    setOpacity(MID_OPACITY * (1 - t));
                } else {
                    setOpacity(0);
                }
            },
            {
                threshold: Array.from({ length: 21 }, (_, i) => i * 0.05), // 0, 0.05, ..., 1
            }
        );
        observer.observe(target);

        return () => observer.disconnect();
    }, []);

    const handleClick = useCallback(() => {
        const paymentSection = document.getElementById("nft-payment-section");
        if (paymentSection) {
            paymentSection.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    if (opacity === 0) return null;

    return (
        <ShinyButton
            style={{ opacity, transition: "opacity 0.5s" }}
            className={cn(
                "gradient-border",
                "bg-gradient-to-br from-[rgba(10,2,28,0.75)] to-[rgba(46,18,108,0.6)]",
                "fixed bottom-[65px] max-w-md z-50 md:hidden border-none backdrop-blur-sm shadow-md"
            )}
            onClick={handleClick}
        >
            <h2
                className={cn(
                    "text-center text-white",
                    getResponsiveClass(15).textClass
                )}
            >
                {text}
            </h2>
        </ShinyButton>
    );
}

function formatDate(date: string) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const monthStr = month < 10 ? `0${month}` : month;
    const dayStr = day < 10 ? `0${day}` : day;
    return `${year}.${monthStr}.${dayStr}`;
}
