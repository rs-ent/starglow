/// components/admin/story/Admin.Story.Mint.tsx

"use client";

import { useEffect, useState } from "react";
import { useNFT } from "@/app/story/nft/hooks";
import { useSPG } from "@/app/story/spg/hooks";
import { useMetadata } from "@/app/story/metadata/hooks";
import { useStoryNetwork } from "@/app/story/network/hooks";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { useToast } from "@/app/hooks/useToast";
import { useSession } from "next-auth/react";
import { TbTopologyStar3 } from "react-icons/tb";
import { SiEthereum } from "react-icons/si";
import { FaRocket, FaCube, FaImages } from "react-icons/fa";
import { Story_spg, ipfs } from "@prisma/client";
import type {
    ERC721Metadata,
    IPAssetMetadata,
} from "@/app/story/metadata/actions";

export default function AdminStoryMint({ onBack }: { onBack?: () => void }) {
    const toast = useToast();
    const { data: session } = useSession();
    const userId = session?.user?.id || "";

    // Hooks
    const {
        mint,
        mintAsync,
        isPending: isMintPending,
        isSuccess: isMintSuccess,
        isError: isMintError,
        error: mintError,

        registerAsIPAsset,
        registerAsIPAssetAsync,
        isRegisterAsIPAssetPending,
        isRegisterAsIPAssetSuccess,
        isRegisterAsIPAssetError,
        registerAsIPAssetError,

        mintAndRegisterAsIPAsset,
        mintAndRegisterAsIPAssetAsync,
        isMintAndRegisterAsIPAssetPending,
        isMintAndRegisterAsIPAssetSuccess,
        isMintAndRegisterAsIPAssetError,
        mintAndRegisterAsIPAssetError,
    } = useNFT();

    const { getSPGsData, getSPGsIsLoading, getSPGsIsError, getSPGsRefetch } =
        useSPG({});

    const {
        metadataList: nftMetadataList,
        isLoadingMetadataList: isLoadingNFTMetadata,
        refetchMetadataList: refetchNFTMetadata,
    } = useMetadata({
        getMetadataListInput: {
            type: "erc721-metadata",
        },
    });

    const [cachedMetadata, setCachedMetadata] = useState<Record<string, any>>(
        {}
    );

    const fetchMetadata = async (url: string) => {
        try {
            const fetchedData = await fetch(url);
            if (!fetchedData.ok) {
                throw new Error(`HTTP error! status: ${fetchedData.status}`);
            }
            const data = await fetchedData.json();
            return data;
        } catch (error) {
            console.error(`Failed to fetch metadata from ${url}:`, error);
            return null;
        }
    };

    useEffect(() => {
        const loadMetadata = async () => {
            if (!nftMetadataList?.length || isLoadingNFTMetadata) return;
            const uncachedMetadata = nftMetadataList.filter(
                (meta) => meta.url && !cachedMetadata[meta.url]
            );

            if (!uncachedMetadata.length) return;

            try {
                // Promise.all을 사용하여 병렬로 모든 요청 처리
                const results = await Promise.all(
                    uncachedMetadata.map(async (meta) => {
                        const data = await fetchMetadata(meta.url!);
                        return { url: meta.url, data };
                    })
                );

                // 새로운 캐시 데이터 생성
                const newCache = results.reduce((acc, { url, data }) => {
                    if (data && url) {
                        acc[url] = data;
                    }
                    return acc;
                }, {} as Record<string, any>);

                // 기존 캐시와 병합
                setCachedMetadata((prev) => ({
                    ...prev,
                    ...newCache,
                }));
            } catch (error) {
                console.error("Error loading metadata:", error);
            }
        };

        loadMetadata();
    }, [nftMetadataList, cachedMetadata, isLoadingNFTMetadata]);

    const {
        metadataList: ipAssetMetadataList,
        isLoadingMetadataList: isLoadingIPAssetMetadata,
        refetchMetadataList: refetchIPAssetMetadata,
    } = useMetadata({
        getMetadataListInput: {
            type: "ip-asset-metadata",
        },
    });

    const { storyNetworks } = useStoryNetwork();
    const { escrowWallets } = useEscrowWallets();

    // State
    const [step, setStep] = useState<number>(0);
    const [form, setForm] = useState<{
        spgCollection: Story_spg | null;
        quantity: number;
        nftMetadata: ipfs | null;
        ipAssetMetadata: ipfs | null;
        mintOption: "mint-only" | "mint-and-register";
        reuseNFTMetadata: boolean;
    }>({
        spgCollection: null,
        quantity: 1,
        nftMetadata: null,
        ipAssetMetadata: null,
        mintOption: "mint-only",
        reuseNFTMetadata: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successData, setSuccessData] = useState<any>(null);
    const [mintProgress, setMintProgress] = useState(0);

    // Progress Bar Component
    const ProgressBar = () => {
        const steps = [
            "시작",
            "컬렉션",
            "수량",
            "NFT 메타데이터",
            "IP 메타데이터",
            "옵션",
            "확인",
            "민팅",
        ];
        return (
            <div className="w-full max-w-4xl mx-auto mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-blue-900/30 -translate-y-1/2"></div>
                    <div
                        className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 -translate-y-1/2 transition-all duration-500"
                        style={{
                            width: `${(step / (steps.length - 1)) * 100}%`,
                        }}
                    ></div>
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            className={`relative z-10 flex flex-col items-center ${
                                i <= step ? "text-cyan-300" : "text-blue-600"
                            }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    i < step
                                        ? "bg-gradient-to-r from-cyan-500 to-purple-500 border-cyan-300"
                                        : i === step
                                        ? "bg-blue-900 border-cyan-400 animate-pulse"
                                        : "bg-[#181c2b] border-blue-800"
                                }`}
                            >
                                {i < step ? "✓" : i + 1}
                            </div>
                            <span className="text-xs mt-1 hidden md:block">
                                {s}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 민팅 실행
    const handleMint = async () => {
        if (!form.spgCollection || !form.nftMetadata) {
            toast.error("필수 정보가 누락되었습니다.");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setMintProgress(0);

        try {
            // 선택한 지갑 찾기
            const wallet = escrowWallets?.find(
                (w) => form.spgCollection?.ownerAddress === w.address
            );

            if (!wallet) {
                throw new Error("지갑을 찾을 수 없습니다.");
            }

            setMintProgress(10);

            // NFT 메타데이터 파싱
            const nftMetadataResponse = await fetch(form.nftMetadata.url);
            const nftMetadata: ERC721Metadata =
                await nftMetadataResponse.json();

            setMintProgress(20);

            if (form.mintOption === "mint-only") {
                // NFT만 민팅
                const result = await mintAsync({
                    userId,
                    networkId: form.spgCollection.networkId,
                    walletAddress: wallet.address,
                    contractAddress: form.spgCollection.address,
                    quantity: form.quantity,
                    tokenURIMetadata: nftMetadata,
                    ipAssetMetadata: {} as IPAssetMetadata, // mint-only에서는 사용하지 않음
                    reuseMetadata: form.reuseNFTMetadata,
                });

                setMintProgress(100);
                setSuccessData(result);
                toast.success(
                    `${form.quantity}개의 NFT가 성공적으로 민팅되었습니다!`
                );
            } else {
                // NFT 민팅 + IP Asset 등록
                if (!form.ipAssetMetadata) {
                    throw new Error("IP Asset 메타데이터가 필요합니다.");
                }

                setMintProgress(30);

                // IP Asset 메타데이터 파싱
                const ipAssetMetadataResponse = await fetch(
                    form.ipAssetMetadata.url
                );
                const ipAssetMetadata: IPAssetMetadata =
                    await ipAssetMetadataResponse.json();

                setMintProgress(40);

                const result = await mintAndRegisterAsIPAssetAsync({
                    userId,
                    networkId: form.spgCollection.networkId,
                    walletAddress: wallet.address,
                    contractAddress: form.spgCollection.address,
                    quantity: form.quantity,
                    tokenURIMetadata: nftMetadata,
                    ipAssetMetadata: ipAssetMetadata,
                    reuseMetadata: form.reuseNFTMetadata,
                });

                setMintProgress(100);
                setSuccessData(result);
                toast.success(
                    `${form.quantity}개의 NFT가 민팅되고 IP Asset으로 등록되었습니다!`
                );
            }

            setStep(8); // 성공 화면
        } catch (err: any) {
            setError(err?.message || "민팅 중 오류가 발생했습니다.");
            toast.error("민팅 실패");
            setMintProgress(0);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center justify-start min-h-[80vh]">
            {/* 배경 아이콘 */}
            <TbTopologyStar3 className="absolute text-[14rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none z-0" />
            <SiEthereum className="absolute text-[7rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none z-0" />

            {/* Progress Bar */}
            {step > 0 && step < 8 && <ProgressBar />}

            {/* Step 0: 시작 화면 */}
            {step === 0 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        <FaRocket className="text-8xl text-purple-400 mx-auto mb-4 animate-bounce" />
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                            NFT 민팅 센터
                        </h1>
                        <p className="text-xl text-blue-200 mb-2">
                            Story Protocol NFT Minting
                        </p>
                        <p className="text-blue-300 mb-8 max-w-2xl mx-auto">
                            SPG 컬렉션에서 NFT를 민팅하고, 선택적으로 IP
                            Asset으로 등록할 수 있습니다. 강력한 Web3 기능과
                            함께 K-pop 아티스트의 디지털 자산을 생성하세요.
                        </p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setStep(1)}
                            className="px-12 py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-bold text-xl rounded-full shadow-2xl hover:scale-105 transition-all duration-300 hover:shadow-purple-500/50"
                        >
                            🚀 민팅 시작하기
                        </button>
                        <button
                            onClick={onBack}
                            className="px-8 py-5 bg-blue-900/50 text-blue-300 font-bold text-xl rounded-full hover:bg-blue-800/50 transition-colors"
                        >
                            뒤로가기
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1: SPG 컬렉션 선택 */}
            {step === 1 && (
                <div className="w-full max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        어떤 컬렉션에서 민팅할까요?
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        NFT를 민팅할 SPG 컬렉션을 선택하세요
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-h-[400px] overflow-y-auto p-2">
                        {getSPGsIsLoading ? (
                            <div className="col-span-full text-center text-blue-200">
                                컬렉션 불러오는 중...
                            </div>
                        ) : getSPGsIsError ? (
                            <div className="col-span-full text-center text-red-400">
                                컬렉션을 불러올 수 없습니다.
                            </div>
                        ) : !getSPGsData || getSPGsData.length === 0 ? (
                            <div className="col-span-full text-center text-blue-200">
                                등록된 컬렉션이 없습니다.
                            </div>
                        ) : (
                            getSPGsData.map((spg) => (
                                <button
                                    key={spg.id}
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            spgCollection: spg,
                                        }))
                                    }
                                    className={`
                                        relative group p-6 rounded-2xl shadow-xl border-4
                                        transition-all duration-300 transform
                                        ${
                                            form.spgCollection?.id === spg.id
                                                ? "border-purple-400 bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-orange-900/50 scale-105 ring-4 ring-purple-300/30"
                                                : "border-blue-800 bg-[#181c2b]/80 hover:scale-105 hover:border-purple-500/50"
                                        }
                                    `}
                                >
                                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                                        <FaCube className="text-purple-400" />
                                    </div>
                                    <h3 className="font-bold text-xl text-purple-200 mb-1">
                                        {spg.name}
                                    </h3>
                                    <p className="text-sm text-blue-300 mb-2">
                                        {spg.symbol}
                                    </p>
                                    <p className="text-xs text-blue-400">
                                        {Array.isArray(storyNetworks)
                                            ? storyNetworks?.find(
                                                  (n: any) =>
                                                      n.id === spg.networkId
                                              )?.name
                                            : (storyNetworks as any)?.name ||
                                              "Unknown Network"}
                                    </p>
                                    {spg.artist && (
                                        <p className="text-xs text-pink-400 mt-2">
                                            🎤 {spg.artist.name}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 font-mono mt-2">
                                        {spg.address.slice(0, 6)}...
                                        {spg.address.slice(-4)}
                                    </p>
                                    {form.spgCollection?.id === spg.id && (
                                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
                                            선택됨
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(0)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!form.spgCollection}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.spgCollection
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: 수량 입력 */}
            {step === 2 && (
                <div className="w-full max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        몇 개를 민팅할까요?
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        민팅할 NFT의 수량을 입력하세요
                    </p>

                    <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-8 border-4 border-purple-800/50">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">🎯</div>
                            <label className="block text-purple-300 mb-4 font-bold text-lg">
                                민팅 수량
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={form.quantity}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        quantity: parseInt(e.target.value) || 1,
                                    }))
                                }
                                className="w-48 px-6 py-4 text-4xl font-bold text-center rounded-xl bg-blue-900/30 text-white border-2 border-purple-500/50 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all"
                            />
                            <p className="text-xs text-blue-400 mt-2">
                                1 ~ 100개까지 민팅 가능
                            </p>
                        </div>

                        <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-700/50">
                            <h4 className="text-purple-400 font-bold mb-2">
                                💡 팁
                            </h4>
                            <ul className="text-sm text-blue-300 space-y-1">
                                <li>
                                    • 대량 민팅 시 가스비가 증가할 수 있습니다
                                </li>
                                <li>
                                    • 각 NFT는 고유한 Token ID를 부여받습니다
                                </li>
                                <li>• 민팅 후 즉시 소유권이 이전됩니다</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={form.quantity < 1 || form.quantity > 100}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.quantity >= 1 && form.quantity <= 100
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: NFT 메타데이터 선택 */}
            {step === 3 && (
                <div className="w-full max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        NFT 메타데이터를 선택하세요
                    </h2>
                    <p className="text-blue-300 text-center mb-4">
                        각 NFT의 이름, 설명, 이미지 등을 정의합니다
                    </p>

                    {/* 메타데이터 재사용 옵션 */}
                    <div className="bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-700/50 max-w-2xl mx-auto">
                        <label className="flex items-center gap-3 text-blue-200 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.reuseNFTMetadata}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        reuseNFTMetadata: e.target.checked,
                                    }))
                                }
                                className="w-5 h-5 rounded border-blue-600 bg-blue-900/50 focus:ring-blue-500"
                            />
                            <span className="font-semibold">
                                동일한 메타데이터 재사용
                            </span>
                        </label>
                        <p className="text-xs text-blue-400 mt-1 ml-8">
                            {form.reuseNFTMetadata
                                ? "모든 NFT가 동일한 메타데이터를 사용합니다 (가스비 절약)"
                                : "각 NFT마다 고유한 메타데이터가 생성됩니다 (#1, #2...)"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-h-[400px] overflow-y-auto p-2">
                        {isLoadingNFTMetadata ? (
                            <div className="col-span-full text-center text-blue-200">
                                메타데이터 불러오는 중...
                            </div>
                        ) : !nftMetadataList || nftMetadataList.length === 0 ? (
                            <div className="col-span-full text-center text-blue-200">
                                등록된 NFT 메타데이터가 없습니다.
                            </div>
                        ) : (
                            <>
                                {nftMetadataList.map((meta) => {
                                    const metadata = cachedMetadata[meta.url];
                                    return (
                                        <button
                                            key={meta.id}
                                            onClick={() =>
                                                setForm((f) => ({
                                                    ...f,
                                                    nftMetadata: meta,
                                                }))
                                            }
                                            className={`
                                            relative group rounded-2xl shadow-xl border-4 overflow-hidden
                                            transition-all duration-300 transform
                                            ${
                                                form.nftMetadata?.id === meta.id
                                                    ? "border-orange-400 scale-105 ring-4 ring-orange-300/30"
                                                    : "border-blue-800 hover:scale-105 hover:border-orange-500/50"
                                            }
                                        `}
                                        >
                                            <div className="aspect-square bg-gradient-to-br from-orange-900/20 to-red-900/20 p-4 flex items-center justify-center">
                                                {metadata?.image ? (
                                                    <img
                                                        src={metadata.image}
                                                        alt={metadata.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <FaImages className="text-5xl text-orange-400" />
                                                )}
                                            </div>
                                            <div className="p-4 bg-[#181c2b]/90">
                                                <p className="text-orange-200 font-mono text-xs mb-2 truncate">
                                                    {metadata?.name}
                                                </p>
                                                <p className="text-blue-300 text-sm">
                                                    ERC721 메타데이터
                                                </p>
                                            </div>
                                            {form.nftMetadata?.id ===
                                                meta.id && (
                                                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
                                                    선택됨
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                                <button
                                    className="rounded-2xl border-4 border-dashed border-orange-500/50 hover:border-orange-400 bg-orange-900/10 hover:bg-orange-900/20 transition-all duration-300 aspect-square flex flex-col items-center justify-center group"
                                    onClick={() => {
                                        toast.info(
                                            "메타데이터 관리 페이지로 이동하세요"
                                        );
                                    }}
                                >
                                    <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                                        ➕
                                    </div>
                                    <p className="text-orange-400 font-bold">
                                        새 메타데이터
                                    </p>
                                    <p className="text-orange-300 text-sm">
                                        등록하기
                                    </p>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(2)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(4)}
                            disabled={!form.nftMetadata}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.nftMetadata
                                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: IP Asset 메타데이터 선택 (선택사항) */}
            {step === 4 && (
                <div className="w-full max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        IP Asset 메타데이터 (선택사항)
                    </h2>
                    <p className="text-blue-300 text-center mb-4">
                        NFT를 IP Asset으로 등록하려면 메타데이터를 선택하세요
                    </p>
                    <p className="text-yellow-400 text-center mb-8 text-sm">
                        ⚡ 건너뛰면 NFT만 민팅됩니다
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-h-[400px] overflow-y-auto p-2">
                        {isLoadingIPAssetMetadata ? (
                            <div className="col-span-full text-center text-blue-200">
                                메타데이터 불러오는 중...
                            </div>
                        ) : !ipAssetMetadataList ||
                          ipAssetMetadataList.length === 0 ? (
                            <div className="col-span-full text-center text-blue-200">
                                등록된 IP Asset 메타데이터가 없습니다.
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            ipAssetMetadata: null,
                                            mintOption: "mint-only",
                                        }))
                                    }
                                    className={`
                                        relative group rounded-2xl shadow-xl border-4
                                        transition-all duration-300 transform h-64
                                        ${
                                            !form.ipAssetMetadata &&
                                            form.mintOption === "mint-only"
                                                ? "border-gray-400 bg-gradient-to-br from-gray-800/50 to-gray-900/50 scale-105 ring-4 ring-gray-300/30"
                                                : "border-gray-700 bg-gray-900/30 hover:scale-105 hover:border-gray-500/50"
                                        }
                                    `}
                                >
                                    <div className="h-full flex flex-col items-center justify-center p-6">
                                        <div className="text-5xl mb-3">⏭️</div>
                                        <p className="text-gray-300 font-bold text-lg">
                                            건너뛰기
                                        </p>
                                        <p className="text-gray-400 text-sm text-center mt-2">
                                            NFT만 민팅하고
                                            <br />
                                            IP 등록은 나중에
                                        </p>
                                    </div>
                                </button>

                                {ipAssetMetadataList.map((meta) => (
                                    <button
                                        key={meta.id}
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                ipAssetMetadata: meta,
                                                mintOption: "mint-and-register",
                                            }))
                                        }
                                        className={`
                                            relative group rounded-2xl shadow-xl border-4 overflow-hidden
                                            transition-all duration-300 transform
                                            ${
                                                form.ipAssetMetadata?.id ===
                                                meta.id
                                                    ? "border-green-400 scale-105 ring-4 ring-green-300/30"
                                                    : "border-blue-800 hover:scale-105 hover:border-green-500/50"
                                            }
                                        `}
                                    >
                                        <div className="aspect-square bg-gradient-to-br from-green-900/20 to-blue-900/20 p-4 flex items-center justify-center">
                                            <div className="text-5xl">📄</div>
                                        </div>
                                        <div className="p-4 bg-[#181c2b]/90">
                                            <p className="text-green-200 font-mono text-xs mb-2 truncate">
                                                {meta.cid}
                                            </p>
                                            <p className="text-blue-300 text-sm">
                                                IP Asset 메타데이터
                                            </p>
                                        </div>
                                        {form.ipAssetMetadata?.id ===
                                            meta.id && (
                                            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
                                                선택됨
                                            </div>
                                        )}
                                    </button>
                                ))}
                                <button
                                    className="rounded-2xl border-4 border-dashed border-green-500/50 hover:border-green-400 bg-green-900/10 hover:bg-green-900/20 transition-all duration-300 aspect-square flex flex-col items-center justify-center group"
                                    onClick={() => {
                                        toast.info(
                                            "메타데이터 관리 페이지로 이동하세요"
                                        );
                                    }}
                                >
                                    <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                                        ➕
                                    </div>
                                    <p className="text-green-400 font-bold">
                                        새 메타데이터
                                    </p>
                                    <p className="text-green-300 text-sm">
                                        등록하기
                                    </p>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(3)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(5)}
                            className={`px-6 py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-green-500 to-blue-500 text-white hover:scale-105`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: 민팅 옵션 확인 */}
            {step === 5 && (
                <div className="w-full max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        민팅 옵션을 확인하세요
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        선택한 옵션에 따라 민팅 프로세스가 진행됩니다
                    </p>

                    <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-8 border-4 border-cyan-800/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <button
                                onClick={() =>
                                    setForm((f) => ({
                                        ...f,
                                        mintOption: "mint-only",
                                    }))
                                }
                                className={`
                                    p-6 rounded-xl border-4 transition-all duration-300
                                    ${
                                        form.mintOption === "mint-only"
                                            ? "border-cyan-400 bg-cyan-900/30 scale-105"
                                            : "border-gray-700 bg-gray-900/20 hover:border-gray-600"
                                    }
                                `}
                            >
                                <div className="text-5xl mb-3">🎨</div>
                                <h3 className="text-xl font-bold text-cyan-300 mb-2">
                                    NFT만 민팅
                                </h3>
                                <p className="text-sm text-blue-300">
                                    • 빠른 민팅 프로세스
                                    <br />
                                    • 낮은 가스비
                                    <br />• 나중에 IP 등록 가능
                                </p>
                                {form.mintOption === "mint-only" && (
                                    <div className="mt-4 text-cyan-400 font-bold">
                                        ✓ 선택됨
                                    </div>
                                )}
                            </button>

                            <button
                                onClick={() =>
                                    setForm((f) => ({
                                        ...f,
                                        mintOption: "mint-and-register",
                                    }))
                                }
                                disabled={!form.ipAssetMetadata}
                                className={`
                                    p-6 rounded-xl border-4 transition-all duration-300
                                    ${
                                        !form.ipAssetMetadata
                                            ? "border-gray-800 bg-gray-900/20 cursor-not-allowed opacity-50"
                                            : form.mintOption ===
                                              "mint-and-register"
                                            ? "border-purple-400 bg-purple-900/30 scale-105"
                                            : "border-gray-700 bg-gray-900/20 hover:border-gray-600"
                                    }
                                `}
                            >
                                <div className="text-5xl mb-3">🚀</div>
                                <h3 className="text-xl font-bold text-purple-300 mb-2">
                                    NFT + IP Asset
                                </h3>
                                <p className="text-sm text-blue-300">
                                    • NFT 민팅 + IP 등록
                                    <br />
                                    • 원스톱 프로세스
                                    <br />• 즉시 라이선스 가능
                                </p>
                                {!form.ipAssetMetadata && (
                                    <p className="text-xs text-yellow-400 mt-2">
                                        IP 메타데이터 필요
                                    </p>
                                )}
                                {form.mintOption === "mint-and-register" &&
                                    form.ipAssetMetadata && (
                                        <div className="mt-4 text-purple-400 font-bold">
                                            ✓ 선택됨
                                        </div>
                                    )}
                            </button>
                        </div>

                        <div className="mt-8 bg-blue-900/20 rounded-xl p-4 border border-blue-700/50">
                            <h4 className="text-blue-400 font-bold mb-2">
                                📊 민팅 요약
                            </h4>
                            <ul className="text-sm text-blue-300 space-y-1">
                                <li>
                                    • 옵션:{" "}
                                    <span className="text-cyan-300 font-bold">
                                        {form.mintOption === "mint-only"
                                            ? "NFT만 민팅"
                                            : "NFT + IP Asset 등록"}
                                    </span>
                                </li>
                                <li>
                                    • 예상 소요 시간:{" "}
                                    {form.mintOption === "mint-only"
                                        ? "1-2분"
                                        : "2-5분"}
                                </li>
                                <li>
                                    • 가스비:{" "}
                                    {form.mintOption === "mint-only"
                                        ? "표준"
                                        : "표준 + IP 등록비"}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(4)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(6)}
                            className="px-6 py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:scale-105"
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 6: 최종 확인 */}
            {step === 6 && (
                <div className="w-full max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        민팅 정보를 확인하세요
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        아래 정보로 NFT가 민팅됩니다
                    </p>

                    <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-8 border-4 border-pink-500/30 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-700/50">
                                <h3 className="text-purple-400 font-bold mb-2">
                                    컬렉션
                                </h3>
                                <p className="text-white font-bold">
                                    {form.spgCollection?.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                    {form.spgCollection?.symbol}
                                </p>
                            </div>
                            <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-700/50">
                                <h3 className="text-orange-400 font-bold mb-2">
                                    수량
                                </h3>
                                <p className="text-white font-bold text-2xl">
                                    {form.quantity}개
                                </p>
                            </div>
                            <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/50">
                                <h3 className="text-blue-400 font-bold mb-2">
                                    NFT 메타데이터
                                </h3>
                                <p className="text-white font-mono text-xs truncate">
                                    {form.nftMetadata?.cid}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {form.reuseNFTMetadata
                                        ? "동일 메타데이터 재사용"
                                        : "개별 메타데이터 생성"}
                                </p>
                            </div>
                            <div className="bg-green-900/20 rounded-xl p-4 border border-green-700/50">
                                <h3 className="text-green-400 font-bold mb-2">
                                    민팅 옵션
                                </h3>
                                <p className="text-white font-bold">
                                    {form.mintOption === "mint-only"
                                        ? "NFT만 민팅"
                                        : "NFT + IP Asset"}
                                </p>
                                {form.ipAssetMetadata && (
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                        IP: {form.ipAssetMetadata.cid}
                                    </p>
                                )}
                            </div>
                            <div className="bg-pink-900/20 rounded-xl p-4 border border-pink-700/50 md:col-span-2">
                                <h3 className="text-pink-400 font-bold mb-2">
                                    네트워크
                                </h3>
                                <p className="text-white">
                                    {Array.isArray(storyNetworks)
                                        ? storyNetworks?.find(
                                              (n: any) =>
                                                  n.id ===
                                                  form.spgCollection?.networkId
                                          )?.name
                                        : (storyNetworks as any)?.name ||
                                          "Unknown Network"}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-red-300">
                                {error}
                            </div>
                        )}

                        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
                            <h4 className="text-yellow-400 font-bold mb-2">
                                ⚠️ 민팅 전 확인사항
                            </h4>
                            <ul className="text-sm text-yellow-300 space-y-1">
                                <li>
                                    • 지갑에 충분한 잔액이 있는지 확인하세요
                                </li>
                                <li>
                                    • 민팅된 NFT는 즉시 블록체인에 기록됩니다
                                </li>
                                <li>
                                    • 트랜잭션 완료까지 페이지를 닫지 마세요
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(5)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(7)}
                            className="px-8 py-4 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                        >
                            🚀 민팅 시작하기
                        </button>
                    </div>
                </div>
            )}

            {/* Step 7: 민팅 진행 */}
            {step === 7 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 bg-[#181c2b] rounded-full flex items-center justify-center">
                                <span className="text-4xl font-bold text-white">
                                    {mintProgress}%
                                </span>
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            민팅 진행 중...
                        </h2>
                        <p className="text-xl text-blue-300 mb-4">
                            {isSubmitting
                                ? "트랜잭션을 처리하고 있습니다"
                                : "민팅을 시작하려면 확인을 눌러주세요"}
                        </p>
                        {mintProgress > 0 && (
                            <div className="max-w-md mx-auto bg-blue-900/20 rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{ width: `${mintProgress}%` }}
                                />
                            </div>
                        )}
                    </div>

                    {!isSubmitting && mintProgress === 0 && (
                        <button
                            onClick={handleMint}
                            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-full shadow-2xl hover:scale-105 transition-all duration-300 hover:shadow-purple-500/50"
                        >
                            민팅 시작하기
                        </button>
                    )}

                    {error && (
                        <div className="mt-6 bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-red-300 max-w-md mx-auto">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Step 8: 성공 화면 */}
            {step === 8 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="text-8xl mb-4 animate-bounce">🎉</div>
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            민팅 성공!
                        </h1>
                        <p className="text-xl text-green-300 mb-8">
                            NFT가 성공적으로 민팅되었습니다
                        </p>
                        {successData && (
                            <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6 mb-8 text-left max-w-2xl mx-auto">
                                <h3 className="text-green-400 font-bold mb-4">
                                    민팅 결과
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p className="text-blue-300">
                                        <span className="text-gray-400">
                                            수량:
                                        </span>
                                        <span className="text-white font-bold ml-2">
                                            {form.quantity}개
                                        </span>
                                    </p>
                                    <p className="text-blue-300">
                                        <span className="text-gray-400">
                                            트랜잭션:
                                        </span>
                                        <span className="text-white font-mono ml-2 text-xs">
                                            {successData.txHash?.slice(0, 10)}
                                            ...{successData.txHash?.slice(-8)}
                                        </span>
                                    </p>
                                    {successData.tokenIds && (
                                        <p className="text-blue-300">
                                            <span className="text-gray-400">
                                                Token IDs:
                                            </span>
                                            <span className="text-white font-bold ml-2">
                                                #
                                                {successData.tokenIds[0]?.toString()}
                                                {form.quantity > 1 &&
                                                    ` ~ #${successData.tokenIds[
                                                        successData.tokenIds
                                                            .length - 1
                                                    ]?.toString()}`}
                                            </span>
                                        </p>
                                    )}
                                    {form.mintOption === "mint-and-register" &&
                                        successData.ipAssets && (
                                            <p className="text-blue-300">
                                                <span className="text-gray-400">
                                                    IP Assets:
                                                </span>
                                                <span className="text-white font-bold ml-2">
                                                    {
                                                        successData.ipAssets
                                                            .length
                                                    }
                                                    개 등록됨
                                                </span>
                                            </p>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setStep(0);
                                setForm({
                                    spgCollection: null,
                                    quantity: 1,
                                    nftMetadata: null,
                                    ipAssetMetadata: null,
                                    mintOption: "mint-only",
                                    reuseNFTMetadata: true,
                                });
                                setSuccessData(null);
                                setError("");
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:scale-105 transition-all"
                        >
                            새로운 민팅
                        </button>
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                        >
                            대시보드로
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
