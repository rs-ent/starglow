/// components/user/User.Rewards.Modal.tsx

"use client";

import { useRef } from "react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { PlayerAssetWithAsset } from "./User.Rewards";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import UserRewardsModalCard from "./User.Rewards.Modal.Card";
import type { RewardLog } from "@/app/actions/rewardsLogs";
import { Player } from "@prisma/client";

interface UserRewardsModalProps {
    player: Player | null;
    showModal: boolean;
    setShowModal: (showModal: boolean) => void;
    selectedReward: PlayerAssetWithAsset | null;
    rewards?: PlayerAssetWithAsset[] | null;
}

export default function UserRewardsModal({
    player,
    showModal,
    setShowModal,
    selectedReward,
    rewards,
}: UserRewardsModalProps) {
    const sliderRef = useRef<Slider>(null);

    const initialSlide =
        rewards && selectedReward
            ? rewards.findIndex((r) => r.id === selectedReward.id)
            : 0;

    const sliderSettings = {
        initialSlide,
        infinite: false,
        speed: 400,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        dots: false,
        swipe: true,
    };

    return (
        <div
            className={cn(
                "fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-xs",
                "transition-all duration-700 ease-in-out",
                showModal ? "opacity-100 z-30" : "opacity-0 -z-50"
            )}
        >
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
                <img
                    src="/ui/arrow-right.svg"
                    alt="arrow-right"
                    className={cn(
                        getResponsiveClass(25).frameClass,
                        "cursor-pointer",
                        rewards && rewards.length > 1
                            ? "opacity-100"
                            : "opacity-0"
                    )}
                    onClick={() => sliderRef.current?.slickNext()}
                />
            </div>
            <div className="absolute top-1/2 left-1 -translate-y-1/2">
                <img
                    src="/ui/arrow-right.svg"
                    alt="arrow-right"
                    className={cn(
                        getResponsiveClass(25).frameClass,
                        "cursor-pointer",
                        rewards && rewards.length > 1
                            ? "opacity-100"
                            : "opacity-0"
                    )}
                    style={{
                        transform: "rotate(180deg)",
                    }}
                    onClick={() => sliderRef.current?.slickPrev()}
                />
            </div>
            <div className="flex items-center justify-center w-full h-full">
                <Slider
                    ref={sliderRef}
                    {...sliderSettings}
                    className="w-screen max-w-full"
                >
                    {rewards?.map((reward, idx) => {
                        return (
                            <div
                                key={reward.id || idx}
                                className={cn(
                                    "flex items-center justify-center",
                                    getResponsiveClass(70).paddingClass
                                )}
                            >
                                <UserRewardsModalCard
                                    player={player}
                                    reward={reward}
                                    closeModal={() => setShowModal(false)}
                                />
                            </div>
                        );
                    })}
                </Slider>
            </div>
        </div>
    );
}
