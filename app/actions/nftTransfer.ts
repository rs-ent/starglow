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

        // 4. 수신 지갑 주소 확인
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

        try {
            // 5. NFT 및 네트워크 정보 조회 (먼저 실행)
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

            // 7. 컬렉션에 등록된 에스크로 지갑 목록 가져오기
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

            // DB에서 해당 에스크로 지갑 정보 가져오기
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
                    balance: true,
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
                        message:
                            "Registered escrow wallet not found in database",
                    },
                };
            }

            // 네트워크 클라이언트 가져오기
            const chain = await getChain(collection.network);

            // 네트워크 RPC URL 가져오기
            const network = await prisma.blockchainNetwork.findUnique({
                where: { id: collection.networkId },
                select: { rpcUrl: true },
            });

            if (!network || !network.rpcUrl) {
                return {
                    success: false,
                    error: {
                        code: "NETWORK_NOT_FOUND",
                        message: "Network RPC URL not found",
                    },
                };
            }

            const publicClient = createPublicClient({
                chain,
                transport: http(network.rpcUrl),
            });

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

            const walletClient = createWalletClient({
                account,
                chain,
                transport: http(network.rpcUrl),
            });

            const escrowWalletData = {
                wallet: {
                    id: escrowWalletFromDB.id,
                    address: escrowWalletFromDB.address,
                    privateKey: escrowWalletFromDB.privateKey,
                    balance:
                        (escrowWalletFromDB.balance as Record<
                            string,
                            string
                        >) || {},
                },
                account,
                walletClient,
            };

            // NFTs 조회 (에스크로 지갑이 소유한 NFT)
            const nfts = await prisma.nFT.findMany({
                where: {
                    collectionId: collection.id,
                    ownerAddress: escrowWalletData.account.address,
                    isBurned: false,
                },
                take: payment.quantity,
                select: {
                    id: true,
                    tokenId: true,
                    networkId: true,
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

            let lastReceipt: { transactionHash: string } | undefined;
            const transferredNFTs: { nftId: string; txHash: string }[] = [];
            const failedTransfers: { nftId: string; error: string }[] = [];

            // NFT 전송 로직을 quantity만큼 반복
            for (const nft of nfts) {
                try {
                    const hash = await walletClient.writeContract({
                        address: collection.address as `0x${string}`,
                        abi: [
                            {
                                name: "transferFrom",
                                type: "function",
                                stateMutability: "payable",
                                inputs: [
                                    { name: "from", type: "address" },
                                    { name: "to", type: "address" },
                                    { name: "tokenId", type: "uint256" },
                                ],
                                outputs: [],
                            },
                        ],
                        functionName: "transferFrom",
                        args: [
                            escrowWalletData.account.address,
                            payment.receiverWalletAddress as `0x${string}`,
                            BigInt(nft.tokenId),
                        ],
                        chain,
                        account: escrowWalletData.account,
                    });

                    const receipt =
                        await publicClient.waitForTransactionReceipt({
                            hash,
                        });
                    lastReceipt = receipt;

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
                            fromAddress: escrowWalletData.account.address,
                            toAddress: payment.receiverWalletAddress,
                            transactionHash: receipt.transactionHash,
                            timestamp: new Date(),
                        },
                    });

                    transferredNFTs.push({
                        nftId: nft.id,
                        txHash: receipt.transactionHash,
                    });
                } catch (error) {
                    failedTransfers.push({
                        nftId: nft.id,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    });
                }
            }

            if (failedTransfers.length > 0) {
                return {
                    success: false,
                    error: {
                        code: "TRANSFER_FAILED",
                        message: "Some NFT transfers failed",
                        details: { failedTransfers, transferredNFTs },
                    },
                };
            }

            if (!lastReceipt) {
                return {
                    success: false,
                    error: {
                        code: "TRANSFER_FAILED",
                        message: "No successful transfers completed",
                    },
                };
            }

            // 11. 전송 결과 DB 업데이트 (lastReceipt 사용)
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    postProcessResult: {
                        type: "NFT_TRANSFER",
                        success: true,
                        txHash: lastReceipt.transactionHash,
                        from: escrowWalletData.account.address,
                        to: payment.receiverWalletAddress,
                        tokenId: payment.productId,
                        networkId: collection.networkId,
                        networkName: collection.network.name,
                        escrowWalletId: escrowWalletData.wallet.id,
                    },
                    postProcessResultAt: new Date(),
                },
            });

            scope.log("NFT transfer successful", {
                txHash: lastReceipt.transactionHash,
                receiver: payment.receiverWalletAddress,
                escrowWallet: escrowWalletData.wallet.address,
                networkName: collection.network.name,
            });

            return {
                success: true,
                data: {
                    txHash: lastReceipt.transactionHash,
                    receiverAddress: payment.receiverWalletAddress,
                    networkName: collection.network.name,
                },
            };
        } catch (error) {
            scope.error("NFT transfer failed", { error });
            return {
                success: false,
                error: {
                    code: "TRANSFER_FAILED",
                    message: "Failed to transfer NFT",
                    details:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
            };
        }
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
            include: {
                user: true,
            },
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

        // 4. 송신자 지갑 주소 확인
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

        const senderWalletAddress = wallets[0].address;

        // 5. 수신 지갑 주소 확인
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

        try {
            // 6. NFT 및 네트워크 정보 조회 및 컬렉션 정보 조회
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

            // 7. 네트워크 클라이언트 가져오기
            const chain = await getChain(collection.network);
            if (!chain) {
                return {
                    success: false,
                    error: {
                        code: "NETWORK_NOT_FOUND",
                        message: `Blockchain network with ID ${collection.networkId} not found or not active`,
                    },
                };
            }

            // 컬렉션의 등록된 에스크로 지갑 목록 가져오기
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

            // DB에서 해당 에스크로 지갑 정보 가져오기
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
                    balance: true,
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
                        message:
                            "Registered escrow wallet not found in database",
                    },
                };
            }

            // 네트워크 RPC URL 가져오기
            const network = await prisma.blockchainNetwork.findUnique({
                where: { id: collection.networkId },
                select: { rpcUrl: true },
            });

            if (!network || !network.rpcUrl) {
                return {
                    success: false,
                    error: {
                        code: "NETWORK_NOT_FOUND",
                        message: "Network RPC URL not found",
                    },
                };
            }

            // 지갑 객체 생성
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

            const publicClient = createPublicClient({
                chain,
                transport: http(network.rpcUrl),
            });

            const walletClient = createWalletClient({
                account,
                chain,
                transport: http(network.rpcUrl),
            });

            const escrowWalletData = {
                wallet: {
                    id: escrowWalletFromDB.id,
                    address: escrowWalletFromDB.address,
                    privateKey: escrowWalletFromDB.privateKey,
                    balance:
                        (escrowWalletFromDB.balance as Record<
                            string,
                            string
                        >) || {},
                },
                account,
                walletClient,
            };

            // 9. NFTs 조회
            const nfts = await prisma.nFT.findMany({
                where: {
                    collectionId: collection.id,
                    ownerAddress: senderWalletAddress,
                    isBurned: false,
                    isLocked: false,
                    isStaked: false,
                },
                take: payment.quantity,
                select: {
                    id: true,
                    tokenId: true,
                    networkId: true,
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

            const { wallet: escrowWallet } = escrowWalletData;
            const owner = senderWalletAddress as `0x${string}`; // 실제 소유자
            const spender = escrowWalletData.account.address; // 에스크로 지갑 (가스비 대납 주체)
            const to = payment.receiverWalletAddress as `0x${string}`;
            const collectionAddr = collection.address as `0x${string}`;

            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const tokenIds = nfts.map((nft) => BigInt(nft.tokenId));

            const signature = input.signature.slice(2);

            const vs: number[] = [];
            const rs: `0x${string}`[] = [];
            const ss: `0x${string}`[] = [];

            for (let i = 0; i < tokenIds.length; i++) {
                const r = `0x${signature.substring(0, 64)}` as `0x${string}`;
                const s = `0x${signature.substring(64, 128)}` as `0x${string}`;
                const v = parseInt(signature.substring(128, 130), 16);

                vs.push(v);
                rs.push(r);
                ss.push(s);
            }

            const hash = await walletClient.writeContract({
                address: collectionAddr,
                abi: [
                    {
                        name: "escrowTransfer",
                        type: "function",
                        stateMutability: "nonpayable",
                        inputs: [
                            { name: "owner", type: "address" },
                            { name: "spender", type: "address" },
                            { name: "to", type: "address" },
                            { name: "tokenIds", type: "uint256[]" },
                            { name: "deadline", type: "uint256" },
                            { name: "v", type: "uint8[]" },
                            { name: "r", type: "bytes32[]" },
                            { name: "s", type: "bytes32[]" },
                        ],
                        outputs: [],
                    },
                ],
                functionName: "escrowTransfer",
                args: [
                    owner,
                    spender,
                    to,
                    tokenIds,
                    BigInt(deadline),
                    vs,
                    rs,
                    ss,
                ],
                chain,
                account: escrowWalletData.account,
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            for (const nft of nfts) {
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
                        eventType: "EscrowTransfer",
                        fromAddress: owner,
                        toAddress: to,
                        transactionHash: receipt.transactionHash,
                        timestamp: new Date(),
                    },
                });
            }

            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    postProcessResult: {
                        type: "NFT_ESCROW_TRANSFER",
                        success: true,
                        txHash: receipt.transactionHash,
                        from: owner,
                        to: payment.receiverWalletAddress,
                        tokenIds: nfts.map((nft) => nft.tokenId),
                        networkId: collection.networkId,
                        networkName: collection.network.name,
                        escrowWalletId: escrowWallet.id,
                    },
                    postProcessResultAt: new Date(),
                },
            });

            scope.log("NFT escrow transfer successful", {
                txHash: receipt.transactionHash,
                from: owner,
                to: to,
                escrowWallet: escrowWallet.address,
                networkName: collection.network.name,
            });

            return {
                success: true,
                data: {
                    txHash: receipt.transactionHash,
                    receiverAddress: payment.receiverWalletAddress,
                    networkName: collection.network.name,
                    transferDetails: {
                        from: owner,
                        to: payment.receiverWalletAddress,
                        tokenId: nfts
                            .map((nft) => nft.tokenId.toString())
                            .join(","),
                        networkId: collection.networkId,
                        networkName: collection.network.name,
                        escrowWalletId: escrowWallet.id,
                    },
                },
            };
        } catch (error) {
            scope.error("NFT escrow transfer failed", { error });
            return {
                success: false,
                error: {
                    code: "TRANSFER_FAILED",
                    message: "Failed to escrow transfer NFT",
                    details:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
            };
        }
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
