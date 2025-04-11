/// components/atoms/MetaMaskButton.tsx

"use client";

import { useMetaMask } from "@/app/hooks/useMetaMask";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface MetaMaskButtonProps {
    className?: string;
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
}

export default function MetaMaskButton({
    className = "",
    onConnect,
    onDisconnect,
}: MetaMaskButtonProps) {
    const {
        connect,
        disconnect,
        isConnected,
        address,
        formattedBalance,
        isPending,
        isUnsupportedChain,
        switchToDefaultChain,
        error,
        clearError,
        isMetaMaskInstalled,
        chainId,
        supportedChains,
    } = useMetaMask();

    const [showDetails, setShowDetails] = useState(false);

    // 연결 상태가 변경될 때 콜백 호출
    useEffect(() => {
        if (isConnected && address && onConnect) {
            onConnect(address);
        } else if (!isConnected && onDisconnect) {
            onDisconnect();
        }
    }, [isConnected, address, onConnect, onDisconnect]);

    // 지갑이 연결되어 있지 않은 경우: 연결 버튼 표시
    if (!isConnected) {
        return (
            <div className={`flex flex-col gap-2 ${className}`}>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
                        <p className="text-red-600 text-sm">{error.message}</p>
                        <button
                            onClick={clearError}
                            className="text-xs text-red-500 mt-1 hover:underline"
                        >
                            닫기
                        </button>
                    </div>
                )}

                {!isMetaMaskInstalled ? (
                    <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-md hover:bg-orange-200 transition-colors"
                    >
                        <Image
                            src="/icons/blockchain/metamask.svg"
                            alt="MetaMask"
                            width={24}
                            height={24}
                        />
                        MetaMask 설치하기
                    </a>
                ) : (
                    <button
                        onClick={connect}
                        disabled={isPending}
                        className="flex items-center justify-center gap-2 bg-[#F6851B] text-white px-4 py-2 rounded-md hover:bg-[#E2761B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                연결 중...
                            </>
                        ) : (
                            <>
                                <Image
                                    src="/icons/blockchain/metamask.svg"
                                    alt="MetaMask"
                                    width={24}
                                    height={24}
                                />
                                MetaMask 연결하기
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    }

    // 지갑이 연결되어 있는 경우: 계정 정보와 연결 해제 버튼 표시
    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors"
            >
                <Image
                    src="/metamask-fox.svg"
                    alt="MetaMask"
                    width={20}
                    height={20}
                />
                <span className="font-medium">
                    {address?.substring(0, 6)}...
                    {address?.substring(address.length - 4)}
                </span>
                <span className="text-sm text-gray-500">
                    {formattedBalance}
                </span>
            </button>

            {showDetails && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg p-4 w-72 z-10">
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">지갑 주소</p>
                        <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
                            {address}
                        </p>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">네트워크</p>
                        <p className="flex items-center">
                            <span
                                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                    isUnsupportedChain
                                        ? "bg-red-500"
                                        : "bg-green-500"
                                }`}
                            ></span>
                            {(chainId &&
                                supportedChains.find(
                                    (chain) => chain.id === chainId
                                )?.name) ||
                                "알 수 없는 네트워크"}
                        </p>

                        {isUnsupportedChain && (
                            <button
                                onClick={switchToDefaultChain}
                                className="text-sm text-blue-600 hover:underline mt-1"
                            >
                                지원되는 네트워크로 전환
                            </button>
                        )}
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                        <button
                            onClick={() => {
                                disconnect();
                                setShowDetails(false);
                            }}
                            className="text-sm text-red-600 hover:underline"
                        >
                            지갑 연결 해제
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
