/// app/story/transfer/actions.ts

import {
    createWalletClient,
    createPublicClient,
    http,
    Hex,
    decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    getChain,
    estimateAndOptimizeGas,
    getStoryNetwork,
} from "../network/actions";
import { prisma } from "@/lib/prisma/client";
import SPGNFTCollection from "@/web3/artifacts/contracts/SPGNFTCollection.sol/SPGNFTCollection.json";
import { fetchEscrowWalletPrivateKey } from "../escrowWallet/actions";
import { fetchStoryClient } from "../client";
import { signTypedData } from "viem/accounts";
import { getOwners } from "../nft/actions";

export interface initialTransferInput {
    collectionAddress: string;
    quantity: number;
    toAddress: string;
}

export async function initialTransfer(
    input: initialTransferInput
): Promise<{ txHash: string; tokenIds: string[] }> {
    const { collectionAddress, quantity, toAddress } = input;

    const collection = await prisma.story_spg.findUnique({
        where: {
            address: collectionAddress,
        },
        include: {
            network: true,
        },
    });

    if (!collection) {
        throw new Error("Collection not found");
    }

    const from = collection.ownerAddress;
    if (!from) {
        throw new Error("From address not found");
    }

    const spender = await fetchEscrowWalletPrivateKey({
        address: from,
    });

    if (!spender) {
        throw new Error("Spender not found");
    }

    const spenderAccount = privateKeyToAccount(spender as `0x${string}`);

    const chain = await getChain(collection.network);
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    const walletClient = createWalletClient({
        account: spenderAccount,
        chain,
        transport: http(),
    });

    const nonce = (await publicClient.readContract({
        address: collectionAddress as `0x${string}`,
        abi: SPGNFTCollection.abi,
        functionName: "getNonce",
        args: [from as `0x${string}`],
    })) as bigint;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 30);
    const domain = {
        name: "SPGNFTCollection",
        version: "1",
        chainId: chain.id,
        verifyingContract: collectionAddress as `0x${string}`,
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

    const tokenIds = await getOwners({
        contractAddress: collectionAddress,
        tokenIds: Array.from({ length: quantity }, (_, i) =>
            BigInt(i).toString()
        ),
    });

    const ownedTokenIds = tokenIds
        .filter((token) => token.owner.toLowerCase() === from.toLowerCase())
        .map((token) => token.tokenId)
        .slice(0, quantity);

    const message = {
        owner: from,
        to: toAddress,
        tokenIds: ownedTokenIds,
        nonce,
        deadline,
    };

    const signature = await spenderAccount.signTypedData({
        domain,
        types,
        primaryType: "TransferPermit",
        message,
    });

    const { request } = await publicClient.simulateContract({
        address: collectionAddress as `0x${string}`,
        abi: SPGNFTCollection.abi,
        functionName: "escrowTransferWithSignature",
        args: [from, toAddress, ownedTokenIds, deadline, signature],
        account: spenderAccount.address,
    });

    const txHash = await walletClient.writeContract(request);

    return { txHash, tokenIds: ownedTokenIds };
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
        const collection = await prisma.story_spg.findUnique({
            where: {
                id: payment.productId,
            },
            include: { network: true },
        });

        if (!collection) {
            console.error("Collection not found");
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
            collectionAddress: collection.address,
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

        // 10. 결제 상태 업데이트
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                postProcessResult: {
                    type: "NFT_TRANSFER",
                    success: true,
                    txHash: result,
                    from: collection.ownerAddress,
                    to: payment.receiverWalletAddress,
                    tokenId: payment.productId,
                    networkId: collection.networkId,
                    networkName: collection.network.name,
                },
                postProcessResultAt: new Date(),
            },
        });

        console.log("NFT transfer successful", {
            txHash: result.txHash,
            receiver: payment.receiverWalletAddress,
            networkName: collection.network.name,
        });

        return {
            success: true,
            data: {
                txHash: result.txHash,
                receiverAddress: payment.receiverWalletAddress,
                networkName: collection.network.name,
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
