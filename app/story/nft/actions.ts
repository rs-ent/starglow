/// app/story/ipAsset/actions.ts

"use server";

import { createHash } from "crypto";

import { User, Wallet } from "@prisma/client";
import { http, decodeEventLog } from "viem";

import { prisma } from "@/lib/prisma/client";
import SPGNFTCollection from "@/web3/artifacts/contracts/SPGNFTCollection.sol/SPGNFTCollection.json";

import {
    fetchPublicClient,
    fetchStoryClient,
    fetchWalletClient,
} from "../client";
import { fetchEscrowWalletPrivateKey } from "../escrowWallet/actions";
import { createTokenURIsMetadata, createMetadata } from "../metadata/actions";
import { estimateAndOptimizeGas } from "../network/actions";

import type { IPAssetMetadata, ERC721Metadata } from "../metadata/actions";
import type {
    BlockchainNetwork,
    Prisma,
    Story_nft,
    Story_spg,
    Artist,
} from "@prisma/client";
import type { PublicClient, Hex, Abi } from "viem";

// 재시도 유틸리티 함수 (가스비 예측 및 최적화 포함)
async function retryTransaction<T>(
    fn: (attempt: number, gasConfig?: any) => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    publicClient?: any,
    walletClient?: any,
    baseRequest?: any,
    nftQuantity: number = 1
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
        try {
            let gasConfig;

            // 가스비 예측 (publicClient와 baseRequest가 제공된 경우)
            if (publicClient && walletClient && baseRequest) {
                gasConfig = await estimateAndOptimizeGas(
                    publicClient,
                    walletClient,
                    baseRequest,
                    i,
                    nftQuantity
                );
            }

            return await fn(i, gasConfig);
        } catch (error) {
            lastError = error as Error;
            console.error(`Transaction attempt ${i + 1} failed:`, error);

            // 오류 유형별 대기 시간 조정
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            if (errorMessage.includes("replacement transaction underpriced")) {
                delay = Math.max(delay, 8000); // 최소 8초 대기
            } else if (errorMessage.includes("nonce too low")) {
                delay = Math.max(delay, 3000); // nonce 문제 시 3초 대기
            } else if (errorMessage.includes("insufficient funds")) {
                throw new Error("Insufficient funds for gas fees");
            }

            if (i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 1.5; // 더 보수적인 백오프
            }
        }
    }

    throw lastError || new Error("Transaction failed after all retries");
}

export interface mintInput {
    userId: string;
    networkId: string;
    walletAddress: string;
    contractAddress: string;
    quantity: number;
    tokenURIMetadata: ERC721Metadata;
    ipAssetMetadata: IPAssetMetadata;
    mintFee?: bigint;
    reuseMetadata?: boolean;
}

export interface mintResult {
    startTokenId: bigint;
    quantity: number;
    txHash: string;
    tokenIds: bigint[];
    tokenURIs: string[];
}

export async function mint(input: mintInput): Promise<mintResult> {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: {
                id: input.networkId,
            },
        });

        if (!network) {
            throw new Error("Network not found");
        }

        const publicClient = await fetchPublicClient({
            network: network,
        });

        const walletClient = await fetchWalletClient({
            network: network,
            walletAddress: input.walletAddress,
        });

        // 1. 먼저 tokenURI 메타데이터 생성
        const tokenURIObjects = await createTokenURIsMetadata({
            userId: input.userId,
            networkId: input.networkId,
            walletAddress: input.walletAddress,
            baseMetadata: input.tokenURIMetadata,
            quantity: input.quantity,
            reuseMetadata: input.reuseMetadata,
        });

        // IPFS URL들 추출
        const tokenURIs = tokenURIObjects.map((obj) => obj.url);

        // 민트 수수료 계산
        let totalMintFee = BigInt(0);
        if (input.mintFee !== undefined) {
            totalMintFee = input.mintFee * BigInt(input.quantity);
        } else {
            const mintFee = (await publicClient.readContract({
                address: input.contractAddress as Hex,
                abi: SPGNFTCollection.abi,
                functionName: "mintFee",
            })) as bigint;
            totalMintFee = mintFee * BigInt(input.quantity);
        }

        // 2. tokenURIs와 함께 mint 함수 호출
        const { request } = await publicClient.simulateContract({
            address: input.contractAddress as Hex,
            abi: SPGNFTCollection.abi,
            functionName: "mint",
            args: [input.walletAddress, BigInt(input.quantity), tokenURIs],
            account: walletClient.account,
            value: totalMintFee,
        });

        // 재시도 로직 적용 (가스비 예측 포함)
        const hash = await retryTransaction(
            async (attempt, gasConfig) => {
                const txRequest = { ...request };

                // 가스 설정 적용
                if (gasConfig) {
                    txRequest.gas = gasConfig.gas;
                    if (
                        gasConfig.maxFeePerGas &&
                        gasConfig.maxPriorityFeePerGas
                    ) {
                        // EIP-1559
                        txRequest.maxFeePerGas = gasConfig.maxFeePerGas;
                        txRequest.maxPriorityFeePerGas =
                            gasConfig.maxPriorityFeePerGas;
                    } else {
                        // Legacy
                        txRequest.gasPrice = gasConfig.gasPrice;
                    }
                }

                return await walletClient.writeContract(txRequest);
            },
            3, // maxRetries
            1000, // initial delay
            publicClient,
            walletClient,
            request,
            input.quantity
        );

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        // 트랜잭션 실패 확인
        if (receipt.status === "reverted") {
            console.error("Transaction reverted. Receipt:", receipt);
            throw new Error(
                `Transaction reverted: ${hash}. This may be due to insufficient gas, incorrect parameters, or contract restrictions.`
            );
        }

        // Debug: Log all events in the receipt to understand what's being emitted
        receipt.logs.forEach((log, index) => {
            console.log(`Log ${index}:`, {
                address: log.address,
                topics: log.topics,
                data: log.data,
            });

            // Try to decode each log with different event signatures
            try {
                const decoded = decodeEventLog({
                    abi: SPGNFTCollection.abi,
                    data: log.data,
                    topics: log.topics,
                });
                console.log(`Decoded event ${index}:`, decoded);
            } catch (error) {
                console.log(
                    `Failed to decode log ${index} with SPGNFTCollection ABI`
                );
            }
        });

        // Minted 이벤트에서 tokenId 추출
        const mintedEvents = receipt.logs.filter((log) => {
            try {
                const decoded = decodeEventLog({
                    abi: SPGNFTCollection.abi,
                    data: log.data,
                    topics: log.topics,
                });
                return decoded.eventName === "Minted";
            } catch {
                return false;
            }
        });

        let startTokenId: bigint;
        let tokenIds: bigint[];

        if (mintedEvents.length === 0) {
            // Try to fall back to Transfer events if no Minted events found

            const transferEvents = receipt.logs.filter((log) => {
                try {
                    const decoded = decodeEventLog({
                        abi: SPGNFTCollection.abi,
                        data: log.data,
                        topics: log.topics,
                    });
                    return (
                        decoded.eventName === "Transfer" &&
                        (decoded.args as any).from ===
                            "0x0000000000000000000000000000000000000000" &&
                        (decoded.args as any).to.toLowerCase() ===
                            input.walletAddress.toLowerCase()
                    );
                } catch {
                    return false;
                }
            });

            if (transferEvents.length === 0) {
                // 이벤트를 찾지 못한 경우, 컨트랙트 상태를 직접 읽어서 확인
                console.log(
                    "No events found, reading contract state directly..."
                );

                try {
                    // 현재 총 공급량 조회
                    const totalSupply = (await publicClient.readContract({
                        address: input.contractAddress as Hex,
                        abi: SPGNFTCollection.abi,
                        functionName: "totalSupply",
                    })) as bigint;

                    // 사용자의 NFT 잔액 조회
                    const userBalance = (await publicClient.readContract({
                        address: input.contractAddress as Hex,
                        abi: SPGNFTCollection.abi,
                        functionName: "balanceOf",
                        args: [input.walletAddress],
                    })) as bigint;

                    if (userBalance >= BigInt(input.quantity)) {
                        // 사용자가 소유한 최근 토큰들 조회
                        tokenIds = [];
                        const startIndex =
                            userBalance > BigInt(input.quantity)
                                ? userBalance - BigInt(input.quantity)
                                : 0n;

                        for (let i = 0; i < input.quantity; i++) {
                            try {
                                const tokenId =
                                    (await publicClient.readContract({
                                        address: input.contractAddress as Hex,
                                        abi: SPGNFTCollection.abi,
                                        functionName: "tokenOfOwnerByIndex",
                                        args: [
                                            input.walletAddress,
                                            startIndex + BigInt(i),
                                        ],
                                    })) as bigint;
                                tokenIds.push(tokenId);
                            } catch (indexError) {
                                // tokenOfOwnerByIndex가 없는 경우, 전체 토큰을 역순으로 확인
                                console.log(
                                    "tokenOfOwnerByIndex not available, scanning all tokens..."
                                );
                                tokenIds = [];

                                // 최근 생성된 토큰부터 역순으로 확인
                                for (
                                    let tokenId = totalSupply - 1n;
                                    tokenId >= 0n &&
                                    tokenIds.length < input.quantity;
                                    tokenId--
                                ) {
                                    try {
                                        const owner =
                                            (await publicClient.readContract({
                                                address:
                                                    input.contractAddress as Hex,
                                                abi: SPGNFTCollection.abi,
                                                functionName: "ownerOf",
                                                args: [tokenId],
                                            })) as string;

                                        if (
                                            owner.toLowerCase() ===
                                            input.walletAddress.toLowerCase()
                                        ) {
                                            tokenIds.unshift(tokenId); // 앞에 추가하여 오름차순 유지
                                        }
                                    } catch (ownerError) {
                                        // 토큰이 존재하지 않으면 계속
                                        continue;
                                    }
                                }
                                break;
                            }
                        }

                        if (tokenIds.length === input.quantity) {
                            tokenIds.sort((a, b) =>
                                a < b ? -1 : a > b ? 1 : 0
                            );
                            startTokenId = tokenIds[0];
                        } else {
                            throw new Error(
                                `Expected ${input.quantity} tokens but found ${tokenIds.length}`
                            );
                        }
                    } else {
                        throw new Error(
                            `User balance (${userBalance}) is less than expected quantity (${input.quantity})`
                        );
                    }
                } catch (contractReadError) {
                    console.error(
                        "Failed to read contract state:",
                        contractReadError
                    );
                    throw new Error(
                        "Failed to determine minted token IDs from contract state"
                    );
                }
            } else {
                // Use Transfer events to extract token IDs
                const transferTokenIds = transferEvents.map((event) => {
                    const decoded = decodeEventLog({
                        abi: SPGNFTCollection.abi,
                        data: event.data,
                        topics: event.topics,
                    });
                    return (decoded.args as any).tokenId as bigint;
                });

                // Sort token IDs to get the starting token ID
                transferTokenIds.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

                startTokenId = transferTokenIds[0];
                tokenIds = transferTokenIds;

                console.log(
                    `Using Transfer events - startTokenId: ${startTokenId}, tokenIds: ${tokenIds}`
                );
            }
        } else {
            // Check if we have individual Minted events for each NFT
            if (mintedEvents.length === input.quantity) {
                // Each NFT has its own Minted event
                tokenIds = mintedEvents.map((event) => {
                    const decoded = decodeEventLog({
                        abi: SPGNFTCollection.abi,
                        data: event.data,
                        topics: event.topics,
                    });
                    return (decoded.args as any).tokenId as bigint;
                });

                // Sort to find the starting token ID
                tokenIds.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
                startTokenId = tokenIds[0];
            } else {
                // Fallback: assume sequential token IDs from first Minted event
                const firstEvent = decodeEventLog({
                    abi: SPGNFTCollection.abi,
                    data: mintedEvents[0].data,
                    topics: mintedEvents[0].topics,
                });

                startTokenId = (firstEvent.args as any).tokenId as bigint;

                // 민팅된 모든 토큰 ID 배열 생성
                tokenIds = [];
                for (let i = 0; i < input.quantity; i++) {
                    tokenIds.push(startTokenId + BigInt(i));
                }
            }
        }

        // 3. DB에 NFT 정보 저장
        const nfts = await Promise.all(
            tokenIds.map((tokenId, index) =>
                prisma.story_nft.create({
                    data: {
                        tokenId: tokenId.toString(),
                        contractAddress: input.contractAddress,
                        ownerAddress: input.walletAddress,
                        networkId: input.networkId,
                        mintTxHash: hash,
                        tokenURI: tokenURIObjects[index].url,
                        tokenURICid: tokenURIObjects[index].cid,
                    },
                })
            )
        );

        return {
            startTokenId,
            quantity: input.quantity,
            txHash: hash,
            tokenIds,
            tokenURIs,
        };
    } catch (error) {
        console.error("Error minting NFTs:", error);
        throw error;
    }
}

export interface RegisterIPAssetInput {
    userId: string;
    networkId: string;
    walletAddress: string;
    nftContract: string;
    tokenId: bigint;
    ipMetadataURI?: string;
    ipMetadataHash?: string;
    nftMetadataURI?: string;
    nftMetadataHash?: string;
}

export interface RegisterIPAssetResult {
    ipId: string;
    txHash: string;
    tokenId: bigint;
}

export async function registerAsIPAsset(
    input: RegisterIPAssetInput
): Promise<RegisterIPAssetResult> {
    try {
        console.log(
            "[registerAsIPAsset] input:",
            JSON.stringify(input, (key, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );
        const network = await prisma.blockchainNetwork.findUnique({
            where: {
                id: input.networkId,
            },
        });
        console.log("[registerAsIPAsset] network:", network);

        if (!network) {
            console.error(
                "[registerAsIPAsset] Network not found for id:",
                input.networkId
            );
            throw new Error("Network not found");
        }

        const privateKey = await fetchEscrowWalletPrivateKey({
            userId: input.userId,
            address: input.walletAddress,
        });
        console.log("[registerAsIPAsset] privateKey fetched:", !!privateKey);

        if (!privateKey) {
            console.error(
                "[registerAsIPAsset] Private key not found for address:",
                input.walletAddress
            );
            throw new Error("Private key not found");
        }

        // Story SDK 클라이언트 가져오기
        const client = await fetchStoryClient({
            networkId: input.networkId,
            walletAddress: input.walletAddress,
        });
        console.log("[registerAsIPAsset] Story client fetched:", !!client);

        console.log("[registerAsIPAsset] Registering NFT as IP Asset...");

        // 해시 생성 (Story Protocol 공식 문서 방식 사용)
        // Story Protocol 표준: SHA256 해시를 사용하고 0x prefix 추가
        let ipMetadataHash: Hex;
        let nftMetadataHash: Hex;

        if (input.ipMetadataHash) {
            ipMetadataHash = input.ipMetadataHash as Hex;
            console.log(
                "[registerAsIPAsset] ipMetadataHash provided:",
                ipMetadataHash
            );
        } else if (input.ipMetadataURI) {
            try {
                console.log(
                    "[registerAsIPAsset] Fetching ipMetadataURI:",
                    input.ipMetadataURI
                );
                const response = await fetch(input.ipMetadataURI);
                if (response.ok) {
                    const metadata = await response.json();
                    const hash = createHash("sha256")
                        .update(JSON.stringify(metadata))
                        .digest("hex");
                    ipMetadataHash = `0x${hash}` as Hex;
                    console.log(
                        "[registerAsIPAsset] ipMetadataHash (fetched):",
                        ipMetadataHash
                    );
                } else {
                    ipMetadataHash = `0x${createHash("sha256")
                        .update("")
                        .digest("hex")}` as Hex;
                    console.warn(
                        "[registerAsIPAsset] ipMetadataURI fetch failed, using empty hash"
                    );
                }
            } catch (err) {
                ipMetadataHash = `0x${createHash("sha256")
                    .update("")
                    .digest("hex")}` as Hex;
                console.error(
                    "[registerAsIPAsset] Error fetching ipMetadataURI, using empty hash:",
                    err
                );
            }
        } else {
            ipMetadataHash = `0x${createHash("sha256")
                .update("")
                .digest("hex")}` as Hex;
            console.log(
                "[registerAsIPAsset] No ipMetadataHash or URI, using empty hash:",
                ipMetadataHash
            );
        }

        if (input.nftMetadataHash) {
            nftMetadataHash = input.nftMetadataHash as Hex;
            console.log(
                "[registerAsIPAsset] nftMetadataHash provided:",
                nftMetadataHash
            );
        } else if (input.nftMetadataURI) {
            try {
                console.log(
                    "[registerAsIPAsset] Fetching nftMetadataURI:",
                    input.nftMetadataURI
                );
                const response = await fetch(input.nftMetadataURI);
                if (response.ok) {
                    const metadata = await response.json();
                    const hash = createHash("sha256")
                        .update(JSON.stringify(metadata))
                        .digest("hex");
                    nftMetadataHash = `0x${hash}` as Hex;
                    console.log(
                        "[registerAsIPAsset] nftMetadataHash (fetched):",
                        nftMetadataHash
                    );
                } else {
                    nftMetadataHash = `0x${createHash("sha256")
                        .update("")
                        .digest("hex")}` as Hex;
                    console.warn(
                        "[registerAsIPAsset] nftMetadataURI fetch failed, using empty hash"
                    );
                }
            } catch (err) {
                nftMetadataHash = `0x${createHash("sha256")
                    .update("")
                    .digest("hex")}` as Hex;
                console.error(
                    "[registerAsIPAsset] Error fetching nftMetadataURI, using empty hash:",
                    err
                );
            }
        } else {
            nftMetadataHash = `0x${createHash("sha256")
                .update("")
                .digest("hex")}` as Hex;
            console.log(
                "[registerAsIPAsset] No nftMetadataHash or URI, using empty hash:",
                nftMetadataHash
            );
        }

        // Story SDK의 txOptions 타입에 맞게 설정
        const txOptions = {
            waitForTransaction: true,
        };

        // IP Asset 등록 (재시도 로직 제거)
        let response: any;
        try {
            console.log(`[registerAsIPAsset] Calling client.ipAsset.register`, {
                nftContract: input.nftContract,
                tokenId: input.tokenId,
                ipMetadata: {
                    ipMetadataURI: input.ipMetadataURI || undefined,
                    ipMetadataHash: ipMetadataHash,
                    nftMetadataURI: input.nftMetadataURI || undefined,
                    nftMetadataHash: nftMetadataHash,
                },
                txOptions,
            });
            response = await client.ipAsset.register({
                nftContract: input.nftContract as Hex,
                tokenId: input.tokenId,
                ipMetadata: {
                    ipMetadataURI: input.ipMetadataURI || undefined,
                    ipMetadataHash: ipMetadataHash,
                    nftMetadataURI: input.nftMetadataURI || undefined,
                    nftMetadataHash: nftMetadataHash,
                },
                txOptions,
            });
            console.log(`[registerAsIPAsset] Response`, response);
        } catch (error) {
            console.error(
                `[registerAsIPAsset] IP Asset registration failed:`,
                error
            );
            // Story SDK 특정 에러 처리
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            if (errorMessage.includes("already registered")) {
                // 이미 등록된 경우 기존 IP Asset 정보 조회 시도
                console.error(
                    "[registerAsIPAsset] NFT is already registered as IP Asset"
                );
                throw new Error("NFT is already registered as IP Asset");
            }
            if (errorMessage.includes("insufficient funds")) {
                console.error(
                    "[registerAsIPAsset] Insufficient funds for gas fees"
                );
                throw new Error("Insufficient funds for gas fees");
            }
            throw error;
        }

        if (!response?.ipId) {
            console.error(
                "[registerAsIPAsset] Registration failed (no ipId)",
                response
            );
            throw new Error("Failed to register IP Asset (no ipId)");
        }
        if (!response?.txHash) {
            await prisma.story_nft.update({
                where: {
                    contractAddress_tokenId: {
                        contractAddress: input.nftContract,
                        tokenId: input.tokenId.toString(),
                    },
                },
                data: {
                    ipId: response.ipId,
                },
            });
            console.warn(
                "[registerAsIPAsset] NFT is already registered as IP Asset. ipId:",
                response.ipId
            );
            throw new Error("NFT is already registered as IP Asset");
        }

        console.log(
            `[registerAsIPAsset] IP Asset registered: ${response.ipId}`
        );
        console.log(`[registerAsIPAsset] Transaction hash: ${response.txHash}`);

        // DB에 IP Asset 정보 저장
        const ipAsset = await prisma.story_ipAsset.create({
            data: {
                ipId: response.ipId,
                chainId: network.chainId.toString(),
                tokenContract: input.nftContract,
                tokenId: input.tokenId.toString(),
                ipMetadataURI: input.ipMetadataURI,
                ipMetadataHash: ipMetadataHash,
                nftMetadataURI: input.nftMetadataURI,
                nftMetadataHash: nftMetadataHash,
                registrationTxHash: response.txHash,
                networkId: input.networkId,
            },
        });
        console.log("[registerAsIPAsset] Saved ipAsset to DB:", ipAsset);

        // NFT 테이블에 ipAssetId 업데이트 (Story_ipAsset의 id 사용)
        const updateResult = await prisma.story_nft.update({
            where: {
                contractAddress_tokenId: {
                    contractAddress: input.nftContract,
                    tokenId: input.tokenId.toString(),
                },
            },
            data: {
                ipId: response.ipId,
            },
        });
        console.log(
            "[registerAsIPAsset] Updated story_nft with ipAssetId:",
            updateResult
        );

        return {
            ipId: response.ipId,
            txHash: response.txHash,
            tokenId: input.tokenId,
        };
    } catch (error) {
        console.error("[registerAsIPAsset] Error registering IP Asset:", error);
        throw error;
    }
}

export interface BatchRegisterIPAssetInput
    extends Omit<
        RegisterIPAssetInput,
        "tokenId" | "nftMetadataURI" | "nftMetadataHash"
    > {
    tokenIds: bigint[];
    nftMetadataURIs: string[];
    nftMetadataHashes: string[];
}

export interface BatchRegisterIPAssetResult {
    results: {
        tokenId: bigint;
        result?: RegisterIPAssetResult;
        error?: string;
    }[];
}

export async function batchRegisterAsIPAsset(
    input: BatchRegisterIPAssetInput
): Promise<BatchRegisterIPAssetResult> {
    const results: BatchRegisterIPAssetResult["results"] = [];

    for (let i = 0; i < input.tokenIds.length; i++) {
        try {
            const result = await registerAsIPAsset({
                ...input,
                tokenId: input.tokenIds[i],
                nftMetadataURI: input.nftMetadataURIs[i],
                nftMetadataHash: input.nftMetadataHashes[i],
            });
            results.push({ tokenId: input.tokenIds[i], result });
        } catch (error) {
            results.push({
                tokenId: input.tokenIds[i],
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return { results };
}

export interface MintAndRegisterAsIPAssetInput {
    userId: string;
    networkId: string;
    walletAddress: string;
    contractAddress: string;
    quantity: number;
    tokenURIMetadata: ERC721Metadata;
    ipAssetMetadata: IPAssetMetadata;
    mintFee?: bigint;
    reuseMetadata?: boolean;
}

export interface MintAndRegisterAsIPAssetResult {
    mintResult: mintResult;
    ipAssets: RegisterIPAssetResult[];
}

export async function mintAndRegisterAsIPAsset(
    input: MintAndRegisterAsIPAssetInput
): Promise<MintAndRegisterAsIPAssetResult> {
    try {
        console.log("Step 1: Minting NFTs...");

        // Story Protocol 표준에 맞게 메타데이터 보완
        const enrichedIPMetadata: IPAssetMetadata = {
            ...input.ipAssetMetadata,
            createdAt:
                input.ipAssetMetadata.createdAt || new Date().toISOString(),
            creators:
                input.ipAssetMetadata.creators?.map((creator) => ({
                    ...creator,
                    contributionPercent: creator.contributionPercent || 100,
                })) || [],
        };

        // 1. NFT 민팅
        const mintResult = await mint({
            userId: input.userId,
            networkId: input.networkId,
            walletAddress: input.walletAddress,
            contractAddress: input.contractAddress,
            quantity: input.quantity,
            tokenURIMetadata: input.tokenURIMetadata,
            ipAssetMetadata: input.ipAssetMetadata,
            mintFee: input.mintFee,
            reuseMetadata: input.reuseMetadata,
        });

        console.log("Step 2: Creating IP Asset metadata...");

        // 2. IP Asset 메타데이터 생성
        const ipMetadata = await createMetadata({
            userId: input.userId,
            metadata: enrichedIPMetadata,
            type: "ip-asset-metadata",
        });

        console.log("Step 3: Registering NFTs as IP Assets...");

        // 3. 각 NFT를 IP Asset으로 등록
        const ipAssets = await Promise.all(
            mintResult.tokenIds.map(async (tokenId, index) => {
                // Story Protocol 공식 문서에 맞게 SHA256 사용
                const nftMetadataHash = `0x${createHash("sha256")
                    .update(JSON.stringify(input.tokenURIMetadata))
                    .digest("hex")}` as Hex;

                const ipMetadataHashValue = `0x${createHash("sha256")
                    .update(JSON.stringify(enrichedIPMetadata))
                    .digest("hex")}` as Hex;

                return await registerAsIPAsset({
                    userId: input.userId,
                    networkId: input.networkId,
                    walletAddress: input.walletAddress,
                    nftContract: input.contractAddress,
                    tokenId: tokenId,
                    ipMetadataURI: ipMetadata.url,
                    ipMetadataHash: ipMetadataHashValue,
                    nftMetadataURI: mintResult.tokenURIs[index],
                    nftMetadataHash: nftMetadataHash,
                });
            })
        );

        console.log(
            `Successfully minted ${mintResult.quantity} NFTs and registered them as IP Assets`
        );

        return {
            mintResult,
            ipAssets,
        };
    } catch (error) {
        console.error("Error in mintAndRegisterAsIPAsset:", error);
        throw error;
    }
}

export interface getNFTsInput {
    networkId?: string;
    ownerAddress?: string;
    tokenIds?: string[];
    ipId?: string;
    unregistered?: boolean;
}

export type NFT = Story_nft & {
    spgCollection: Story_spg | null;
};

export async function getNFTs(input?: getNFTsInput): Promise<NFT[]> {
    try {
        if (!input) {
            return await prisma.story_nft.findMany({
                include: {
                    spgCollection: true,
                },
            });
        }

        const { networkId, ownerAddress, tokenIds, ipId, unregistered } = input;

        const where: Prisma.Story_nftWhereInput = {};

        if (networkId) {
            where.networkId = networkId;
        }

        if (ownerAddress) {
            where.ownerAddress = ownerAddress;
        }

        if (tokenIds) {
            where.tokenId = { in: tokenIds };
        }

        if (ipId) {
            where.ipId = ipId;
        }

        if (unregistered) {
            where.ipId = null;
        }

        return (await prisma.story_nft.findMany({
            where,
            include: {
                spgCollection: true,
            },
            orderBy: {
                tokenId: "asc",
            },
        })) as NFT[];
    } catch (error) {
        console.error("Error getting NFTs:", error);
        return [];
    }
}

async function getOwnersByTokenIds(
    publicClient: PublicClient,
    spgAddress: string,
    network: BlockchainNetwork,
    tokenIds: string[],
    batchSize: number = 200
): Promise<getOwnersResult[]> {
    if (!tokenIds || tokenIds.length === 0) {
        return [];
    }

    const results: getOwnersResult[] = [];

    try {
        for (let i = 0; i < tokenIds.length; i += batchSize) {
            const batch = tokenIds.slice(i, i + batchSize);

            if (network.multicallAddress) {
                const multicallResults = await publicClient.multicall({
                    contracts: batch.map((tokenId) => ({
                        address: spgAddress as Hex,
                        abi: SPGNFTCollection.abi as Abi,
                        functionName: "ownerOf",
                        args: [tokenId],
                    })),
                    multicallAddress: network.multicallAddress as Hex,
                });

                results.push(
                    ...multicallResults.map((result, index) => ({
                        tokenId: batch[index],
                        owner:
                            result.status === "success"
                                ? (result.result as string)
                                : "",
                    }))
                );
            } else {
                for (const tokenId of batch) {
                    try {
                        const owner = await publicClient.readContract({
                            address: spgAddress as Hex,
                            abi: SPGNFTCollection.abi,
                            functionName: "ownerOf",
                            args: [tokenId],
                        });
                        results.push({
                            tokenId,
                            owner: owner as string,
                        });
                    } catch (error) {
                        results.push({
                            tokenId,
                            owner: "",
                        });
                    }
                }
            }

            if (i + batchSize < tokenIds.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        return results;
    } catch (error) {
        console.error("Error getting owners:", error);
        return [];
    }
}

async function getTotalSupply(
    publicClient: PublicClient,
    spgAddress: string
): Promise<number> {
    const totalSupplyBigint = await publicClient.readContract({
        address: spgAddress as Hex,
        abi: SPGNFTCollection.abi,
        functionName: "totalSupply",
    });

    return Number(totalSupplyBigint);
}

export interface getOwnersInput {
    spgAddress: string;
    tokenIds?: string[];
}

export interface getOwnersResult {
    tokenId: string;
    owner: string;
}

export async function getOwners(
    input?: getOwnersInput
): Promise<getOwnersResult[]> {
    if (!input) {
        return [];
    }

    const spg = await prisma.story_spg.findUnique({
        where: {
            address: input.spgAddress,
        },
        include: {
            network: true,
        },
    });

    if (!spg) {
        throw new Error("SPG not found");
    }

    const publicClient = await fetchPublicClient({
        network: spg.network,
    });

    let tokenIds = input.tokenIds;
    if (!tokenIds || tokenIds.length === 0) {
        const totalSupply = await getTotalSupply(publicClient, spg.address);
        tokenIds = Array.from({ length: totalSupply }, (_, i) => i.toString());
    }

    return await getOwnersByTokenIds(
        publicClient,
        spg.address,
        spg.network,
        tokenIds
    );
}

export interface getCirculationInput {
    spgAddress: string;
}

export interface getCirculationResult {
    remain: number;
    total: number;
}

export async function getCirculation(
    input?: getCirculationInput
): Promise<getCirculationResult> {
    if (!input) {
        return {
            remain: 0,
            total: 0,
        };
    }

    try {
        const spg = await prisma.story_spg.findUnique({
            where: {
                address: input.spgAddress,
            },
            include: {
                network: true,
            },
        });

        if (!spg) {
            throw new Error("SPG not found");
        }

        const publicClient = await fetchPublicClient({
            network: spg.network,
        });

        const totalSupply = await getTotalSupply(publicClient, spg.address);

        const owners = await getOwnersByTokenIds(
            publicClient,
            spg.address,
            spg.network,
            Array.from({ length: totalSupply }, (_, i) => i.toString())
        );

        const total = spg.circulation || 0;

        const remain = Math.min(
            owners.filter((owner) => owner.owner === spg.ownerAddress).length,
            total
        );

        return {
            remain,
            total,
        };
    } catch (error) {
        console.error("Error getting circulation:", error);
        return {
            remain: 0,
            total: 0,
        };
    }
}

export interface TokenGatingInput {
    artist: Artist | null;
    userId: string | null;
}

export interface TokenGatingData {
    hasToken: boolean;
    detail: {
        tokenId: string;
        owner: string;
    }[];
}

export interface TokenGatingResult {
    success: boolean;
    data: Record<string, TokenGatingData>;
    error?: string;
}

export async function tokenGating(
    input?: TokenGatingInput
): Promise<TokenGatingResult> {
    try {
        const { artist, userId } = input || {};
        if (!artist?.id || !userId) {
            return {
                success: false,
                data: {},
                error: "Artist or user not found",
            };
        }

        // 1. 병렬 데이터 조회
        const [spgs, wallets] = await Promise.all([
            prisma.story_spg.findMany({
                where: { artistId: artist.id },
                select: { address: true },
            }),
            prisma.wallet.findMany({
                where: {
                    userId: userId,
                    status: "ACTIVE",
                },
                select: { address: true },
            }),
        ]);

        if (!spgs.length) {
            return {
                success: true,
                data: {},
                error: "No SPG found",
            };
        }

        if (wallets?.length === 0) {
            return {
                success: false,
                error: wallets
                    ? "User has no active wallets"
                    : "User not found",
                data: {},
            };
        }

        // 2. 미리 정규화된 지갑 주소 Set 생성
        const normalizedWalletAddresses = new Set(
            wallets.map((w) => w.address.toLowerCase())
        );

        // 3. 에러 처리가 포함된 병렬 SPG 처리
        const results = await Promise.allSettled(
            spgs.map(async (spg) => {
                try {
                    const owners = await getOwners({ spgAddress: spg.address });
                    const userOwnedTokens = owners.filter((owner) =>
                        normalizedWalletAddresses.has(owner.owner.toLowerCase())
                    );

                    return {
                        [spg.address]: {
                            hasToken: userOwnedTokens.length > 0,
                            detail: userOwnedTokens.map((token) => ({
                                tokenId: token.tokenId,
                                owner: token.owner,
                            })),
                        },
                    };
                } catch (error) {
                    console.warn(
                        `Failed to get owners for SPG ${spg.address}:`,
                        error
                    );
                    return {
                        [spg.address]: {
                            hasToken: false,
                            detail: [],
                        },
                    };
                }
            })
        );

        // 4. 성공한 결과만 병합
        const mergedData = results.reduce((acc, result) => {
            if (result.status === "fulfilled") {
                return { ...acc, ...result.value };
            }
            return acc;
        }, {});

        return {
            success: true,
            data: mergedData,
        };
    } catch (error) {
        console.error("Error in token gating:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to check token ownership",
            data: {},
        };
    }
}
