"use client";

import { useState, useEffect } from "react";
import { useRaffles } from "@/app/actions/raffles/hooks";
import { useArtistsGet } from "@/app/hooks/useArtists";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useSPG } from "@/app/story/spg/hooks";
import { useToast } from "@/app/hooks/useToast";

import {
    FaArrowLeft,
    FaPlus,
    FaTrash,
    FaEdit,
    FaDice,
    FaImage,
    FaClock,
    FaCog,
    FaGift,
    FaCoins,
    FaUsers,
    FaSave,
} from "react-icons/fa";
import { TbTopologyStar3 } from "react-icons/tb";

import type {
    CreateRaffleInput,
    RafflePrizeInput,
    RaffleWithDetails,
} from "@/app/actions/raffles/actions";
import type { RafflePrizeType } from "@prisma/client";

interface AdminRafflesCreateProps {
    onBack: () => void;
    editData?: RaffleWithDetails | null;
}

// 임시 타입 정의 (실제 타입이 확실해질 때까지)
interface Artist {
    id: string;
    name: string;
}

interface Asset {
    id: string;
    name: string;
    symbol: string;
}

interface SPG {
    id: string;
    address: string;
    name: string;
    symbol: string;
}

export default function AdminRafflesCreate({
    onBack,
    editData,
}: AdminRafflesCreateProps) {
    const toast = useToast();

    const {
        createRaffleAsync,
        isCreateRafflePending,
        isCreateRaffleError,
        createRaffleError,
        updateRaffleAsync,
        isUpdateRafflePending,
        isUpdateRaffleError,
        updateRaffleError,
    } = useRaffles();

    // 🔧 임시로 훅 결과를 안전하게 캐스팅
    const artistsResult = useArtistsGet({ getArtistsInput: {} });
    const assetsResult = useAssetsGet({ getAssetsInput: {} });
    const spgResult = useSPG({ getSPGsInput: {} });

    // 안전한 타입 캐스팅 - 올바른 데이터 구조 접근
    const artistsData = (artistsResult.artists || []) as Artist[];
    const assetsData = (assetsResult.assets?.assets || []) as Asset[];
    const spgsData = (spgResult.getSPGsData || []) as SPG[];

    // 🎰 기본 래플 정보
    const [raffleData, setRaffleData] = useState<Partial<CreateRaffleInput>>({
        title: "",
        description: "",
        imgUrl: "",
        artistId: "",
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
        drawDate: undefined,
        instantReveal: true,
        isLimited: true,
        displayType: "GACHA",
        maxParticipants: 1000,
        entryFeeAssetId: "",
        entryFeeAmount: 0,
        allowMultipleEntry: false,
        maxEntriesPerPlayer: undefined,
        isPublic: true,
        prizes: [],
    });

    // 🎁 상품 관리
    const [currentPrize, setCurrentPrize] = useState<Partial<RafflePrizeInput>>(
        {
            title: "",
            description: "",
            imageUrl: "",
            order: 0,
            quantity: 1,
            type: "EMPTY",
            assetId: "",
            assetAmount: 0,
            spgAddress: "",
            nftQuantity: 1,
        }
    );

    // 🔧 상품 편집 모드
    const [editingPrizeIndex, setEditingPrizeIndex] = useState<number | null>(
        null
    );

    // 📊 총 슬롯 계산
    const totalSlots =
        raffleData.prizes?.reduce((sum, prize) => sum + prize.quantity, 0) || 0;

    // 🔄 Edit 모드일 때 기존 데이터로 초기화
    useEffect(() => {
        if (editData) {
            setRaffleData({
                title: editData.title,
                description: editData.description || "",
                imgUrl: editData.imgUrl || "",
                artistId: editData.artistId || "",
                endDate: new Date(editData.endDate),
                drawDate: editData.drawDate
                    ? new Date(editData.drawDate)
                    : undefined,
                instantReveal: editData.instantReveal,
                isLimited: editData.isLimited,
                displayType: editData.displayType,
                maxParticipants: editData.maxParticipants || undefined,
                entryFeeAssetId: editData.entryFeeAssetId || "",
                entryFeeAmount: editData.entryFeeAmount || 0,
                allowMultipleEntry: editData.allowMultipleEntry,
                maxEntriesPerPlayer: editData.maxEntriesPerPlayer || undefined,
                isPublic: editData.isPublic,
                prizes:
                    editData.prizes?.map((prize) => ({
                        title: prize.title,
                        description: prize.description || "",
                        imageUrl: prize.imageUrl || "",
                        order: prize.order,
                        quantity: prize.quantity,
                        type: prize.prizeType,
                        assetId: prize.assetId || undefined,
                        assetAmount: prize.assetAmount || undefined,
                        spgAddress: prize.spgAddress || undefined,
                        nftQuantity: prize.nftQuantity || undefined,
                    })) || [],
            });
        }
    }, [editData]);

    const isEditMode = !!editData;

    // 🎯 상품 추가/수정
    const addOrUpdatePrize = () => {
        // 편집 모드인 경우 저장 함수 호출
        if (editingPrizeIndex !== null) {
            saveEditPrize();
            return;
        }

        // 새 상품 추가 로직
        if (!currentPrize.title?.trim()) {
            toast.error("상품 이름은 필수입니다.");
            return;
        }

        if (!currentPrize.quantity || currentPrize.quantity <= 0) {
            toast.error("상품 수량은 0보다 커야 합니다.");
            return;
        }

        if (currentPrize.order === undefined || currentPrize.order < 0) {
            toast.error("상품 정렬순서는 0 이상이어야 합니다.");
            return;
        }

        const newPrize: RafflePrizeInput = {
            title: currentPrize.title,
            description: currentPrize.description,
            imageUrl: currentPrize.imageUrl,
            order: currentPrize.order!,
            quantity: currentPrize.quantity!,
            type: currentPrize.type!,
            assetId:
                currentPrize.type === "ASSET"
                    ? currentPrize.assetId
                    : undefined,
            assetAmount:
                currentPrize.type === "ASSET"
                    ? currentPrize.assetAmount
                    : undefined,
            spgAddress:
                currentPrize.type === "NFT"
                    ? currentPrize.spgAddress
                    : undefined,
            nftQuantity:
                currentPrize.type === "NFT"
                    ? currentPrize.nftQuantity
                    : undefined,
        };

        setRaffleData((prev) => ({
            ...prev,
            prizes: [...(prev.prizes || []), newPrize],
        }));

        resetCurrentPrize();
        toast.success("상품이 추가되었습니다.");
    };

    // 🗑️ 상품 제거
    const removePrize = (index: number) => {
        // 편집 중인 상품을 삭제하는 경우 편집 모드 해제
        if (editingPrizeIndex === index) {
            setEditingPrizeIndex(null);
            resetCurrentPrize();
        }
        // 편집 중인 상품의 인덱스가 삭제된 것보다 뒤에 있으면 인덱스 조정
        if (editingPrizeIndex !== null && editingPrizeIndex > index) {
            setEditingPrizeIndex(editingPrizeIndex - 1);
        }

        setRaffleData((prev) => ({
            ...prev,
            prizes: prev.prizes?.filter((_, i) => i !== index),
        }));
        toast.success("상품이 제거되었습니다.");
    };

    // ✏️ 상품 편집 시작
    const startEditPrize = (index: number) => {
        const prize = raffleData.prizes?.[index];
        if (prize) {
            setCurrentPrize({
                title: prize.title,
                description: prize.description,
                imageUrl: prize.imageUrl,
                order: prize.order,
                quantity: prize.quantity,
                type: prize.type,
                assetId: prize.assetId,
                assetAmount: prize.assetAmount,
                spgAddress: prize.spgAddress,
                nftQuantity: prize.nftQuantity,
            });
            setEditingPrizeIndex(index);
        }
    };

    // 💾 상품 편집 저장
    const saveEditPrize = () => {
        if (editingPrizeIndex === null) return;

        if (!currentPrize.title?.trim()) {
            toast.error("상품 이름은 필수입니다.");
            return;
        }

        if (!currentPrize.quantity || currentPrize.quantity <= 0) {
            toast.error("상품 수량은 0보다 커야 합니다.");
            return;
        }

        if (currentPrize.order === undefined || currentPrize.order < 0) {
            toast.error("상품 정렬순서는 0 이상이어야 합니다.");
            return;
        }

        const updatedPrize: RafflePrizeInput = {
            title: currentPrize.title,
            description: currentPrize.description,
            imageUrl: currentPrize.imageUrl,
            order: currentPrize.order!,
            quantity: currentPrize.quantity!,
            type: currentPrize.type!,
            assetId:
                currentPrize.type === "ASSET"
                    ? currentPrize.assetId
                    : undefined,
            assetAmount:
                currentPrize.type === "ASSET"
                    ? currentPrize.assetAmount
                    : undefined,
            spgAddress:
                currentPrize.type === "NFT"
                    ? currentPrize.spgAddress
                    : undefined,
            nftQuantity:
                currentPrize.type === "NFT"
                    ? currentPrize.nftQuantity
                    : undefined,
        };

        setRaffleData((prev) => ({
            ...prev,
            prizes: prev.prizes?.map((prize, index) =>
                index === editingPrizeIndex ? updatedPrize : prize
            ),
        }));

        resetCurrentPrize();
        setEditingPrizeIndex(null);
        toast.success("상품이 수정되었습니다.");
    };

    // 🔄 편집 취소
    const cancelEditPrize = () => {
        resetCurrentPrize();
        setEditingPrizeIndex(null);
    };

    // 🔄 현재 상품 폼 리셋
    const resetCurrentPrize = () => {
        setCurrentPrize({
            title: "",
            description: "",
            imageUrl: "",
            order: 0,
            quantity: 1,
            type: "EMPTY",
            assetId: "",
            assetAmount: 0,
            spgAddress: "",
            nftQuantity: 1,
        });
    };

    // 💾 래플 생성/수정
    const handleSubmitRaffle = async () => {
        if (!raffleData.title?.trim()) {
            toast.error("래플 이름은 필수입니다.");
            return;
        }

        if (!raffleData.endDate) {
            toast.error("종료 일자는 필수입니다.");
            return;
        }

        if (!raffleData.prizes || raffleData.prizes.length === 0) {
            toast.error("최소 하나의 상품이 필요합니다.");
            return;
        }

        try {
            // artistId가 빈 문자열이면 undefined로 변환
            const sanitizedRaffleData = {
                ...raffleData,
                artistId:
                    raffleData.artistId && raffleData.artistId.trim() !== ""
                        ? raffleData.artistId
                        : undefined,
            };

            if (isEditMode && editData) {
                // Update API 호출
                const result = await updateRaffleAsync({
                    id: editData.id,
                    ...sanitizedRaffleData,
                });

                if (result.success) {
                    toast.success("🎉 래플이 수정되었습니다!");
                    onBack();
                } else {
                    toast.error(result.error || "래플 수정에 실패했습니다.");
                }
            } else {
                const result = await createRaffleAsync(
                    sanitizedRaffleData as CreateRaffleInput
                );

                if (result.success) {
                    toast.success("🎉 래플이 생성되었습니다!");
                    onBack();
                } else {
                    toast.error(result.error || "래플 생성에 실패했습니다.");
                }
            }
        } catch (error) {
            console.error("Error submitting raffle:", error);
            toast.error(
                isEditMode
                    ? "래플 수정에 실패했습니다."
                    : "래플 생성에 실패했습니다."
            );
        }
    };

    return (
        <div className="min-h-[80vh] bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            {/* Background decoration */}
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 right-[-4rem] top-[-6rem] pointer-events-none select-none" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors"
                >
                    <FaArrowLeft className="text-white" />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <FaDice className="text-purple-400" />
                        {isEditMode ? (
                            <>
                                Edit{" "}
                                <span className="text-purple-400">Raffle</span>
                            </>
                        ) : (
                            <>
                                Create New{" "}
                                <span className="text-purple-400">Raffle</span>
                            </>
                        )}
                    </h1>
                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-400/30 rounded-full text-sm font-medium">
                                🚀 DEV MODE
                            </span>
                            <span className="text-green-300 text-sm">
                                All edit restrictions disabled
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* 📝 Basic Information */}
                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaCog className="text-blue-400" />
                            기본 정보
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    타이틀틀
                                </label>
                                <input
                                    type="text"
                                    value={raffleData.title || ""}
                                    onChange={(e) =>
                                        setRaffleData((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    placeholder="래플 이름을 입력하세요..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    설명
                                </label>
                                <textarea
                                    value={raffleData.description || ""}
                                    onChange={(e) =>
                                        setRaffleData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    placeholder="래플 설명을 입력하세요..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    아티스트
                                </label>
                                <select
                                    value={raffleData.artistId || ""}
                                    onChange={(e) =>
                                        setRaffleData((prev) => ({
                                            ...prev,
                                            artistId: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="">
                                        아티스트 없음 (일반 래플)
                                    </option>
                                    {artistsData?.map((artist: Artist) => (
                                        <option
                                            key={artist.id}
                                            value={artist.id}
                                        >
                                            {artist.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <FaImage className="inline mr-1" />
                                    이미지 URL
                                </label>
                                <input
                                    type="url"
                                    value={raffleData.imgUrl || ""}
                                    onChange={(e) =>
                                        setRaffleData((prev) => ({
                                            ...prev,
                                            imgUrl: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ⏰ Date & Settings */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaClock className="text-green-400" />
                            일정 & 설정
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    종료 일자
                                </label>
                                <input
                                    type="datetime-local"
                                    value={
                                        raffleData.endDate
                                            ? new Date(
                                                  raffleData.endDate.getTime() -
                                                      raffleData.endDate.getTimezoneOffset() *
                                                          60000
                                              )
                                                  .toISOString()
                                                  .slice(0, 16)
                                            : ""
                                    }
                                    onChange={(e) =>
                                        setRaffleData((prev) => ({
                                            ...prev,
                                            endDate: new Date(e.target.value),
                                        }))
                                    }
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={
                                                raffleData.instantReveal ||
                                                false
                                            }
                                            onChange={(e) =>
                                                setRaffleData((prev) => ({
                                                    ...prev,
                                                    instantReveal:
                                                        e.target.checked,
                                                }))
                                            }
                                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-gray-300">
                                            즉시 공개
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={
                                                raffleData.isLimited || false
                                            }
                                            onChange={(e) =>
                                                setRaffleData((prev) => ({
                                                    ...prev,
                                                    isLimited: e.target.checked,
                                                }))
                                            }
                                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-gray-300">
                                            제한 수량
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={
                                                raffleData.allowMultipleEntry ||
                                                false
                                            }
                                            onChange={(e) =>
                                                setRaffleData((prev) => ({
                                                    ...prev,
                                                    allowMultipleEntry:
                                                        e.target.checked,
                                                }))
                                            }
                                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-gray-300">
                                            중복 참여 허용
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={
                                                raffleData.isPublic || false
                                            }
                                            onChange={(e) =>
                                                setRaffleData((prev) => ({
                                                    ...prev,
                                                    isPublic: e.target.checked,
                                                }))
                                            }
                                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-gray-300">
                                            공개 래플
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    표시 타입
                                </label>
                                <select
                                    value={raffleData.displayType || "GACHA"}
                                    onChange={(e) =>
                                        setRaffleData((prev) => ({
                                            ...prev,
                                            displayType: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="GACHA">가챠 머신</option>
                                    <option value="SCRATCH_CARD">
                                        스크래치 카드
                                    </option>
                                    <option value="SLOT_MACHINE">
                                        슬롯 머신
                                    </option>
                                    <option value="ROULETTE">룰렛</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <FaUsers className="inline mr-1" />
                                        최대 참가자
                                    </label>
                                    <input
                                        type="number"
                                        value={raffleData.maxParticipants || ""}
                                        onChange={(e) =>
                                            setRaffleData((prev) => ({
                                                ...prev,
                                                maxParticipants:
                                                    parseInt(e.target.value) ||
                                                    undefined,
                                            }))
                                        }
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        placeholder="무제한"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        플레이어당 최대 참여 횟수
                                    </label>
                                    <input
                                        type="number"
                                        value={
                                            raffleData.maxEntriesPerPlayer || ""
                                        }
                                        onChange={(e) =>
                                            setRaffleData((prev) => ({
                                                ...prev,
                                                maxEntriesPerPlayer:
                                                    parseInt(e.target.value) ||
                                                    undefined,
                                            }))
                                        }
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        placeholder="무제한"
                                        min="1"
                                        disabled={
                                            !raffleData.allowMultipleEntry
                                        }
                                    />
                                    {!raffleData.allowMultipleEntry && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            중복 참여가 허용되지 않음
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 💰 Entry Fee */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaCoins className="text-yellow-400" />
                            입장료
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    에셋
                                </label>
                                <select
                                    value={raffleData.entryFeeAssetId || ""}
                                    onChange={(e) =>
                                        setRaffleData((prev) => ({
                                            ...prev,
                                            entryFeeAssetId: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="">무료 입장</option>
                                    {assetsData?.map((asset: Asset) => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.name} ({asset.symbol})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {raffleData.entryFeeAssetId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        금액
                                    </label>
                                    <input
                                        type="number"
                                        value={raffleData.entryFeeAmount || 0}
                                        onChange={(e) =>
                                            setRaffleData((prev) => ({
                                                ...prev,
                                                entryFeeAmount:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        min="0"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🎁 Prize Management */}
                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaGift className="text-pink-400" />
                            상품 풀 ({totalSlots} 총 슬롯)
                        </h2>
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-sm text-blue-300">
                                💡 <strong>오더 시스템:</strong> 오더 = (레어도
                                × 10) + 티어 내 오더
                                <br />
                                높은 티어 번호 = 더 좋은/희귀한 상품 (예: 53 =
                                티어 5, 오더 3)
                            </p>
                        </div>

                        {/* 현재 상품 목록 */}
                        <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                            {raffleData.prizes
                                ?.sort(
                                    (a, b) => (a.order ?? 0) - (b.order ?? 0)
                                )
                                .map((prize, index) => {
                                    const isEditing =
                                        editingPrizeIndex === index;
                                    const tierNumber = Math.floor(
                                        (prize.order ?? 0) / 10
                                    );
                                    const orderInTier = (prize.order ?? 0) % 10;
                                    const probability =
                                        totalSlots > 0
                                            ? (prize.quantity / totalSlots) *
                                              100
                                            : 0;

                                    // 에셋/SPG 정보 가져오기
                                    const assetInfo =
                                        prize.type === "ASSET" && prize.assetId
                                            ? assetsData?.find(
                                                  (a) => a.id === prize.assetId
                                              )
                                            : null;
                                    const spgInfo =
                                        prize.type === "NFT" && prize.spgAddress
                                            ? spgsData?.find(
                                                  (s) =>
                                                      s.address ===
                                                      prize.spgAddress
                                              )
                                            : null;

                                    return (
                                        <div
                                            key={index}
                                            className={`bg-gray-700/30 p-4 rounded-lg border transition-all ${
                                                isEditing
                                                    ? "border-purple-500/50 bg-purple-500/10"
                                                    : "border-gray-600/30 hover:border-gray-500/50"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-medium text-white text-lg">
                                                            {prize.title}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                                                                prize.type ===
                                                                "ASSET"
                                                                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                                                    : prize.type ===
                                                                      "NFT"
                                                                    ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                                                                    : "bg-gray-500/20 text-gray-300 border border-gray-400/30"
                                                            }`}
                                                        >
                                                            {prize.type}
                                                        </span>
                                                        {isEditing && (
                                                            <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 rounded-full">
                                                                편집 중
                                                            </span>
                                                        )}
                                                    </div>

                                                    {prize.description && (
                                                        <p className="text-gray-400 text-sm mb-2">
                                                            {prize.description}
                                                        </p>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">
                                                                수량:
                                                            </span>
                                                            <span className="text-white font-medium ml-1">
                                                                {prize.quantity}
                                                                개
                                                            </span>
                                                            <span className="text-green-400 ml-1">
                                                                (
                                                                {probability.toFixed(
                                                                    1
                                                                )}
                                                                %)
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">
                                                                티어:
                                                            </span>
                                                            <span className="text-purple-400 font-medium ml-1">
                                                                {tierNumber}
                                                            </span>
                                                            <span className="text-gray-400 ml-1">
                                                                (순서:{" "}
                                                                {orderInTier})
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* 상품별 상세 정보 */}
                                                    {prize.type === "ASSET" && (
                                                        <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-400/20">
                                                            <div className="text-sm">
                                                                <span className="text-blue-300 font-medium">
                                                                    💰 에셋:
                                                                </span>
                                                                <span className="text-white ml-1">
                                                                    {assetInfo?.name ||
                                                                        "Unknown Asset"}
                                                                    (
                                                                    {assetInfo?.symbol ||
                                                                        "?"}
                                                                    )
                                                                </span>
                                                                <span className="text-blue-300 ml-2">
                                                                    {
                                                                        prize.assetAmount
                                                                    }
                                                                    개
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {prize.type === "NFT" && (
                                                        <div className="mt-2 p-2 bg-purple-500/10 rounded border border-purple-400/20">
                                                            <div className="text-sm">
                                                                <span className="text-purple-300 font-medium">
                                                                    🎨 NFT:
                                                                </span>
                                                                <span className="text-white ml-1">
                                                                    {spgInfo?.name ||
                                                                        "Unknown Collection"}
                                                                    (
                                                                    {spgInfo?.symbol ||
                                                                        "?"}
                                                                    )
                                                                </span>
                                                                <span className="text-purple-300 ml-2">
                                                                    {
                                                                        prize.nftQuantity
                                                                    }
                                                                    개
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {
                                                                    prize.spgAddress
                                                                }
                                                            </div>
                                                        </div>
                                                    )}

                                                    {prize.type === "EMPTY" && (
                                                        <div className="mt-2 p-2 bg-gray-500/10 rounded border border-gray-400/20">
                                                            <div className="text-sm text-gray-400">
                                                                💔 꽝 (상품
                                                                없음)
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() =>
                                                            startEditPrize(
                                                                index
                                                            )
                                                        }
                                                        disabled={
                                                            editingPrizeIndex !==
                                                                null &&
                                                            editingPrizeIndex !==
                                                                index
                                                        }
                                                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="상품 편집"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            removePrize(index)
                                                        }
                                                        disabled={
                                                            editingPrizeIndex !==
                                                            null
                                                        }
                                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="상품 삭제"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* 새 상품 추가/편집 폼 */}
                        <div className="space-y-4 border-t border-gray-700/50 pt-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                {editingPrizeIndex !== null ? (
                                    <>
                                        <FaEdit className="text-yellow-400" />
                                        상품 편집 #{editingPrizeIndex + 1}
                                    </>
                                ) : (
                                    <>
                                        <FaPlus className="text-green-400" />새
                                        상품 추가
                                    </>
                                )}
                            </h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        상품명
                                    </label>
                                    <input
                                        type="text"
                                        value={currentPrize.title || ""}
                                        onChange={(e) =>
                                            setCurrentPrize((prev) => ({
                                                ...prev,
                                                title: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        placeholder="상품명을 입력하세요..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        정렬순서 (티어 × 10 + 정렬순서)
                                    </label>
                                    <input
                                        type="number"
                                        value={currentPrize.order ?? ""}
                                        onChange={(e) =>
                                            setCurrentPrize((prev) => ({
                                                ...prev,
                                                order:
                                                    parseInt(e.target.value) ??
                                                    0,
                                            }))
                                        }
                                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        min="0"
                                        placeholder="예: 53 = 티어 5, 정렬순서 3"
                                    />
                                    <div className="mt-1 text-xs text-gray-400">
                                        {currentPrize.order !== undefined &&
                                            currentPrize.order >= 0 && (
                                                <>
                                                    티어:{" "}
                                                    {Math.floor(
                                                        currentPrize.order / 10
                                                    )}{" "}
                                                    (높은 티어 = 더 좋은) |
                                                    정렬순서:{" "}
                                                    {currentPrize.order % 10}
                                                </>
                                            )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        수량
                                    </label>
                                    <input
                                        type="number"
                                        value={currentPrize.quantity || ""}
                                        onChange={(e) =>
                                            setCurrentPrize((prev) => ({
                                                ...prev,
                                                quantity:
                                                    parseInt(e.target.value) ||
                                                    1,
                                            }))
                                        }
                                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    상품 타입
                                </label>
                                <select
                                    value={currentPrize.type || "EMPTY"}
                                    onChange={(e) =>
                                        setCurrentPrize((prev) => ({
                                            ...prev,
                                            type: e.target
                                                .value as RafflePrizeType,
                                        }))
                                    }
                                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="EMPTY">
                                        꽝 (상품 없음)
                                    </option>
                                    <option value="ASSET">에셋 상품</option>
                                    <option value="NFT">NFT 상품</option>
                                </select>
                            </div>

                            {currentPrize.type === "ASSET" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            에셋
                                        </label>
                                        <select
                                            value={currentPrize.assetId || ""}
                                            onChange={(e) =>
                                                setCurrentPrize((prev) => ({
                                                    ...prev,
                                                    assetId: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        >
                                            <option value="">에셋 선택</option>
                                            {assetsData?.map((asset: Asset) => (
                                                <option
                                                    key={asset.id}
                                                    value={asset.id}
                                                >
                                                    {asset.name} ({asset.symbol}
                                                    )
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            금액
                                        </label>
                                        <input
                                            type="number"
                                            value={
                                                currentPrize.assetAmount || ""
                                            }
                                            onChange={(e) =>
                                                setCurrentPrize((prev) => ({
                                                    ...prev,
                                                    assetAmount:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 0,
                                                }))
                                            }
                                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            )}

                            {currentPrize.type === "NFT" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            SPG 컬렉션
                                        </label>
                                        <select
                                            value={
                                                currentPrize.spgAddress || ""
                                            }
                                            onChange={(e) =>
                                                setCurrentPrize((prev) => ({
                                                    ...prev,
                                                    spgAddress: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        >
                                            <option value="">
                                                컬렉션 선택
                                            </option>
                                            {spgsData?.map((spg: SPG) => (
                                                <option
                                                    key={spg.id}
                                                    value={spg.address}
                                                >
                                                    {spg.name} ({spg.symbol})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            수량
                                        </label>
                                        <input
                                            type="number"
                                            value={
                                                currentPrize.nftQuantity || 1
                                            }
                                            onChange={(e) =>
                                                setCurrentPrize((prev) => ({
                                                    ...prev,
                                                    nftQuantity:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1,
                                                }))
                                            }
                                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={addOrUpdatePrize}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                                >
                                    {editingPrizeIndex !== null ? (
                                        <>
                                            <FaSave />
                                            상품 수정 저장
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus />
                                            상품 추가
                                        </>
                                    )}
                                </button>
                                {editingPrizeIndex !== null && (
                                    <button
                                        onClick={cancelEditPrize}
                                        className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all"
                                    >
                                        취소
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 💾 Create Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSubmitRaffle}
                    disabled={isCreateRafflePending || isUpdateRafflePending}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-700 via-pink-700 to-red-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-red-700 hover:to-purple-700 transition-all duration-200 text-lg tracking-wide border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {isCreateRafflePending || isUpdateRafflePending ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            {isEditMode ? "래플 수정 중..." : "래플 생성 중..."}
                        </>
                    ) : (
                        <>
                            <FaSave />
                            {isEditMode ? "래플 수정" : "래플 생성"}
                        </>
                    )}
                </button>
            </div>

            {/* 오류 표시 */}
            {((isCreateRaffleError && createRaffleError) ||
                (isUpdateRaffleError && updateRaffleError)) && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400">
                        {createRaffleError?.message ||
                            updateRaffleError?.message}
                    </p>
                </div>
            )}
        </div>
    );
}
