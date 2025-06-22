/// app\actions\metadata.ts

"use server";

import { MetadataType } from "@prisma/client";
import { put } from "@vercel/blob";

import { prisma } from "@/lib/prisma/client";

import type { Metadata, CollectionContract } from "@prisma/client";

/**
 * NFT 메타데이터 타입
 * OpenSea와 대부분의 NFT 마켓플레이스에서 사용하는 표준 메타데이터 형식
 */
export type METADATA_TYPE = {
    /** NFT의 이름 */
    name: string;

    /** NFT에 대한 설명 */
    description: string;

    /**
     * NFT 이미지의 URL
     * IPFS URL 형식: "ipfs://bafkreib4..."
     * HTTP URL도 가능: "https://example.com/image.png"
     */
    image: string;

    /**
     * NFT 프로젝트의 외부 웹사이트 URL
     * 반드시 https://로 시작하는 완전한 URL이어야 함
     */
    external_url: string;

    /**
     * 3D 모델, 애니메이션 등 멀티미디어 콘텐츠의 URL
     * 지원 형식: GLTF, GLB, WEBM, MP4, M4V, OGV, OGG
     */
    animation_url?: string;

    /**
     * 유튜브 영상 URL
     * 전체 URL이나 영상 ID 모두 가능
     * 예: "https://www.youtube.com/watch?v=..." 또는 "dQw4w9WgXcQ"
     */
    youtube_url?: string;

    /**
     * OpenSea에서 사용할 배경색 (6자리 16진수)
     * - '#' 기호를 포함하지 않음
     * - 대소문자 구분 없음
     * - 특히 투명한 PNG 이미지를 사용할 때 유용
     * @example "000000" // 검정
     * @example "FFFFFF" // 흰색
     * @example "FF0000" // 빨강
     */
    background_color?: HexColor;

    /**
     * NFT의 특성들을 정의하는 배열
     * OpenSea와 다른 마켓플레이스에서 필터링과 정렬에 사용됨
     */
    attributes?: {
        /** 특성의 종류 (예: "Level", "Rarity", "Type" 등) */
        trait_type: string;

        /** 특성의 값 */
        value: string | number;

        /**
         * 값의 표시 형식
         * - "number": 일반 숫자 (예: "5")
         * - "boost_number": 증가값 표시 (예: "+5")
         * - "boost_percentage": 퍼센트 표시 (예: "5%")
         * - "date": Unix Timestamp를 날짜로 변환하여 표시
         * - "string": 일반 문자열 (기본값)
         */
        display_type?:
            | "number"
            | "boost_number"
            | "boost_percentage"
            | "date"
            | "string";

        /**
         * 숫자형 특성의 최대값
         * display_type이 "number"일 때 게이지 바의 최대값으로 사용됨
         */
        max_value?: number;
    }[];

    /**
     * 추가적인 메타데이터를 위한 객체
     * 마켓플레이스에 따라 다르게 해석될 수 있음
     */
    properties?: {
        [key: string]: any;
    };
};

/**
 * 6자리 16진수 색상 코드를 위한 브랜디드 타입
 * TypeScript의 타입 시스템을 사용하여 일반 문자열과 구분
 */
export type HexColor = string & { __brand: "HexColor" };

/**
 * 문자열이 유효한 6자리 16진수 색상 코드인지 검증
 * @param color 검증할 색상 코드 문자열 ('#' 제외)
 * @returns 유효한 HexColor 타입인지 여부
 */
export async function isValidHexColor(color: string): Promise<boolean> {
    return /^[0-9A-Fa-f]{6}$/.test(color);
}

const TOKEN = process.env.BLOB_METADATA_READ_WRITE_TOKEN;

export async function getLinkableCollectionMetadata(): Promise<Metadata[]> {
    try {
        const linkableMetadata = await prisma.metadata.findMany({
            where: {
                collectionAddress: null,
                type: MetadataType.collection,
            },
        });
        return linkableMetadata;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get linkable collection metadata");
    }
}

export async function getCollectionMetadata(
    metadataId: string
): Promise<Metadata> {
    try {
        const createdMetadata = await prisma.metadata.findUnique({
            where: {
                id: metadataId,
                type: MetadataType.collection,
            },
        });
        if (!createdMetadata) {
            throw new Error("Metadata not found");
        }
        return createdMetadata;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get collection metadata");
    }
}

export async function createCollectionMetadata(
    metadata: METADATA_TYPE,
    collectionKey: string
): Promise<Metadata> {
    try {
        const json = JSON.stringify(metadata);
        const blob = new Blob([json], { type: "application/json" });
        const fileName = "contract.json";
        const { url } = await put(`${collectionKey}/${fileName}`, blob, {
            access: "public",
            token: TOKEN,
            addRandomSuffix: false,
        });

        const createdMetadata = await prisma.metadata.create({
            data: {
                collectionKey,
                metadata: metadata,
                url,
                type: MetadataType.collection,
            },
        });
        if (!createdMetadata) {
            throw new Error("Metadata not created");
        }
        return createdMetadata;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to create collection metadata");
    }
}

export async function linkCollectionMetadata(
    metadataId: string,
    collectionAddress: string
): Promise<Metadata> {
    try {
        const updatedMetadata = await prisma.metadata.update({
            where: {
                id: metadataId,
                type: MetadataType.collection,
            },
            data: {
                collectionAddress: collectionAddress,
            },
        });
        if (!updatedMetadata) {
            throw new Error("Metadata not updated");
        }
        return updatedMetadata;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to link collection metadata");
    }
}

export async function createNFTMetadata(
    collection: CollectionContract,
    specificCount: number = 1,
    tokenStartId: number = 0
) {
    try {
        const collectionMetadata = await prisma.metadata.findUnique({
            where: {
                collectionAddress: collection.address,
                type: MetadataType.collection,
            },
        });

        if (!collectionMetadata) {
            throw new Error("Collection metadata not found");
        }

        const metadata = collectionMetadata.metadata as METADATA_TYPE;
        const collectionKey = collection.key;
        const endPoint = specificCount
            ? tokenStartId + specificCount
            : collection.maxSupply;

        const batchSize = 20;
        const nftMetadataList = [];
        const failedUploads: number[] = [];

        for (let start = tokenStartId; start < endPoint; start += batchSize) {
            const end = Math.min(start + batchSize, endPoint);
            const batch = Array.from(
                { length: end - start },
                (_, i) => start + i
            );

            const batchResults = await Promise.allSettled(
                batch.map(async (tokenId) => {
                    try {
                        const json = JSON.stringify({
                            ...metadata,
                            name: `${metadata.name} #${tokenId}`,
                            tokenId: tokenId,
                        });

                        const blob = new Blob([json], {
                            type: "application/json",
                        });
                        const { url } = await put(
                            `${collectionKey}/${tokenId}`,
                            blob,
                            {
                                access: "public",
                                token: TOKEN,
                                addRandomSuffix: false,
                            }
                        );

                        return {
                            metadata: metadata,
                            url,
                            type: MetadataType.nft,
                            collectionAddress: collection.address,
                            collectionKey: collectionKey,
                            tokenId,
                        };
                    } catch (error) {
                        console.error(
                            `Failed to upload metadata for token ${tokenId}:`,
                            error
                        );
                        failedUploads.push(tokenId);
                        throw error;
                    }
                })
            );

            const successfulUploads = batchResults
                .filter(
                    (result): result is PromiseFulfilledResult<any> =>
                        result.status === "fulfilled"
                )
                .map((result) => result.value);

            nftMetadataList.push(...successfulUploads);

            if (end < endPoint) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        if (failedUploads.length > 0) {
            console.warn(
                `Failed to upload metadata for tokens: ${failedUploads.join(
                    ", "
                )}`
            );
        }

        const result = {
            totalProcessed: endPoint - tokenStartId,
            successful: endPoint - tokenStartId - failedUploads.length,
            failed: failedUploads.length,
            failedTokenIds: failedUploads,
        };

        return result;
    } catch (error) {
        console.error("Failed to create NFT metadata:", error);
        throw new Error("Failed to create NFT metadata");
    }
}

export async function getMetadataByCollectionAddress(address: string) {
    try {
        const metadata = await prisma.metadata.findUnique({
            where: {
                collectionAddress: address,
                type: MetadataType.collection,
            },
        });

        if (!metadata) {
            throw new Error("Collection metadata not found");
        }

        return metadata;
    } catch (error) {
        console.error("Failed to get metadata by collection address:", error);
        throw new Error("Failed to get metadata by collection address");
    }
}

export async function recoverNFTMetadata({
    tokenId,
    collectionAddress,
}: {
    tokenId: number;
    collectionAddress: string;
}) {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: {
                address: collectionAddress,
            },
            include: {
                metadata: true,
            },
        });

        if (!collection) {
            throw new Error("Collection not found");
        }

        const result = await createNFTMetadata(collection, 1, tokenId);

        return result;
    } catch (error) {
        console.error("Failed to recover NFT metadata:", error);
        throw new Error("Failed to recover NFT metadata");
    }
}
