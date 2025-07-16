"use client";

import { useCallback, useState, useMemo } from "react";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useSPG } from "@/app/story/spg/hooks";
import { tierMap } from "@/components/raffles/raffle-tier";
import {
    FaGift,
    FaPlus,
    FaTrash,
    FaStar,
    FaImage,
    FaCoins,
    FaGem,
    FaEye,
    FaChartPie,
    FaLightbulb,
    FaCopy,
    FaCheck,
    FaExclamationTriangle,
    FaDice,
    FaUsers,
    FaTrophy,
    FaGripVertical,
    FaEdit,
    FaSave,
    FaTimes,
} from "react-icons/fa";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";
import { cn } from "@/lib/utils/tailwind";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
}

interface Asset {
    id: string;
    name: string;
    symbol: string;
    iconUrl?: string;
    imageUrl?: string;
}

interface SPG {
    id: string;
    address: string;
    name: string;
    symbol: string;
    imageUrl?: string;
}

const PRIZE_TYPES = [
    {
        value: 0,
        label: "빈 상품",
        description: "꽝, 상품 없음",
        icon: FaTrash,
        color: "text-gray-400",
        bgColor: "bg-gray-900/30",
        borderColor: "border-gray-700",
    },
    {
        value: 1,
        label: "에셋",
        description: "SGP, 응모권 등",
        icon: FaCoins,
        color: "text-yellow-400",
        bgColor: "bg-yellow-900/30",
        borderColor: "border-yellow-700",
    },
    {
        value: 2,
        label: "NFT",
        description: "대체불가능한 토큰",
        icon: FaGem,
        color: "text-purple-400",
        bgColor: "bg-purple-900/30",
        borderColor: "border-purple-700",
    },
] as const;

export function AdminRafflesWeb3CreatePrizes({ data, updateData }: Props) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const assetsResult = useAssetsGet({ getAssetsInput: {} });
    const spgResult = useSPG({ getSPGsInput: {} });

    const assetsData = (assetsResult.assets?.assets || []) as Asset[];
    const spgsData = (spgResult.getSPGsData || []) as SPG[];

    const addPrize = useCallback(() => {
        const prizes = Array.isArray(data.prizes) ? data.prizes : [];
        const newPrize = {
            prizeType: 1 as 0 | 1 | 2,
            collectionAddress: "",
            registeredTicketQuantity: 1,
            order: prizes.length + 1,
            rarity: 0,
            prizeQuantity: 1,
            title: "",
            description: "",
            imageUrl: "",
            iconUrl: "",
            assetId: "",
            tokenIds: [],
        };

        updateData("prizes", [...prizes, newPrize]);
    }, [data.prizes, updateData]);

    const removePrize = useCallback(
        (index: number) => {
            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const newPrizes = prizes.filter((_, i) => i !== index);
            const reorderedPrizes = newPrizes.map((prize, i) => ({
                ...prize,
                order: i + 1,
            }));
            updateData("prizes", reorderedPrizes);
            setEditingIndex(null);
        },
        [data.prizes, updateData]
    );

    const updatePrize = useCallback(
        (index: number, field: string, value: any) => {
            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const newPrizes = [...prizes];
            newPrizes[index] = {
                ...newPrizes[index],
                [field]: value,
            };
            updateData("prizes", newPrizes);
        },
        [data.prizes, updateData]
    );

    const duplicatePrize = useCallback(
        (index: number) => {
            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const prizeToDuplicate = { ...prizes[index] };
            prizeToDuplicate.order = prizes.length + 1;
            prizeToDuplicate.title = `${prizeToDuplicate.title} (복사본)`;
            updateData("prizes", [...prizes, prizeToDuplicate]);
        },
        [data.prizes, updateData]
    );

    const copyToClipboard = useCallback(async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    }, []);

    const handleDragStart = useCallback((index: number) => {
        setDraggedIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback(
        (targetIndex: number) => {
            if (draggedIndex === null || draggedIndex === targetIndex) return;

            const prizes = Array.isArray(data.prizes) ? data.prizes : [];
            const newPrizes = [...prizes];
            const draggedPrize = newPrizes[draggedIndex];
            newPrizes.splice(draggedIndex, 1);
            newPrizes.splice(targetIndex, 0, draggedPrize);

            const reorderedPrizes = newPrizes.map((prize, index) => ({
                ...prize,
                order: index + 1,
            }));

            updateData("prizes", reorderedPrizes);
            setDraggedIndex(null);
        },
        [draggedIndex, data.prizes, updateData]
    );

    const handleAssetSelection = useCallback(
        (index: number, assetId: string) => {
            updatePrize(index, "assetId", assetId);

            const selectedAsset = assetsData?.find((a) => a.id === assetId);
            if (selectedAsset) {
                // 기본적으로 iconUrl 사용, 없으면 imageUrl 사용
                const defaultImage =
                    selectedAsset.iconUrl || selectedAsset.imageUrl || "";
                updatePrize(index, "imageUrl", defaultImage);
            }
        },
        [assetsData, updatePrize]
    );

    const handleNFTSelection = useCallback(
        (index: number, collectionAddress: string) => {
            updatePrize(index, "collectionAddress", collectionAddress);

            const selectedNFT = spgsData?.find(
                (s) => s.address === collectionAddress
            );
            if (selectedNFT?.imageUrl) {
                updatePrize(index, "imageUrl", selectedNFT.imageUrl);
            }
        },
        [spgsData, updatePrize]
    );

    const handleAssetImageSelection = useCallback(
        (index: number, imageType: "iconUrl" | "imageUrl") => {
            const prize = data.prizes[index];
            const selectedAsset = assetsData?.find(
                (a) => a.id === prize.assetId
            );
            if (selectedAsset) {
                const imageUrl = selectedAsset[imageType] || "";
                updatePrize(index, "imageUrl", imageUrl);
            }
        },
        [data.prizes, assetsData, updatePrize]
    );

    const handlePrizeTypeChange = useCallback(
        (index: number, prizeType: 0 | 1 | 2) => {
            // 기본 업데이트
            updatePrize(index, "prizeType", prizeType);

            // 타입별 필드 초기화
            updatePrize(index, "assetId", "");
            updatePrize(index, "collectionAddress", "");
            updatePrize(index, "tokenIds", []);
            updatePrize(index, "imageUrl", "");

            // 빈 상품이 아닌 경우 기본 수량 설정
            if (prizeType !== 0) {
                updatePrize(index, "registeredTicketQuantity", 1);
                updatePrize(index, "prizeQuantity", 1);
            }
        },
        [updatePrize]
    );

    const getTierInfo = useCallback((tier: number) => {
        return tierMap[tier as keyof typeof tierMap] || tierMap[0];
    }, []);

    const availableTiers = useMemo(() => {
        return Object.entries(tierMap).map(([key, tier]) => ({
            value: parseInt(key),
            ...tier,
        }));
    }, []);

    const prizeStats = useMemo(() => {
        const prizes = Array.isArray(data.prizes) ? data.prizes : [];
        const totalTickets = prizes.reduce(
            (sum, prize) => sum + (prize?.registeredTicketQuantity || 0),
            0
        );

        const rarityDistribution = availableTiers.map((tier) => {
            const prizesOfRarity = prizes.filter(
                (p) => p?.rarity === tier.value
            );
            const tickets = prizesOfRarity.reduce(
                (sum, p) => sum + (p?.registeredTicketQuantity || 0),
                0
            );
            return {
                ...tier,
                count: prizesOfRarity.length,
                tickets,
                percentage:
                    totalTickets > 0 ? (tickets / totalTickets) * 100 : 0,
            };
        });

        const typeDistribution = PRIZE_TYPES.map((type) => {
            const prizesOfType = prizes.filter(
                (p) => p?.prizeType === type.value
            );
            return {
                ...type,
                count: prizesOfType.length,
            };
        });

        return {
            totalTickets,
            totalPrizes: prizes.length,
            rarityDistribution,
            typeDistribution,
        };
    }, [data.prizes, availableTiers]);

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-pink-900/30 to-rose-900/30 rounded-xl p-6 border border-pink-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaGift className="mr-3 text-pink-400" size={20} />
                        상품 설정
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-300">
                            총 상품:{" "}
                            <span className="text-pink-400 font-medium">
                                {prizeStats.totalPrizes}개
                            </span>
                        </div>
                        <div className="text-sm text-gray-300">
                            총 티켓:{" "}
                            <span className="text-pink-400 font-medium">
                                {prizeStats.totalTickets}개
                            </span>
                        </div>
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                showPreview
                                    ? "bg-pink-600 text-white"
                                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                            }`}
                        >
                            <FaEye className="inline mr-1" size={12} />
                            {showPreview ? "편집 모드" : "미리보기"}
                        </button>
                        <button
                            onClick={addPrize}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <FaPlus size={14} />
                            상품 추가
                        </button>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    래플에서 제공할 상품들을 설정합니다. 드래그앤드롭으로 순서를
                    변경할 수 있습니다.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaTrophy
                                className="mr-3 text-yellow-400"
                                size={16}
                            />
                            상품 목록 (
                            {
                                (Array.isArray(data.prizes) ? data.prizes : [])
                                    .length
                            }
                            개)
                        </h4>

                        {(Array.isArray(data.prizes) ? data.prizes : [])
                            .length === 0 ? (
                            <div className="text-center py-12">
                                <FaGift
                                    className="mx-auto text-gray-400 mb-4"
                                    size={48}
                                />
                                <h5 className="text-lg font-medium text-gray-300 mb-2">
                                    상품이 없습니다
                                </h5>
                                <p className="text-gray-400 text-sm mb-6">
                                    래플에 제공할 상품을 추가해주세요.
                                </p>
                                <button
                                    onClick={addPrize}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <FaPlus size={14} />첫 번째 상품 추가
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(Array.isArray(data.prizes)
                                    ? data.prizes
                                    : []
                                ).map((prize, index) => {
                                    const prizeType = PRIZE_TYPES.find(
                                        (t) => t.value === prize.prizeType
                                    );
                                    const rarity = getTierInfo(prize.rarity);
                                    const IconComponent =
                                        prizeType?.icon || FaGift;
                                    const isEditing = editingIndex === index;

                                    const assetInfo =
                                        prize.prizeType === 1 && prize.assetId
                                            ? assetsData?.find(
                                                  (a) => a.id === prize.assetId
                                              )
                                            : null;
                                    const spgInfo =
                                        prize.prizeType === 2 &&
                                        prize.collectionAddress
                                            ? spgsData?.find(
                                                  (s) =>
                                                      s.address ===
                                                      prize.collectionAddress
                                              )
                                            : null;

                                    return (
                                        <div
                                            key={index}
                                            draggable={!isEditing}
                                            onDragStart={() =>
                                                handleDragStart(index)
                                            }
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(index)}
                                            className={cn(
                                                "border rounded-xl p-6 transition-all",
                                                `bg-gradient-to-br ${rarity.bg}`,
                                                `border-${rarity.border
                                                    .replace("[", "")
                                                    .replace("]", "")}`,
                                                rarity.glow
                                                    ? `shadow-lg shadow-${rarity.glow
                                                          .replace("[", "")
                                                          .replace("]", "")}`
                                                    : "",
                                                draggedIndex === index
                                                    ? "opacity-50 scale-95"
                                                    : "",
                                                "hover:scale-[1.02] cursor-move"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <FaGripVertical
                                                            className="text-gray-400 cursor-move"
                                                            size={14}
                                                        />
                                                        <div
                                                            className={cn(
                                                                "p-3 rounded-lg bg-gradient-to-r",
                                                                rarity.gradient
                                                            )}
                                                        >
                                                            <IconComponent
                                                                className="text-white"
                                                                size={20}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h5 className="font-bold text-white text-lg">
                                                                #{prize.order}{" "}
                                                                {prize.title ||
                                                                    "상품 이름"}
                                                            </h5>
                                                            <div
                                                                className={cn(
                                                                    "px-3 py-1 rounded-full bg-gradient-to-r text-white font-bold text-xs",
                                                                    rarity.gradient
                                                                )}
                                                            >
                                                                {rarity.name}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-300 mt-1">
                                                            {prizeType?.label} |{" "}
                                                            {
                                                                prize.prizeQuantity
                                                            }
                                                            개 상품 |{" "}
                                                            {
                                                                prize.registeredTicketQuantity
                                                            }
                                                            개 티켓
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setEditingIndex(
                                                                isEditing
                                                                    ? null
                                                                    : index
                                                            )
                                                        }
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            isEditing
                                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                                        }`}
                                                        title={
                                                            isEditing
                                                                ? "저장"
                                                                : "편집"
                                                        }
                                                    >
                                                        {isEditing ? (
                                                            <FaSave size={14} />
                                                        ) : (
                                                            <FaEdit size={14} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            duplicatePrize(
                                                                index
                                                            )
                                                        }
                                                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                                        title="복사"
                                                    >
                                                        <FaCopy size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            removePrize(index)
                                                        }
                                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                        title="삭제"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {isEditing ? (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-900/50 rounded-lg p-4">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                상품 종류 *
                                                            </label>
                                                            <select
                                                                value={
                                                                    prize.prizeType
                                                                }
                                                                onChange={(e) =>
                                                                    handlePrizeTypeChange(
                                                                        index,
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) as
                                                                            | 0
                                                                            | 1
                                                                            | 2
                                                                    )
                                                                }
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                {PRIZE_TYPES.map(
                                                                    (type) => (
                                                                        <option
                                                                            key={
                                                                                type.value
                                                                            }
                                                                            value={
                                                                                type.value
                                                                            }
                                                                        >
                                                                            {
                                                                                type.label
                                                                            }{" "}
                                                                            -{" "}
                                                                            {
                                                                                type.description
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                희귀도
                                                            </label>
                                                            <select
                                                                value={
                                                                    prize.rarity
                                                                }
                                                                onChange={(e) =>
                                                                    updatePrize(
                                                                        index,
                                                                        "rarity",
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                {availableTiers.map(
                                                                    (tier) => (
                                                                        <option
                                                                            key={
                                                                                tier.value
                                                                            }
                                                                            value={
                                                                                tier.value
                                                                            }
                                                                        >
                                                                            {
                                                                                tier.name
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    티켓 수량 *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        prize.registeredTicketQuantity
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updatePrize(
                                                                            index,
                                                                            "registeredTicketQuantity",
                                                                            Math.max(
                                                                                1,
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ) ||
                                                                                    1
                                                                            )
                                                                        )
                                                                    }
                                                                    min="1"
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    상품 수량 *
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        prize.prizeQuantity
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        updatePrize(
                                                                            index,
                                                                            "prizeQuantity",
                                                                            Math.max(
                                                                                1,
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ) ||
                                                                                    1
                                                                            )
                                                                        )
                                                                    }
                                                                    min="1"
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                        </div>

                                                        {prize.prizeType ===
                                                            1 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    에셋 선택
                                                                </label>
                                                                <select
                                                                    value={
                                                                        prize.assetId ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleAssetSelection(
                                                                            index,
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                >
                                                                    <option value="">
                                                                        에셋
                                                                        선택
                                                                    </option>
                                                                    {assetsData?.map(
                                                                        (
                                                                            asset: Asset
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    asset.id
                                                                                }
                                                                                value={
                                                                                    asset.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    asset.name
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    asset.symbol
                                                                                }

                                                                                )
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {prize.prizeType ===
                                                            2 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    NFT 컬렉션
                                                                    선택
                                                                </label>
                                                                <select
                                                                    value={
                                                                        prize.collectionAddress ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleNFTSelection(
                                                                            index,
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                >
                                                                    <option value="">
                                                                        컬렉션
                                                                        선택
                                                                    </option>
                                                                    {spgsData?.map(
                                                                        (
                                                                            spg: SPG
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    spg.id
                                                                                }
                                                                                value={
                                                                                    spg.address
                                                                                }
                                                                            >
                                                                                {
                                                                                    spg.name
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    spg.symbol
                                                                                }

                                                                                )
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                상품 이름 *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={
                                                                    prize.title
                                                                }
                                                                onChange={(e) =>
                                                                    updatePrize(
                                                                        index,
                                                                        "title",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="상품 이름"
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                상품 설명
                                                            </label>
                                                            <textarea
                                                                value={
                                                                    prize.description
                                                                }
                                                                onChange={(e) =>
                                                                    updatePrize(
                                                                        index,
                                                                        "description",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="상품에 대한 설명"
                                                                rows={3}
                                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                            />
                                                        </div>

                                                        {prize.prizeType ===
                                                            1 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    에셋 이미지
                                                                    선택
                                                                </label>
                                                                <select
                                                                    value={
                                                                        prize.imageUrl ===
                                                                        assetsData?.find(
                                                                            (
                                                                                a
                                                                            ) =>
                                                                                a.id ===
                                                                                prize.assetId
                                                                        )
                                                                            ?.iconUrl
                                                                            ? "iconUrl"
                                                                            : "imageUrl"
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        handleAssetImageSelection(
                                                                            index,
                                                                            e
                                                                                .target
                                                                                .value as
                                                                                | "iconUrl"
                                                                                | "imageUrl"
                                                                        )
                                                                    }
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    disabled={
                                                                        !prize.assetId
                                                                    }
                                                                >
                                                                    <option value="iconUrl">
                                                                        아이콘
                                                                        이미지
                                                                    </option>
                                                                    <option value="imageUrl">
                                                                        상세
                                                                        이미지
                                                                    </option>
                                                                </select>
                                                                {prize.assetId && (
                                                                    <div className="mt-2 text-xs text-gray-400">
                                                                        현재:{" "}
                                                                        {prize.imageUrl ||
                                                                            "이미지 없음"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {prize.prizeType ===
                                                            2 &&
                                                            prize.collectionAddress && (
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                        NFT
                                                                        컬렉션
                                                                        이미지
                                                                    </label>
                                                                    <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-300">
                                                                        <div className="text-sm">
                                                                            자동
                                                                            설정됨:{" "}
                                                                            {prize.imageUrl ||
                                                                                "이미지 없음"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {prize.prizeType ===
                                                            0 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    상품 이미지
                                                                    URL
                                                                    (선택사항)
                                                                </label>
                                                                <div className="relative">
                                                                    <FaImage
                                                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                    <input
                                                                        type="url"
                                                                        value={
                                                                            prize.imageUrl
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updatePrize(
                                                                                index,
                                                                                "imageUrl",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="https://example.com/image.jpg"
                                                                        className="w-full pl-10 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {prize.prizeType ===
                                                            2 && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                    NFT 토큰
                                                                    ID들 (쉼표로
                                                                    구분)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={prize.tokenIds.join(
                                                                        ", "
                                                                    )}
                                                                    onChange={(
                                                                        e
                                                                    ) => {
                                                                        const ids =
                                                                            e.target.value
                                                                                .split(
                                                                                    ","
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        id
                                                                                    ) =>
                                                                                        parseInt(
                                                                                            id.trim()
                                                                                        )
                                                                                )
                                                                                .filter(
                                                                                    (
                                                                                        id
                                                                                    ) =>
                                                                                        !isNaN(
                                                                                            id
                                                                                        )
                                                                                );
                                                                        updatePrize(
                                                                            index,
                                                                            "tokenIds",
                                                                            ids
                                                                        );
                                                                    }}
                                                                    placeholder="1, 2, 3, 4, 5"
                                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                    <div className="lg:col-span-2">
                                                        {prize.description && (
                                                            <p className="text-gray-300 mb-4 leading-relaxed">
                                                                {
                                                                    prize.description
                                                                }
                                                            </p>
                                                        )}

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div className="bg-gray-900/50 rounded-lg p-3">
                                                                <div className="text-gray-400">
                                                                    당첨 확률
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    {prizeStats.totalTickets >
                                                                    0
                                                                        ? `${(
                                                                              (prize.registeredTicketQuantity /
                                                                                  prizeStats.totalTickets) *
                                                                              100
                                                                          ).toFixed(
                                                                              2
                                                                          )}%`
                                                                        : "0%"}
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-900/50 rounded-lg p-3">
                                                                <div className="text-gray-400">
                                                                    상품 수
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    {
                                                                        prize.prizeQuantity
                                                                    }
                                                                    개
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-900/50 rounded-lg p-3">
                                                                <div className="text-gray-400">
                                                                    티켓 수
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    {
                                                                        prize.registeredTicketQuantity
                                                                    }
                                                                    개
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-900/50 rounded-lg p-3">
                                                                <div className="text-gray-400">
                                                                    종류
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    {
                                                                        prizeType?.label
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {prize.prizeType ===
                                                            1 &&
                                                            assetInfo && (
                                                                <div className="mt-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
                                                                    <div className="text-sm">
                                                                        <span className="text-yellow-400 font-medium">
                                                                            💰
                                                                            에셋:
                                                                        </span>
                                                                        <span className="text-white ml-2">
                                                                            {
                                                                                assetInfo.name
                                                                            }{" "}
                                                                            (
                                                                            {
                                                                                assetInfo.symbol
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {prize.prizeType ===
                                                            2 &&
                                                            spgInfo && (
                                                                <div className="mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-700">
                                                                    <div className="text-sm">
                                                                        <span className="text-purple-400 font-medium">
                                                                            🎨
                                                                            NFT:
                                                                        </span>
                                                                        <span className="text-white ml-2">
                                                                            {
                                                                                spgInfo.name
                                                                            }{" "}
                                                                            (
                                                                            {
                                                                                spgInfo.symbol
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 mt-1">
                                                                        {
                                                                            prize.collectionAddress
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>

                                                    {prize.imageUrl && (
                                                        <div className="flex justify-center">
                                                            <div className="relative w-32 h-32">
                                                                {/* Holographic border effect for NFT */}
                                                                {prize.prizeType ===
                                                                    2 && (
                                                                    <div
                                                                        className="absolute inset-0 rounded-xl animate-spin scale-110"
                                                                        style={{
                                                                            animationDuration:
                                                                                "3s",
                                                                            background:
                                                                                "conic-gradient(from 0deg, #a855f7, #06b6d4, #10b981, #eab308, #a855f7)",
                                                                        }}
                                                                    />
                                                                )}

                                                                <div
                                                                    className={cn(
                                                                        "relative w-full h-full rounded-xl overflow-hidden",
                                                                        "bg-gradient-to-br",
                                                                        rarity.bg,
                                                                        "border-2",
                                                                        `border-${rarity.border
                                                                            .replace(
                                                                                "[",
                                                                                ""
                                                                            )
                                                                            .replace(
                                                                                "]",
                                                                                ""
                                                                            )}`
                                                                    )}
                                                                >
                                                                    <img
                                                                        src={
                                                                            prize.imageUrl
                                                                        }
                                                                        alt={
                                                                            prize.title ||
                                                                            "상품 이미지"
                                                                        }
                                                                        className="w-full h-full object-cover"
                                                                        onError={(
                                                                            e
                                                                        ) => {
                                                                            const target =
                                                                                e.target as HTMLImageElement;
                                                                            target.style.display =
                                                                                "none";
                                                                        }}
                                                                    />

                                                                    {/* Shimmer effect */}
                                                                    <div
                                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                                                                        style={{
                                                                            animation:
                                                                                "shimmer 2s infinite",
                                                                            background:
                                                                                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                                                            transform:
                                                                                "translateX(-100%) skewX(-12deg)",
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!prize.imageUrl && (
                                                        <div className="flex justify-center">
                                                            <div className="relative w-32 h-32">
                                                                <div
                                                                    className={cn(
                                                                        "w-full h-full rounded-xl border-2 flex items-center justify-center",
                                                                        "bg-gradient-to-br",
                                                                        rarity.bg,
                                                                        `border-${rarity.border
                                                                            .replace(
                                                                                "[",
                                                                                ""
                                                                            )
                                                                            .replace(
                                                                                "]",
                                                                                ""
                                                                            )}`
                                                                    )}
                                                                >
                                                                    {prize.prizeType ===
                                                                    0 ? (
                                                                        <div className="text-center">
                                                                            <div className="text-red-400 mb-1 text-4xl">
                                                                                💔
                                                                            </div>
                                                                            <div className="text-xs text-gray-400">
                                                                                빈
                                                                                상품
                                                                            </div>
                                                                        </div>
                                                                    ) : prize.prizeType ===
                                                                      2 ? (
                                                                        <FaGem className="text-purple-400 text-3xl animate-pulse" />
                                                                    ) : (
                                                                        <IconComponent className="text-white text-3xl" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaChartPie
                                className="mr-3 text-blue-400"
                                size={16}
                            />
                            상품 통계
                        </h4>

                        <div className="space-y-4">
                            <div className="text-center bg-gray-750 rounded-lg p-4">
                                <div className="text-3xl font-bold text-blue-400 mb-1">
                                    {prizeStats.totalTickets}
                                </div>
                                <div className="text-sm text-gray-400">
                                    총 당첨 티켓
                                </div>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-3">
                                    희귀도별 분포
                                </h5>
                                <div className="space-y-2">
                                    {prizeStats.rarityDistribution
                                        .filter((r) => r.count > 0)
                                        .map((rarity) => (
                                            <div
                                                key={rarity.value}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-3 h-3 rounded-full bg-gradient-to-r ${rarity.gradient}`}
                                                    />
                                                    <span
                                                        className={rarity.color}
                                                    >
                                                        {rarity.name}
                                                    </span>
                                                </div>
                                                <div className="text-gray-400">
                                                    {rarity.count}개 (
                                                    {rarity.percentage.toFixed(
                                                        1
                                                    )}
                                                    %)
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-3">
                                    상품 타입별
                                </h5>
                                <div className="space-y-2">
                                    {prizeStats.typeDistribution
                                        .filter((t) => t.count > 0)
                                        .map((type) => {
                                            const IconComponent = type.icon;
                                            return (
                                                <div
                                                    key={type.value}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <IconComponent
                                                            className={
                                                                type.color
                                                            }
                                                            size={14}
                                                        />
                                                        <span className="text-gray-300">
                                                            {type.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-400">
                                                        {type.count}개
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
                        <div className="flex items-center mb-3">
                            <FaLightbulb
                                className="text-blue-400 mr-2"
                                size={16}
                            />
                            <span className="text-blue-400 font-medium">
                                상품 설정 가이드
                            </span>
                        </div>
                        <div className="space-y-2 text-sm text-blue-300">
                            <p>• 드래그앤드롭으로 상품 순서 변경</p>
                            <p>• 희귀도가 높을수록 적은 티켓 권장</p>
                            <p>• 총 티켓 수는 참가 제한과 비례</p>
                            <p>• 에셋/NFT 선택으로 실제 상품 연결</p>
                        </div>
                    </div>

                    {prizeStats.totalTickets > 0 && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <FaDice
                                    className="mr-3 text-green-400"
                                    size={16}
                                />
                                확률 계산기
                            </h4>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-300">
                                        아무 상품 당첨:
                                    </span>
                                    <span className="text-green-400 font-medium">
                                        {(
                                            (prizeStats.totalTickets /
                                                Math.max(
                                                    data.settings
                                                        ?.participationLimit ||
                                                        1000,
                                                    1
                                                )) *
                                            100
                                        ).toFixed(1)}
                                        %
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">
                                        1인당 평균 시도:
                                    </span>
                                    <span className="text-blue-400 font-medium">
                                        {(
                                            (data.settings
                                                ?.participationLimit || 1000) /
                                            prizeStats.totalTickets
                                        ).toFixed(1)}
                                        회
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">
                                        예상 당첨자:
                                    </span>
                                    <span className="text-purple-400 font-medium">
                                        {Math.min(
                                            prizeStats.totalTickets,
                                            data.settings?.participationLimit ||
                                                1000
                                        )}
                                        명
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
