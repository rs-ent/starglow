"use client";

import { FaChartLine, FaExclamationTriangle } from "react-icons/fa";

export default function AdminRafflesWeb3Simulation() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30">
            <div className="text-center">
                <FaChartLine className="text-8xl text-purple-400 mx-auto mb-6" />
                <h1 className="text-4xl font-extrabold text-white mb-4">
                    V2 래플 <span className="text-purple-400">시뮬레이션</span>
                </h1>

                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6 max-w-md">
                    <div className="flex items-center gap-3 mb-3">
                        <FaExclamationTriangle
                            className="text-yellow-400"
                            size={20}
                        />
                        <span className="text-yellow-400 font-medium">
                            개발 중
                        </span>
                    </div>
                    <p className="text-yellow-300 text-sm">
                        RafflesV2 시뮬레이션 기능은 현재 개발 중입니다.
                        <br />
                        향후 업데이트에서 제공될 예정입니다.
                    </p>
                </div>

                <div className="mt-8 text-gray-400">
                    <p className="text-sm">
                        시뮬레이션 기능이 준비되면 다음을 제공합니다:
                    </p>
                    <ul className="text-xs mt-2 space-y-1">
                        <li>• 래플 결과 예측</li>
                        <li>• 참가자 분포 분석</li>
                        <li>• 상품 배분 시뮬레이션</li>
                        <li>• 수익성 분석</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
