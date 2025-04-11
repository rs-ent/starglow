/// app/hooks/useCollectionFactory.ts

"use client";

import {
    FACTORY_ABI,
    FACTORY_ADDRESS,
} from "../blockchain/abis/CollectionFactory";
import {
    useWriteContract,
    useReadContract,
    useWaitForTransactionReceipt,
    useConfig,
    useGasPrice,
    useBlockNumber,
    useAccount,
} from "wagmi";
import {
    parseEther,
    type Address,
    formatEther,
    formatGwei,
    encodeFunctionData,
} from "viem";
import { readContract, estimateGas } from "wagmi/actions";
import { useState } from "react";

// 디버깅용 로그 추가
console.log("[useCollectionFactory] FACTORY_ADDRESS:", FACTORY_ADDRESS);
if (
    !FACTORY_ADDRESS ||
    FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000"
) {
    console.warn(
        "[useCollectionFactory] FACTORY_ADDRESS is not set or is invalid"
    );
}

export interface CreateCollectionParams {
    name: string;
    symbol: string;
    maxSupply: number;
    mintPrice: number;
    baseURI: string;
    contractURI: string;
    gasPrice?: bigint; // 가스 가격 설정 (Gwei) - 선택사항
}

export interface UseCollectionFactoryReturn {
    createCollection: (params: CreateCollectionParams) => Promise<void>;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: Error | null;
    transactionHash: Address | undefined;

    isConfirming: boolean;
    isConfirmed: boolean;

    collections: Address[] | undefined;
    isLoading: boolean;
    getCollectionByName: (name: string) => Promise<Address | undefined>;

    // 가스 관련 추가 속성
    estimateGas: (
        params: CreateCollectionParams
    ) => Promise<bigint | undefined>;
    estimatedGasAmount: bigint | undefined;
    isEstimating: boolean;
    estimateError: Error | null;
    gasPrice: bigint | undefined;
    gasPriceInGwei: string;
    gasFeeInEth: string;

    // 트랜잭션 시간 예측 관련
    estimatedTimeInSeconds: number | undefined;
    estimatedTimeText: string;
    networkCongestion: "low" | "medium" | "high" | "unknown";
}

export function useCollectionFactory(): UseCollectionFactoryReturn {
    const config = useConfig();

    const address = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as Address; // 여기에 실제 지갑 주소 입력
    const isConnected = true;

    const {
        writeContract,
        isPending,
        isSuccess,
        isError,
        error,
        data: hash,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const { data: collections, isLoading } = useReadContract({
        address: FACTORY_ADDRESS as Address,
        abi: FACTORY_ABI,
        functionName: "getCollections",
    });

    // 가스 가격 조회
    const { data: gasPrice } = useGasPrice();

    // 최신 블록 정보 가져오기
    const { data: blockNumber } = useBlockNumber();

    // 가스 예측 상태
    const [estimatedGasAmount, setEstimatedGasAmount] = useState<bigint>();
    const [isEstimating, setIsEstimating] = useState(false);
    const [estimateError, setEstimateError] = useState<Error | null>(null);

    // 가스 가격 포맷팅
    const gasPriceInGwei = gasPrice ? formatGwei(gasPrice) : "0";

    // 예상 가스비 계산 (ETH 단위)
    const gasFeeInEth =
        gasPrice && estimatedGasAmount
            ? formatEther(gasPrice * estimatedGasAmount)
            : "0";

    // 현재 네트워크 혼잡도 추정
    const networkCongestion = (): "low" | "medium" | "high" | "unknown" => {
        if (!gasPrice) return "unknown";

        const gasPriceInGweiNumber = Number(gasPriceInGwei);

        if (gasPriceInGweiNumber < 30) return "low";
        if (gasPriceInGweiNumber < 100) return "medium";
        return "high";
    };

    // 예상 트랜잭션 시간 계산 (초 단위)
    const calculateEstimatedTime = (): number | undefined => {
        if (!gasPrice) return undefined;

        const congestion = networkCongestion();

        // 가스 가격에 따른 대략적인 예상 시간 (초 단위)
        switch (congestion) {
            case "low":
                return 15; // 약 15초 (1블록)
            case "medium":
                return 60; // 약 1분 (4블록)
            case "high":
                return 300; // 약 5분 (20블록)
            default:
                return undefined;
        }
    };

    // 사용자 친화적인 시간 표시
    const formatEstimatedTime = (seconds: number | undefined): string => {
        if (!seconds) return "알 수 없음";

        if (seconds < 60) return `약 ${seconds}초`;
        if (seconds < 3600) {
            const minutes = Math.round(seconds / 60);
            return `약 ${minutes}분`;
        }

        const hours = Math.round(seconds / 3600);
        return `약 ${hours}시간`;
    };

    // 계산된 예상 시간
    const estimatedTimeInSeconds = calculateEstimatedTime();
    const estimatedTimeText = formatEstimatedTime(estimatedTimeInSeconds);

    /**
     * 컬렉션 생성에 필요한 가스비 추정
     */
    const estimateCollectionGas = async (
        params: CreateCollectionParams
    ): Promise<bigint | undefined> => {
        try {
            setIsEstimating(true);
            setEstimateError(null);

            // 간단한 하드코딩된 가스 추정값 사용
            const estimatedGas = 1000000n;
            setEstimatedGasAmount(estimatedGas);
            return estimatedGas;
        } catch (error) {
            console.error("Failed to estimate gas", error);
            setEstimateError(
                error instanceof Error ? error : new Error(String(error))
            );
            return undefined;
        } finally {
            setIsEstimating(false);
        }
    };

    /**
     * 새로운 NFT 컬렉션 생성
     * @param params 컬렉션 생성에 필요한 파라미터
     */
    const createCollection = async (params: CreateCollectionParams) => {
        try {
            console.log("컬렉션 생성 요청:", params);
            console.log("FACTORY_ADDRESS:", FACTORY_ADDRESS);
            console.log("하드코딩된 지갑 주소:", address);

            // 개발 모드에서는 성공한 것으로 처리
            alert("개발 모드: 실제 트랜잭션은 전송되지 않았습니다.");
        } catch (error) {
            console.error("Failed to create collection", error);
            throw error;
        }
    };

    /**
     * 이름으로 컬렉션 주소 조회
     * @param name 컬렉션 이름
     * @returns 컬렉션 컨트랙트 주소
     */
    const getCollectionByName = async (
        name: string
    ): Promise<Address | undefined> => {
        try {
            const address = await readContract(config, {
                address: FACTORY_ADDRESS as Address,
                abi: FACTORY_ABI,
                functionName: "collectionsByName",
                args: [name],
            });

            if (address === "0x0000000000000000000000000000000000000000") {
                return undefined;
            }

            return address as Address;
        } catch (error) {
            console.error("Failed to get collection by name", error);
            return undefined;
        }
    };

    return {
        createCollection,
        isPending,
        isSuccess,
        isError,
        error,
        transactionHash: hash,
        isConfirming,
        isConfirmed,
        collections: collections as Address[] | undefined,
        isLoading,
        getCollectionByName,
        // 가스 관련 필드 추가
        estimateGas: estimateCollectionGas,
        estimatedGasAmount,
        isEstimating,
        estimateError,
        gasPrice,
        gasPriceInGwei,
        gasFeeInEth,
        // 트랜잭션 시간 예측 관련 필드
        estimatedTimeInSeconds,
        estimatedTimeText,
        networkCongestion: networkCongestion(),
    };
}
