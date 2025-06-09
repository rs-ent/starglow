/// components\organisms\NFTs.Collection.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import NFTContentsDetails from "./NFT.Contents.Details";
import NFTContentsPayment from "./NFT.Contents.Payment";
import NFTContentsReport from "./NFT.Contents.Report";
import NFTContentsPageImages from "./NFT.Contents.PageImages";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { CollectionParticipantType, Payment } from "@prisma/client";
import NFTContentsPreRegistration from "./NFT.Contents.PreRegistration";
import InteractFeedback from "../atoms/Popup.InteractFeedback";
import WarningPopup from "../atoms/WarningPopup";
import { SPG } from "@/app/story/spg/actions";
import { useNFT } from "@/app/story/nft/hooks";
import { useSession } from "next-auth/react";

interface NFTContentsProps {
    spg: SPG;
}

export default React.memo(function NFTContents({ spg }: NFTContentsProps) {
    const { data: session } = useSession();

    const [showFeedback, setShowFeedback] = useState(false);
    const [showWaitWarning, setShowWaitWarning] = useState(false);
    const [forceCloseWaitWarning, setForceCloseWaitWarning] = useState(false);

    const { circulation, isCirculationLoading, refetchTokenGating } = useNFT({
        getCirculationInput: {
            spgAddress: spg.address,
        },
        tokenGatingInput: {
            artist: spg.artist,
            userId: session?.user?.id || "",
        },
    });

    const { status, dateLabel, dateValue, participantsType } = useMemo(() => {
        const now = new Date();
        const preSaleStart = spg.preOrderStart;
        const preSaleEnd = spg.preOrderEnd;
        const saleStart = spg.saleStart;
        const saleEnd = spg.saleEnd;
        const glowStart = spg.glowStart;
        const glowEnd = spg.glowEnd;

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
                status = "PREORDER";
                dateLabel = "Pre Order Open";
                dateValue = formatDate(preSaleStart.toISOString());
            } else if (now > preSaleStart && now < preSaleEnd) {
                participantsType = CollectionParticipantType.PREREGISTRATION;
                status = "PREORDER";
                dateLabel = "Pre Order End";
                dateValue = formatDate(preSaleEnd.toISOString());
            }
        }

        return {
            status,
            dateLabel,
            dateValue,
            participantsType,
        };
    }, [spg]);

    const handlePurchase = useCallback(
        (quantity: number) => {
            console.log(
                `Purchasing ${quantity} NFTs from collection ${spg.address}`
            );
        },
        [spg.address]
    );

    const handlePaymentSuccess = useCallback((payment: Payment) => {
        console.log("Payment success");
        setShowWaitWarning(true);
        setForceCloseWaitWarning(false);
    }, []);

    const handlePaymentComplete = useCallback(() => {
        setShowWaitWarning(false);
        setShowFeedback(true);
        refetchTokenGating();
    }, [refetchTokenGating]);

    const handlePaymentError = useCallback(
        (error?: Error) => {
            setShowWaitWarning(false);
            refetchTokenGating();
        },
        [refetchTokenGating]
    );

    return (
        <div className="flex flex-col items-center w-full py-6 sm:py-8 md:py-10">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <div className="w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-6 mt-[50px] mb-[50px] lg:grid-cols-3 lg:gap-8 lg:mt-[0px] lg:mb-[0px]">
                    <div className="lg:col-span-2 order-1 lg:order-1 gap-6 flex flex-col">
                        <NFTContentsDetails
                            spg={spg}
                            participantsType={participantsType}
                            status={status}
                            dateLabel={dateLabel}
                            dateValue={dateValue}
                            circulation={circulation ?? null}
                            isCirculationLoading={isCirculationLoading}
                        />
                        <h2
                            className={cn(
                                getResponsiveClass(30).textClass,
                                "mt-[50px]"
                            )}
                        >
                            Official Report
                        </h2>
                        <NFTContentsReport spg={spg} />
                        <h2
                            className={cn(
                                getResponsiveClass(30).textClass,
                                "mt-[50px]"
                            )}
                        >
                            Details
                        </h2>
                        <NFTContentsPageImages spg={spg} />
                        <ToTheTopButton className="fixed lg:sticky" />
                    </div>

                    <div className="lg:col-span-1 order-2 lg:order-2">
                        <div
                            className="lg:sticky lg:top-[110px]"
                            id="nft-payment-section"
                        >
                            {participantsType ===
                            CollectionParticipantType.PUBLICSALE ? (
                                <NFTContentsPayment
                                    spg={spg}
                                    onPurchase={handlePurchase}
                                    collectionStock={{
                                        remain: circulation?.remain ?? 0,
                                        total: circulation?.total ?? 0,
                                    }}
                                    onPaymentSuccess={handlePaymentSuccess}
                                    onPaymentComplete={handlePaymentComplete}
                                    onPaymentError={handlePaymentError}
                                />
                            ) : (
                                <NFTContentsPreRegistration
                                    spg={spg}
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
                description={`You have successfully purchased ${spg.name}`}
                type="purchaseNFT"
                showConfetti={true}
                spg={spg}
            />

            <WarningPopup
                open={showWaitWarning}
                title="NFT Transfer in Progress"
                message="Please keep this window open while your NFT is being transferred. Do not close the window or navigate away."
                loading={true}
                preventClose={true}
                critical={true}
                forceClose={forceCloseWaitWarning}
                onClose={() => setShowWaitWarning(false)}
            />
        </div>
    );
});

const VISIBLE_THRESHOLD = 0.1;
const HIDE_THRESHOLD = 0.7;
const MAX_OPACITY = 1;
const MID_OPACITY = 0.9;

const NFTStickyPurchaseButton = React.memo(function NFTStickyPurchaseButton({
    text = "Buy Now",
}: {
    text?: string;
}) {
    const [opacity, setOpacity] = useState(MAX_OPACITY);
    const thresholds = useMemo(
        () => Array.from({ length: 21 }, (_, i) => i * 0.05),
        []
    );

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
                threshold: thresholds,
            }
        );
        observer.observe(target);

        return () => observer.disconnect();
    }, [thresholds]);

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
});

const ToTheTopButton = React.memo(function ToTheTopButton({
    className,
}: {
    className?: string;
}) {
    const handleClick = useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <div
            className={cn(
                "sticky w-full bottom-[90px] right-0 z-20",
                className
            )}
        >
            <img
                src="/ui/to-top.svg"
                alt="To the Top"
                className={cn(
                    "absolute right-[10px] text-white cursor-pointer opacity-80",
                    getResponsiveClass(35).frameClass
                )}
                onClick={handleClick}
            />
        </div>
    );
});

function formatDate(date: string) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const monthStr = month < 10 ? `0${month}` : month;
    const dayStr = day < 10 ? `0${day}` : day;
    return `${year}.${monthStr}.${dayStr}`;
}
