"use client";

import { useCallback, useMemo } from "react";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import {
    FaCoins,
    FaDollarSign,
    FaInfoCircle,
    FaCheckCircle,
    FaDatabase,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";
import Image from "next/image";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
}

interface Asset {
    id: string;
    name: string;
    symbol: string;
    description?: string;
    iconUrl?: string;
}

export function AdminRafflesWeb3CreateFee({ data, updateData }: Props) {
    // 오프체인 에셋 가져오기
    const assetsResult = useAssetsGet({ getAssetsInput: {} });
    const offchainAssets = useMemo(
        () => (assetsResult.assets?.assets || []) as Asset[],
        [assetsResult.assets?.assets]
    );

    // 현재 선택된 에셋 찾기
    const selectedAsset = useMemo(() => {
        return (
            offchainAssets.find(
                (asset) => asset.id === data.fee.participationFeeAsset
            ) || offchainAssets[0]
        );
    }, [offchainAssets, data.fee.participationFeeAsset]);

    const handleFeeChange = useCallback(
        (field: string, value: any) => {
            updateData("fee", { [field]: value });
        },
        [updateData]
    );

    // 에셋 선택 함수
    const selectAsset = useCallback(
        (asset: Asset) => {
            handleFeeChange("participationFeeAsset", asset.id);
            handleFeeChange("participationFeeAssetId", asset.id);
        },
        [handleFeeChange]
    );

    return (
        <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl p-6 border border-cyan-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaCoins className="mr-3 text-cyan-400" size={20} />
                        참가비 설정 (오프체인 에셋)
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-cyan-900/50 text-cyan-400 rounded-full text-xs font-medium border border-cyan-700">
                            가스비 없음
                        </div>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    플랫폼 내 포인트, 크레딧 등 오프체인 에셋을 참가비로
                    사용합니다. 가스비가 없어 비용 효율적이며 빠른 처리가
                    가능합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 w-full gap-8">
                {/* 메인 설정 영역 */}
                <div className="space-y-6">
                    {/* 오프체인 에셋 선택 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaDatabase
                                className="mr-3 text-cyan-400"
                                size={16}
                            />
                            오프체인 에셋 선택
                        </h4>

                        {offchainAssets.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {offchainAssets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                            selectedAsset?.id === asset.id
                                                ? "bg-cyan-900/30 border-cyan-600"
                                                : "bg-gray-750 border-gray-600 hover:border-gray-500"
                                        }`}
                                        onClick={() => selectAsset(asset)}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            {asset.iconUrl && (
                                                <Image
                                                    src={asset.iconUrl}
                                                    alt={asset.name}
                                                    width={40}
                                                    height={40}
                                                />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">
                                                        {asset.symbol}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {asset.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-400">
                                                {asset.description ||
                                                    "오프체인 에셋"}
                                            </p>
                                        </div>

                                        {selectedAsset?.id === asset.id && (
                                            <div className="mt-3 pt-3 border-t border-cyan-700">
                                                <FaCheckCircle
                                                    className="text-cyan-400 mx-auto"
                                                    size={16}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaInfoCircle
                                    className="text-gray-400 mx-auto mb-2"
                                    size={24}
                                />
                                <p className="text-gray-400">
                                    등록된 오프체인 에셋이 없습니다.
                                </p>
                                <p className="text-sm text-gray-500">
                                    관리자 &gt; 자산 관리에서 에셋을 먼저
                                    등록해주세요.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 참가비 설정 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaDollarSign
                                className="mr-3 text-yellow-400"
                                size={16}
                            />
                            참가비 금액 설정
                        </h4>

                        {/* 수동 금액 입력 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaCoins
                                        className="inline mr-2 text-yellow-400"
                                        size={14}
                                    />
                                    참가비 ({selectedAsset?.symbol || "에셋"}) *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={data.fee.participationFeeAmount}
                                        onChange={(e) =>
                                            handleFeeChange(
                                                "participationFeeAmount",
                                                e.target.value
                                            )
                                        }
                                        min="0"
                                        step="1"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-16 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <span className="text-gray-400 text-sm font-medium">
                                            {selectedAsset?.symbol || "에셋"}
                                        </span>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    티켓 1개당 참가비
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaDatabase
                                        className="inline mr-2 text-cyan-400"
                                        size={14}
                                    />
                                    에셋 정보
                                </label>
                                <div className="bg-gray-750 border border-gray-600 rounded-lg px-4 py-3">
                                    {selectedAsset ? (
                                        <div>
                                            <div className="text-white font-medium">
                                                {selectedAsset.name}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {selectedAsset.description ||
                                                    "오프체인 에셋"}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">
                                            에셋을 선택해주세요
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    선택된 오프체인 에셋 정보
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
