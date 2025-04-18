/// app\actions\nftTransfer.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { PaymentStatus } from "@prisma/client";
import {
    createPublicClient,
    createWalletClient,
    http,
    Chain,
    defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getPrivateKey } from "./defaultWallets";
import { decryptPrivateKey } from "@/lib/utils/encryption";

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

interface ChainClients {
    publicClient: ReturnType<typeof createPublicClient>;
    chain: Chain;
}

// 블록체인 네트워크 캐시 (메모리에 보관하여 DB 조회 최소화)
const chainClientsCache = new Map<string, ChainClients>();

/**
 * 네트워크 ID에 해당하는 Chain 객체와 클라이언트를 가져옵니다.
 */
async function getChainClients(
    networkId: string
): Promise<ChainClients | null> {
    // 캐시에 있으면 반환
    if (chainClientsCache.has(networkId)) {
        return chainClientsCache.get(networkId)!;
    }

    try {
        // DB에서 네트워크 정보 조회
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: networkId, isActive: true },
        });

        if (!network) {
            logger.error(
                `Network with ID ${networkId} not found or not active`
            );
            return null;
        }

        // Chain 객체 생성
        const chain = defineChain({
            id: network.chainId,
            name: network.name,
            rpcUrls: {
                default: {
                    http: [network.rpcUrl],
                },
            },
            nativeCurrency: {
                name: network.symbol,
                symbol: network.symbol,
                decimals: 18,
            },
        });

        // 클라이언트 생성
        const publicClient = createPublicClient({
            chain,
            transport: http(network.rpcUrl),
        });

        // 결과 캐싱
        const clients = { publicClient, chain };
        chainClientsCache.set(networkId, clients);

        return clients;
    } catch (error) {
        logger.error(`Error getting chain clients for network ${networkId}`, {
            error,
        });
        return null;
    }
}

/**
 * 충분한 잔액을 가진 에스크로 지갑을 찾아 반환합니다.
 */
async function findEligibleEscrowWallet(
    networkId: string,
    minBalance: number = 0.01
): Promise<{
    wallet: {
        id: string;
        address: string;
        privateKey: string;
        balance: Record<string, string>;
    };
    account: ReturnType<typeof privateKeyToAccount>;
    walletClient: ReturnType<typeof createWalletClient>;
} | null> {
    try {
        // 1. 네트워크 정보 및 클라이언트 가져오기
        const chainClients = await getChainClients(networkId);
        if (!chainClients) {
            console.error(
                `Failed to get chain clients for network ${networkId}`
            );
            return null;
        }

        // 네트워크 symbol 가져오기
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: networkId },
            select: { symbol: true },
        });

        if (!network) {
            console.error(`Network with ID ${networkId} not found`);
            return null;
        }

        // 2. 사용 가능한 에스크로 지갑 조회
        const escrowWallets = await prisma.escrowWallet.findMany({
            where: {
                isActive: true,
                networkIds: {
                    has: networkId,
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

        if (escrowWallets.length === 0) {
            console.error(
                `No active escrow wallets found for network ${networkId}`
            );
            return null;
        }

        // 3. 충분한 잔액을 가진 지갑 선택
        // 3. 충분한 잔액을 가진 지갑 선택
        const eligibleWallet = escrowWallets.find((wallet) => {
            const balanceData =
                (wallet.balance as Record<string, string>) || {};
            const balance = Object.entries(balanceData).find(([key]) =>
                key.includes(network.symbol)
            );

            if (!balance) return false;

            const balanceValue = parseFloat(balance[1].split(" ")[0]);
            return balanceValue >= minBalance;
        });

        if (!eligibleWallet) {
            console.error(
                `No escrow wallet with sufficient balance found for network ${networkId}`
            );
            return null;
        }

        // 4. 지갑 객체 생성
        const decryptedKey = await decryptPrivateKey({
            dbPart: eligibleWallet.privateKey,
            blobPart: eligibleWallet.keyHash,
            keyHash: eligibleWallet.keyHash,
            nonce: eligibleWallet.nonce,
        });

        const account = privateKeyToAccount(
            decryptedKey.startsWith("0x")
                ? (decryptedKey as `0x${string}`)
                : (`0x${decryptedKey}` as `0x${string}`)
        );

        const walletClient = createWalletClient({
            account,
            chain: chainClients.chain,
            transport: http(),
        });

        return {
            wallet: {
                id: eligibleWallet.id,
                address: eligibleWallet.address,
                privateKey: eligibleWallet.privateKey,
                balance:
                    (eligibleWallet.balance as Record<string, string>) || {},
            },
            account,
            walletClient,
        };
    } catch (error) {
        logger.error("Error finding eligible escrow wallet", { error });
        return null;
    }
}

/**
 * 에스크로 지갑 잔액 업데이트
 */
async function updateEscrowWalletBalance(
    walletId: string,
    networkId: string,
    newBalance: number
): Promise<void> {
    try {
        const escrowWallet = await prisma.escrowWallet.findUnique({
            where: { id: walletId },
            select: { balance: true },
        });

        if (!escrowWallet) return;

        const currentBalance =
            (escrowWallet.balance as Record<string, number>) || {};

        await prisma.escrowWallet.update({
            where: { id: walletId },
            data: {
                balance: {
                    ...currentBalance,
                    [networkId]: newBalance,
                },
            },
        });
    } catch (error) {
        logger.error("Failed to update escrow wallet balance", {
            error,
            walletId,
            networkId,
        });
    }
}

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

        // 3. 결제 상태 확인
        if (payment.status !== "PAID") {
            scope.log("Invalid payment status for transfer");
            return {
                success: false,
                error: {
                    code: "INVALID_PAYMENT_STATUS",
                    message: "Payment must be in PAID status for NFT transfer",
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
                select: {
                    id: true,
                    networkId: true,
                    address: true,
                    network: {
                        select: { name: true },
                    },
                },
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

            // 7. 에스크로 지갑 선택
            const escrowWalletData = await findEligibleEscrowWallet(
                collection.networkId
            );

            if (!escrowWalletData) {
                scope.log("No eligible escrow wallet found");
                return {
                    success: false,
                    error: {
                        code: "ESCROW_WALLET_NOT_FOUND",
                        message:
                            "No escrow wallet with sufficient balance found",
                    },
                };
            }

            const {
                wallet: escrowWallet,
                account: escrowAccount,
                walletClient,
            } = escrowWalletData;

            // NFTs 조회
            const nfts = await prisma.nFT.findMany({
                where: {
                    collectionId: collection.id,
                    mintedBy: escrowAccount.address,
                    ownerAddress: escrowAccount.address,
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

            // 6. 네트워크 클라이언트 가져오기
            const chainClients = await getChainClients(collection.networkId);
            if (!chainClients) {
                return {
                    success: false,
                    error: {
                        code: "NETWORK_NOT_FOUND",
                        message: `Blockchain network with ID ${collection.networkId} not found or not active`,
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
                            escrowAccount.address,
                            payment.receiverWalletAddress as `0x${string}`,
                            BigInt(nft.tokenId),
                        ],
                        chain: chainClients.chain,
                        account: escrowAccount,
                    });

                    const receipt =
                        await chainClients.publicClient.waitForTransactionReceipt(
                            {
                                hash,
                            }
                        );
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
                            fromAddress: escrowAccount.address,
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
                        from: escrowAccount.address,
                        to: payment.receiverWalletAddress,
                        tokenId: payment.productId,
                        networkId: collection.networkId,
                        networkName: collection.network.name,
                        escrowWalletId: escrowWallet.id,
                    },
                    postProcessResultAt: new Date(),
                },
            });

            scope.log("NFT transfer successful", {
                txHash: lastReceipt.transactionHash,
                receiver: payment.receiverWalletAddress,
                escrowWallet: escrowWallet.address,
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

        // 3. 결제 상태 확인
        if (payment.status !== "PAID") {
            scope.log("Invalid payment status for transfer");
            return {
                success: false,
                error: {
                    code: "INVALID_PAYMENT_STATUS",
                    message: "Payment must be in PAID status for NFT transfer",
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
            // 6. NFT 및 네트워크 정보 조회
            const nft = await prisma.nFT.findFirst({
                where: { tokenId: parseInt(payment.productId) },
                select: {
                    networkId: true,
                    network: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            if (!nft) {
                scope.log("NFT not found");
                return {
                    success: false,
                    error: {
                        code: "WALLET_NOT_FOUND",
                        message: "NFT data not found",
                    },
                };
            }

            // 7. 네트워크 클라이언트 가져오기
            const chainClients = await getChainClients(nft.networkId);
            if (!chainClients) {
                return {
                    success: false,
                    error: {
                        code: "NETWORK_NOT_FOUND",
                        message: `Blockchain network with ID ${nft.networkId} not found or not active`,
                    },
                };
            }

            // 8. 에스크로 지갑 선택
            const escrowWalletData = await findEligibleEscrowWallet(
                nft.networkId
            );

            if (!escrowWalletData) {
                scope.log("No eligible escrow wallet found");
                return {
                    success: false,
                    error: {
                        code: "ESCROW_WALLET_NOT_FOUND",
                        message:
                            "No escrow wallet with sufficient balance found",
                    },
                };
            }

            const { wallet: escrowWallet, walletClient } = escrowWalletData;
            const nftContractAddress = process.env
                .NFT_CONTRACT_ADDRESS as `0x${string}`;
            const fromAddress = senderWalletAddress as `0x${string}`;
            const toAddress = payment.receiverWalletAddress as `0x${string}`;
            const tokenId = BigInt(payment.productId);

            // 9. 최소 가스비 설정 (gwei 단위)
            const gasFee = BigInt(5);

            // 10. escrowTransfer 함수 호출
            const hash = await walletClient.writeContract({
                address: nftContractAddress,
                abi: [
                    {
                        name: "escrowTransfer",
                        type: "function",
                        stateMutability: "nonpayable",
                        inputs: [
                            { name: "from", type: "address" },
                            { name: "to", type: "address" },
                            { name: "tokenId", type: "uint256" },
                            { name: "signature", type: "bytes" },
                            { name: "gasFee", type: "uint256" },
                        ],
                        outputs: [],
                    },
                ],
                functionName: "escrowTransfer",
                args: [
                    fromAddress,
                    toAddress,
                    tokenId,
                    input.signature,
                    gasFee,
                ],
                chain: chainClients.chain,
                account: escrowWalletData.account,
            });

            // 11. 트랜잭션 영수증 대기
            const receipt =
                await chainClients.publicClient.waitForTransactionReceipt({
                    hash,
                });

            // 13. NFT 이벤트 생성
            await prisma.nFTEvent.create({
                data: {
                    nftId:
                        (
                            await prisma.nFT.findFirst({
                                where: { tokenId: parseInt(payment.productId) },
                            })
                        )?.id || "",
                    collectionId:
                        (
                            await prisma.nFT.findFirst({
                                where: { tokenId: parseInt(payment.productId) },
                            })
                        )?.collectionId || "",
                    eventType: "EscrowTransfer",
                    fromAddress: fromAddress,
                    toAddress: toAddress,
                    transactionHash: receipt.transactionHash,
                    timestamp: new Date(),
                },
            });

            scope.log("NFT escrow transfer successful", {
                txHash: receipt.transactionHash,
                from: fromAddress,
                to: toAddress,
                escrowWallet: escrowWallet.address,
                networkName: nft.network.name,
            });

            return {
                success: true,
                data: {
                    txHash: receipt.transactionHash,
                    receiverAddress: payment.receiverWalletAddress,
                    networkName: nft.network.name,
                    transferDetails: {
                        from: escrowWalletData.wallet.address,
                        to: payment.receiverWalletAddress,
                        tokenId: payment.productId,
                        networkId: nft.networkId,
                        networkName: nft.network.name,
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
    toAddress: string,
    tokenId: number
): Promise<string> {
    try {
        // 1. NFT 네트워크 확인
        const nft = await prisma.nFT.findFirst({
            where: { tokenId },
            select: { networkId: true },
        });

        if (!nft) {
            throw new Error(`NFT with tokenId ${tokenId} not found`);
        }

        // 2. 네트워크 클라이언트 가져오기
        const chainClients = await getChainClients(nft.networkId);
        if (!chainClients) {
            throw new Error(
                `Network with ID ${nft.networkId} not found or not active`
            );
        }

        const nftContractAddress = process.env
            .NFT_CONTRACT_ADDRESS as `0x${string}`;

        // 3. 현재 nonce 값 가져오기
        const nonce = await chainClients.publicClient.readContract({
            address: nftContractAddress,
            abi: [
                {
                    name: "nonce",
                    type: "function",
                    stateMutability: "view",
                    inputs: [{ name: "owner", type: "address" }],
                    outputs: [{ name: "", type: "uint256" }],
                },
            ],
            functionName: "nonce",
            args: [fromAddress as `0x${string}`],
        });

        // 4. 메시지 해시 생성
        const messageHash = await chainClients.publicClient.readContract({
            address: nftContractAddress,
            abi: [
                {
                    name: "getMessageHash",
                    type: "function",
                    stateMutability: "view",
                    inputs: [
                        { name: "from", type: "address" },
                        { name: "to", type: "address" },
                        { name: "tokenId", type: "uint256" },
                    ],
                    outputs: [{ name: "", type: "bytes32" }],
                },
            ],
            functionName: "getMessageHash",
            args: [
                fromAddress as `0x${string}`,
                toAddress as `0x${string}`,
                BigInt(tokenId),
            ],
        });

        return messageHash as string;
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
