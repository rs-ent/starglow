/// app/story/transfer/actions.ts

import { Hex } from "viem";
import { prisma } from "@/lib/prisma/client";
import SPGNFTCollection from "@/web3/artifacts/contracts/SPGNFTCollection.sol/SPGNFTCollection.json";
import { getOwners } from "../nft/actions";
import { fetchPublicClient, fetchWalletClient } from "../client";

export interface initialTransferInput {
    spgAddress: string;
    quantity: number;
    toAddress: string;
}

export interface BatchTransferResult {
    txHashes: string[];
    tokenIds: string[];
    totalGasUsed?: bigint;
}

async function getOwnedTokenIds(
    spgAddress: string,
    owner: string,
    quantity: number
): Promise<string[]> {
    const maxTokensToCheck = Math.min(quantity * 10, 10000);
    const tokenIds = await getOwners({
        spgAddress: spgAddress,
        tokenIds: Array.from({ length: maxTokensToCheck }, (_, i) =>
            BigInt(i).toString()
        ),
    });

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

    const publicClient = await fetchPublicClient({
        network: spg.network,
    });

    const walletClient = await fetchWalletClient({
        network: spg.network,
        walletAddress: spg.ownerAddress,
    });

    if (!walletClient.account) {
        throw new Error("Wallet account not found");
    }

    const isEscrow = await publicClient.readContract({
        address: spgAddress as Hex,
        abi: SPGNFTCollection.abi,
        functionName: "isEscrowWallet",
        args: [walletClient.account.address],
    });

    if (!isEscrow) {
        throw new Error("Wallet is not authorized as escrow wallet");
    }

    const ownedTokenIds = await getOwnedTokenIds(spgAddress, from, quantity);

    const nonce = await publicClient.readContract({
        address: spgAddress as Hex,
        abi: SPGNFTCollection.abi,
        functionName: "getNonce",
        args: [from],
    });

    const domain = {
        name: "SPGNFTCollection",
        version: "1",
        chainId: spg.network.chainId,
        verifyingContract: spgAddress as Hex,
    };

    const types = {
        BatchTransferPermit: [
            { name: "owner", type: "address" },
            { name: "to", type: "address" },
            { name: "startTokenId", type: "uint256" },
            { name: "quantity", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const message = {
        owner: from,
        to: toAddress,
        startTokenId: BigInt(ownedTokenIds[0]),
        quantity: BigInt(quantity),
        nonce: nonce,
        deadline: BigInt(deadline),
    };

    const signature = await walletClient.signTypedData({
        account: walletClient.account,
        domain,
        types,
        primaryType: "BatchTransferPermit",
        message,
    });

    const { request } = await publicClient.simulateContract({
        address: spgAddress as Hex,
        abi: SPGNFTCollection.abi,
        functionName: "escrowTransferBatch",
        args: [
            from,
            toAddress,
            ownedTokenIds[0],
            quantity,
            deadline,
            signature,
        ],
        account: walletClient.account,
        chain: walletClient.chain,
    });

    const tx = await walletClient.writeContract(request);

    return {
        txHash: tx,
        tokenIds: ownedTokenIds,
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
