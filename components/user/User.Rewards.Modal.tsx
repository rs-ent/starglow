/// components/user/User.Rewards.Modal.tsx

"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import Slider from "react-slick";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { PlayerAssetWithAsset } from "@/app/actions/playerAssets/actions";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import UserRewardsModalCard from "./User.Rewards.Modal.Card";

import EnhancedPortal from "@/components/atoms/Portal.Enhanced";
import { useKeyPressMap } from "@/app/hooks/useKeyPress";

interface UserRewardsModalProps {
    playerId: string;
    showModal: boolean;
    setShowModal: (showModal: boolean) => void;
    selectedReward: PlayerAssetWithAsset | null;
    rewards?: PlayerAssetWithAsset[] | null;
}

/**
 * 사용자 보상 상세 정보를 모달로 표시하는 컴포넌트
 * 슬라이더를 사용하여 여러 보상 항목을 탐색할 수 있음
 */
function UserRewardsModal({
    playerId,
    showModal,
    setShowModal,
    selectedReward,
    rewards,
}: UserRewardsModalProps) {
    const sliderRef = useRef<Slider>(null);
    const [isVisible, setIsVisible] = useState(false);
    const hasMultipleRewards = rewards && rewards.length > 1;

    // 초기 슬라이드 인덱스 계산
    const initialSlide =
        rewards && selectedReward
            ? rewards.findIndex((r) => r.id === selectedReward.id)
            : 0;

    // 슬라이더 설정
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

    // 모달 닫기 핸들러
    const closeModal = useCallback(() => {
        setIsVisible(false);
        // 애니메이션 완료 후 모달 상태 업데이트
        setTimeout(() => setShowModal(false), 300);
    }, [setShowModal]);

    // 다음 슬라이드로 이동
    const handleNextSlide = useCallback(() => {
        if (hasMultipleRewards) {
            sliderRef.current?.slickNext();
        }
    }, [hasMultipleRewards]);

    // 이전 슬라이드로 이동
    const handlePrevSlide = useCallback(() => {
        if (hasMultipleRewards) {
            sliderRef.current?.slickPrev();
        }
    }, [hasMultipleRewards]);

    // 키보드 이벤트 처리 - useKeyPressMap 사용
    useKeyPressMap(
        {
            Escape: closeModal,
            ArrowRight: handleNextSlide,
            ArrowLeft: handlePrevSlide,
        },
        {
            enabled: showModal,
            preventDefault: true,
        }
    );

    // 모달 표시 애니메이션
    useEffect(() => {
        if (showModal) {
            // 모달이 DOM에 마운트된 후 애니메이션 시작
            requestAnimationFrame(() => setIsVisible(true));

            // 스크롤 방지
            document.body.style.overflow = "hidden";

            return () => {
                document.body.style.overflow = "";
            };
        }
    }, [showModal]);

    // 배경 클릭 시 모달 닫기
    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                closeModal();
            }
        },
        [closeModal]
    );

    // 모달이 표시되지 않을 때는 렌더링하지 않음
    if (!showModal) return null;

    return (
        <EnhancedPortal layer="modal">
            <div
                className={cn(
                    "fixed inset-0 w-full h-full bg-black/50 backdrop-blur-xs",
                    "transition-all duration-300 ease-in-out",
                    "flex items-center justify-center",
                    "overflow-hidden",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
                style={{
                    zIndex: 1000,
                }}
                onClick={handleBackdropClick}
                role="dialog"
                aria-modal="true"
                aria-labelledby="reward-modal-title"
            >
                {/* 오른쪽 화살표 */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20">
                    <button
                        className={cn(
                            "focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full",
                            "p-2 bg-black/30 hover:bg-black/50 transition-colors",
                            hasMultipleRewards
                                ? "opacity-100"
                                : "opacity-0 pointer-events-none"
                        )}
                        onClick={handleNextSlide}
                        aria-label="Next reward"
                        disabled={!hasMultipleRewards}
                    >
                        <img
                            src="/ui/arrow-right.svg"
                            alt="Next"
                            className={getResponsiveClass(25).frameClass}
                            loading="lazy"
                        />
                    </button>
                </div>

                {/* 왼쪽 화살표 */}
                <div className="absolute top-1/2 left-4 -translate-y-1/2 z-20">
                    <button
                        className={cn(
                            "focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full",
                            "p-2 bg-black/30 hover:bg-black/50 transition-colors",
                            hasMultipleRewards
                                ? "opacity-100"
                                : "opacity-0 pointer-events-none"
                        )}
                        onClick={handlePrevSlide}
                        aria-label="Previous reward"
                        disabled={!hasMultipleRewards}
                    >
                        <img
                            src="/ui/arrow-right.svg"
                            alt="Previous"
                            className={getResponsiveClass(25).frameClass}
                            loading="lazy"
                            style={{
                                transform: "rotate(180deg)",
                            }}
                        />
                    </button>
                </div>

                {/* 슬라이더 컨테이너 */}
                <div className="w-full h-full max-w-[1200px] mx-auto px-4 flex items-center justify-center">
                    <Slider
                        ref={sliderRef}
                        {...sliderSettings}
                        className="w-full"
                    >
                        {rewards?.map((reward, idx) => (
                            <div
                                key={reward.id || idx}
                                className="flex items-center justify-center px-4"
                            >
                                <UserRewardsModalCard
                                    playerId={playerId}
                                    reward={reward}
                                    closeModal={closeModal}
                                />
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </EnhancedPortal>
    );
}

export default memo(UserRewardsModal);
