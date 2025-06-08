/// components/admin/story/Admin.Story.SPG.tsx

import { useSPG } from "@/app/story/spg/hooks";
import { useStoryNetwork } from "@/app/story/network/hooks";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { useMetadata } from "@/app/story/metadata/hooks";
import { useArtistsGet } from "@/app/hooks/useArtists";
import { useToast } from "@/app/hooks/useToast";
import { useTBA } from "@/app/story/tba/hooks";
import { useEffect, useState } from "react";
import { TbTopologyStar3 } from "react-icons/tb";
import { SiEthereum } from "react-icons/si";
import { FaShieldAlt, FaCube } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { BlockchainNetwork, ipfs, TBAContractType } from "@prisma/client";

export default function AdminStorySPG({ onBack }: { onBack?: () => void }) {
    const toast = useToast();
    const { data: session } = useSession();
    const userId = session?.user?.id || "";

    // 폼 상태
    const [form, setForm] = useState<{
        name: string;
        symbol: string;
        networkId: string;
        walletAddress: string;
        contractAddress: string;
        tbaRegistry: string;
        tbaImplementation: string;
        selectedMetadata: ipfs | null;
        artistId: string;
    }>({
        name: "",
        symbol: "",
        networkId: "",
        walletAddress: "",
        contractAddress: "",
        tbaRegistry: "",
        tbaImplementation: "",
        selectedMetadata: null,
        artistId: "",
    });

    const {
        storyNetworks,
        isLoadingStoryNetworks,
        isErrorStoryNetworks,
        refetchStoryNetworks,
    } = useStoryNetwork({
        getStoryNetworksInput: {
            isActive: true,
        },
    });

    const {
        escrowWallets,
        isLoadingEscrowWallets,
        isErrorEscrowWallets,
        refetchEscrowWallets,

        fetchEscrowWalletsBalanceAsync,
        isPendingFetchEscrowWalletsBalance,
    } = useEscrowWallets({
        getEscrowWalletsInput: {
            isActive: true,
        },
    });

    const { tbaContracts, isTBAContractsLoading, tbaAddresses } = useTBA({
        getTBAContractsInput: {
            networkId: form.networkId || undefined,
            isActive: true,
        },
        getTBAAddressesInput: {
            networkId: form.networkId || "default",
        },
    });

    const {
        getSPGContractsData,
        getSPGContractsIsLoading,
        getSPGContractsIsError,
        getSPGContractsError,
        getSPGContractsRefetch,

        getSPGsData,
        getSPGsIsLoading,
        getSPGsIsError,
        getSPGsError,
        getSPGsRefetch,

        deploySPGNFTFactoryMutation,
        deploySPGNFTFactoryMutationAsync,
        deploySPGNFTFactoryMutationIsPending,
        deploySPGNFTFactoryMutationIsError,

        createSPGMutation,
        createSPGMutationAsync,
        createSPGMutationIsPending,
        createSPGMutationIsError,

        updateSPGMutation,
        updateSPGMutationAsync,
        updateSPGMutationIsPending,
        updateSPGMutationIsError,

        deleteSPGMutation,
        deleteSPGMutationAsync,
        deleteSPGMutationIsPending,
        deleteSPGMutationIsError,
    } = useSPG({
        getSPGContractsInput: form.networkId
            ? {
                  networkId: form.networkId,
              }
            : undefined,
        getSPGsInput: {
            networkId: form.networkId,
        },
    });

    const {
        metadataList,
        isLoadingMetadataList,
        isErrorMetadataList,
        refetchMetadataList,
    } = useMetadata({
        getMetadataListInput: {
            type: "spg-nft-collection-metadata",
        },
    });

    const { artists, isLoading: isArtistsLoading } = useArtistsGet({
        getArtistsInput: {},
    });

    const [step, setStep] = useState<number>(0);
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [walletBalances, setWalletBalances] = useState<
        Record<string, string>
    >({});

    useEffect(() => {
        if (
            step === 2 &&
            form.networkId &&
            escrowWallets &&
            escrowWallets.length > 0
        ) {
            const fetchAllBalances = async () => {
                const result = await fetchEscrowWalletsBalanceAsync({
                    networkId: form.networkId,
                    addresses: escrowWallets.map((w) => w.address),
                });
                if (result) {
                    setWalletBalances(
                        result.reduce(
                            (acc, cur) => ({
                                ...acc,
                                [cur.address]: cur.balance,
                            }),
                            {} as Record<string, string>
                        )
                    );
                }
            };
            fetchAllBalances();
        }
    }, [step, form.networkId, escrowWallets]);

    // TBA 주소 자동 설정
    useEffect(() => {
        if (tbaAddresses && form.networkId) {
            if (tbaAddresses.registry) {
                setForm((f) => ({
                    ...f,
                    tbaRegistry: tbaAddresses.registry || "",
                }));
            }
            if (tbaAddresses.implementation) {
                setForm((f) => ({
                    ...f,
                    tbaImplementation: tbaAddresses.implementation || "",
                }));
            }
        }
    }, [tbaAddresses, form.networkId]);

    // 배포 핸들러 - TBA 주소들을 직접 전달하도록 수정
    const handleDeploy = async () => {
        if (
            !form.networkId ||
            !form.walletAddress ||
            !form.contractAddress ||
            !form.tbaRegistry ||
            !form.tbaImplementation ||
            !form.selectedMetadata ||
            !form.artistId ||
            !form.name ||
            !form.symbol
        ) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const result = await createSPGMutationAsync({
                userId,
                networkId: form.networkId,
                walletAddress: form.walletAddress,
                contractAddress: form.contractAddress,
                name: form.name,
                symbol: form.symbol,
                selectedMetadata: form.selectedMetadata,
                artistId: form.artistId,
                tbaRegistry: form.tbaRegistry,
                tbaImplementation: form.tbaImplementation,
            });

            toast.success("SPG가 성공적으로 배포되었습니다!");
            setSuccessMsg(`Contract Address: ${result.address}`);
            setStep(9); // 성공 화면으로 이동
            getSPGsRefetch();
        } catch (err: any) {
            setError(err?.message || "배포 중 오류가 발생했습니다.");
            toast.error("배포 실패");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Progress Bar Component
    const ProgressBar = () => {
        const steps = [
            "시작",
            "네트워크",
            "지갑",
            "컨트랙트",
            "TBA",
            "메타데이터",
            "아티스트",
            "정보 입력",
            "확인",
        ];
        return (
            <div className="w-full max-w-4xl mx-auto mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-blue-900/30 -translate-y-1/2"></div>
                    <div
                        className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 -translate-y-1/2 transition-all duration-500"
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

    return (
        <div className="relative w-full flex flex-col items-center justify-start min-h-[80vh]">
            {/* 배경 아이콘 */}
            <TbTopologyStar3 className="absolute text-[14rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none z-0" />
            <SiEthereum className="absolute text-[7rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none z-0" />

            {/* 상단 네비게이션 - 관리 화면일 때만 */}
            {step === -1 && (
                <>
                    <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                        <button
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                            onClick={onBack}
                            title="뒤로가기"
                        >
                            <span className="hidden md:inline">뒤로가기</span>
                        </button>
                        <h2 className="text-2xl font-bold text-white">
                            SPG NFT Collection 관리
                        </h2>
                    </div>

                    {/* SPG 컬렉션 목록 */}
                    <div className="w-full max-w-4xl mb-10 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] border border-blue-900/30">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-blue-400">
                                내 SPG 컬렉션 목록
                            </h3>
                            <button
                                onClick={() => setStep(0)}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:scale-105 transition-all shadow-lg"
                            >
                                + 새 SPG 배포
                            </button>
                        </div>
                        {getSPGsIsLoading ? (
                            <div className="text-blue-200 py-8 text-center">
                                불러오는 중...
                            </div>
                        ) : getSPGsIsError ? (
                            <div className="text-red-400 py-8 text-center">
                                {getSPGsError?.message ||
                                    "목록을 불러오지 못했습니다."}
                            </div>
                        ) : !getSPGsData || getSPGsData.length === 0 ? (
                            <div className="text-blue-200 py-8 text-center">
                                아직 등록된 컬렉션이 없습니다.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl shadow-lg bg-[#23243a]/60">
                                <table className="min-w-full text-sm text-blue-100">
                                    <thead>
                                        <tr className="bg-[#23243a]/80 text-blue-300 divide-x divide-blue-900/30">
                                            <th className="px-4 py-3 text-center">
                                                이름
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                심볼
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                네트워크
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                아티스트
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                컨트랙트 주소
                                            </th>
                                            <th className="px-4 py-3 text-center">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getSPGsData.map((spg) => (
                                            <tr
                                                key={spg.address}
                                                className="border-b border-blue-900/30 hover:bg-blue-900/10 transition divide-x divide-blue-900/30"
                                            >
                                                <td className="px-4 py-2 text-center">
                                                    {spg.name}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {spg.symbol}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {Array.isArray(
                                                        storyNetworks
                                                    ) &&
                                                        storyNetworks?.find(
                                                            (n: any) =>
                                                                n.id ===
                                                                spg.networkId
                                                        )?.name}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {spg.artist?.name || "-"}
                                                </td>
                                                <td className="px-4 py-2 font-mono max-w-[180px] truncate text-center">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(
                                                                spg.address
                                                            );
                                                            toast.success(
                                                                "주소가 복사되었습니다"
                                                            );
                                                        }}
                                                        className="hover:text-cyan-300 transition-colors truncate"
                                                        title="클릭하여 복사"
                                                    >
                                                        {spg.address}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2 flex gap-2 justify-center">
                                                    <button
                                                        className="p-2 rounded-xl hover:bg-red-900/30 text-red-400 hover:text-red-500 transition shadow"
                                                        onClick={() =>
                                                            deleteSPGMutationAsync(
                                                                {
                                                                    address:
                                                                        spg.address,
                                                                }
                                                            )
                                                        }
                                                        disabled={
                                                            deleteSPGMutationIsPending
                                                        }
                                                        title="삭제"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Progress Bar */}
            {step > 0 && step < 9 && <ProgressBar />}

            {/* Step 0: 인트로 */}
            {step === 0 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        <TbTopologyStar3 className="text-8xl text-cyan-400 mx-auto mb-4" />
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            새로운 SPG 배포
                        </h1>
                        <p className="text-xl text-blue-200 mb-2">
                            Story Protocol Gateway NFT Collection
                        </p>
                        <p className="text-blue-300 mb-8 max-w-2xl mx-auto">
                            SPG는 Story Protocol의 핵심 구성요소로, NFT 발행과
                            IP 자산 등록을 하나의 트랜잭션으로 처리할 수 있게
                            해주는 스마트 컨트랙트입니다. K-pop 아티스트의
                            디지털 자산을 Web3 세계에 안전하게 등록하고
                            관리하세요.
                        </p>
                    </div>
                    <button
                        onClick={() => setStep(1)}
                        className="px-12 py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-xl rounded-full shadow-2xl hover:scale-105 transition-all duration-300 hover:shadow-cyan-500/50"
                    >
                        시작하기 →
                    </button>
                    <div className="mt-8">
                        <button
                            onClick={() => setStep(-1)}
                            className="text-blue-400 hover:text-cyan-300 transition-colors"
                        >
                            SPG 컬렉션 목록 보기
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1: 네트워크 선택 */}
            {step === 1 && (
                <div className="w-full max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        어떤 네트워크에 배포할까요?
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        SPG를 배포할 블록체인 네트워크를 선택하세요
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {isLoadingStoryNetworks ? (
                            <div className="col-span-full text-center text-blue-200">
                                네트워크 불러오는 중...
                            </div>
                        ) : (
                            Array.isArray(storyNetworks) &&
                            storyNetworks?.map((net) => (
                                <button
                                    key={net.id}
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            networkId: net.id,
                                        }))
                                    }
                                    className={`
                                        relative group p-6 rounded-2xl shadow-xl border-4
                                        transition-all duration-300 transform
                                        ${
                                            form.networkId === net.id
                                                ? "border-cyan-400 bg-gradient-to-br from-cyan-900/50 via-blue-900/50 to-indigo-900/50 scale-105 ring-4 ring-cyan-300/30"
                                                : "border-blue-800 bg-[#181c2b]/80 hover:scale-105 hover:border-cyan-500/50"
                                        }
                                    `}
                                >
                                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                                        {net.isTestnet ? "🧪" : "🌐"}
                                    </div>
                                    <h3 className="font-extrabold text-xl text-cyan-200 mb-1">
                                        {net.name}
                                    </h3>
                                    <p className="text-sm text-blue-300 mb-2">
                                        {net.rpcUrl}
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-xs">
                                        <span
                                            className={`px-2 py-1 rounded-full ${
                                                net.isTestnet
                                                    ? "bg-yellow-500/20 text-yellow-300"
                                                    : "bg-green-500/20 text-green-300"
                                            }`}
                                        >
                                            {net.isTestnet
                                                ? "Testnet"
                                                : "Mainnet"}
                                        </span>
                                        {net.isActive && (
                                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    {form.networkId === net.id && (
                                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-cyan-400 to-purple-400 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
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
                            disabled={!form.networkId}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.networkId
                                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: 지갑 선택 */}
            {step === 2 && (
                <div className="w-full max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        어떤 지갑으로 배포할까요?
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        SPG 컬렉션의 소유자가 될 지갑을 선택하세요
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {isLoadingEscrowWallets ? (
                            <div className="col-span-full text-center text-blue-200">
                                지갑 불러오는 중...
                            </div>
                        ) : (
                            escrowWallets?.map((wallet) => (
                                <button
                                    key={wallet.address}
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            walletAddress: wallet.address,
                                        }))
                                    }
                                    className={`
                                        relative group p-6 rounded-2xl shadow-xl border-4
                                        transition-all duration-300 transform
                                        ${
                                            form.walletAddress ===
                                            wallet.address
                                                ? "border-purple-400 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-pink-900/50 scale-105 ring-4 ring-purple-300/30"
                                                : "border-blue-800 bg-[#181c2b]/80 hover:scale-105 hover:border-purple-500/50"
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                            W
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-lg text-purple-200">
                                                Wallet
                                            </h3>
                                            <p className="text-sm text-blue-300 font-mono">
                                                {wallet.address.slice(0, 10)}...
                                                {wallet.address.slice(-8)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-blue-400">
                                            잔액:
                                        </span>
                                        <span className="text-cyan-300 font-bold">
                                            {isPendingFetchEscrowWalletsBalance ? (
                                                <span className="animate-pulse">
                                                    ...
                                                </span>
                                            ) : (
                                                <span>
                                                    {String(
                                                        walletBalances[
                                                            wallet.address
                                                        ] || "0"
                                                    )}{" "}
                                                    IP
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {wallet.isActive && (
                                        <div className="mt-2 text-center">
                                            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                                                Active
                                            </span>
                                        </div>
                                    )}
                                    {form.walletAddress === wallet.address && (
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
                            onClick={() => setStep(1)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={!form.walletAddress}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.walletAddress
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: 컨트랙트 선택 */}
            {step === 3 && (
                <div className="w-full max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        어떤 컨트랙트를 사용할까요?
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        기존 컨트랙트를 선택하거나 새로운 컨트랙트를 배포하세요
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {getSPGContractsIsLoading ? (
                            <div className="col-span-full text-center text-blue-200">
                                컨트랙트 불러오는 중...
                            </div>
                        ) : (
                            <>
                                {/* 기존 컨트랙트 목록 */}
                                {getSPGContractsData?.map((contract) => (
                                    <button
                                        key={contract.id}
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                contractAddress:
                                                    contract.address,
                                            }))
                                        }
                                        className={`
                                            relative group p-6 rounded-2xl shadow-xl border-4
                                            transition-all duration-300 transform
                                            ${
                                                form.contractAddress ===
                                                contract.address
                                                    ? "border-orange-400 bg-gradient-to-br from-orange-900/50 via-yellow-900/50 to-red-900/50 scale-105 ring-4 ring-orange-300/30"
                                                    : "border-blue-800 bg-[#181c2b]/80 hover:scale-105 hover:border-orange-500/50"
                                            }
                                        `}
                                    >
                                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                                            📝
                                        </div>
                                        <h3 className="font-bold text-orange-200 mb-2">
                                            기존 컨트랙트
                                        </h3>
                                        <p className="text-xs text-blue-300 font-mono truncate">
                                            {contract.address.slice(0, 8)}...
                                            {contract.address.slice(-6)}
                                        </p>
                                        <p className="text-xs text-blue-400 mt-2">
                                            네트워크:{" "}
                                            {Array.isArray(storyNetworks) &&
                                                storyNetworks?.find(
                                                    (n: any) =>
                                                        n.id ===
                                                        contract.networkId
                                                )?.name}
                                        </p>
                                        {form.contractAddress ===
                                            contract.address && (
                                            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
                                                선택됨
                                            </div>
                                        )}
                                    </button>
                                ))}

                                {/* 새 컨트랙트 배포 버튼 */}
                                <button
                                    onClick={async () => {
                                        try {
                                            const result =
                                                await deploySPGNFTFactoryMutationAsync(
                                                    {
                                                        userId,
                                                        networkId:
                                                            form.networkId,
                                                        walletAddress:
                                                            form.walletAddress,
                                                    }
                                                );

                                            setForm((f) => ({
                                                ...f,
                                                contractAddress: result.address,
                                            }));

                                            toast.success(
                                                "새 컨트랙트가 배포되었습니다!"
                                            );
                                            getSPGContractsRefetch();
                                        } catch (err: any) {
                                            toast.error(
                                                err?.message ||
                                                    "컨트랙트 배포 실패"
                                            );
                                        }
                                    }}
                                    disabled={
                                        deploySPGNFTFactoryMutationIsPending
                                    }
                                    className="rounded-2xl border-4 border-dashed border-orange-500/50 hover:border-orange-400 bg-orange-900/10 hover:bg-orange-900/20 transition-all duration-300 aspect-square flex flex-col items-center justify-center group"
                                >
                                    {deploySPGNFTFactoryMutationIsPending ? (
                                        <>
                                            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3"></div>
                                            <p className="text-orange-400 font-bold">
                                                배포 중...
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                                                🚀
                                            </div>
                                            <p className="text-orange-400 font-bold">
                                                새 컨트랙트
                                            </p>
                                            <p className="text-orange-300 text-sm">
                                                배포하기
                                            </p>
                                        </>
                                    )}
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
                            disabled={!form.contractAddress}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.contractAddress
                                    ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: TBA 선택 (새로 추가) */}
            {step === 4 && (
                <div className="w-full max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        Token Bound Account 설정
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        NFT와 연결될 TBA 컨트랙트를 선택하세요
                    </p>

                    {isTBAContractsLoading ? (
                        <div className="text-center text-blue-200 py-8">
                            TBA 컨트랙트 확인 중...
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* TBA Registry 선택 */}
                            <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-6 border border-blue-800/30">
                                <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                                    <FaShieldAlt /> TBA Registry
                                </h3>
                                {tbaContracts?.filter(
                                    (c) =>
                                        c.type === TBAContractType.REGISTRY &&
                                        c.networkId === form.networkId
                                ).length === 0 ? (
                                    <p className="text-blue-300 text-center py-4">
                                        이 네트워크에 배포된 Registry가
                                        없습니다.
                                        <button
                                            onClick={() => {
                                                toast.info(
                                                    "TBA 관리 페이지에서 Registry를 먼저 배포해주세요."
                                                );
                                            }}
                                            className="block mx-auto mt-2 text-cyan-400 hover:text-cyan-300"
                                        >
                                            TBA 배포하러 가기 →
                                        </button>
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {tbaContracts
                                            ?.filter(
                                                (c) =>
                                                    c.type ===
                                                        TBAContractType.REGISTRY &&
                                                    c.networkId ===
                                                        form.networkId
                                            )
                                            .map((contract) => (
                                                <button
                                                    key={contract.id}
                                                    onClick={() =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            tbaRegistry:
                                                                contract.address,
                                                        }))
                                                    }
                                                    className={`
                                                        relative p-4 rounded-xl border-2 transition-all
                                                        ${
                                                            form.tbaRegistry ===
                                                            contract.address
                                                                ? "border-cyan-400 bg-cyan-900/30"
                                                                : "border-blue-700/50 bg-blue-900/20 hover:border-cyan-500/50"
                                                        }
                                                    `}
                                                >
                                                    <p className="text-white font-semibold">
                                                        {contract.name ||
                                                            "Registry"}
                                                    </p>
                                                    <p className="text-xs text-blue-300 font-mono mt-1">
                                                        {contract.address.slice(
                                                            0,
                                                            10
                                                        )}
                                                        ...
                                                        {contract.address.slice(
                                                            -8
                                                        )}
                                                    </p>
                                                    {form.tbaRegistry ===
                                                        contract.address && (
                                                        <div className="absolute top-2 right-2">
                                                            <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                                                                <span className="text-xs text-black">
                                                                    ✓
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* TBA Implementation 선택 */}
                            <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-6 border border-purple-800/30">
                                <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                                    <FaCube /> TBA Implementation
                                </h3>
                                {tbaContracts?.filter(
                                    (c) =>
                                        c.type ===
                                            TBAContractType.IMPLEMENTATION &&
                                        c.networkId === form.networkId
                                ).length === 0 ? (
                                    <p className="text-blue-300 text-center py-4">
                                        이 네트워크에 배포된 Implementation이
                                        없습니다.
                                        <button
                                            onClick={() => {
                                                toast.info(
                                                    "TBA 관리 페이지에서 Implementation을 먼저 배포해주세요."
                                                );
                                            }}
                                            className="block mx-auto mt-2 text-purple-400 hover:text-purple-300"
                                        >
                                            TBA 배포하러 가기 →
                                        </button>
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {tbaContracts
                                            ?.filter(
                                                (c) =>
                                                    c.type ===
                                                        TBAContractType.IMPLEMENTATION &&
                                                    c.networkId ===
                                                        form.networkId
                                            )
                                            .map((contract) => (
                                                <button
                                                    key={contract.id}
                                                    onClick={() =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            tbaImplementation:
                                                                contract.address,
                                                        }))
                                                    }
                                                    className={`
                                                        relative p-4 rounded-xl border-2 transition-all
                                                        ${
                                                            form.tbaImplementation ===
                                                            contract.address
                                                                ? "border-purple-400 bg-purple-900/30"
                                                                : "border-purple-700/50 bg-purple-900/20 hover:border-purple-500/50"
                                                        }
                                                    `}
                                                >
                                                    <p className="text-white font-semibold">
                                                        {contract.name ||
                                                            "Implementation"}
                                                    </p>
                                                    <p className="text-xs text-purple-300 font-mono mt-1">
                                                        {contract.address.slice(
                                                            0,
                                                            10
                                                        )}
                                                        ...
                                                        {contract.address.slice(
                                                            -8
                                                        )}
                                                    </p>
                                                    {form.tbaImplementation ===
                                                        contract.address && (
                                                        <div className="absolute top-2 right-2">
                                                            <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center">
                                                                <span className="text-xs text-black">
                                                                    ✓
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(3)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(5)}
                            disabled={
                                !form.tbaRegistry || !form.tbaImplementation
                            }
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.tbaRegistry && form.tbaImplementation
                                    ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: 메타데이터 선택 (기존 Step 4) */}
            {step === 5 && (
                <div className="w-full max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        컬렉션 메타데이터를 선택하세요
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        SPG 컬렉션의 메타데이터(이미지, 설명 등)를 선택하세요
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-h-[1200px] overflow-y-auto p-2">
                        {isLoadingMetadataList ? (
                            <div className="col-span-full text-center text-blue-200">
                                메타데이터 불러오는 중...
                            </div>
                        ) : (
                            <>
                                {metadataList?.map((meta: ipfs) => (
                                    <button
                                        key={meta.id}
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                selectedMetadata: meta,
                                            }))
                                        }
                                        className={`
                                            relative group rounded-2xl shadow-xl border-4 overflow-hidden
                                            transition-all duration-300 transform
                                            ${
                                                form.selectedMetadata?.id ===
                                                meta.id
                                                    ? "border-green-400 scale-105 ring-4 ring-green-300/30"
                                                    : "border-blue-800 hover:scale-105 hover:border-green-500/50"
                                            }
                                        `}
                                    >
                                        <div className="aspect-square bg-gradient-to-br from-green-900/20 to-blue-900/20 p-4 flex items-center justify-center">
                                            <div className="text-5xl">📦</div>
                                        </div>
                                        <div className="p-4 bg-[#181c2b]/90">
                                            <p className="text-green-200 font-mono text-xs mb-2 truncate">
                                                {meta.cid}
                                            </p>
                                            <p className="text-blue-300 text-sm">
                                                {meta.type}
                                            </p>
                                        </div>
                                        {form.selectedMetadata?.id ===
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
                                            "메타데이터 등록 페이지로 이동하세요"
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
                            onClick={() => setStep(4)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(6)}
                            disabled={!form.selectedMetadata}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.selectedMetadata
                                    ? "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 6: 아티스트 선택 (기존 Step 5) */}
            {step === 6 && (
                <div className="w-full max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        어떤 아티스트와 연결할까요?
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        이 SPG 컬렉션과 연결될 K-pop 아티스트를 선택하세요
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 max-h-[400px] overflow-y-auto p-2">
                        {isArtistsLoading ? (
                            <div className="col-span-full text-center text-blue-200">
                                아티스트 불러오는 중...
                            </div>
                        ) : (
                            artists?.map((artist) => (
                                <button
                                    key={artist.id}
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            artistId: artist.id,
                                        }))
                                    }
                                    className={`
                                        relative group p-4 rounded-2xl shadow-xl border-4
                                        transition-all duration-300 transform text-center
                                        ${
                                            form.artistId === artist.id
                                                ? "border-pink-400 bg-gradient-to-br from-pink-900/50 via-purple-900/50 to-blue-900/50 scale-105 ring-4 ring-pink-300/30"
                                                : "border-blue-800 bg-[#181c2b]/80 hover:scale-105 hover:border-pink-500/50"
                                        }
                                    `}
                                >
                                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                                        {artist.name?.charAt(0) || "A"}
                                    </div>
                                    <h3 className="font-bold text-pink-200 mb-1">
                                        {artist.name}
                                    </h3>
                                    <p className="text-xs text-blue-300">
                                        {artist.code}
                                    </p>
                                    {form.artistId === artist.id && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg animate-pulse">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(5)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(7)}
                            disabled={!form.artistId}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.artistId
                                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 7: 컬렉션 정보 입력 (기존 Step 6) */}
            {step === 7 && (
                <div className="w-full max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        컬렉션 정보를 입력하세요
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        SPG 컬렉션의 이름과 심볼을 설정하세요
                    </p>

                    <div className="bg-[#181c2b]/80 rounded-2xl p-8 border-4 border-blue-800 space-y-6">
                        <div>
                            <label className="block text-cyan-300 mb-2 font-bold">
                                컬렉션 이름{" "}
                                <span className="text-pink-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="예: Starglow K-Pop Stars"
                                className="w-full px-4 py-3 rounded-xl bg-blue-900/30 text-white border-2 border-cyan-500/50 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 transition-all"
                            />
                            <p className="text-xs text-blue-400 mt-1">
                                영문, 숫자, 공백 사용 가능
                            </p>
                        </div>

                        <div>
                            <label className="block text-cyan-300 mb-2 font-bold">
                                컬렉션 심볼{" "}
                                <span className="text-pink-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.symbol}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        symbol: e.target.value.toUpperCase(),
                                    }))
                                }
                                placeholder="예: STAR"
                                className="w-full px-4 py-3 rounded-xl bg-blue-900/30 text-white border-2 border-purple-500/50 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-400/20 transition-all uppercase"
                            />
                            <p className="text-xs text-blue-400 mt-1">
                                3-5자 영문 대문자 권장
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(6)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={() => setStep(8)}
                            disabled={!form.name || !form.symbol}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                form.name && form.symbol
                                    ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:scale-105"
                                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            다음 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 8: 최종 확인 (기존 Step 7) */}
            {step === 8 && (
                <div className="w-full max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        배포 정보를 확인하세요
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        아래 정보로 SPG 컬렉션이 배포됩니다
                    </p>

                    <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-8 border-4 border-cyan-500/30 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/50">
                                <h3 className="text-cyan-400 font-bold mb-2">
                                    네트워크
                                </h3>
                                <p className="text-white">
                                    {Array.isArray(storyNetworks) &&
                                        storyNetworks?.find(
                                            (n: any) => n.id === form.networkId
                                        )?.name}
                                </p>
                            </div>
                            <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-700/50">
                                <h3 className="text-purple-400 font-bold mb-2">
                                    지갑
                                </h3>
                                <p className="text-white font-mono text-sm">
                                    {form.walletAddress.slice(0, 10)}...
                                    {form.walletAddress.slice(-8)}
                                </p>
                            </div>
                            <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-700/50">
                                <h3 className="text-orange-400 font-bold mb-2">
                                    컨트랙트
                                </h3>
                                <p className="text-white font-mono text-sm">
                                    {form.contractAddress.slice(0, 10)}...
                                    {form.contractAddress.slice(-8)}
                                </p>
                            </div>
                            <div className="bg-green-900/20 rounded-xl p-4 border border-green-700/50">
                                <h3 className="text-green-400 font-bold mb-2">
                                    메타데이터
                                </h3>
                                <p className="text-white font-mono text-xs truncate">
                                    {form.selectedMetadata?.cid}
                                </p>
                            </div>
                            <div className="bg-indigo-900/20 rounded-xl p-4 border border-indigo-700/50">
                                <h3 className="text-indigo-400 font-bold mb-2">
                                    TBA Registry
                                </h3>
                                <p className="text-white font-mono text-xs">
                                    {form.tbaRegistry.slice(0, 10)}...
                                    {form.tbaRegistry.slice(-8)}
                                </p>
                            </div>
                            <div className="bg-teal-900/20 rounded-xl p-4 border border-teal-700/50">
                                <h3 className="text-teal-400 font-bold mb-2">
                                    TBA Implementation
                                </h3>
                                <p className="text-white font-mono text-xs">
                                    {form.tbaImplementation.slice(0, 10)}...
                                    {form.tbaImplementation.slice(-8)}
                                </p>
                            </div>
                            <div className="bg-pink-900/20 rounded-xl p-4 border border-pink-700/50">
                                <h3 className="text-pink-400 font-bold mb-2">
                                    아티스트
                                </h3>
                                <p className="text-white">
                                    {
                                        artists?.find(
                                            (a) => a.id === form.artistId
                                        )?.name
                                    }
                                </p>
                            </div>
                            <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-700/50">
                                <h3 className="text-cyan-400 font-bold mb-2">
                                    컬렉션 이름
                                </h3>
                                <p className="text-white font-bold">
                                    {form.name}
                                </p>
                            </div>
                            <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-700/50 md:col-span-2">
                                <h3 className="text-purple-400 font-bold mb-2">
                                    심볼
                                </h3>
                                <p className="text-white font-bold">
                                    {form.symbol}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-red-300">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(7)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={handleDeploy}
                            disabled={
                                isSubmitting || createSPGMutationIsPending
                            }
                            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                                isSubmitting || createSPGMutationIsPending
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                            }`}
                        >
                            {isSubmitting || createSPGMutationIsPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    배포 중...
                                </span>
                            ) : (
                                "🚀 SPG 배포하기"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 9: 성공 화면 (기존 Step 8) */}
            {step === 9 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="text-8xl mb-4 animate-bounce">🎉</div>
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            SPG 배포 완료!
                        </h1>
                        <p className="text-xl text-green-300 mb-8">
                            SPG 컬렉션이 성공적으로 배포되었습니다
                        </p>
                        {successMsg && (
                            <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6 mb-8">
                                <p className="text-green-300 font-mono">
                                    {successMsg}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setStep(0);
                                setForm({
                                    name: "",
                                    symbol: "",
                                    networkId: "",
                                    walletAddress: "",
                                    contractAddress: "",
                                    tbaRegistry: "",
                                    tbaImplementation: "",
                                    selectedMetadata: null,
                                    artistId: "",
                                });
                            }}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50 transition-colors"
                        >
                            새 SPG 배포
                        </button>
                        <button
                            onClick={() => setStep(-1)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition-all"
                        >
                            컬렉션 목록 보기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
