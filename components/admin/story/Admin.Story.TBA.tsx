/// components/admin/story/Admin.Story.TBA.tsx

import { useState, useEffect } from "react";

import { TBAContractType } from "@prisma/client";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { FaShieldAlt, FaCube } from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import { useToast } from "@/app/hooks/useToast";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { useStoryNetwork } from "@/app/story/network/hooks";
import { useTBA } from "@/app/story/tba/hooks";

export default function AdminStoryTBA({ onBack }: { onBack?: () => void }) {
    const toast = useToast();
    const { data: session } = useSession();
    const userId = session?.user?.id || "";

    const [step, setStep] = useState<number>(-1); // -1: 관리 화면, 0+: 배포 단계
    const [form, setForm] = useState<{
        type: TBAContractType | null;
        networkId: string;
        walletAddress: string;
        existingAddress: string;
    }>({
        type: null,
        networkId: "",
        walletAddress: "",
        existingAddress: "",
    });

    const { storyNetworks, isLoadingStoryNetworks } = useStoryNetwork({
        getStoryNetworksInput: {
            isActive: true,
        },
    });

    const {
        escrowWallets,
        isLoadingEscrowWallets,
        fetchEscrowWalletsBalanceAsync,
        isPendingFetchEscrowWalletsBalance,
    } = useEscrowWallets({
        getEscrowWalletsInput: {
            isActive: true,
        },
    });

    const {
        tbaContracts,
        isTBAContractsLoading,
        isTBAContractsError,
        tbaContractsError,
        refetchTBAContracts,

        refetchTBAAddresses,

        deployTBARegistryMutation,
        deployTBAImplementationMutation,
        setTBAAddressMutation,
    } = useTBA({
        getTBAContractsInput: {
            networkId: form.networkId || undefined,
            isActive: true,
        },
        getTBAAddressesInput: {
            networkId: form.networkId || "default",
        },
    });

    const [walletBalances, setWalletBalances] = useState<
        Record<string, string>
    >({});
    const [isDeploying, setIsDeploying] = useState(false);

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
            fetchAllBalances().catch((err) => {
                console.error(err);
            });
        }
    }, [step, form.networkId, escrowWallets, fetchEscrowWalletsBalanceAsync]);

    const handleDeploy = async () => {
        if (!form.type || !form.networkId || !form.walletAddress) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        setIsDeploying(true);
        try {
            const deployData = {
                userId,
                networkId: form.networkId,
                walletAddress: form.walletAddress,
            };

            if (form.type === TBAContractType.REGISTRY) {
                await deployTBARegistryMutation.mutateAsync(deployData);
                toast.success("TBA Registry가 성공적으로 배포되었습니다!");
            } else {
                await deployTBAImplementationMutation.mutateAsync(deployData);
                toast.success(
                    "TBA Implementation이 성공적으로 배포되었습니다!"
                );
            }

            refetchTBAContracts().catch((err) => {
                console.error(err);
            });
            refetchTBAAddresses().catch((err) => {
                console.error(err);
            });
            setStep(5); // 성공 화면
        } catch (error: any) {
            toast.error(error?.message || "배포 중 오류가 발생했습니다.");
        } finally {
            setIsDeploying(false);
        }
    };

    const handleSetAddress = async () => {
        if (!form.type || !form.networkId || !form.existingAddress) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        try {
            await setTBAAddressMutation.mutateAsync({
                networkId: form.networkId,
                address: form.existingAddress,
                type: form.type,
                name:
                    form.type === TBAContractType.REGISTRY
                        ? "ERC6551Registry"
                        : "StarglowTBA",
            });

            toast.success("TBA 주소가 성공적으로 등록되었습니다!");
            refetchTBAContracts().catch((err) => {
                console.error(err);
            });
            refetchTBAAddresses().catch((err) => {
                console.error(err);
            });
            setStep(-1);
        } catch (error: any) {
            toast.error(error?.message || "주소 등록 중 오류가 발생했습니다.");
        }
    };

    // Progress Bar Component
    const ProgressBar = () => {
        const steps = ["시작", "네트워크", "지갑", "배포", "완료"];
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
            <TbTopologyStar3 className="absolute text-[16rem] text-blue-900/10 left-[-3rem] top-[-5rem] pointer-events-none select-none z-0" />
            <SiEthereum className="absolute text-[8rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none z-0" />

            {/* 관리 화면 */}
            {step === -1 && (
                <>
                    <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                        <button
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                            onClick={onBack}
                        >
                            <span className="hidden md:inline">뒤로가기</span>
                        </button>
                        <h2 className="text-2xl font-bold text-white">
                            TBA 컨트랙트 관리
                        </h2>
                    </div>

                    {/* TBA 컨트랙트 목록 */}
                    <div className="w-full max-w-6xl mb-10 p-8 rounded-2xl shadow-2xl bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] border border-blue-900/30">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-blue-400">
                                TBA 컨트랙트 목록
                            </h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setForm({
                                            ...form,
                                            type: TBAContractType.REGISTRY,
                                        });
                                        setStep(0);
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:scale-105 transition-all shadow-lg"
                                >
                                    + Registry 배포
                                </button>
                                <button
                                    onClick={() => {
                                        setForm({
                                            ...form,
                                            type: TBAContractType.IMPLEMENTATION,
                                        });
                                        setStep(0);
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition-all shadow-lg"
                                >
                                    + Implementation 배포
                                </button>
                            </div>
                        </div>

                        {isTBAContractsLoading ? (
                            <div className="text-blue-200 py-8 text-center">
                                불러오는 중...
                            </div>
                        ) : isTBAContractsError ? (
                            <div className="text-red-400 py-8 text-center">
                                {tbaContractsError?.message ||
                                    "목록을 불러오지 못했습니다."}
                            </div>
                        ) : !tbaContracts || tbaContracts.length === 0 ? (
                            <div className="text-blue-200 py-8 text-center">
                                아직 등록된 TBA 컨트랙트가 없습니다.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Registry 섹션 */}
                                <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-700/30">
                                    <h4 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                                        <FaShieldAlt /> TBA Registry
                                    </h4>
                                    <div className="space-y-3">
                                        {tbaContracts
                                            .filter(
                                                (c) =>
                                                    c.type ===
                                                    TBAContractType.REGISTRY
                                            )
                                            .map((contract) => (
                                                <motion.div
                                                    key={contract.id}
                                                    initial={{
                                                        opacity: 0,
                                                        x: -20,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    className="bg-[#23243a]/60 rounded-lg p-4 border border-blue-800/30"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
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
                                                            {storyNetworks &&
                                                                Array.isArray(
                                                                    storyNetworks
                                                                ) && (
                                                                    <p className="text-xs text-blue-400 mt-2">
                                                                        네트워크:{" "}
                                                                        {
                                                                            storyNetworks?.find(
                                                                                (
                                                                                    n
                                                                                ) =>
                                                                                    n.id ===
                                                                                    contract.networkId
                                                                            )
                                                                                ?.name
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {contract.isActive && (
                                                                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                </div>

                                {/* Implementation 섹션 */}
                                <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-700/30">
                                    <h4 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                                        <FaCube /> TBA Implementation
                                    </h4>
                                    <div className="space-y-3">
                                        {tbaContracts
                                            .filter(
                                                (c) =>
                                                    c.type ===
                                                    TBAContractType.IMPLEMENTATION
                                            )
                                            .map((contract) => (
                                                <motion.div
                                                    key={contract.id}
                                                    initial={{
                                                        opacity: 0,
                                                        x: 20,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    className="bg-[#23243a]/60 rounded-lg p-4 border border-purple-800/30"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
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
                                                            {storyNetworks &&
                                                                Array.isArray(
                                                                    storyNetworks
                                                                ) && (
                                                                    <p className="text-xs text-purple-400 mt-2">
                                                                        네트워크:{" "}
                                                                        {
                                                                            storyNetworks?.find(
                                                                                (
                                                                                    n
                                                                                ) =>
                                                                                    n.id ===
                                                                                    contract.networkId
                                                                            )
                                                                                ?.name
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {contract.isActive && (
                                                                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 기존 주소 등록 섹션 */}
                        <div className="mt-8 p-6 bg-orange-900/10 rounded-xl border border-orange-700/30">
                            <h4 className="text-lg font-bold text-orange-300 mb-4">
                                기존 컨트랙트 주소 등록
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select
                                    value={form.type || ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            type: e.target
                                                .value as TBAContractType,
                                        })
                                    }
                                    className="px-4 py-3 rounded-xl bg-[#23243a] text-white border border-orange-700/30 focus:border-orange-500"
                                >
                                    <option value="">타입 선택</option>
                                    <option value={TBAContractType.REGISTRY}>
                                        Registry
                                    </option>
                                    <option
                                        value={TBAContractType.IMPLEMENTATION}
                                    >
                                        Implementation
                                    </option>
                                </select>
                                <select
                                    value={form.networkId}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            networkId: e.target.value,
                                        })
                                    }
                                    className="px-4 py-3 rounded-xl bg-[#23243a] text-white border border-orange-700/30 focus:border-orange-500"
                                >
                                    <option value="">네트워크 선택</option>
                                    {Array.isArray(storyNetworks) &&
                                        storyNetworks?.map((net) => (
                                            <option key={net.id} value={net.id}>
                                                {net.name}
                                            </option>
                                        ))}
                                </select>
                                <input
                                    type="text"
                                    value={form.existingAddress}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            existingAddress: e.target.value,
                                        })
                                    }
                                    placeholder="0x..."
                                    className="px-4 py-3 rounded-xl bg-[#23243a] text-white border border-orange-700/30 focus:border-orange-500"
                                />
                            </div>
                            <button
                                onClick={handleSetAddress}
                                disabled={
                                    !form.type ||
                                    !form.networkId ||
                                    !form.existingAddress ||
                                    setTBAAddressMutation.isPending
                                }
                                className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {setTBAAddressMutation.isPending
                                    ? "등록 중..."
                                    : "주소 등록"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Progress Bar */}
            {step >= 0 && step < 5 && <ProgressBar />}

            {/* Step 0: 시작 */}
            {step === 0 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        {form.type === TBAContractType.REGISTRY ? (
                            <FaShieldAlt className="text-8xl text-cyan-400 mx-auto mb-4" />
                        ) : (
                            <FaCube className="text-8xl text-purple-400 mx-auto mb-4" />
                        )}
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            {form.type === TBAContractType.REGISTRY
                                ? "TBA Registry 배포"
                                : "TBA Implementation 배포"}
                        </h1>
                        <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
                            {form.type === TBAContractType.REGISTRY
                                ? "ERC6551 Registry는 Token Bound Account를 생성하고 관리하는 핵심 컨트랙트입니다."
                                : "StarglowTBA는 NFT와 연결된 스마트 계정의 기능을 구현하는 컨트랙트입니다."}
                        </p>
                    </div>
                    <button
                        onClick={() => setStep(1)}
                        className="px-12 py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-xl rounded-full shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        시작하기 →
                    </button>
                </div>
            )}

            {/* Step 1: 네트워크 선택 */}
            {step === 1 && (
                <div className="w-full max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        네트워크 선택
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        TBA를 배포할 블록체인 네트워크를 선택하세요
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
                                        setForm({ ...form, networkId: net.id })
                                    }
                                    className={`
                                        relative group p-6 rounded-2xl shadow-xl border-4
                                        transition-all duration-300 transform
                                        ${
                                            form.networkId === net.id
                                                ? "border-cyan-400 bg-gradient-to-br from-cyan-900/50 via-blue-900/50 to-indigo-900/50 scale-105"
                                                : "border-blue-800 bg-[#181c2b]/80 hover:scale-105 hover:border-cyan-500/50"
                                        }
                                    `}
                                >
                                    <div className="text-5xl mb-3">
                                        {net.isTestnet ? "🧪" : "🌐"}
                                    </div>
                                    <h3 className="font-extrabold text-xl text-cyan-200 mb-1">
                                        {net.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 text-xs mt-2">
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
                                    </div>
                                    {form.networkId === net.id && (
                                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-cyan-400 to-purple-400 text-white rounded-full px-3 py-1 text-xs font-bold animate-pulse">
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
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50"
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
                        지갑 선택
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        TBA를 배포할 지갑을 선택하세요
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {isLoadingEscrowWallets ? (
                            <div className="col-span-full text-center text-blue-200">
                                지갑 불러오는 중...
                            </div>
                        ) : (
                            Array.isArray(escrowWallets) &&
                            escrowWallets?.map((wallet) => (
                                <button
                                    key={wallet.address}
                                    onClick={() =>
                                        setForm({
                                            ...form,
                                            walletAddress: wallet.address,
                                        })
                                    }
                                    className={`
                                        relative group p-6 rounded-2xl shadow-xl border-4
                                        transition-all duration-300 transform
                                        ${
                                            form.walletAddress ===
                                            wallet.address
                                                ? "border-purple-400 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-pink-900/50 scale-105"
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
                                    {form.walletAddress === wallet.address && (
                                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full px-3 py-1 text-xs font-bold animate-pulse">
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
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50"
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

            {/* Step 3: 최종 확인 */}
            {step === 3 && (
                <div className="w-full max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">
                        배포 정보 확인
                    </h2>
                    <p className="text-blue-300 text-center mb-8">
                        아래 정보로 TBA가 배포됩니다
                    </p>

                    <div className="bg-gradient-to-br from-[#23243a] via-[#2a2342] to-[#181c2b] rounded-2xl p-8 border-4 border-cyan-500/30 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/50">
                                <h3 className="text-cyan-400 font-bold mb-2">
                                    컨트랙트 타입
                                </h3>
                                <p className="text-white flex items-center gap-2">
                                    {form.type === TBAContractType.REGISTRY ? (
                                        <>
                                            <FaShieldAlt className="text-cyan-400" />{" "}
                                            Registry
                                        </>
                                    ) : (
                                        <>
                                            <FaCube className="text-purple-400" />{" "}
                                            Implementation
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-700/50">
                                <h3 className="text-purple-400 font-bold mb-2">
                                    네트워크
                                </h3>
                                <p className="text-white">
                                    {storyNetworks &&
                                        Array.isArray(storyNetworks) &&
                                        storyNetworks?.find(
                                            (n: any) => n.id === form.networkId
                                        )?.name}
                                </p>
                            </div>
                            <div className="bg-pink-900/20 rounded-xl p-4 border border-pink-700/50 md:col-span-2">
                                <h3 className="text-pink-400 font-bold mb-2">
                                    지갑 주소
                                </h3>
                                <p className="text-white font-mono text-sm">
                                    {form.walletAddress}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(2)}
                            className="px-6 py-3 bg-blue-900/50 text-blue-300 rounded-xl hover:bg-blue-800/50"
                        >
                            ← 이전
                        </button>
                        <button
                            onClick={handleDeploy}
                            disabled={isDeploying}
                            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                                isDeploying
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:scale-105 hover:shadow-2xl"
                            }`}
                        >
                            {isDeploying ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    배포 중...
                                </span>
                            ) : (
                                "🚀 TBA 배포하기"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: 성공 화면 */}
            {step === 5 && (
                <div className="w-full max-w-3xl mx-auto text-center">
                    <div className="mb-8">
                        <div className="text-8xl mb-4 animate-bounce">🎉</div>
                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            TBA 배포 완료!
                        </h1>
                        <p className="text-xl text-green-300 mb-8">
                            {form.type === TBAContractType.REGISTRY
                                ? "TBA Registry가"
                                : "TBA Implementation이"}{" "}
                            성공적으로 배포되었습니다
                        </p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setStep(-1);
                                setForm({
                                    type: null,
                                    networkId: "",
                                    walletAddress: "",
                                    existingAddress: "",
                                });
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition-all"
                        >
                            TBA 목록 보기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
