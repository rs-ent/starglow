/// app\actions\nftTransfer.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    createPublicClient,
    createWalletClient,
    http,
    Chain,
    defineChain,
    Address,
    getContract,
} from "viem";
import { getEscrowWallet, getTokensByOwner } from "./collectionContracts";
import { privateKeyToAccount } from "viem/accounts";
import { decryptPrivateKey } from "@/lib/utils/encryption";
import { getTokenOwners, transferTokens } from "./collectionContracts";
import { ethers, BytesLike } from "ethers";
import {
    BlockchainNetwork,
    CollectionContract,
    EscrowWallet,
} from "@prisma/client";
import { getChain, getWalletBalance } from "./blockchain";
import collectionJson from "@/web3/artifacts/contracts/Collection.sol/Collection.json";
const abi = collectionJson.abi;

// 로깅 유틸리티 직접 정의
const logger = {
    info: (message: string, data?: any) => {
        console.log(`[INFO] ${message}`, data);
    },
    error: (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error);
    },
};

export interface TransferNFTInput {
    paymentId: string;
    userId: string;
}

export interface TransferNFTSuccess {
    success: true;
    data: {
        txHash: string;
        receiverAddress: string;
        networkName?: string;
        transferDetails?: {
            from: string;
            to: string;
            tokenId: string;
            networkId: string;
            networkName: string;
            escrowWalletId: string;
        };
    };
}

export interface TransferNFTError {
    success: false;
    error: {
        code:
            | "PAYMENT_NOT_FOUND"
            | "UNAUTHORIZED"
            | "INVALID_PAYMENT_STATUS"
            | "TRANSFER_FAILED"
            | "WALLET_NOT_FOUND"
            | "ESCROW_WALLET_NOT_FOUND"
            | "INSUFFICIENT_BALANCE"
            | "NETWORK_NOT_FOUND"
            | "COLLECTION_NOT_FOUND"
            | "INVALID_SIGNATURE";
        message: string;
        details?: any;
    };
}

export type TransferNFTResponse = TransferNFTSuccess | TransferNFTError;

export async function transferNFTToUser(
    input: TransferNFTInput
): Promise<TransferNFTResponse> {
    const scope = createLogScope("transferNFTToUser", {
        paymentId: input.paymentId,
        userId: input.userId,
    });

    try {
        // 1. 결제 정보 조회
        const payment = await prisma.payment.findUnique({
            where: { id: input.paymentId },
        });

        if (!payment) {
            scope.log("Payment not found");
            return {
                success: false,
                error: {
                    code: "PAYMENT_NOT_FOUND",
                    message: "Payment not found",
                },
            };
        }

        // 2. 권한 검증
        if (payment.userId !== input.userId) {
            scope.log("Unauthorized transfer attempt");
            return {
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Unauthorized transfer attempt",
                },
            };
        }

        // 3. 수신 지갑 주소 확인
        if (!payment.receiverWalletAddress) {
            scope.log("Receiver wallet address not found");
            return {
                success: false,
                error: {
                    code: "WALLET_NOT_FOUND",
                    message: "Receiver wallet address not found",
                },
            };
        }

        // 4. NFT 및 컬렉션 정보 조회
        const collection = await prisma.collectionContract.findFirst({
            where: { id: payment.productId },
            include: { network: true },
        });

        if (!collection) {
            scope.log("Collection not found");
            return {
                success: false,
                error: {
                    code: "COLLECTION_NOT_FOUND",
                    message: "Collection data not found",
                },
            };
        }

        // 5. 에스크로 지갑 조회 (컬렉션의 creator address 사용)
        const escrowWallet = await prisma.escrowWallet.findUnique({
            where: {
                address: collection.creatorAddress,
            },
        });

        if (!escrowWallet) {
            return {
                success: false,
                error: {
                    code: "ESCROW_WALLET_NOT_FOUND",
                    message: "No escrow wallet found for collection creator",
                },
            };
        }

        // 5. 온체인에서 에스크로 지갑이 소유한 NFT 조회 (Source of Truth)
        const tokenOwners = await getTokenOwners({
            collectionAddress: collection.address,
        });

        console.log("tokenOwners", tokenOwners);
        
        const ownerTokenIds: number[] = [];
        tokenOwners.owners.forEach((owner, idx) => {
            if (owner.toLowerCase() === escrowWallet.address.toLowerCase()) {
                ownerTokenIds.push(tokenOwners.tokenIds[idx]);
            }
        });

        if (ownerTokenIds.length < payment.quantity) {
            scope.log("Not enough available NFTs for transfer on-chain", {
                required: payment.quantity,
                available: ownerTokenIds.length,
                error: "Not enough available NFTs for transfer on-chain",
            });
            return {
                success: false,
                error: {
                    code: "TRANSFER_FAILED",
                    message: `Not enough available NFTs on-chain. Required: ${payment.quantity}, Available: ${ownerTokenIds.length}`,
                    details: "Not enough available NFTs for transfer on-chain",
                },
            };
        }

        scope.log("ownerTokenIds", { ownerTokenIds });
        scope.log("payment.quantity", { payment });
        scope.log("Enough to proceed", {
            ownerTokenIds: ownerTokenIds.length,
            paymentQuantity: payment.quantity,
        });
        const tokenIds = ownerTokenIds.slice(0, payment.quantity);
        scope.log("Proceeding with tokenIds", { tokenIds });

        // 6. transferTokens 호출
        const result = await transferTokens({
            collectionAddress: collection.address,
            fromAddress: escrowWallet.address,
            spenderAddress: escrowWallet.address,
            toAddress: payment.receiverWalletAddress,
            tokenIds: tokenIds, // DB 또는 온체인에서 조회한 토큰 ID 사용
        });

        if (!result.success) {
            return {
                success: false,
                error: {
                    code: "TRANSFER_FAILED",
                    message: result.error || "Transfer failed",
                },
            };
        }

        // 8. DB 업데이트를 병렬로 처리
        await Promise.all([
            // NFT 소유자 정보 업데이트
            prisma.nFT.updateMany({
                where: {
                    collectionId: collection.id,
                    tokenId: { in: tokenIds },
                },
                data: {
                    ownerAddress: payment.receiverWalletAddress!,
                    currentOwnerAddress: payment.receiverWalletAddress!,
                    transferCount: {
                        increment: 1,
                    },
                    lastTransferredAt: new Date(),
                },
            }),
            // 결제 상태 업데이트
            prisma.payment.update({
                where: { id: payment.id },
                data: {
                    postProcessResult: {
                        type: "NFT_TRANSFER",
                        success: true,
                        txHash: result.transactionHash,
                        from: escrowWallet.address,
                        to: payment.receiverWalletAddress,
                        tokenId: payment.productId,
                        networkId: collection.networkId,
                        networkName: collection.network.name,
                        escrowWalletId: escrowWallet.id,
                    },
                    postProcessResultAt: new Date(),
                },
            }),
        ]);

        // 9. 이벤트 로그는 비동기로 처리 (응답 속도 향상)
        setImmediate(async () => {
            try {
                const nfts = await prisma.nFT.findMany({
                    where: {
                        collectionId: collection.id,
                        tokenId: { in: tokenIds },
                    },
                    select: {
                        id: true,
                        tokenId: true,
                    },
                });

                const transferEvents = tokenIds.map((tokenId: number) => {
                    const nftRecord = nfts.find(
                        (nft) => nft.tokenId === tokenId
                    );
                    return {
                        nftId: nftRecord?.id || `temp-${tokenId}`,
                        collectionId: collection.id,
                        eventType: "TRANSFER" as const,
                        fromAddress: escrowWallet.address,
                        toAddress: payment.receiverWalletAddress!,
                        transactionHash: result.transactionHash!,
                        timestamp: new Date(),
                    };
                });

                await prisma.nFTEvent.createMany({
                    data: transferEvents,
                });
            } catch (error) {
                scope.error("Failed to create transfer events", { error });
            }
        });

        scope.log("NFT transfer successful", {
            txHash: result.transactionHash,
            receiver: payment.receiverWalletAddress,
            escrowWallet: escrowWallet.address,
            networkName: collection.network.name,
            transferredTokenIds: tokenIds,
            quantity: payment.quantity,
        });

        return {
            success: true,
            data: {
                txHash: result.transactionHash!,
                receiverAddress: payment.receiverWalletAddress,
                networkName: collection.network.name,
            },
        };
    } catch (error) {
        scope.error("Unexpected error during NFT transfer", { error });
        return {
            success: false,
            error: {
                code: "TRANSFER_FAILED",
                message: "Unexpected error during NFT transfer",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
}

/**
 * 에스크로 역할로 NFT를 다른 주소로 전송하는 함수
 * 토큰 소유자의 서명을 검증하여 진행하며, 가스비는 에스크로 계정이 지불함
 */
export interface EscrowTransferNFTInput {
    paymentId: string;
    userId: string;
    fromAddress: string;
    toAddress: string;
}

export async function escrowTransferNFT(
    input: EscrowTransferNFTInput
): Promise<TransferNFTResponse> {
    const scope = createLogScope("escrowTransferNFT", {
        paymentId: input.paymentId,
        userId: input.userId,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
    });

    try {
        // 1. 결제 정보 조회
        const payment = await prisma.payment.findUnique({
            where: { id: input.paymentId },
            include: { user: true },
        });

        if (!payment) {
            scope.log("Payment not found");
            return {
                success: false,
                error: {
                    code: "PAYMENT_NOT_FOUND",
                    message: "Payment not found",
                },
            };
        }

        // 2. 권한 검증
        if (payment.userId !== input.userId) {
            scope.log("Unauthorized transfer attempt");
            return {
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Unauthorized transfer attempt",
                },
            };
        }

        // 3. 송신자 지갑 주소 확인
        const fromWallet = await prisma.wallet.findUnique({
            where: { address: input.fromAddress },
        });

        if (!fromWallet) {
            scope.log("Sender wallet address not found");
            return {
                success: false,
                error: {
                    code: "WALLET_NOT_FOUND",
                    message: "Sender wallet address not found",
                },
            };
        }

        // 4. NFT 및 컬렉션 정보 조회
        const collection = await prisma.collectionContract.findFirst({
            where: { id: payment.productId },
            include: { network: true },
        });

        if (!collection) {
            scope.log("Collection not found");
            return {
                success: false,
                error: {
                    code: "COLLECTION_NOT_FOUND",
                    message: "Collection data not found",
                },
            };
        }

        // 5. NFTs 조회
        const nfts = await prisma.nFT.findMany({
            where: {
                collectionId: collection.id,
                ownerAddress: fromWallet.address,
                isBurned: false,
                isLocked: false,
                isStaked: false,
            },
            take: payment.quantity,
            select: {
                tokenId: true,
            },
        });

        if (!nfts || nfts.length < payment.quantity) {
            scope.log("Not enough available NFTs for transfer");
            return {
                success: false,
                error: {
                    code: "TRANSFER_FAILED",
                    message: `Not enough available NFTs. Required: ${
                        payment.quantity
                    }, Available: ${nfts?.length || 0}`,
                },
            };
        }

        const creatorWalletAddress = collection.creatorAddress;
        const selectedEscrowWallet = await prisma.escrowWallet.findUnique({
            where: {
                address: creatorWalletAddress,
            },
        });

        if (!selectedEscrowWallet) {
            return {
                success: false,
                error: {
                    code: "ESCROW_WALLET_NOT_FOUND",
                    message: "No escrow wallet found",
                },
            };
        }

        const result = await transferTokens({
            collectionAddress: collection.address,
            fromAddress: fromWallet.address,
            spenderAddress: selectedEscrowWallet.address,
            toAddress: input.toAddress,
            tokenIds: nfts.map((nft) => nft.tokenId),
        });

        if (!result.success) {
            return {
                success: false,
                error: {
                    code: "TRANSFER_FAILED",
                    message: result.error || "Transfer failed",
                },
            };
        }

        // 7. 결제 상태 업데이트
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                postProcessResult: {
                    type: "NFT_ESCROW_TRANSFER",
                    success: true,
                    txHash: result.transactionHash,
                    from: fromWallet.address,
                    to: input.toAddress,
                    tokenIds: nfts.map((nft) => nft.tokenId),
                    networkId: collection.networkId,
                    networkName: collection.network.name,
                },
                postProcessResultAt: new Date(),
            },
        });

        return {
            success: true,
            data: {
                txHash: result.transactionHash!,
                receiverAddress: input.toAddress,
                networkName: collection.network.name,
                transferDetails: {
                    from: fromWallet.address,
                    to: input.toAddress,
                    tokenId: nfts
                        .map((nft) => nft.tokenId.toString())
                        .join(","),
                    networkId: collection.networkId,
                    networkName: collection.network.name,
                    escrowWalletId: "",
                },
            },
        };
    } catch (error) {
        scope.error("Unexpected error during NFT escrow transfer", { error });
        return {
            success: false,
            error: {
                code: "TRANSFER_FAILED",
                message: "Unexpected error during NFT escrow transfer",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
}

// 로깅 유틸리티
function createLogScope(name: string, initialData?: any) {
    const startTime = Date.now();
    const id = Math.random().toString(36).substring(2, 8);

    return {
        log: (message: string, data?: any) => {
            logger.info(`[${name}] ${message}`, {
                ...initialData,
                ...data,
                id,
            });
        },
        error: (message: string, error?: any) => {
            logger.error(`[${name}] ${message}`, { error, ...initialData, id });
        },
    };
}
