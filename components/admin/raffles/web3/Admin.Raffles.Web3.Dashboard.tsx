"use client";

import { useState } from "react";
import { FaRocket, FaCog, FaArrowLeft, FaPlus } from "react-icons/fa";
import { SiEthereum } from "react-icons/si";
import { TbTopologyStar3 } from "react-icons/tb";

import AdminRafflesWeb3Deploy from "./Admin.Raffles.Web3.Deploy";
import AdminRafflesWeb3Contracts from "./Admin.Raffles.Web3.Contracts";
import { AdminRafflesWeb3CreateManager } from "./Admin.Raffles.Web3.Create.Manager";

interface Props {
    onBack: () => void;
}

type DeploymentMode = "deploy" | "manage" | "create" | null;

export default function AdminRafflesWeb3Dashboard({ onBack }: Props) {
    const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>(null);

    const handleBack = () => {
        if (deploymentMode) {
            setDeploymentMode(null);
        } else {
            onBack();
        }
    };

    if (deploymentMode === "deploy") {
        return <AdminRafflesWeb3Deploy onBack={handleBack} />;
    }

    if (deploymentMode === "manage") {
        return <AdminRafflesWeb3Contracts onBack={handleBack} />;
    }

    if (deploymentMode === "create") {
        return <AdminRafflesWeb3CreateManager onBack={handleBack} />;
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 left-[-2rem] top-[-4rem] pointer-events-none select-none" />
            <SiEthereum className="absolute text-[8rem] text-pink-800/10 right-[-2rem] bottom-[-2rem] pointer-events-none select-none" />

            <h1 className="mb-8 text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl flex items-center gap-3">
                Web3 <span className="text-purple-400">래플</span>
            </h1>

            <p className="mb-8 text-lg text-gray-300 text-center">
                블록체인 기반 래플 관리
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    className="flex flex-col items-center gap-4 px-12 py-8 bg-gradient-to-r from-purple-700 via-pink-700 to-red-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-red-700 hover:to-purple-700 transition-all duration-200 text-xl tracking-wide border border-purple-500/30"
                    onClick={() => setDeploymentMode("deploy")}
                >
                    <FaRocket className="text-4xl" />
                    <span>컨트랙트 배포</span>
                    <span className="text-sm text-gray-200 font-normal">
                        새 래플 컨트랙트 배포
                    </span>
                </button>

                <button
                    className="flex flex-col items-center gap-4 px-12 py-8 bg-gradient-to-r from-green-700 via-blue-700 to-purple-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-purple-700 hover:to-green-700 transition-all duration-200 text-xl tracking-wide border border-green-500/30"
                    onClick={() => setDeploymentMode("create")}
                >
                    <FaPlus className="text-4xl" />
                    <span>래플 생성</span>
                    <span className="text-sm text-gray-200 font-normal">
                        새로운 래플 만들기
                    </span>
                </button>

                <button
                    className="flex flex-col items-center gap-4 px-12 py-8 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white font-bold rounded-xl shadow-xl hover:scale-105 hover:from-pink-700 hover:to-blue-700 transition-all duration-200 text-xl tracking-wide border border-blue-500/30"
                    onClick={() => setDeploymentMode("manage")}
                >
                    <FaCog className="text-4xl" />
                    <span>컨트랙트 관리</span>
                    <span className="text-sm text-gray-200 font-normal">
                        기존 컨트랙트 설정
                    </span>
                </button>
            </div>

            <button
                className="mt-8 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                onClick={onBack}
            >
                <FaArrowLeft />
                래플 관리자로 돌아가기
            </button>
        </div>
    );
}
