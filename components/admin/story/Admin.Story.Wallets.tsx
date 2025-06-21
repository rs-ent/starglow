"use client";

import { useState, useEffect } from "react";

import { useSession } from "next-auth/react";
import {
    FaWallet,
    FaEye,
    FaKey,
    FaCheck,
    FaTimes,
    FaPlus,
    FaBackspace,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";
import { privateKeyToAccount } from "viem/accounts";

import { useToast } from "@/app/hooks/useToast";
import { useEscrowWallets } from "@/app/story/escrowWallet/hooks";
import { useStoryNetwork } from "@/app/story/network/hooks";

export default function AdminStoryWallets({ onBack }: { onBack?: () => void }) {
    const { data: session } = useSession();
    const toast = useToast();
    const {
        escrowWallets,
        isLoadingEscrowWallets,
        isErrorEscrowWallets,
        refetchEscrowWallets,

        setActiveEscrowWalletAsync,
        isPendingSetActiveEscrowWallet,

        fetchEscrowWalletPrivateKeyAsync,
        isPendingFetchEscrowWalletPrivateKey,

        registerEscrowWalletAsync,
        isPendingRegisterEscrowWallet,

        fetchEscrowWalletsBalanceAsync,
        isPendingFetchEscrowWalletsBalance,
    } = useEscrowWallets({
        getEscrowWalletsInput: {
            isActive: true,
        },
    });

    const { storyNetworks } = useStoryNetwork();

    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [walletBalances, setWalletBalances] = useState<
        Record<string, string>
    >({});
    const [selectedNetworkId, setSelectedNetworkId] = useState<
        string | undefined
    >(undefined);
    const [showAddWalletModal, setShowAddWalletModal] = useState(false);
    const [addWalletMode, setAddWalletMode] = useState<"random" | "privateKey">(
        "random"
    );
    const [inputPrivateKey, setInputPrivateKey] = useState("");
    const [isAddWalletLoading, setIsAddWalletLoading] = useState(false);
    const [createdWalletInfo, setCreatedWalletInfo] = useState<{
        address: string;
        privateKey: string;
    } | null>(null);

    useEffect(() => {
        if (selectedNetworkId && escrowWallets && escrowWallets.length > 0) {
            // 모든 address에 대해 배치 잔고 조회
            const fetchAllBalances = async () => {
                const result = await fetchEscrowWalletsBalanceAsync({
                    networkId: selectedNetworkId,
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
    }, [selectedNetworkId, escrowWallets, fetchEscrowWalletsBalanceAsync]);

    useEffect(() => {
        if (storyNetworks && Array.isArray(storyNetworks)) {
            setSelectedNetworkId(storyNetworks[0].id);
        }
    }, [storyNetworks]);

    // 활성/비활성 토글
    const handleToggleActive = async (address: string, isActive: boolean) => {
        await setActiveEscrowWalletAsync({ address, isActive: !isActive });
        refetchEscrowWallets().catch((err) => {
            console.error(err);
        });
    };

    // 프라이빗키 복호화
    const handleShowPrivateKey = async (address: string) => {
        setShowKey(true);
        setPrivateKey("로딩중...");
        const key = await fetchEscrowWalletPrivateKeyAsync({
            userId: session?.user?.id ?? "",
            address,
        });
        setPrivateKey(key || "권한 없음/에러");
    };

    // 새 지갑 등록 (예시)
    const handleRegisterWallet = async () => {
        setShowAddWalletModal(true);
    };

    const handleAddWalletModalClose = () => {
        setShowAddWalletModal(false);
        setAddWalletMode("random");
        setInputPrivateKey("");
        setCreatedWalletInfo(null);
        setIsAddWalletLoading(false);
    };

    const handleFetchBalance = async (address: string) => {
        if (!selectedNetworkId) {
            alert("네트워크를 먼저 선택하세요.");
            return;
        }
        const result = await fetchEscrowWalletsBalanceAsync({
            networkId: selectedNetworkId,
            addresses: [address],
        });
        if (result && result.length > 0) {
            setWalletBalances((prev) => ({
                ...prev,
                [address]: result[0].balance,
            }));
        }
    };

    // 네트워크 선택 핸들러
    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedNetworkId(e.target.value);
    };

    const copyToClipboard = (text: string, type?: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${type ? `${type} ` : ""}복사되었습니다.`);
    };

    const handleBack = () => {
        onBack?.();
    };

    const handleAddWallet = async () => {
        setIsAddWalletLoading(true);
        try {
            // 프라이빗키 입력 등록 - viem 사용
            let pk = inputPrivateKey.trim();
            if (!pk.startsWith("0x")) pk = `0x${pk}`;

            let account;
            try {
                account = privateKeyToAccount(pk as `0x${string}`);
            } catch (e) {
                toast.error("유효하지 않은 프라이빗키입니다.");
                setIsAddWalletLoading(false);
                return;
            }

            const address = account.address;
            const privateKey = pk;
            const result = await registerEscrowWalletAsync({
                address,
                privateKey,
            });
            if (typeof result === "object" && result && "address" in result) {
                toast.success("에스크로 지갑이 등록되었습니다.");
                refetchEscrowWallets().catch((err) => {
                    console.error(err);
                });
                handleAddWalletModalClose();
            } else if (
                typeof result === "string" &&
                result.includes("unique")
            ) {
                toast.error("이미 등록된 지갑입니다.");
            } else if (typeof result === "string") {
                toast.error(result);
            } else {
                toast.error("지갑 등록에 실패했습니다.");
            }
        } catch (err) {
            console.error(err);
            toast.error("지갑 등록 중 오류가 발생했습니다.");
        } finally {
            setIsAddWalletLoading(false);
        }
    };

    return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-start bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-blue-900/30 overflow-hidden">
            <TbTopologyStar3 className="absolute text-[14rem] text-blue-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[7rem] text-purple-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            {/* 뒤로가기 버튼 */}
            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#23243a]/80 text-blue-200 hover:bg-blue-900/40 hover:text-white transition shadow-lg"
                    onClick={handleBack}
                    title="뒤로가기"
                >
                    <FaBackspace className="text-xl" />
                    <span className="hidden md:inline">뒤로가기</span>
                </button>
            </div>

            <div className="w-full flex items-center justify-between mb-8 z-10 mt-2">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FaWallet className="text-purple-400" />
                    에스크로 지갑 관리
                </h2>
                <button
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-all duration-200"
                    onClick={handleRegisterWallet}
                    disabled={isPendingRegisterEscrowWallet}
                >
                    <FaPlus />
                    {isPendingRegisterEscrowWallet ? "추가중..." : "지갑 추가"}
                </button>
            </div>

            {/* 네트워크 드롭다운 */}
            {storyNetworks && Array.isArray(storyNetworks) && (
                <div className="flex items-center gap-4 mb-6">
                    <label className="text-blue-200 font-semibold">
                        Network:
                    </label>
                    <select
                        className="px-3 py-2 rounded bg-[#181c2b] text-white border border-blue-800 focus:outline-none"
                        value={selectedNetworkId}
                        onChange={handleNetworkChange}
                    >
                        <option value="">네트워크 선택</option>
                        {storyNetworks.map((network) => (
                            <option key={network.id} value={network.id}>
                                {network.name} ({network.chainId})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="w-full max-w-5xl z-10">
                {isLoadingEscrowWallets ? (
                    <div className="text-blue-200 text-center py-16">
                        지갑 목록을 불러오는 중입니다...
                    </div>
                ) : isErrorEscrowWallets ? (
                    <div className="text-red-400 text-center py-16">
                        지갑 목록을 불러오지 못했습니다.
                    </div>
                ) : !escrowWallets || escrowWallets.length === 0 ? (
                    <div className="text-blue-200 text-center py-16">
                        등록된 지갑이 없습니다.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl shadow-lg bg-[#23243a]/60">
                        <table className="min-w-full text-sm text-blue-100 divide-y divide-blue-900/40">
                            <thead>
                                <tr className="bg-[#23243a]/80 text-blue-300 divide-x divide-blue-900/40">
                                    <th className="px-4 py-3 text-center">
                                        지갑 주소
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        활성 여부
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        잔고
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        작업
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {escrowWallets.map((wallet) => (
                                    <tr
                                        key={wallet.address}
                                        className="divide-x divide-blue-900/40 hover:bg-blue-900/10 transition"
                                    >
                                        <td
                                            className="cursor-pointer px-4 py-2 font-mono text-center text-blue-200 bg-[#23243a]/60"
                                            onClick={() =>
                                                copyToClipboard(
                                                    wallet.address,
                                                    "지갑 주소가"
                                                )
                                            }
                                        >
                                            {wallet.address}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {wallet.isActive ? (
                                                <span className="text-green-400 font-semibold">
                                                    활성
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 font-semibold">
                                                    비활성
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-center text-blue-100">
                                            {walletBalances[wallet.address] !==
                                            undefined ? (
                                                walletBalances[wallet.address] +
                                                " IP"
                                            ) : (
                                                <span className="text-blue-400">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 flex justify-center items-center gap-2 bg-[#23243a]/50">
                                            <button
                                                className="p-2 rounded hover:bg-blue-900/30 text-blue-300 hover:text-blue-400 transition"
                                                onClick={() =>
                                                    handleToggleActive(
                                                        wallet.address,
                                                        wallet.isActive
                                                    )
                                                }
                                                disabled={
                                                    isPendingSetActiveEscrowWallet
                                                }
                                                title={
                                                    wallet.isActive
                                                        ? "비활성화"
                                                        : "활성화"
                                                }
                                            >
                                                {wallet.isActive ? (
                                                    <FaTimes />
                                                ) : (
                                                    <FaCheck />
                                                )}
                                            </button>
                                            <button
                                                className="p-2 rounded hover:bg-purple-900/30 text-purple-300 hover:text-purple-400 transition"
                                                onClick={() =>
                                                    handleShowPrivateKey(
                                                        wallet.address
                                                    )
                                                }
                                                disabled={
                                                    isPendingFetchEscrowWalletPrivateKey
                                                }
                                                title="프라이빗키 보기"
                                            >
                                                <FaKey />
                                            </button>
                                            <button
                                                className="p-2 rounded hover:bg-green-900/30 text-green-300 hover:text-green-400 transition"
                                                onClick={() =>
                                                    handleFetchBalance(
                                                        wallet.address
                                                    )
                                                }
                                                disabled={
                                                    isPendingFetchEscrowWalletsBalance
                                                }
                                                title="잔고 조회하기"
                                            >
                                                <FaEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* 프라이빗키 모달/토스트 등 */}
                        {showKey && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                                <div className="bg-[#23243a] rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <FaKey className="text-purple-400" />
                                        프라이빗키
                                    </h3>
                                    <div
                                        className="text-blue-200 font-mono break-all cursor-pointer"
                                        onClick={() =>
                                            copyToClipboard(
                                                privateKey ?? "",
                                                "프라이빗키가"
                                            )
                                        }
                                    >
                                        {privateKey}
                                    </div>
                                    <button
                                        className="mt-6 px-4 py-2 rounded bg-gray-700 text-blue-200 hover:bg-gray-600 transition"
                                        onClick={() => setShowKey(false)}
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Wallet Modal */}
            {showAddWalletModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-[#23243a] rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <FaWallet className="text-purple-400" />
                            에스크로 지갑 추가
                        </h3>
                        {createdWalletInfo ? (
                            <div className="mb-6">
                                <div className="mb-4 text-blue-200">
                                    <b>새 지갑이 생성되었습니다!</b>
                                    <br />
                                    아래 프라이빗키와 주소를 반드시 안전하게
                                    백업하세요.
                                    <br />
                                    <span className="text-red-400">
                                        (분실 시 복구 불가)
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <label className="block text-blue-200 mb-1 font-semibold">
                                        지갑 주소
                                    </label>
                                    <div
                                        className="font-mono bg-[#181c2b] text-blue-100 rounded px-3 py-2 break-all cursor-pointer"
                                        onClick={() =>
                                            copyToClipboard(
                                                createdWalletInfo.address,
                                                "지갑 주소가"
                                            )
                                        }
                                    >
                                        {createdWalletInfo.address}
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <label className="block text-blue-200 mb-1 font-semibold">
                                        프라이빗키
                                    </label>
                                    <div
                                        className="font-mono bg-[#181c2b] text-blue-100 rounded px-3 py-2 break-all cursor-pointer"
                                        onClick={() =>
                                            copyToClipboard(
                                                createdWalletInfo.privateKey,
                                                "프라이빗키가"
                                            )
                                        }
                                    >
                                        {createdWalletInfo.privateKey}
                                    </div>
                                </div>
                                <div className="text-xs text-blue-400 mt-2">
                                    프라이빗키는 절대 외부에 노출되지 않도록
                                    주의하세요.
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        className="px-4 py-2 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
                                        onClick={handleAddWalletModalClose}
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-4 mb-6">
                                    <button
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-150 ${
                                            addWalletMode === "privateKey"
                                                ? "bg-blue-700 text-white"
                                                : "bg-gray-700 text-blue-200"
                                        }`}
                                        onClick={() =>
                                            setAddWalletMode("privateKey")
                                        }
                                        disabled={isAddWalletLoading}
                                    >
                                        프라이빗키로 등록
                                    </button>
                                </div>
                                {addWalletMode === "random" ? (
                                    <div className="mb-6 text-blue-200">
                                        <p>
                                            새로운 랜덤 에스크로 지갑을
                                            생성합니다.
                                            <br />
                                            생성된 프라이빗키는 반드시 안전하게
                                            보관하세요.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mb-6">
                                        <label className="block text-blue-200 mb-2 font-semibold">
                                            프라이빗키 입력
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 rounded bg-[#181c2b] text-white border border-blue-800 focus:outline-none font-mono"
                                            placeholder="0x..."
                                            value={inputPrivateKey}
                                            onChange={(e) =>
                                                setInputPrivateKey(
                                                    e.target.value
                                                )
                                            }
                                            disabled={isAddWalletLoading}
                                        />
                                        <p className="text-xs text-blue-400 mt-2">
                                            프라이빗키는 절대 외부에 노출되지
                                            않도록 주의하세요.
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        className="px-4 py-2 rounded bg-gray-700 text-blue-200 hover:bg-gray-600 transition"
                                        onClick={handleAddWalletModalClose}
                                        disabled={isAddWalletLoading}
                                    >
                                        취소
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
                                        disabled={
                                            isAddWalletLoading ||
                                            (addWalletMode === "privateKey" &&
                                                !inputPrivateKey)
                                        }
                                        onClick={handleAddWallet}
                                    >
                                        {isAddWalletLoading
                                            ? "처리중..."
                                            : addWalletMode === "random"
                                            ? "지갑 생성"
                                            : "등록하기"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
