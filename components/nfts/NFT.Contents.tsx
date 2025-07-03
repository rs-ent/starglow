/// components\organisms\NFTs.Collection.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { CollectionParticipantType } from "@prisma/client";
import { useSession } from "next-auth/react";

import { useStoryInteractions } from "@/app/story/interaction/hooks";
import { useNFT } from "@/app/story/nft/hooks";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import NFTContentsDetails from "./NFT.Contents.Details";
import NFTContentsPayment from "./NFT.Contents.Payment";
import NFTContentsPreRegistration from "./NFT.Contents.PreRegistration";
import NFTContentsReport from "./NFT.Contents.Report";
import InteractFeedback from "../atoms/Popup.InteractFeedback";
import WarningPopup from "../atoms/WarningPopup";

import type { SPG } from "@/app/story/spg/actions";
import NFTBenefits from "./NFT.Benefits";

interface NFTContentsProps {
    spg: SPG;
}

export default React.memo(function NFTContents({ spg }: NFTContentsProps) {
    const { data: session } = useSession();
    const [showFeedback, setShowFeedback] = useState(false);
    const [showWaitWarning, setShowWaitWarning] = useState(false);
    const [forceCloseWaitWarning, setForceCloseWaitWarning] = useState(false);

    const { refetchVerifiedSPGs } = useStoryInteractions({
        getUserVerifiedSPGsInput: {
            userId: session?.user?.id || "",
        },
    });

    const { circulation, refetchTokenGating } = useNFT({
        getCirculationInput: {
            spgAddress: spg.address,
        },
        tokenGatingInput: {
            artist: spg.artist,
            userId: session?.user?.id || "",
        },
    });

    const { status, dateValue, participantsType, comingSoon, hiddenDetails } =
        useMemo(() => {
            const now = new Date();
            const comingSoon = spg.comingSoon || false;
            const hiddenDetails = spg.hiddenDetails || false;
            if (hiddenDetails) {
                return {
                    status: "COMING SOON",
                    dateValue: formatDate(new Date().toISOString()),
                    participantsType: CollectionParticipantType.PREREGISTRATION,
                    comingSoon: true,
                    hiddenDetails: true,
                };
            }

            if (comingSoon) {
                return {
                    status: "COMING SOON",
                    dateValue: formatDate(new Date().toISOString()),
                    participantsType: CollectionParticipantType.PREREGISTRATION,
                    comingSoon: true,
                    hiddenDetails: false,
                };
            }

            const preSaleStart = spg.preOrderStart;
            const preSaleEnd = spg.preOrderEnd;
            const saleStart = spg.saleStart;
            const saleEnd = spg.saleEnd;
            const glowStart = spg.glowStart;
            const glowEnd = spg.glowEnd;

            let status = "SCHEDULED";
            let dateValue = "Unknown";
            let participantsType: CollectionParticipantType =
                CollectionParticipantType.PREREGISTRATION;

            if (glowStart && glowEnd) {
                if (now < glowStart) {
                    participantsType = CollectionParticipantType.GLOW;
                    status = "GLOWING";
                    dateValue = formatDate(glowStart.toISOString());
                } else if (now > glowStart && now < glowEnd) {
                    participantsType = CollectionParticipantType.GLOW;
                    status = "GLOWING";
                    dateValue = formatDate(glowEnd.toISOString());
                } else {
                    participantsType = CollectionParticipantType.GLOW;
                    status = "GLOWED";
                    dateValue = formatDate(glowEnd.toISOString());
                }
            }

            if (saleStart && saleEnd) {
                if (now < saleStart) {
                    participantsType = CollectionParticipantType.PRIVATESALE;
                    status = "SCHEDULED";
                    dateValue = formatDate(saleStart.toISOString());
                } else if (now > saleStart && now < saleEnd) {
                    participantsType = CollectionParticipantType.PUBLICSALE;
                    status = "ONGOING";
                    dateValue = formatDate(saleEnd.toISOString());
                }
            }

            if (preSaleStart && preSaleEnd) {
                if (now < preSaleStart) {
                    participantsType =
                        CollectionParticipantType.PREREGISTRATION;
                    status = "PREORDER";
                    dateValue = formatDate(preSaleStart.toISOString());
                } else if (now > preSaleStart && now < preSaleEnd) {
                    participantsType =
                        CollectionParticipantType.PREREGISTRATION;
                    status = "PREORDER";
                    dateValue = formatDate(preSaleEnd.toISOString());
                }
            }

            return {
                status,
                dateValue,
                participantsType,
                comingSoon: false,
                hiddenDetails: false,
            };
        }, [spg]);

    const handlePaymentSuccess = useCallback(() => {
        setShowWaitWarning(true);
        setForceCloseWaitWarning(false);
    }, []);

    const handlePaymentComplete = useCallback(async () => {
        setShowWaitWarning(false);
        setShowFeedback(true);
        await refetchTokenGating();
        await refetchVerifiedSPGs();
    }, [refetchTokenGating, refetchVerifiedSPGs]);

    const handlePaymentError = useCallback(
        async (error?: Error) => {
            setShowWaitWarning(false);
            await refetchTokenGating();
            await refetchVerifiedSPGs();

            if (error) {
                console.error(error.message);
            }
        },
        [refetchTokenGating, refetchVerifiedSPGs]
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
                            dateValue={dateValue}
                            circulation={circulation ?? null}
                            comingSoon={comingSoon}
                            hiddenDetails={hiddenDetails}
                        />
                        <h2
                            className={cn(
                                getResponsiveClass(30).textClass,
                                "mt-[50px]"
                            )}
                        >
                            What will you get
                        </h2>
                        <NFTBenefits />
                        <h2
                            className={cn(
                                getResponsiveClass(30).textClass,
                                "mt-[50px]"
                            )}
                        >
                            Official Report
                        </h2>
                        <NFTContentsReport spg={spg} />
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
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!comingSoon && !hiddenDetails && (
                <NFTStickyPurchaseButton
                    text={
                        participantsType ===
                        CollectionParticipantType.PUBLICSALE
                            ? "Buy Now"
                            : "Pre Register Now"
                    }
                />
            )}

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

function formatDate(date: string) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const monthStr = month < 10 ? `0${month}` : month;
    const dayStr = day < 10 ? `0${day}` : day;
    return `${year}.${monthStr}.${dayStr}`;
}
