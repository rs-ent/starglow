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
import { getEscrowWallet } from "./collectionContracts";
import { privateKeyToAccount } from "viem/accounts";
import { decryptPrivateKey } from "@/lib/utils/encryption";
import { transferTokens } from "./collectionContracts";
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

        const selectedEscrowWalletResult = await selectEscrowWallet(collection);
        if (
            !selectedEscrowWalletResult.success ||
            !selectedEscrowWalletResult.data
        ) {
            return {
                success: false,
                error: {
                    code: "ESCROW_WALLET_NOT_FOUND",
                    message: "No escrow wallet found",
                },
            };
        }

        const selectedEscrowWallet = selectedEscrowWalletResult.data;

        // 7. NFTs 조회 (에스크로 지갑이 소유한 NFT)
        const nfts = await prisma.nFT.findMany({
            where: {
                collectionId: collection.id,
                ownerAddress: selectedEscrowWallet.address,
                isBurned: false,
            },
            take: payment.quantity,
            select: {
                id: true,
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

        // 8. transferTokens 호출
        const result = await transferTokens({
            collectionAddress: collection.address,
            fromAddress: selectedEscrowWallet.address,
            spenderAddress: selectedEscrowWallet.address,
            toAddress: payment.receiverWalletAddress,
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

        // 9. NFT 소유자 정보 및 이벤트 업데이트
        await prisma.$transaction(async (tx) => {
            await tx.nFT.updateMany({
                where: {
                    id: { in: nfts.map((t) => t.id) },
                },
                data: {
                    ownerAddress: payment.receiverWalletAddress!,
                    currentOwnerAddress: payment.receiverWalletAddress!,
                    transferCount: {
                        increment: 1,
                    },
                    lastTransferredAt: new Date(),
                },
            });

            // NFT 이벤트 생성
            const transferEvents = nfts.map((token) => ({
                nftId: token.id,
                collectionId: collection.id,
                eventType: "TRANSFER",
                fromAddress: selectedEscrowWallet.address,
                toAddress: payment.receiverWalletAddress!,
                transactionHash: result.transactionHash!,
                timestamp: new Date(),
            }));

            await tx.nFTEvent.createMany({
                data: transferEvents,
            });
        });

        // 10. 결제 상태 업데이트
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                postProcessResult: {
                    type: "NFT_TRANSFER",
                    success: true,
                    txHash: result.transactionHash,
                    from: selectedEscrowWallet.address,
                    to: payment.receiverWalletAddress,
                    tokenId: payment.productId,
                    networkId: collection.networkId,
                    networkName: collection.network.name,
                    escrowWalletId: selectedEscrowWallet.id,
                },
                postProcessResultAt: new Date(),
            },
        });

        scope.log("NFT transfer successful", {
            txHash: result.transactionHash,
            receiver: payment.receiverWalletAddress,
            escrowWallet: selectedEscrowWallet.address,
            networkName: collection.network.name,
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

        const selectedEscrowWalletResult = await selectEscrowWallet(collection);
        if (
            !selectedEscrowWalletResult.success ||
            !selectedEscrowWalletResult.data
        ) {
            return {
                success: false,
                error: {
                    code: "ESCROW_WALLET_NOT_FOUND",
                    message: "No escrow wallet found",
                },
            };
        }

        const selectedEscrowWallet = selectedEscrowWalletResult.data;
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

async function selectEscrowWallet(
    collection: CollectionContract & { network: BlockchainNetwork }
): Promise<{
    success: boolean;
    data?: EscrowWallet;
    error?: {
        code: string;
        message: string;
    };
}> {
    const escrowWallets = await prisma.escrowWallet.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });

    const chain = await getChain(collection.network);
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    const contract = getContract({
        address: collection.address as Address,
        abi,
        client: publicClient,
    });

    const isEscrowResults = await Promise.all(
        escrowWallets.map((wallet) =>
            contract.read.isEscrowWallet([wallet.address as `0x${string}`])
        )
    );

    const validEscrowWallets = escrowWallets.filter(
        (_, index) => isEscrowResults[index]
    );

    if (validEscrowWallets.length === 0) {
        return {
            success: false,
            error: {
                code: "ESCROW_WALLET_NOT_FOUND",
                message: "No escrow wallet found",
            },
        };
    }

    const balanceResults = await Promise.all(
        validEscrowWallets.map((wallet) =>
            getWalletBalance({
                address: wallet.address as `0x${string}`,
                networkId: collection.networkId,
            })
        )
    );

    let selectedEscrowWallet;
    let maxBalance = 0;

    validEscrowWallets.forEach((wallet, index) => {
        const balance = balanceResults[index];
        if (balance.success) {
            const balanceEther = Number(balance.data?.balanceEther || 0);
            if (balanceEther > maxBalance) {
                maxBalance = balanceEther;
                selectedEscrowWallet = wallet;
            }
        }
    });

    if (!selectedEscrowWallet) {
        return {
            success: false,
            error: {
                code: "ESCROW_WALLET_NOT_FOUND",
                message: "No escrow wallet with sufficient balance found",
            },
        };
    }

    return {
        success: true,
        data: selectedEscrowWallet,
    };
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
