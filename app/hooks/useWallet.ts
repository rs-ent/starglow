/// app\hooks\useWallet.ts

"use client";

import { useWalletsByUserIdQuery } from "../queries/walletQueries";
import type { Wallet } from "@prisma/client";
import { useState, useEffect } from "react";

interface UseWalletReturn {
    wallets: Wallet[] | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    defaultWallet: Wallet | undefined;
    getWalletByAddress: (address: string) => Wallet | undefined;
}

export function useWalletsByUserId(userId: string): UseWalletReturn {
    const { data, isLoading, isError, error } = useWalletsByUserIdQuery(userId);

    const wallets = data?.success ? data.wallets : undefined;

    // 기본 지갑 찾기
    const defaultWallet = wallets?.find((wallet) => wallet.default);

    // 주소로 지갑 찾기 헬퍼 함수
    const getWalletByAddress = (address: string) => {
        return wallets?.find((wallet) => wallet.address === address);
    };

    return {
        wallets,
        isLoading,
        isError,
        error,
        defaultWallet,
        getWalletByAddress,
    };
}

// 선택된 지갑 관리를 위한 추가 훅
export function useSelectedWallet(userId: string) {
    const [selectedAddress, setSelectedAddress] = useState<string>("");
    const { wallets, defaultWallet } = useWalletsByUserId(userId);

    useEffect(() => {
        // 기본 지갑이 있으면 자동 선택
        if (defaultWallet && !selectedAddress) {
            setSelectedAddress(defaultWallet.address);
        }
    }, [defaultWallet, selectedAddress]);

    return {
        selectedAddress,
        setSelectedAddress,
        selectedWallet: wallets?.find((w) => w.address === selectedAddress),
        wallets,
    };
}
