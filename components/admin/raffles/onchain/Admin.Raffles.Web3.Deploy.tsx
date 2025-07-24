"use client";

import { useState, useCallback, useEffect } from "react";
import {
    FaArrowLeft,
    FaRocket,
    FaCog,
    FaCheckCircle,
    FaSpinner,
    FaShieldAlt,
    FaPause,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import { useToast } from "@/app/hooks/useToast";
import { useStoryNetwork } from "@/app/story/network/hooks";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { deployRafflesV2Contract } from "@/app/actions/raffles/onchain/actions-admin-v2";

interface Props {
    onBack: () => void;
}

interface DeployForm {
    networkId: string;
    walletAddress: string;
    contractName: string;
}

interface GasEstimation {
    gas: string;
    cost: string;
    symbol: string;
    recommendation?: "low" | "standard" | "fast" | "urgent";
    confidence?: number;
    usd?: string;
}

export default function AdminRafflesWeb3Deploy({ onBack }: Props) {
    const toast = useToast();
    const { storyNetworks } = useStoryNetwork();
    const { escrowWallets } = useEscrowWallets();

    const [form, setForm] = useState<DeployForm>({
        networkId: "",
        walletAddress: "",
        contractName: "RafflesV2 Contract",
    });

    const [isDeploying, setIsDeploying] = useState(false);
    const [gasEstimation, setGasEstimation] = useState<GasEstimation | null>(
        null
    );
    const [deployedContract, setDeployedContract] = useState<any>(null);
    const [deploymentProgress, setDeploymentProgress] = useState({
        step: 0,
        status: "idle" as "idle" | "deploying" | "completed" | "error",
        txHash: "",
        error: null as string | null,
    });

    // 네트워크 선택 시 호환되는 지갑 자동 선택
    useEffect(() => {
        if (form.networkId && escrowWallets && escrowWallets.length > 0) {
            const compatibleWallet = escrowWallets.find((wallet) =>
                wallet.networkIds.includes(form.networkId)
            );
            if (compatibleWallet && !form.walletAddress) {
                setForm((prev) => ({
                    ...prev,
                    walletAddress: compatibleWallet.address,
                }));
            }
        }
    }, [form.networkId, escrowWallets, form.walletAddress]);

    // 가스비 추정 (단순화된 버전)
    useEffect(() => {
        if (form.networkId && form.walletAddress) {
            const selectedNetwork = Array.isArray(storyNetworks)
                ? storyNetworks.find((n) => n.id === form.networkId)
                : null;

            if (selectedNetwork) {
                // V2 컨트랙트는 더 복잡하므로 가스비가 더 높음
                const estimatedGas = "250000"; // V2에서 증가된 가스 사용량
                const gasPrice = selectedNetwork.isTestnet ? "20" : "30"; // gwei
                const gasCost =
                    (parseInt(gasPrice) * parseInt(estimatedGas)) / 1e9;

                setGasEstimation({
                    gas: estimatedGas,
                    cost: gasCost.toFixed(6),
                    symbol: selectedNetwork.symbol,
                    recommendation: selectedNetwork.isTestnet
                        ? "standard"
                        : "fast",
                    confidence: 85,
                    usd: (gasCost * 2.5).toFixed(2), // 임시 USD 환율
                });
            }
        }
    }, [form.networkId, form.walletAddress, storyNetworks]);

    const selectedNetwork = Array.isArray(storyNetworks)
        ? storyNetworks.find((n) => n.id === form.networkId)
        : null;

    const handleDeploy = async () => {
        if (!form.networkId || !form.walletAddress) {
            toast.error("네트워크와 지갑을 선택해주세요.");
            return;
        }

        setIsDeploying(true);
        setDeploymentProgress({
            step: 1,
            status: "deploying",
            txHash: "",
            error: null,
        });

        try {
            toast.info("RafflesV2 컨트랙트 배포를 시작합니다...");

            const result = await deployRafflesV2Contract({
                networkId: form.networkId,
                walletAddress: form.walletAddress,
                contractName: form.contractName,
            });

            if (result.success && result.data) {
                setDeployedContract(result.data);
                setDeploymentProgress({
                    step: 2,
                    status: "completed",
                    txHash: result.data.txHash,
                    error: null,
                });

                toast.success(
                    "RafflesV2 컨트랙트가 성공적으로 배포되었습니다!"
                );

                // 폼 초기화
                setForm({
                    networkId: "",
                    walletAddress: "",
                    contractName: "RafflesV2 Contract",
                });
            } else {
                throw new Error(
                    result.error || "컨트랙트 배포에 실패했습니다."
                );
            }
        } catch (error) {
            console.error("Error deploying RafflesV2 contract:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "컨트랙트 배포 중 오류가 발생했습니다.";

            setDeploymentProgress({
                step: 1,
                status: "error",
                txHash: "",
                error: errorMessage,
            });

            toast.error(errorMessage);
        } finally {
            setIsDeploying(false);
        }
    };

    const getRecommendationColor = (recommendation?: string) => {
        switch (recommendation) {
            case "low":
                return "text-green-400";
            case "standard":
                return "text-blue-400";
            case "fast":
                return "text-yellow-400";
            case "urgent":
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    };

    const getRecommendationText = (recommendation?: string) => {
        switch (recommendation) {
            case "low":
                return "저속 (절약)";
            case "standard":
                return "표준 (권장)";
            case "fast":
                return "고속";
            case "urgent":
                return "긴급";
            default:
                return "표준";
        }
    };

    const isFormValid =
        form.networkId && form.walletAddress && form.contractName.trim();

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[8rem] text-pink-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            <h1 className="mb-8 text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                RafflesV2 <span className="text-purple-400">배포</span>
            </h1>

            <div className="w-full max-w-4xl bg-black/20 rounded-xl p-8 border border-purple-500/20">
                {/* V2 특징 안내 */}
                <div className="mb-8 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-700/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <FaRocket className="mr-3 text-purple-400" size={20} />
                        RafflesV2 새로운 기능
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-purple-900/20 rounded-lg border border-purple-700/50">
                            <FaShieldAlt
                                className="text-purple-400"
                                size={16}
                            />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    역할 기반 제어
                                </div>
                                <div className="text-xs text-purple-300">
                                    ADMIN, OPERATOR 역할
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
                            <FaPause className="text-blue-400" size={16} />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    일시정지 기능
                                </div>
                                <div className="text-xs text-blue-300">
                                    긴급 상황 대응
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg border border-green-700/50">
                            <FaCog className="text-green-400" size={16} />
                            <div>
                                <div className="font-medium text-white text-sm">
                                    배치 추첨
                                </div>
                                <div className="text-xs text-green-300">
                                    대량 처리 최적화
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 배포 진행률 */}
                {deploymentProgress.status !== "idle" && (
                    <div className="mb-8 p-6 bg-gray-800 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white">
                                배포 진행률
                            </h3>
                            <span className="text-sm text-gray-400">
                                {deploymentProgress.step}/2 단계
                            </span>
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    deploymentProgress.status === "error"
                                        ? "bg-red-500"
                                        : deploymentProgress.status ===
                                          "completed"
                                        ? "bg-green-500"
                                        : "bg-blue-500"
                                }`}
                                style={{
                                    width: `${
                                        (deploymentProgress.step / 2) * 100
                                    }%`,
                                }}
                            />
                        </div>

                        <div className="text-sm">
                            {deploymentProgress.status === "deploying" && (
                                <span className="text-blue-400">
                                    🚀 컨트랙트 배포 중...
                                </span>
                            )}
                            {deploymentProgress.status === "completed" && (
                                <span className="text-green-400">
                                    ✅ 배포 완료!
                                </span>
                            )}
                            {deploymentProgress.status === "error" && (
                                <span className="text-red-400">
                                    ❌ 오류: {deploymentProgress.error}
                                </span>
                            )}
                        </div>

                        {deploymentProgress.txHash && (
                            <div className="mt-2 text-xs text-gray-500">
                                TX: {deploymentProgress.txHash}
                            </div>
                        )}
                    </div>
                )}

                {/* 배포 성공 결과 */}
                {deployedContract && (
                    <div className="mb-8 p-6 bg-green-900/20 rounded-xl border border-green-700">
                        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center">
                            <FaCheckCircle className="mr-3" size={20} />
                            배포 완료
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">
                                    컨트랙트 주소:
                                </span>
                                <p className="text-white font-mono break-all">
                                    {deployedContract.address}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-400">
                                    블록 번호:
                                </span>
                                <p className="text-white">
                                    #{deployedContract.blockNumber}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-400">
                                    트랜잭션 해시:
                                </span>
                                <p className="text-white font-mono break-all">
                                    {deployedContract.txHash}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-400">배포자:</span>
                                <p className="text-white font-mono">
                                    {deployedContract.deployedBy}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-800/30 rounded-lg">
                            <p className="text-green-300 text-sm">
                                💡 V2 컨트랙트에서는 배포자에게 모든 관리자
                                권한이 자동으로 부여됩니다.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    <div className="text-center">
                        <FaRocket className="text-6xl text-blue-400 mx-auto mb-4" />
                        <p className="text-gray-300 text-lg mb-6">
                            새로운 RafflesV2 컨트랙트를 블록체인에 배포합니다
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 배포 설정 */}
                        <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-6 text-lg">
                                배포 설정
                            </h3>

                            <div className="space-y-6">
                                {/* 네트워크 선택 */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-3">
                                        네트워크 *
                                    </label>
                                    <select
                                        value={form.networkId}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                networkId: e.target.value,
                                                walletAddress: "", // 네트워크 변경 시 지갑 초기화
                                            }))
                                        }
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="">
                                            네트워크를 선택하세요
                                        </option>
                                        {Array.isArray(storyNetworks) &&
                                            storyNetworks.map((network) => (
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
                                    {selectedNetwork && (
                                        <div className="mt-2 text-xs text-gray-400">
                                            Chain ID: {selectedNetwork.chainId}{" "}
                                            | Symbol: {selectedNetwork.symbol}
                                        </div>
                                    )}
                                </div>

                                {/* 지갑 선택 */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-3">
                                        배포자 지갑 *
                                    </label>
                                    <select
                                        value={form.walletAddress}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                walletAddress: e.target.value,
                                            }))
                                        }
                                        disabled={!form.networkId}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    >
                                        <option value="">
                                            {form.networkId
                                                ? "지갑을 선택하세요"
                                                : "먼저 네트워크를 선택하세요"}
                                        </option>
                                        {escrowWallets?.map((wallet) => (
                                            <option
                                                key={wallet.id}
                                                value={wallet.address}
                                            >
                                                {wallet.address.slice(0, 10)}...
                                                {wallet.address.slice(-8)}
                                            </option>
                                        ))}
                                    </select>
                                    {form.walletAddress && (
                                        <div className="mt-2 text-xs text-gray-400 font-mono">
                                            {form.walletAddress}
                                        </div>
                                    )}
                                </div>

                                {/* 컨트랙트 이름 */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-3">
                                        컨트랙트 이름
                                    </label>
                                    <input
                                        type="text"
                                        value={form.contractName}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                contractName: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="RafflesV2 Contract"
                                    />
                                    <p className="mt-2 text-xs text-gray-400">
                                        관리용 이름 (블록체인에는 영향 없음)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 가스비 및 배포 정보 */}
                        <div className="space-y-6">
                            {/* 가스비 추정 */}
                            {gasEstimation && (
                                <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                    <h3 className="text-white font-semibold mb-4 text-lg">
                                        가스비 추정
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">
                                                예상 가스:
                                            </span>
                                            <span className="text-white font-mono">
                                                {parseInt(
                                                    gasEstimation.gas
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">
                                                비용:
                                            </span>
                                            <span className="text-white font-medium">
                                                {gasEstimation.cost}{" "}
                                                {gasEstimation.symbol}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">
                                                USD 환산:
                                            </span>
                                            <span className="text-green-400 font-medium">
                                                ~${gasEstimation.usd}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">
                                                속도:
                                            </span>
                                            <span
                                                className={`font-medium ${getRecommendationColor(
                                                    gasEstimation.recommendation
                                                )}`}
                                            >
                                                {getRecommendationText(
                                                    gasEstimation.recommendation
                                                )}
                                            </span>
                                        </div>
                                        {gasEstimation.confidence && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-300">
                                                    신뢰도:
                                                </span>
                                                <span className="text-blue-400 font-medium">
                                                    {gasEstimation.confidence}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                                        <p className="text-yellow-300 text-sm">
                                            💡 V2 컨트랙트는 추가 기능으로 인해
                                            일반 컨트랙트보다 가스비가 높습니다.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 배포 버튼 */}
                            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                <button
                                    onClick={handleDeploy}
                                    disabled={!isFormValid || isDeploying}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 ${
                                        !isFormValid || isDeploying
                                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                    }`}
                                >
                                    {isDeploying ? (
                                        <>
                                            <FaSpinner
                                                className="animate-spin"
                                                size={20}
                                            />
                                            V2 배포 중...
                                        </>
                                    ) : (
                                        <>
                                            <FaRocket size={20} />
                                            RafflesV2 배포하기
                                        </>
                                    )}
                                </button>

                                {!isFormValid && (
                                    <p className="text-red-400 text-sm mt-3 text-center">
                                        모든 필수 항목을 입력해주세요
                                    </p>
                                )}

                                {isDeploying && (
                                    <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaSpinner
                                                className="animate-spin text-blue-400"
                                                size={14}
                                            />
                                            <span className="text-blue-400 font-medium text-sm">
                                                배포 진행 중
                                            </span>
                                        </div>
                                        <p className="text-blue-300 text-xs">
                                            V2 컨트랙트가 블록체인에 배포되고
                                            있습니다. 완료까지 2-3분 소요됩니다.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* V2 권한 정보 */}
                            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg">
                                    V2 권한 시스템
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FaShieldAlt
                                            className="text-purple-400"
                                            size={14}
                                        />
                                        <span className="text-gray-300">
                                            DEFAULT_ADMIN_ROLE:
                                        </span>
                                        <span className="text-purple-400">
                                            최고 관리자
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaShieldAlt
                                            className="text-blue-400"
                                            size={14}
                                        />
                                        <span className="text-gray-300">
                                            ADMIN_ROLE:
                                        </span>
                                        <span className="text-blue-400">
                                            관리자
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaShieldAlt
                                            className="text-green-400"
                                            size={14}
                                        />
                                        <span className="text-gray-300">
                                            OPERATOR_ROLE:
                                        </span>
                                        <span className="text-green-400">
                                            운영자
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-purple-900/30 border border-purple-700 rounded-lg">
                                    <p className="text-purple-300 text-xs">
                                        📋 배포자에게 모든 역할이 자동으로
                                        부여됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                className="mt-8 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                onClick={onBack}
            >
                <FaArrowLeft />
                뒤로
            </button>
        </div>
    );
}
