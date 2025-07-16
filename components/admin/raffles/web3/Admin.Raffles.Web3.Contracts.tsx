"use client";

import {
    FaCog,
    FaArrowLeft,
    FaPlay,
    FaPause,
    FaUserShield,
    FaEye,
} from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

interface Props {
    onBack: () => void;
}

interface ContractInfo {
    address: string;
    network: string;
    deployedAt: string;
    status: "active" | "paused";
    totalRaffles: number;
    totalParticipants: number;
}

export default function AdminRafflesWeb3Contracts({ onBack }: Props) {
    const mockContracts: ContractInfo[] = [
        {
            address: "0x1234...5678",
            network: "Story Protocol Testnet",
            deployedAt: "2024-01-15",
            status: "active",
            totalRaffles: 5,
            totalParticipants: 123,
        },
        {
            address: "0xabcd...efgh",
            network: "Story Protocol Mainnet",
            deployedAt: "2024-01-20",
            status: "paused",
            totalRaffles: 2,
            totalParticipants: 45,
        },
    ];

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[8rem] text-pink-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            <h1 className="mb-8 text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                컨트랙트 <span className="text-purple-400">관리</span>
            </h1>

            <div className="w-full max-w-6xl bg-black/20 rounded-xl p-8 border border-purple-500/20">
                <div className="space-y-8">
                    <div className="text-center">
                        <FaCog className="text-6xl text-blue-400 mx-auto mb-4" />
                        <p className="text-gray-300 text-lg mb-6">
                            배포된 래플 컨트랙트를 관리합니다
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4 text-lg">
                                배포된 컨트랙트 목록
                            </h3>
                            <div className="space-y-4">
                                {mockContracts.map((contract, index) => (
                                    <div
                                        key={index}
                                        className="bg-black/40 rounded-lg p-4 border border-gray-600"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${
                                                        contract.status ===
                                                        "active"
                                                            ? "bg-green-400"
                                                            : "bg-red-400"
                                                    }`}
                                                ></div>
                                                <span className="text-white font-medium">
                                                    {contract.address}
                                                </span>
                                                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                                    {contract.network}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                    title="상세보기"
                                                >
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button
                                                    className={`p-2 text-white rounded transition-colors ${
                                                        contract.status ===
                                                        "active"
                                                            ? "bg-orange-600 hover:bg-orange-700"
                                                            : "bg-green-600 hover:bg-green-700"
                                                    }`}
                                                    title={
                                                        contract.status ===
                                                        "active"
                                                            ? "일시정지"
                                                            : "재개"
                                                    }
                                                >
                                                    {contract.status ===
                                                    "active" ? (
                                                        <FaPause className="text-sm" />
                                                    ) : (
                                                        <FaPlay className="text-sm" />
                                                    )}
                                                </button>
                                                <button
                                                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                                                    title="관리자 관리"
                                                >
                                                    <FaUserShield className="text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">
                                                    배포일:
                                                </span>
                                                <span className="text-white ml-2">
                                                    {contract.deployedAt}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">
                                                    총 래플:
                                                </span>
                                                <span className="text-white ml-2">
                                                    {contract.totalRaffles}개
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">
                                                    총 참여자:
                                                </span>
                                                <span className="text-white ml-2">
                                                    {contract.totalParticipants}
                                                    명
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {mockContracts.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400">
                                            배포된 컨트랙트가 없습니다
                                        </p>
                                        <p className="text-gray-500 text-sm mt-2">
                                            새 컨트랙트를 배포해보세요
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg">
                                    컨트랙트 상태
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            활성 컨트랙트
                                        </span>
                                        <span className="text-green-400 font-medium">
                                            {
                                                mockContracts.filter(
                                                    (c) => c.status === "active"
                                                ).length
                                            }
                                            개
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            일시정지
                                        </span>
                                        <span className="text-red-400 font-medium">
                                            {
                                                mockContracts.filter(
                                                    (c) => c.status === "paused"
                                                ).length
                                            }
                                            개
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            총 컨트랙트
                                        </span>
                                        <span className="text-white font-medium">
                                            {mockContracts.length}개
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg">
                                    관리 작업
                                </h3>
                                <div className="space-y-3">
                                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                                        관리자 추가
                                    </button>
                                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                                        일괄 일시정지
                                    </button>
                                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                                        일괄 재개
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-white font-semibold mb-4 text-lg">
                                    통계
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            총 래플
                                        </span>
                                        <span className="text-white">
                                            {mockContracts.reduce(
                                                (sum, c) =>
                                                    sum + c.totalRaffles,
                                                0
                                            )}
                                            개
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            총 참여자
                                        </span>
                                        <span className="text-white">
                                            {mockContracts.reduce(
                                                (sum, c) =>
                                                    sum + c.totalParticipants,
                                                0
                                            )}
                                            명
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">
                                            평균 참여율
                                        </span>
                                        <span className="text-white">85%</span>
                                    </div>
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
