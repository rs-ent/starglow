/// app/story/transfer/actions.ts

import {
    createWalletClient,
    createPublicClient,
    http,
    encodeFunctionData,
    Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getChain } from "../network/actions";
import { prisma } from "@/lib/prisma/client";
import SPGNFTCollection from "@/web3/artifacts/contracts/SPGNFTCollection.sol/SPGNFTCollection.json";
import { fetchEscrowWalletPrivateKey } from "../escrowWallet/actions";
import { getOwners } from "../nft/actions";

export interface initialTransferInput {
    spgAddress: string;
    quantity: number;
    toAddress: string;
}

// Batch transfer result interface
export interface BatchTransferResult {
    txHashes: string[];
    tokenIds: string[];
    totalGasUsed?: bigint;
}

// Constants for batch processing
const BATCH_SIZES = {
    SMALL: 20, // For escrowTransfer (legacy)
    MEDIUM: 100, // For batchTransfer
    LARGE: 500, // For chunked processing
};

/**
 * Get owned token IDs for batch transfer
 */
async function getOwnedTokenIds(
    spgAddress: string,
    owner: string,
    quantity: number
): Promise<string[]> {
    // Get a large range of potential token IDs
    const maxTokensToCheck = Math.min(quantity * 10, 10000);
    const tokenIds = await getOwners({
        spgAddress: spgAddress,
        tokenIds: Array.from({ length: maxTokensToCheck }, (_, i) =>
            BigInt(i).toString()
        ),
    });

    // Filter owned tokens
    const ownedTokenIds = tokenIds
        .filter((token) => token.owner.toLowerCase() === owner.toLowerCase())
        .map((token) => token.tokenId)
        .slice(0, quantity);

    if (ownedTokenIds.length < quantity) {
        throw new Error(
            `Only found ${ownedTokenIds.length} tokens owned by ${owner}`
        );
    }

    return ownedTokenIds;
}

/**
 * Main transfer function with industry-standard batch processing
 */
export async function initialTransfer(
    input: initialTransferInput
): Promise<{ txHash: string; tokenIds: string[] } | BatchTransferResult> {
    const { spgAddress, quantity, toAddress } = input;

    const spg = await prisma.story_spg.findUnique({
        where: {
            address: spgAddress,
        },
        include: {
            network: true,
        },
    });

    if (!spg) {
        throw new Error("SPG not found");
    }

    const from = spg.ownerAddress;
    if (!from) {
        throw new Error("From address not found");
    }

    const spender = await fetchEscrowWalletPrivateKey({
        address: from,
    });

    if (!spender) {
        throw new Error("Spender not found");
    }

    const spenderAccount = privateKeyToAccount(spender as Hex);

    const chain = await getChain(spg.network);
    const publicClient = createPublicClient({
        chain,
        transport: http(spg.network.rpcUrl),
    });

    const walletClient = createWalletClient({
        account: spenderAccount,
        chain,
        transport: http(spg.network.rpcUrl),
    });

    // Get owned token IDs
    const ownedTokenIds = await getOwnedTokenIds(spgAddress, from, quantity);

    // Determine transfer strategy based on quantity
    if (quantity <= BATCH_SIZES.SMALL) {
        // Use legacy escrowTransfer for small quantities
        return legacyTransfer({
            spgAddress,
            from,
            to: toAddress,
            tokenIds: ownedTokenIds,
            spenderAccount,
            publicClient,
            walletClient,
            chain,
        });
    } else if (quantity <= BATCH_SIZES.MEDIUM) {
        // Use single batchTransfer
        return batchTransfer({
            spgAddress,
            from,
            to: toAddress,
            tokenIds: ownedTokenIds,
            spenderAccount,
            publicClient,
            walletClient,
            chain,
        });
    } else {
        // Use multiple batch transfers for large quantities
        return largeBatchTransfer({
            spgAddress,
            from,
            to: toAddress,
            tokenIds: ownedTokenIds,
            spenderAccount,
            publicClient,
            walletClient,
            chain,
        });
    }
}

/**
 * Legacy transfer for backward compatibility (<=20 tokens)
 */
async function legacyTransfer(
    params: any
): Promise<{ txHash: string; tokenIds: string[] }> {
    const {
        spgAddress,
        from,
        to,
        tokenIds,
        spenderAccount,
        publicClient,
        walletClient,
        chain,
    } = params;

    const contractNonce = (await publicClient.readContract({
        address: spgAddress as `0x${string}`,
        abi: SPGNFTCollection.abi,
        functionName: "getNonce",
        args: [from as `0x${string}`],
    })) as bigint;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 30);
    const domain = {
        name: "SPGNFTCollection",
        version: "1",
        chainId: chain.id,
        verifyingContract: spgAddress as `0x${string}`,
    };

    const types = {
        TransferPermit: [
            { name: "owner", type: "address" },
            { name: "to", type: "address" },
            { name: "tokenIds", type: "uint256[]" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const message = {
        owner: from,
        to: to,
        tokenIds: tokenIds,
        nonce: contractNonce,
        deadline,
    };

    const signature = await spenderAccount.signTypedData({
        domain,
        types,
        primaryType: "TransferPermit",
        message,
    });

    const txData = encodeFunctionData({
        abi: SPGNFTCollection.abi,
        functionName: "escrowTransferWithSignature",
        args: [from, to, tokenIds, deadline, signature],
    });

    const gasEstimate = await publicClient.estimateGas({
        account: spenderAccount.address,
        to: spgAddress as `0x${string}`,
        data: txData,
    });

    const txNonce = await publicClient.getTransactionCount({
        address: spenderAccount.address,
    });

    const tx = {
        to: spgAddress as `0x${string}`,
        data: txData,
        gas: gasEstimate,
        nonce: txNonce,
        ...(await publicClient.estimateFeesPerGas()),
    };

    const signedTx = await walletClient.signTransaction(tx);
    const txHash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTx,
    });

    return { txHash, tokenIds };
}

/**
 * Industry-standard batch transfer (21-100 tokens)
 */
async function batchTransfer(
    params: any
): Promise<{ txHash: string; tokenIds: string[] }> {
    const {
        spgAddress,
        from,
        to,
        tokenIds,
        spenderAccount,
        publicClient,
        walletClient,
        chain,
    } = params;

    const contractNonce = (await publicClient.readContract({
        address: spgAddress as `0x${string}`,
        abi: SPGNFTCollection.abi,
        functionName: "getNonce",
        args: [from as `0x${string}`],
    })) as bigint;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 30);
    const domain = {
        name: "SPGNFTCollection",
        version: "1",
        chainId: chain.id,
        verifyingContract: spgAddress as `0x${string}`,
    };

    const types = {
        BatchTransferPermit: [
            { name: "owner", type: "address" },
            { name: "to", type: "address" },
            { name: "tokenIds", type: "uint256[]" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const message = {
        owner: from,
        to: to,
        tokenIds: tokenIds,
        nonce: contractNonce,
        deadline,
    };

    const signature = await spenderAccount.signTypedData({
        domain,
        types,
        primaryType: "BatchTransferPermit",
        message,
    });

    const txData = encodeFunctionData({
        abi: SPGNFTCollection.abi,
        functionName: "batchTransfer",
        args: [from, to, tokenIds, deadline, signature],
    });

    const gasEstimate = await publicClient.estimateGas({
        account: spenderAccount.address,
        to: spgAddress as `0x${string}`,
        data: txData,
    });

    const txNonce = await publicClient.getTransactionCount({
        address: spenderAccount.address,
    });

    const tx = {
        to: spgAddress as `0x${string}`,
        data: txData,
        gas: gasEstimate,
        nonce: txNonce,
        ...(await publicClient.estimateFeesPerGas()),
    };

    const signedTx = await walletClient.signTransaction(tx);
    const txHash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTx,
    });

    return { txHash, tokenIds };
}

/**
 * Large batch transfer with chunking (>100 tokens)
 */
async function largeBatchTransfer(params: any): Promise<BatchTransferResult> {
    const {
        spgAddress,
        from,
        to,
        tokenIds,
        spenderAccount,
        publicClient,
        walletClient,
        chain,
    } = params;

    const txHashes: string[] = [];
    const processedTokenIds: string[] = [];
    let totalGasUsed = BigInt(0);

    // Process in chunks
    const chunkSize = BATCH_SIZES.MEDIUM;
    for (let i = 0; i < tokenIds.length; i += chunkSize) {
        const chunk = tokenIds.slice(i, i + chunkSize);

        console.log(
            `Processing batch ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(
                tokenIds.length / chunkSize
            )}`
        );

        try {
            const result = await batchTransfer({
                spgAddress,
                from,
                to,
                tokenIds: chunk,
                spenderAccount,
                publicClient,
                walletClient,
                chain,
            });

            txHashes.push(result.txHash);
            processedTokenIds.push(...chunk);

            // Wait for transaction receipt to get gas used
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: result.txHash as `0x${string}`,
            });

            totalGasUsed += receipt.gasUsed;

            // Delay between batches to avoid rate limiting
            if (i + chunkSize < tokenIds.length) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(
                `Batch ${Math.floor(i / chunkSize) + 1} failed:`,
                error
            );
            // Optionally implement retry logic here
            throw error;
        }
    }

    return {
        txHashes,
        tokenIds: processedTokenIds,
        totalGasUsed,
    };
}

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
    try {
        // 1. 결제 정보 조회
        const payment = await prisma.payment.findUnique({
            where: { id: input.paymentId },
        });

        if (!payment) {
            console.error("Payment not found");
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
            console.error("Unauthorized transfer attempt");
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
            console.error("Receiver wallet address not found");
            return {
                success: false,
                error: {
                    code: "WALLET_NOT_FOUND",
                    message: "Receiver wallet address not found",
                },
            };
        }

        // 4. NFT 및 컬렉션 정보 조회
        const spg = await prisma.story_spg.findUnique({
            where: {
                id: payment.productId,
            },
            include: { network: true },
        });

        if (!spg) {
            console.error("SPG not found");
            return {
                success: false,
                error: {
                    code: "COLLECTION_NOT_FOUND",
                    message: "Collection data not found",
                },
            };
        }

        // 8. transferTokens 호출
        const result = await initialTransfer({
            spgAddress: spg.address,
            quantity: payment.quantity,
            toAddress: payment.receiverWalletAddress,
        });

        if (!result) {
            return {
                success: false,
                error: {
                    code: "TRANSFER_FAILED",
                    message: result || "Transfer failed",
                },
            };
        }

        // Handle both single and batch results
        const txHash = "txHash" in result ? result.txHash : result.txHashes[0];

        // 10. 결제 상태 업데이트
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                postProcessResult: {
                    type: "NFT_TRANSFER",
                    success: true,
                    txHash: txHash,
                    from: spg.ownerAddress,
                    to: payment.receiverWalletAddress,
                    tokenId: payment.productId,
                    networkId: spg.networkId,
                    networkName: spg.network.name,
                    quantity: payment.quantity,
                    batchInfo:
                        "txHashes" in result
                            ? {
                                  totalBatches: result.txHashes.length,
                                  txHashes: result.txHashes,
                                  totalGasUsed: result.totalGasUsed?.toString(),
                              }
                            : undefined,
                },
                postProcessResultAt: new Date(),
            },
        });

        console.log("NFT transfer successful", {
            txHash: txHash,
            receiver: payment.receiverWalletAddress,
            networkName: spg.network.name,
            quantity: payment.quantity,
        });

        return {
            success: true,
            data: {
                txHash: txHash,
                receiverAddress: payment.receiverWalletAddress,
                networkName: spg.network.name,
            },
        };
    } catch (error) {
        console.error("Unexpected error during NFT transfer", { error });
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
