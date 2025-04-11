/// app/hooks/useMetaMask.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useBalance,
    useSwitchChain,
    useConfig,
    useChainId,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { formatEther } from "viem";
import { mainnet, sepolia } from "wagmi/chains";

// 애플리케이션에서 지원하는 체인 목록
const SUPPORTED_CHAINS = [mainnet, sepolia];
const DEFAULT_CHAIN = sepolia; // 테스트넷을 기본값으로 설정

interface UseMetaMaskReturn {
    // 지갑 연결 상태
    address: string | undefined;
    isConnected: boolean;

    // 지갑 잔액
    balance: string;
    formattedBalance: string;
    isBalanceLoading: boolean;

    // 연결 관련 함수 및 상태
    connect: () => Promise<void>;
    disconnect: () => void;
    isPending: boolean;
    isConnecting: boolean;
    isDisconnecting: boolean;

    // 체인 관련
    chainId: number | undefined;
    isUnsupportedChain: boolean;
    switchToDefaultChain: () => Promise<void>;
    isSwitchingChain: boolean;
    supportedChains: typeof SUPPORTED_CHAINS;

    // 오류 관련
    error: Error | null;
    clearError: () => void;

    // MetaMask 관련
    isMetaMaskInstalled: boolean;
}

export function useMetaMask(): UseMetaMaskReturn {
    const [error, setError] = useState<Error | null>(null);
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] =
        useState<boolean>(false);

    // wagmi 설정 및 현재 체인 ID
    const config = useConfig();
    const currentChainId = useChainId();

    // 지갑 계정 정보
    const { address, isConnected, chainId } = useAccount();

    // 지갑 연결/해제 훅
    const {
        connectAsync,
        status: connectStatus,
        error: connectError,
    } = useConnect();
    const { disconnectAsync, status: disconnectStatus } = useDisconnect();

    // 체인 전환 훅
    const {
        switchChainAsync,
        status: switchChainStatus,
        error: switchChainError,
    } = useSwitchChain();

    // 지갑 잔액 정보
    const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
        address: address,
    });

    // 지원하지 않는 체인인지 확인
    const isUnsupportedChain =
        chainId !== undefined &&
        !SUPPORTED_CHAINS.some((chain) => chain.id === chainId);

    // 초기화 시 MetaMask 설치 여부 확인
    useEffect(() => {
        const checkMetaMaskInstalled = () => {
            // @ts-ignore - ethereum 전역 객체는 타입스크립트에 정의되어 있지 않음
            const isInstalled =
                typeof window !== "undefined" &&
                window.ethereum &&
                // @ts-ignore
                window.ethereum.isMetaMask;
            setIsMetaMaskInstalled(!!isInstalled);
        };

        checkMetaMaskInstalled();
    }, []);

    // 연결 오류 업데이트
    useEffect(() => {
        if (connectError) {
            setError(connectError);
        }
    }, [connectError]);

    // 체인 전환 오류 업데이트
    useEffect(() => {
        if (switchChainError) {
            setError(switchChainError);
        }
    }, [switchChainError]);

    // 오류 초기화
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // 지갑 연결 함수
    const connect = useCallback(async () => {
        try {
            setError(null);

            if (!isMetaMaskInstalled) {
                throw new Error(
                    "MetaMask가 설치되어 있지 않습니다. MetaMask를 설치한 후 다시 시도해주세요."
                );
            }

            await connectAsync({ connector: injected() });

            // 연결 후 지원하지 않는 체인이면 기본 체인으로 전환 안내
            if (isUnsupportedChain) {
                console.warn(
                    "지원하지 않는 체인에 연결되었습니다. 기본 체인으로 전환해주세요."
                );
            }
        } catch (err) {
            // 사용자가 거부한 경우와 다른 오류 구분
            if (err instanceof Error && err.message.includes("User rejected")) {
                setError(new Error("사용자가 지갑 연결을 거부했습니다."));
            } else {
                setError(err instanceof Error ? err : new Error(String(err)));
            }
            console.error("MetaMask 연결 오류:", err);
        }
    }, [connectAsync, isMetaMaskInstalled, isUnsupportedChain]);

    // 지갑 연결 해제 함수
    const disconnect = useCallback(async () => {
        try {
            await disconnectAsync();
        } catch (err) {
            console.error("MetaMask 연결 해제 오류:", err);
        }
    }, [disconnectAsync]);

    // 기본 체인으로 전환 함수
    const switchToDefaultChain = useCallback(async () => {
        try {
            if (!isConnected) {
                throw new Error(
                    "지갑이 연결되어 있지 않습니다. 먼저 지갑을 연결해주세요."
                );
            }

            await switchChainAsync({ chainId: DEFAULT_CHAIN.id });
        } catch (err) {
            if (err instanceof Error && err.message.includes("User rejected")) {
                setError(new Error("사용자가 체인 전환을 거부했습니다."));
            } else {
                setError(err instanceof Error ? err : new Error(String(err)));
            }
            console.error("체인 전환 오류:", err);
        }
    }, [isConnected, switchChainAsync]);

    // 잔액 포맷팅
    const formattedBalance = balanceData
        ? `${parseFloat(formatEther(balanceData.value)).toFixed(4)} ${
              balanceData.symbol
          }`
        : "0 ETH";

    return {
        // 지갑 연결 상태
        address,
        isConnected,

        // 지갑 잔액
        balance: balanceData ? formatEther(balanceData.value) : "0",
        formattedBalance,
        isBalanceLoading,

        // 연결 관련 함수 및 상태
        connect,
        disconnect,
        isPending: connectStatus === "pending",
        isConnecting:
            connectStatus === "success" || connectStatus === "pending",
        isDisconnecting:
            disconnectStatus === "success" || disconnectStatus === "pending",

        // 체인 관련
        chainId,
        isUnsupportedChain,
        switchToDefaultChain,
        isSwitchingChain: switchChainStatus === "pending",
        supportedChains: SUPPORTED_CHAINS,

        // 오류 관련
        error,
        clearError,

        // MetaMask 관련
        isMetaMaskInstalled,
    };
}
