/// app/hooks/web3/useCollection.ts

import { useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { abi as COLLECTION_ABI } from "@/web3/artifacts/contracts/Collection.sol/Collection.json";
import { bigint } from "zod";

const COLLECTION_ADDRESS = process.env.COLLECTION_ADDRESS;

export function useCollection() {
    // 민팅 상태 읽기
    const { data: mintingEnabled } = useReadContract({
        abi: COLLECTION_ABI,
        address: COLLECTION_ADDRESS as `0x${string}`,
        functionName: "mintingEnabled",
    });

    // 컨트랙트 write 함수
    const { writeContract, isPending } = useWriteContract();

    // 새로운 컬렉션 생성
    const createCollection = async ({
        name,
        symbol,
        initialOwner,
        maxSupply,
        mintPrice,
        baseURI,
        contractURI,
    }: {
        name: string;
        symbol: string;
        initialOwner: `0x${string}`;
        maxSupply: bigint;
        mintPrice: bigint;
        baseURI: string;
        contractURI: string;
    }) => {
        return writeContract({
            abi: COLLECTION_ABI,
            address: COLLECTION_ADDRESS as `0x${string}`,
            functionName: "createCollection",
            args: [
                name,
                symbol,
                initialOwner,
                maxSupply,
                mintPrice,
                baseURI,
                contractURI,
            ],
        });
    };

    // 배치 민팅 함수
    const mint = async (to: string, quantity: number) => {
        if (!mintingEnabled) {
            throw new Error("Minting is not enabled");
        }

        return writeContract({
            abi: COLLECTION_ABI,
            address: COLLECTION_ADDRESS as `0x${string}`,
            functionName: "batchMint",
            args: [to, BigInt(quantity), BigInt(0)],
        });
    };

    return {
        mintingEnabled,
        createCollection,
        mint,
        isPending,
    };
}
