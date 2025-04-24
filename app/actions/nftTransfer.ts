/// app\actions\nftTransfer.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    createPublicClient,
    createWalletClient,
    http,
    Chain,
    defineChain,
} from "viem";
import { getEscrowWallet } from "./collectionContracts";
import { privateKeyToAccount } from "viem/accounts";
import { decryptPrivateKey } from "@/lib/utils/encryption";
import { getChain } from "./blockchain";
import { transferTokens } from "./collectionContracts";
import { ethers } from "ethers";

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

export interface EscrowTransferNFTInput {
    paymentId: string;
    userId: string;
    signature: `0x${string}`;
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

        // 5. 에스크로 지갑 정보 조회
        const { wallet: registeredEscrowWallet } = await getEscrowWallet({
            collectionAddress: collection.address,
        });

        if (!registeredEscrowWallet) {
            scope.log("No escrow wallets registered in collection");
            return {
                success: false,
                error: {
                    code: "ESCROW_WALLET_NOT_FOUND",
                    message: "No escrow wallets registered in collection",
                },
            };
        }

        // 6. DB에서 에스크로 지갑 정보 가져오기
        const escrowWalletFromDB = await prisma.escrowWallet.findFirst({
            where: {
                address: registeredEscrowWallet,
                isActive: true,
                networkIds: {
                    has: collection.networkId,
                },
            },
            select: {
                id: true,
                address: true,
                privateKey: true,
                keyHash: true,
                nonce: true,
            },
        });

        if (!escrowWalletFromDB) {
            scope.log("Registered escrow wallet not found in database");
            return {
                success: false,
                error: {
                    code: "ESCROW_WALLET_NOT_FOUND",
                    message: "Registered escrow wallet not found in database",
                },
            };
        }

        // private key 복호화
        const decryptedKey = await decryptPrivateKey({
            dbPart: escrowWalletFromDB.privateKey,
            blobPart: escrowWalletFromDB.keyHash,
            keyHash: escrowWalletFromDB.keyHash,
            nonce: escrowWalletFromDB.nonce,
        });

        const account = privateKeyToAccount(
            decryptedKey.startsWith("0x")
                ? (decryptedKey as `0x${string}`)
                : (`0x${decryptedKey}` as `0x${string}`)
        );

        // 7. NFTs 조회 (에스크로 지갑이 소유한 NFT)
        const nfts = await prisma.nFT.findMany({
            where: {
                collectionId: collection.id,
                ownerAddress: escrowWalletFromDB.address,
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
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간
        const messageHash = await generateMessageHashForNFT(
            escrowWalletFromDB.address,
            escrowWalletFromDB.address,
            payment.receiverWalletAddress,
            nfts[0].tokenId,
            deadline
        );

        const signature = await account.signTypedData(messageHash);
        const { v, r, s } = ethers.utils.splitSignature(signature);

        const result = await transferTokens({
            collectionAddress: collection.address,
            walletId: escrowWalletFromDB.id,
            fromAddress: escrowWalletFromDB.address,
            toAddress: payment.receiverWalletAddress,
            tokenIds: nfts.map((nft) => nft.tokenId),
            deadline,
            signatures: { v, r, s },
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
        for (const nft of nfts) {
            // NFT 소유자 정보 업데이트
            await prisma.nFT.update({
                where: { id: nft.id },
                data: {
                    ownerAddress: payment.receiverWalletAddress,
                    lastTransferredAt: new Date(),
                    transferCount: { increment: 1 },
                },
            });

            // NFT 이벤트 생성
            await prisma.nFTEvent.create({
                data: {
                    nftId: nft.id,
                    collectionId: collection.id,
                    eventType: "Transfer",
                    fromAddress: escrowWalletFromDB.address,
                    toAddress: payment.receiverWalletAddress,
                    transactionHash: result.transactionHash!,
                    timestamp: new Date(),
                },
            });
        }

        // 10. 결제 상태 업데이트
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                postProcessResult: {
                    type: "NFT_TRANSFER",
                    success: true,
                    txHash: result.transactionHash,
                    from: escrowWalletFromDB.address,
                    to: payment.receiverWalletAddress,
                    tokenId: payment.productId,
                    networkId: collection.networkId,
                    networkName: collection.network.name,
                    escrowWalletId: escrowWalletFromDB.id,
                },
                postProcessResultAt: new Date(),
            },
        });

        scope.log("NFT transfer successful", {
            txHash: result.transactionHash,
            receiver: payment.receiverWalletAddress,
            escrowWallet: escrowWalletFromDB.address,
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

export async function escrowTransferNFT(
    input: EscrowTransferNFTInput
): Promise<TransferNFTResponse> {
    const scope = createLogScope("escrowTransferNFT", {
        paymentId: input.paymentId,
        userId: input.userId,
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
        const wallets = await prisma.wallet.findMany({
            where: { userId: payment.userId!, default: true },
            take: 1,
        });

        if (wallets.length === 0) {
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
                ownerAddress: wallets[0].address,
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

        // 6. transferTokens 호출
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간
        const messageHash = await generateMessageHashForNFT(
            wallets[0].address,
            wallets[0].address,
            payment.receiverWalletAddress!,
            nfts[0].tokenId,
            deadline
        );

        const signature = await account.signTypedData(messageHash);
        const { v, r, s } = ethers.utils.splitSignature(signature);

        const result = await transferTokens({
            collectionAddress: collection.address,
            walletId: wallets[0].id,
            fromAddress: wallets[0].address,
            toAddress: payment.receiverWalletAddress!,
            tokenIds: nfts.map((nft) => nft.tokenId),
            deadline,
            signatures: {
                v: parseInt(input.signature.slice(-2), 16),
                r: `0x${input.signature.slice(2, 66)}`,
                s: `0x${input.signature.slice(66, 130)}`,
            },
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
                    from: wallets[0].address,
                    to: payment.receiverWalletAddress,
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
                receiverAddress: payment.receiverWalletAddress!,
                networkName: collection.network.name,
                transferDetails: {
                    from: wallets[0].address,
                    to: payment.receiverWalletAddress!,
                    tokenId: nfts
                        .map((nft) => nft.tokenId.toString())
                        .join(","),
                    networkId: collection.networkId,
                    networkName: collection.network.name,
                    escrowWalletId: wallets[0].id,
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
}*/

/**
 * 메시지 해시를 생성하는 함수
 * 클라이언트에서 서명을 생성할 때 사용하기 위한 helper 함수
 */
export async function generateMessageHashForNFT(
    fromAddress: string,
    spenderAddress: string,
    toAddress: string,
    tokenId: number,
    deadline: number = Math.floor(Date.now() / 1000) + 3600 // 기본 1시간
): Promise<any> {
    try {
        // 1. NFT 네트워크 확인
        const nft = await prisma.nFT.findFirst({
            where: { tokenId },
            select: {
                networkId: true,
                collectionId: true,
                collection: {
                    select: {
                        address: true,
                    },
                },
            },
        });

        if (!nft) {
            throw new Error(`NFT with tokenId ${tokenId} not found`);
        }

        const collection = await prisma.collectionContract.findUnique({
            where: { id: nft.collectionId },
            include: { network: true },
        });

        if (!collection) {
            throw new Error(`Collection with ID ${nft.collectionId} not found`);
        }

        // 2. 네트워크 클라이언트 가져오기
        const chain = await getChain(collection.network);
        if (!chain) {
            throw new Error(
                `Network with ID ${nft.networkId} not found or not active`
            );
        }

        const publicClient = createPublicClient({
            chain,
            transport: http(collection.network.rpcUrl),
        });

        const collectionAddress = nft.collection.address as `0x${string}`;

        // 3. 현재 nonce 값 가져오기
        const nonce = await publicClient.readContract({
            address: collectionAddress,
            abi: [
                {
                    name: "nonces",
                    type: "function",
                    stateMutability: "view",
                    inputs: [{ name: "owner", type: "address" }],
                    outputs: [{ name: "", type: "uint256" }],
                },
            ],
            functionName: "nonces",
            args: [fromAddress as `0x${string}`],
        });

        // 4. EIP-712 해시 생성
        const typedData = {
            domain: {
                name: await publicClient.readContract({
                    address: collectionAddress,
                    abi: [
                        {
                            name: "name",
                            type: "function",
                            stateMutability: "view",
                            inputs: [],
                            outputs: [{ name: "", type: "string" }],
                        },
                    ],
                    functionName: "name",
                }),
                version: "1",
                chainId: chain.id,
                verifyingContract: collectionAddress,
            },
            types: {
                Permit: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "to", type: "address" },
                    { name: "tokenId", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                ],
            },
            primaryType: "Permit",
            message: {
                owner: fromAddress,
                spender: spenderAddress,
                to: toAddress,
                tokenId: BigInt(tokenId),
                nonce: nonce,
                deadline: BigInt(deadline),
            },
        };

        return typedData;
    } catch (error) {
        throw new Error(
            `Failed to generate message hash: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
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
