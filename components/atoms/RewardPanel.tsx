/// components/molecules/RewardPanel.tsx

"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { Loader2 } from "lucide-react";

import { usePlayerAssetsGet } from "@/app/actions/playerAssets/hooks";
import Funds from "@/components/atoms/Funds";
import { cn } from "@/lib/utils/tailwind";

import UserRewardsModal from "../user/User.Rewards.Modal";

import type { Asset, PlayerAsset } from "@prisma/client";

export type PlayerAssetWithAsset = PlayerAsset & { asset: Asset };

interface RewardPanelProps {
    playerId: string;
    assetNames: string[];
    className?: string;
}

/**
 * 사용자의 보상 자산을 표시하는 패널 컴포넌트
 * 클릭 시 상세 정보를 모달로 표시
 */
function RewardPanel({ playerId, assetNames, className }: RewardPanelProps) {
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [selectedReward, setSelectedReward] =
        useState<PlayerAssetWithAsset | null>(null);

    // SGP는 항상 표시되도록 보장
    const displayAssetNames = useMemo(
        () => Array.from(new Set([...assetNames, "SGP"])),
        [assetNames]
    );

    // 플레이어 자산 데이터 가져오기
    const { playerAssets, isPlayerAssetsLoading, playerAssetsError } =
        usePlayerAssetsGet({
            getPlayerAssetsInput: {
                filter: {
                    playerId,
                },
            },
        });

    // 표시할 플레이어 자산 필터링
    const displayPlayerAssets = useMemo(() => {
        if (!playerAssets?.data) return [];

        return (
            playerAssets.data as Array<PlayerAsset & { asset: Asset }>
        ).filter((pa) => displayAssetNames.includes(pa.asset.name));
    }, [playerAssets, displayAssetNames]);

    // 보상 클릭 핸들러
    const handleRewardClick = useCallback(
        (asset: PlayerAsset & { asset: Asset }) => {
            setSelectedReward(asset);
            setShowRewardModal(true);
        },
        []
    );

    // 모달 닫기 핸들러
    const handleCloseModal = useCallback(() => {
        setShowRewardModal(false);
    }, []);

    // 로딩 상태 처리
    if (isPlayerAssetsLoading) {
        return (
            <div className={cn("flex items-center justify-center", className)}>
                <Loader2
                    className="w-4 h-4 animate-spin text-white/70"
                    aria-label="Loading assets"
                />
            </div>
        );
    }

    // 에러 상태 처리
    if (playerAssetsError) {
        return (
            <div
                className={cn("text-red-400 text-xs", className)}
                aria-live="polite"
            >
                Failed to load assets
            </div>
        );
    }

    // 자산이 없는 경우 처리
    if (!displayPlayerAssets || displayPlayerAssets.length === 0) {
        return null;
    }

    return (
        <div className={cn("relative", className)}>
            {/* 보상 상세 모달 */}
            {showRewardModal && selectedReward && (
                <UserRewardsModal
                    playerId={playerId}
                    showModal={showRewardModal}
                    setShowModal={handleCloseModal}
                    selectedReward={selectedReward}
                    rewards={displayPlayerAssets}
                />
            )}

            {/* 보상 목록 */}
            <div className="flex gap-2 items-center justify-center">
                {displayPlayerAssets.map((asset) => (
                    <button
                        key={asset.id}
                        onClick={() => handleRewardClick(asset)}
                        className={cn(
                            "focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md cursor-pointer relative group",
                            "transition-all duration-300 hover:scale-105",
                            "overflow-hidden"
                        )}
                        aria-label={`View ${asset.asset.name} details`}
                    >
                        <Funds
                            funds={asset?.balance ?? 0}
                            fundsLabel={asset.asset.symbol}
                            fundsIcon={asset.asset.iconUrl ?? undefined}
                            frameSize={20}
                            textSize={15}
                            gapSize={10}
                            paddingSize={5}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default memo(RewardPanel);
