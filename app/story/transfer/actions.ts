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

export async function initialTransfer(
    input: initialTransferInput
): Promise<{ txHash: string; tokenIds: string[] }> {
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

    // 컨트랙트 nonce 읽기 (서명용)
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

    const tokenIds = await getOwners({
        spgAddress: spgAddress,
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
        nonce: contractNonce, // 컨트랙트 nonce 사용
        deadline,
    };

    const signature = await spenderAccount.signTypedData({
        domain,
        types,
        primaryType: "TransferPermit",
        message,
    });

    // simulateContract 대신 직접 트랜잭션 데이터 인코딩
    const txData = encodeFunctionData({
        abi: SPGNFTCollection.abi,
        functionName: "escrowTransferWithSignature",
        args: [from, toAddress, ownedTokenIds, deadline, signature],
    });

    // 가스 추정
    const gasEstimate = await publicClient.estimateGas({
        account: spenderAccount.address,
        to: spgAddress as `0x${string}`,
        data: txData,
    });

    // 트랜잭션 nonce 가져오기 (number 타입)
    const txNonce = await publicClient.getTransactionCount({
        address: spenderAccount.address,
    });

    // 트랜잭션 객체 생성
    const tx = {
        to: spgAddress as `0x${string}`,
        data: txData,
        gas: gasEstimate,
        nonce: txNonce, // 트랜잭션 nonce 사용 (number 타입)
        ...(await publicClient.estimateFeesPerGas()),
    };

    // 트랜잭션 서명
    const signedTx = await walletClient.signTransaction(tx);

    // Raw 트랜잭션 전송
    const txHash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTx,
    });

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

        // 10. 결제 상태 업데이트
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                postProcessResult: {
                    type: "NFT_TRANSFER",
                    success: true,
                    txHash: result,
                    from: spg.ownerAddress,
                    to: payment.receiverWalletAddress,
                    tokenId: payment.productId,
                    networkId: spg.networkId,
                    networkName: spg.network.name,
                },
                postProcessResultAt: new Date(),
            },
        });

        console.log("NFT transfer successful", {
            txHash: result.txHash,
            receiver: payment.receiverWalletAddress,
            networkName: spg.network.name,
        });

        return {
            success: true,
            data: {
                txHash: result.txHash,
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
