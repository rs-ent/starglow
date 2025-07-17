"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
    FaImage,
    FaGlobe,
    FaNetworkWired,
    FaWallet,
    FaEdit,
    FaEye,
    FaInfoCircle,
    FaCopy,
    FaCheck,
    FaRocket,
} from "react-icons/fa";
import type {
    BlockchainNetwork,
    EscrowWallet,
    OnchainRaffleContract,
} from "@prisma/client";

import FileUploaderIPFS from "@/components/atoms/FileUploader.IPFS";

import { getRafflesContracts } from "@/app/actions/raffles/web3/actions-admin";
import type { RaffleFormData } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    data: RaffleFormData;
    updateData: (step: string, data: any) => void;
    storyNetworks?: BlockchainNetwork[];
    escrowWallets?: EscrowWallet[];
}

export function AdminRafflesWeb3CreateBasicInfo({
    data,
    updateData,
    storyNetworks,
    escrowWallets,
}: Props) {
    const { data: session } = useSession();
    const [contracts, setContracts] = useState<OnchainRaffleContract[]>([]);
    const [isLoadingContracts, setIsLoadingContracts] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState(data.networkId);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const loadContracts = useCallback(
        async (networkId?: string) => {
            setIsLoadingContracts(true);
            try {
                const result = await getRafflesContracts({
                    networkId,
                    isActive: true,
                });

                if (result.success && result.data) {
                    setContracts(result.data);
                    // 스마트 기본값: 첫 번째 활성 컨트랙트 자동 선택
                    if (result.data.length > 0 && !data.contractId) {
                        updateData("contractId", result.data[0].id);
                    }
                } else {
                    toast.error("컨트랙트 목록을 불러오는데 실패했습니다.");
                    setContracts([]);
                }
            } catch (error) {
                console.error("Error loading contracts:", error);
                toast.error("컨트랙트 로딩 중 오류가 발생했습니다.");
                setContracts([]);
            } finally {
                setIsLoadingContracts(false);
            }
        },
        [data.contractId, updateData]
    );

    useEffect(() => {
        if (selectedNetwork) {
            loadContracts(selectedNetwork).catch((err) => {
                console.error("Error loading contracts:", err);
            });
        }
    }, [selectedNetwork, loadContracts]);

    const handleNetworkChange = useCallback(
        (networkId: string) => {
            setSelectedNetwork(networkId);
            updateData("networkId", networkId);
            updateData("contractId", "");
            updateData("walletAddress", "");

            // 스마트 기본값: 네트워크 변경 시 호환되는 지갑 자동 선택
            const compatibleWallets = escrowWallets?.filter((w) =>
                w.networkIds.includes(networkId)
            );
            if (compatibleWallets && compatibleWallets.length > 0) {
                updateData("walletAddress", compatibleWallets[0].address);
            }
        },
        [updateData, escrowWallets]
    );

    const handleBasicInfoChange = useCallback(
        (field: string, value: string) => {
            updateData("basicInfo", { [field]: value });
        },
        [updateData]
    );

    const copyToClipboard = useCallback(async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
            toast.success("클립보드에 복사되었습니다!");
        } catch (error) {
            console.error("Copy failed:", error);
            toast.error("복사에 실패했습니다.");
        }
    }, []);

    // 파일 업로드 핸들러
    const handleFileUpload = useCallback(
        (field: string, files: any[]) => {
            if (files[0]?.url) {
                handleBasicInfoChange(field, files[0].url);
            }
        },
        [handleBasicInfoChange]
    );

    const selectedNetworkData = storyNetworks?.find(
        (n) => n.id === selectedNetwork
    );
    const selectedContractData = contracts.find(
        (c) => c.id === data.contractId
    );
    const availableWallets = escrowWallets?.filter((w) => {
        if (!selectedNetwork) return true;

        // networkIds가 배열인지 확인
        if (!Array.isArray(w.networkIds)) {
            return false;
        }

        // 빈 배열이면 모든 네트워크에서 사용 가능하다고 간주
        if (w.networkIds.length === 0) {
            return true;
        }

        return w.networkIds.includes(selectedNetwork);
    });
    const selectedWalletData = availableWallets?.find(
        (w) => w.address === data.walletAddress
    );

    // 완성도 계산
    const completionPercentage =
        [
            selectedNetwork,
            data.contractId,
            data.walletAddress,
            data.basicInfo.title.trim(),
        ].filter(Boolean).length * 25;

    return (
        <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-700/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FaRocket className="mr-3 text-blue-400" size={20} />
                        래플 기본 정보
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-300">
                            완성도:{" "}
                            <span className="text-blue-400 font-medium">
                                {completionPercentage}%
                            </span>
                        </div>
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                    온체인 래플을 생성하기 위한 기본 설정을 완료해주세요. 모든
                    필수 항목을 입력하면 다음 단계로 진행할 수 있습니다.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 블록체인 설정 */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaNetworkWired
                                className="mr-3 text-green-400"
                                size={16}
                            />
                            블록체인 설정
                        </h4>

                        <div className="space-y-6">
                            {/* 네트워크 선택 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaGlobe
                                        className="inline mr-2"
                                        size={14}
                                    />
                                    네트워크 선택 *
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedNetwork}
                                        onChange={(e) =>
                                            handleNetworkChange(e.target.value)
                                        }
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">
                                            네트워크를 선택하세요
                                        </option>
                                        {storyNetworks?.map((network) => (
                                            <option
                                                key={network.id}
                                                value={network.id}
                                            >
                                                {network.name}{" "}
                                                {network.isTestnet
                                                    ? "(Testnet)"
                                                    : "(Mainnet)"}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedNetworkData && (
                                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 bg-gray-750 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-2 h-2 rounded-full ${
                                                        selectedNetworkData.isTestnet
                                                            ? "bg-yellow-400"
                                                            : "bg-green-400"
                                                    }`}
                                                />
                                                <span>
                                                    Chain ID:{" "}
                                                    {
                                                        selectedNetworkData.chainId
                                                    }
                                                </span>
                                            </div>
                                            <span>•</span>
                                            <span>
                                                Symbol:{" "}
                                                {selectedNetworkData.symbol}
                                            </span>
                                            <span>•</span>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        selectedNetworkData.rpcUrl,
                                                        "rpc"
                                                    )
                                                }
                                                className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                                            >
                                                {copiedField === "rpc" ? (
                                                    <FaCheck />
                                                ) : (
                                                    <FaCopy />
                                                )}
                                                RPC 복사
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 래플 컨트랙트 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaNetworkWired
                                        className="inline mr-2"
                                        size={14}
                                    />
                                    래플 컨트랙트 *
                                </label>
                                <div className="relative">
                                    <select
                                        value={data.contractId}
                                        onChange={(e) =>
                                            updateData(
                                                "contractId",
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            !selectedNetwork ||
                                            isLoadingContracts
                                        }
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    >
                                        <option value="">
                                            {isLoadingContracts
                                                ? "컨트랙트 로딩 중..."
                                                : selectedNetwork
                                                ? "컨트랙트를 선택하세요"
                                                : "먼저 네트워크를 선택하세요"}
                                        </option>
                                        {contracts.map((contract) => (
                                            <option
                                                key={contract.id}
                                                value={contract.id}
                                            >
                                                {contract.address.slice(0, 8)}
                                                ...{contract.address.slice(-6)}
                                                {" - "}Block #
                                                {contract.blockNumber}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedContractData && (
                                        <div className="mt-3 bg-gray-750 p-3 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400">
                                                    컨트랙트 주소:
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            selectedContractData.address,
                                                            "contract"
                                                        )
                                                    }
                                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    {copiedField ===
                                                    "contract" ? (
                                                        <FaCheck />
                                                    ) : (
                                                        <FaCopy />
                                                    )}
                                                    {
                                                        selectedContractData.address
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {contracts.length === 0 &&
                                    selectedNetwork &&
                                    !isLoadingContracts && (
                                        <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                                            <div className="flex items-center">
                                                <FaInfoCircle
                                                    className="text-yellow-400 mr-2"
                                                    size={14}
                                                />
                                                <span className="text-yellow-300 text-sm">
                                                    선택한 네트워크에 활성화된
                                                    래플 컨트랙트가 없습니다.
                                                </span>
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {/* 에스크로 지갑 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    <FaWallet
                                        className="inline mr-2"
                                        size={14}
                                    />
                                    에스크로 지갑 *
                                </label>
                                <div className="relative">
                                    <select
                                        value={data.walletAddress}
                                        onChange={(e) =>
                                            updateData(
                                                "walletAddress",
                                                e.target.value
                                            )
                                        }
                                        disabled={!selectedNetwork}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    >
                                        <option value="">
                                            지갑을 선택하세요
                                        </option>
                                        {availableWallets?.map((wallet) => (
                                            <option
                                                key={wallet.id}
                                                value={wallet.address}
                                            >
                                                {wallet.address} (
                                                {wallet.address.slice(0, 8)}...
                                                {wallet.address.slice(-6)})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedWalletData && (
                                        <div className="mt-3 bg-gray-750 p-3 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400">
                                                    지갑 주소:
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            selectedWalletData.address,
                                                            "wallet"
                                                        )
                                                    }
                                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    {copiedField ===
                                                    "wallet" ? (
                                                        <FaCheck />
                                                    ) : (
                                                        <FaCopy />
                                                    )}
                                                    {selectedWalletData.address}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 래플 정보 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                            <FaEdit
                                className="mr-3 text-purple-400"
                                size={16}
                            />
                            래플 정보
                        </h4>

                        <div className="space-y-6">
                            {/* 래플 제목 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    래플 제목 *
                                </label>
                                <input
                                    type="text"
                                    value={data.basicInfo.title}
                                    onChange={(e) =>
                                        handleBasicInfoChange(
                                            "title",
                                            e.target.value
                                        )
                                    }
                                    placeholder="예: 스페셜 NFT 래플 이벤트"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    required
                                    maxLength={100}
                                />
                                <div className="mt-2 text-xs text-gray-400 text-right">
                                    {data.basicInfo.title.length}/100
                                </div>
                            </div>

                            {/* 래플 설명 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    래플 설명
                                </label>
                                <textarea
                                    value={data.basicInfo.description}
                                    onChange={(e) =>
                                        handleBasicInfoChange(
                                            "description",
                                            e.target.value
                                        )
                                    }
                                    placeholder="래플에 대한 자세한 설명을 입력하세요..."
                                    rows={4}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                                    maxLength={500}
                                />
                                <div className="mt-2 text-xs text-gray-400 text-right">
                                    {data.basicInfo.description.length}/500
                                </div>
                            </div>

                            {/* 이미지 업로드 */}
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <FaImage size={14} />
                                    래플 이미지
                                </label>
                                <div className="space-y-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                                    <FileUploaderIPFS
                                        userId={session?.user?.id || ""}
                                        type="image"
                                        multiple={false}
                                        onComplete={(files) =>
                                            handleFileUpload("imageUrl", files)
                                        }
                                        className="mb-3"
                                    />
                                    <input
                                        type="url"
                                        value={data.basicInfo.imageUrl}
                                        onChange={(e) =>
                                            handleBasicInfoChange(
                                                "imageUrl",
                                                e.target.value
                                            )
                                        }
                                        placeholder="또는 직접 URL 입력: https://example.com/image.jpg"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                    />
                                    {data.basicInfo.imageUrl && (
                                        <div className="mt-3">
                                            <img
                                                src={data.basicInfo.imageUrl}
                                                alt="래플 이미지 미리보기"
                                                className="w-full h-48 object-cover rounded-lg border border-gray-600"
                                                onError={(e) => {
                                                    const target =
                                                        e.target as HTMLImageElement;
                                                    target.style.display =
                                                        "none";
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 아이콘 업로드 */}
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <FaImage size={14} />
                                    래플 아이콘
                                </label>
                                <div className="space-y-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                                    <FileUploaderIPFS
                                        userId={session?.user?.id || ""}
                                        type="image"
                                        multiple={false}
                                        onComplete={(files) =>
                                            handleFileUpload("iconUrl", files)
                                        }
                                        className="mb-3"
                                    />
                                    <input
                                        type="url"
                                        value={data.basicInfo.iconUrl}
                                        onChange={(e) =>
                                            handleBasicInfoChange(
                                                "iconUrl",
                                                e.target.value
                                            )
                                        }
                                        placeholder="또는 직접 URL 입력: https://example.com/icon.jpg"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                                    />
                                    {data.basicInfo.iconUrl && (
                                        <div className="mt-3">
                                            <img
                                                src={data.basicInfo.iconUrl}
                                                alt="래플 아이콘 미리보기"
                                                className="w-24 h-24 object-cover rounded-lg border border-gray-600"
                                                onError={(e) => {
                                                    const target =
                                                        e.target as HTMLImageElement;
                                                    target.style.display =
                                                        "none";
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 미리보기 섹션 */}
                <div className="space-y-6">
                    {/* 미리보기 제어 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-white flex items-center">
                                <FaEye
                                    className="mr-3 text-blue-400"
                                    size={16}
                                />
                                미리보기
                            </h4>
                            <button
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    isPreviewMode
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                }`}
                            >
                                {isPreviewMode ? "편집 모드" : "미리보기 모드"}
                            </button>
                        </div>

                        {/* 래플 카드 미리보기 */}
                        <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                            {data.basicInfo.imageUrl && (
                                <div className="mb-4">
                                    <img
                                        src={data.basicInfo.imageUrl}
                                        alt="래플 이미지 미리보기"
                                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                        onError={(e) => {
                                            const target =
                                                e.target as HTMLImageElement;
                                            target.style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                {data.basicInfo.iconUrl && (
                                    <img
                                        src={data.basicInfo.iconUrl}
                                        alt="래플 아이콘"
                                        className="w-12 h-12 rounded-lg border border-gray-600 flex-shrink-0"
                                        onError={(e) => {
                                            const target =
                                                e.target as HTMLImageElement;
                                            target.style.display = "none";
                                        }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-white truncate">
                                        {data.basicInfo.title || "래플 제목"}
                                    </h5>
                                    {data.basicInfo.description && (
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                            {data.basicInfo.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                        <span>
                                            {selectedNetworkData?.name ||
                                                "네트워크"}
                                        </span>
                                        <span>•</span>
                                        <span>상태: 준비중</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 설정 요약 */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FaInfoCircle
                                className="mr-3 text-yellow-400"
                                size={16}
                            />
                            설정 요약
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                <span className="text-gray-300">네트워크:</span>
                                <span
                                    className={`font-medium ${
                                        selectedNetworkData
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {selectedNetworkData?.name || "미선택"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                <span className="text-gray-300">컨트랙트:</span>
                                <span
                                    className={`font-medium ${
                                        selectedContractData
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {selectedContractData ? "선택됨" : "미선택"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                <span className="text-gray-300">지갑:</span>
                                <span
                                    className={`font-medium ${
                                        selectedWalletData
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {selectedWalletData?.address || "미선택"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-300">제목:</span>
                                <span
                                    className={`font-medium ${
                                        data.basicInfo.title.trim()
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {data.basicInfo.title.trim()
                                        ? "작성됨"
                                        : "미작성"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
