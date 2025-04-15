/// app\actions\ipfs.ts

"use server";

import type { GroupResponseItem, UploadResponse } from "pinata";
import { pinataClient } from "@/lib/pinata/client";
import { prisma } from "@/lib/prisma/client";
import { IpfsFile, Metadata, NFT } from "@prisma/client";

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
    properties?: {};
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

export async function getIpfsFiles(): Promise<IpfsFile[]> {
    console.log("[getIpfsFiles] Fetching all IPFS files");
    const files = await prisma.ipfsFile.findMany();
    console.log(`[getIpfsFiles] Found ${files.length} files`);
    return files;
}

export async function getGroupFiles(groupId: string): Promise<IpfsFile[]> {
    console.log(`[getGroupFiles] Fetching files for group: ${groupId}`);
    const files = await prisma.ipfsFile.findMany({
        where: {
            groupId,
        },
    });
    console.log(
        `[getGroupFiles] Found ${files.length} files for group: ${groupId}`
    );
    return files;
}

export async function uploadIpfsFile(
    file: File,
    groupId?: string,
    gateway: string = "ipfs://",
    network?: string
): Promise<UploadResponse> {
    console.log(
        `[uploadIpfsFile] Uploading file: ${file.name}${
            groupId ? ` to group: ${groupId}` : ""
        }`
    );
    const response = await pinataClient.upload.public
        .file(file)
        .group(groupId ?? "");
    console.log(`[uploadIpfsFile] Upload response:`, response);

    const ipfsFile = await prisma.ipfsFile.create({
        data: {
            type: "nft-metadata",
            url: `${gateway}${response.cid}`,
            pinataId: response.id,
            name: file.name,
            cid: response.cid,
            size: response.size,
            numberOfFiles: response.number_of_files,
            mimeType: response.mime_type,
            groupId: groupId ?? null,
            gateway: gateway,
            network: network,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
    return response;
}

export async function uploadIpfsFiles(
    files: File[],
    gateway: string = "ipfs://",
    network?: string,
    groupId?: string
): Promise<UploadResponse[]> {
    console.log(
        `[uploadIpfsFiles] Uploading ${files.length} files${
            groupId ? ` to group: ${groupId}` : ""
        }`
    );

    const promises = files.map(async (file) => {
        const response = await uploadIpfsFile(file, groupId, gateway, network);
        return response;
    });

    const responses = await Promise.all(promises);

    console.log(`[uploadIpfsFiles] Created ${responses.length} IPFS files`);
    return responses;
}

export async function uploadMetadata(
    metadata: METADATA_TYPE,
    groupId?: string,
    collectionId?: string,
    gateway: string = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "ipfs://",
    network?: string
): Promise<Metadata> {
    console.log(
        `[uploadMetadata] Starting upload for metadata: "${metadata.name}"${
            groupId ? ` to group: ${groupId}` : ""
        }${collectionId ? ` for collection: ${collectionId}` : ""}`
    );

    if (!metadata.name) {
        throw new Error("name is required");
    }
    if (!metadata.description) {
        throw new Error("description is required");
    }
    if (!metadata.image) {
        throw new Error("image is required");
    }
    if (!metadata.external_url) {
        throw new Error("external_url is required");
    }

    if (
        metadata.background_color &&
        !(await isValidHexColor(metadata.background_color))
    ) {
        throw new Error("background_color must be a valid hex color");
    }

    if (
        !metadata.image.startsWith("ipfs://") &&
        !metadata.image.startsWith("https://")
    ) {
        throw new Error("Image URL must start with 'ipfs://' or 'https://'");
    }

    // 컬렉션 ID가 제공되었다면 실제 존재하는지 검증
    if (collectionId) {
        const collection = await prisma.collectionContract.findUnique({
            where: { id: collectionId },
        });

        if (!collection) {
            throw new Error(
                `CollectionContract with ID ${collectionId} not found`
            );
        }
    }

    try {
        console.log(`[uploadMetadata] Uploading metadata to Pinata`);
        const response = await pinataClient.upload.public
            .json(metadata)
            .group(groupId ?? "")
            .name(metadata.name);
        console.log(`[uploadMetadata] Pinata response:`, response);

        console.log(`[uploadMetadata] Saving metadata to database`);
        const tx = await prisma.$transaction(async (tx) => {
            try {
                console.log(`[uploadMetadata] Creating IPFS file record`);
                const ipfsFile = await tx.ipfsFile.create({
                    data: {
                        type: "nft-metadata",
                        url: `${gateway}${response.cid}`,
                        pinataId: response.id,
                        name: metadata.name,
                        cid: response.cid,
                        size: response.size,
                        numberOfFiles: response.number_of_files,
                        mimeType: response.mime_type,
                        groupId: groupId ?? "",
                        keyvalues: response.keyvalues ?? {},
                        vectorized: response.vectorized ?? false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
                console.log(
                    `[uploadMetadata] IPFS file created with ID: ${ipfsFile.id}`
                );

                console.log(`[uploadMetadata] Creating metadata record`);
                const savedMetadata = await tx.metadata.create({
                    data: {
                        metadata: metadata,
                        url: `${gateway}${response.cid}`,
                        ipfsFileId: ipfsFile.id,
                        collectionContractId: collectionId ?? null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
                console.log(
                    `[uploadMetadata] Metadata created with ID: ${savedMetadata.id}`
                );

                return { ipfsFile, savedMetadata };
            } catch (error) {
                console.error(`[uploadMetadata] Transaction error:`, error);
                throw error;
            }
        });

        if (!tx) {
            throw new Error("Failed to save metadata");
        }

        console.log(
            `[uploadMetadata] Successfully uploaded and saved metadata with ID: ${tx.savedMetadata.id}`
        );
        return tx.savedMetadata;
    } catch (error) {
        console.error(`[uploadMetadata] Error:`, error);
        throw error;
    }
}

export async function getMetadata(savedMetadataId: string): Promise<Metadata> {
    console.log(`[getMetadata] Fetching metadata with ID: ${savedMetadataId}`);
    const metadata = await prisma.metadata.findUnique({
        where: { id: savedMetadataId },
    });

    if (!metadata) {
        console.error(
            `[getMetadata] Metadata not found with ID: ${savedMetadataId}`
        );
        throw new Error("Metadata not found");
    }

    console.log(`[getMetadata] Found metadata: ${metadata.id}`);
    return metadata;
}

export async function getLinkableMetadata(): Promise<Metadata[]> {
    console.log(`[getLinkableMetadata] Fetching unlinked metadata`);
    const metadata = await prisma.metadata.findMany({
        where: { collectionContractId: null },
    });
    console.log(
        `[getLinkableMetadata] Found ${metadata.length} unlinked metadata items`
    );
    return metadata;
}

function createMetadataFile(metadata: METADATA_TYPE, index: number): File {
    const content = JSON.stringify(metadata, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    return new File([blob], `${index}.json`, { type: "application/json" });
}

export async function createMetadataFolder(
    metadataId: string,
    maxSupply: number,
    gateway: string = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "ipfs://"
): Promise<Metadata> {
    try {
        // 병렬로 메타데이터와 컬렉션 정보를 조회
        const linkableMetadata = await prisma.metadata.findUnique({
            where: { id: metadataId },
            select: { metadata: true },
        });

        if (!linkableMetadata?.metadata) {
            throw new Error("Metadata not found");
        }

        const metadata = linkableMetadata.metadata as METADATA_TYPE;

        // 메타데이터 파일 생성을 병렬로 처리
        const files = await Promise.all(
            Array.from({ length: maxSupply }, (_, i) => {
                const file = createMetadataFile(metadata, i);
                console.log(`Metadata Created: ${file.name}`);
                return file;
            })
        );

        // Pinata 업로드
        const pinataResponse = await pinataClient.upload.public.fileArray(
            files
        );

        // 트랜잭션으로 DB 작업 묶기
        const result = await prisma.$transaction(async (tx) => {
            // IPFS 파일 정보 생성
            const ipfsFile = await tx.ipfsFile.create({
                data: {
                    type: "nft-metadata-folder",
                    url: `${gateway}${pinataResponse.cid}`,
                    pinataId: pinataResponse.id,
                    name: metadata.name,
                    cid: pinataResponse.cid,
                    size: pinataResponse.size,
                    numberOfFiles: pinataResponse.number_of_files,
                    mimeType: pinataResponse.mime_type,
                    keyvalues: pinataResponse.keyvalues ?? {},
                    vectorized: pinataResponse.vectorized ?? false,
                },
            });

            // 메타데이터 업데이트
            const folder = await tx.metadata.update({
                where: { id: metadataId },
                data: {
                    url: `${gateway}${pinataResponse.cid}`,
                    metadata: metadata,
                    ipfsFileId: ipfsFile.id,
                    collectionContractId: null,
                },
            });

            return { ipfsFile, folder };
        });

        console.log(
            `[createMetadataFolder] Successfully created metadata folder ${result.folder.id}`
        );

        return result.folder;
    } catch (error) {
        console.error(`[linkMetadataToCollection] Error:`, error);
        throw error;
    }
}

export async function linkMetadataToCollection(
    metadataFolderId: string,
    collectionId: string
): Promise<Metadata> {
    console.log(
        `[linkMetadataToCollection] Linking metadata folder ${metadataFolderId} to collection ${collectionId}`
    );
    try {
        const metadataFolder = await prisma.metadata.update({
            where: { id: metadataFolderId },
            data: {
                collectionContractId: collectionId,
            },
        });

        console.log(
            `[linkMetadataToCollection] Successfully linked metadata ${metadataFolderId} to collection ${collectionId}`
        );

        return metadataFolder;
    } catch (error) {
        console.error(`[linkMetadataToCollection] Error:`, error);
        throw error;
    }
}

export async function createNFTMetadata(
    collectionId: string,
    mintAmount: number,
    batchSize: number = 10,
    gateway: string = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "ipfs://"
): Promise<Metadata[]> {
    const startTime = performance.now();
    console.log(
        `[createNFTMetadata] Starting - Collection: ${collectionId}, Mint Amount: ${mintAmount}, Batch Size: ${batchSize}`
    );

    try {
        console.log(
            `[createNFTMetadata] Fetching collection data for ID: ${collectionId}`
        );
        const collection = await prisma.collectionContract.findUnique({
            where: { id: collectionId },
            select: {
                id: true,
                name: true,
                metadata: true,
            },
        });
        console.log(`[createNFTMetadata] Collection found:`, collection);

        if (!collection) {
            throw new Error(`Collection not found with ID: ${collectionId}`);
        }

        if (
            !collection.metadata ||
            collection.metadata.length === 0 ||
            !collection.metadata[0].id
        ) {
            throw new Error(
                `Collection ${collection.name} (${collection.id}) isn't connected to any metadata`
            );
        }

        console.log(
            `[createNFTMetadata] Getting Pinata group for collection: ${collection.name}`
        );
        const group = await getPinataGroupByName(collection.name);
        console.log(`[createNFTMetadata] Pinata group:`, group);

        console.log(
            `[createNFTMetadata] Fetching collection metadata with ID: ${collection.metadata[0].id}`
        );
        const collectionMetadata = await getMetadata(collection.metadata[0].id);
        const metadata = collectionMetadata.metadata as METADATA_TYPE;
        console.log(
            `[createNFTMetadata] Using base metadata with name: ${metadata.name}`
        );

        const allMetadata: Metadata[] = [];
        const totalBatches = Math.ceil(mintAmount / batchSize);
        console.log(
            `[createNFTMetadata] Will create ${mintAmount} metadata in ${totalBatches} batches of ${batchSize}`
        );

        for (let i = 0; i < mintAmount; i += batchSize) {
            const batchStartTime = performance.now();
            const batchCount = Math.min(batchSize, mintAmount - i);
            const batchNumber = Math.floor(i / batchSize) + 1;

            console.log(
                `[createNFTMetadata] Processing batch ${batchNumber}/${totalBatches} - Creating ${batchCount} metadata`
            );

            const batchPromises = Array(batchCount)
                .fill(null)
                .map((_, index) => {
                    console.log(
                        `[createNFTMetadata] Creating metadata ${
                            i + index + 1
                        }/${mintAmount}`
                    );
                    return uploadMetadata(
                        metadata as METADATA_TYPE,
                        group?.id,
                        collection.id,
                        gateway
                    );
                });

            const batchResults = await Promise.all(batchPromises);
            console.log(
                `[createNFTMetadata] Batch ${batchNumber} completed - Created ${batchResults.length} metadata`
            );

            allMetadata.push(...batchResults);

            const batchEndTime = performance.now();
            const batchDuration = (batchEndTime - batchStartTime) / 1000;
            console.log(
                `[createNFTMetadata] Batch ${batchNumber} took ${batchDuration.toFixed(
                    2
                )} seconds`
            );

            if (i + batchSize < mintAmount) {
                console.log(
                    `[createNFTMetadata] Batch complete, waiting 500ms before next batch`
                );
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        console.log(
            `[createNFTMetadata] Completed - Created ${
                allMetadata.length
            } metadata in ${duration.toFixed(2)} seconds`
        );

        return allMetadata;
    } catch (error) {
        const errorTime = performance.now();
        const duration = (errorTime - startTime) / 1000;
        console.error(
            `[createNFTMetadata] ERROR after ${duration.toFixed(2)} seconds:`,
            error
        );
        throw error;
    }
}

export async function linkNFTsToMetadata({
    nftIds,
    collectionId,
    gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "ipfs://",
}: {
    nftIds: string[];
    collectionId: string;
    gateway: string;
}): Promise<NFT[]> {
    const startTime = performance.now();
    console.log(
        `[linkNFTsToMetadata] Starting - Collection: ${collectionId}, NFT Count: ${nftIds.length}`
    );
    console.log(`[linkNFTsToMetadata] NFT IDs to link:`, nftIds);

    const tx = await prisma.$transaction(async (tx) => {
        try {
            console.log(
                `[linkNFTsToMetadata] Finding available metadata for collection: ${collectionId}`
            );
            const linkableMetadata = await tx.metadata.findMany({
                where: {
                    AND: [
                        { collectionContractId: collectionId },
                        { token: null },
                    ],
                },
                take: nftIds.length,
            });
            console.log(
                `[linkNFTsToMetadata] Found ${linkableMetadata.length} available metadata items`
            );

            const needAmount = Math.max(
                0,
                nftIds.length - linkableMetadata.length
            );
            console.log(
                `[linkNFTsToMetadata] Need to create ${needAmount} additional metadata items`
            );

            if (needAmount > 0) {
                console.log(
                    `[linkNFTsToMetadata] Creating ${needAmount} new metadata items for collection: ${collectionId}`
                );
                const createStart = performance.now();
                const batchSize = 10;
                const newLinkableMetadata = await createNFTMetadata(
                    collectionId,
                    needAmount,
                    batchSize,
                    gateway
                );
                const createEnd = performance.now();
                const createDuration = (createEnd - createStart) / 1000;
                console.log(
                    `[linkNFTsToMetadata] Created ${
                        newLinkableMetadata.length
                    } new metadata items in ${createDuration.toFixed(
                        2
                    )} seconds`
                );

                linkableMetadata.push(...newLinkableMetadata);
                console.log(
                    `[linkNFTsToMetadata] Total available metadata items: ${linkableMetadata.length}`
                );
            }

            console.log(
                `[linkNFTsToMetadata] Preparing to update ${nftIds.length} NFTs with metadata`
            );
            const updatePromises = nftIds.map((nftId, index) => {
                const metadataId = linkableMetadata[index]?.id;
                console.log(
                    `[linkNFTsToMetadata] Linking NFT ${nftId} to metadata ${metadataId} (${
                        index + 1
                    }/${nftIds.length})`
                );

                return tx.nFT.update({
                    where: { id: nftId },
                    data: {
                        metadataId: metadataId,
                    },
                });
            });

            console.log(
                `[linkNFTsToMetadata] Executing ${updatePromises.length} NFT updates`
            );
            const updateStart = performance.now();
            const updatedNFTs = await Promise.all(updatePromises);
            const updateEnd = performance.now();
            const updateDuration = (updateEnd - updateStart) / 1000;

            console.log(
                `[linkNFTsToMetadata] Successfully updated ${
                    updatedNFTs.length
                } NFTs in ${updateDuration.toFixed(2)} seconds`
            );
            return updatedNFTs;
        } catch (error) {
            const errorTime = performance.now();
            const duration = (errorTime - startTime) / 1000;
            console.error(
                `[linkNFTsToMetadata] Transaction ERROR after ${duration.toFixed(
                    2
                )} seconds:`,
                error
            );
            throw error;
        }
    });

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    console.log(
        `[linkNFTsToMetadata] Completed - Linked ${
            tx.length
        } NFTs to metadata in ${duration.toFixed(2)} seconds`
    );

    return tx;
}

export async function createPinataGroup({
    name,
}: {
    name: string;
}): Promise<GroupResponseItem> {
    console.log(`[createPinataGroup] Creating Pinata group with name: ${name}`);
    const group = await pinataClient.groups.public.create({
        name,
    });
    console.log(`[createPinataGroup] Pinata group created:`, group);

    console.log(`[createPinataGroup] Saving group to database`);
    await prisma.ipfsGroup.create({
        data: {
            pinataId: group.id,
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
    console.log(`[createPinataGroup] Group saved to database`);

    return group;
}

export async function getPinataGroupById(
    id: string
): Promise<GroupResponseItem | null> {
    console.log(`[getPinataGroupById] Looking up group with ID: ${id}`);
    const prismaGroup = await prisma.ipfsGroup.findUnique({
        where: { id },
    });

    if (prismaGroup && prismaGroup.id) {
        console.log(
            `[getPinataGroupById] Found group in database: ${prismaGroup.name}`
        );
        return {
            id: prismaGroup.pinataId,
            is_public: true,
            name: prismaGroup.name,
            createdAt: prismaGroup.createdAt.toISOString(),
        };
    }

    console.log(
        `[getPinataGroupById] Group not found in database, checking Pinata API`
    );
    const pinataGroup = await pinataClient.groups.public.get({
        groupId: id,
    });
    if (pinataGroup && pinataGroup.id) {
        console.log(
            `[getPinataGroupById] Found group via Pinata API: ${pinataGroup.name}`
        );
        console.log(`[getPinataGroupById] Saving group to database`);
        await prisma.ipfsGroup.create({
            data: {
                pinataId: pinataGroup.id,
                name: pinataGroup.name,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        console.log(`[getPinataGroupById] Group saved to database`);

        return pinataGroup;
    }

    console.log(`[getPinataGroupById] Group not found with ID: ${id}`);
    return null;
}

export async function getPinataGroupByName(
    name: string
): Promise<GroupResponseItem | null> {
    console.log(`[getPinataGroupByName] Looking up group with name: ${name}`);
    const group = await prisma.ipfsGroup.findUnique({
        where: { name },
    });

    if (group && group.id) {
        console.log(
            `[getPinataGroupByName] Found existing group: ${group.name}`
        );
        return {
            id: group.pinataId,
            is_public: true,
            name: group.name,
            createdAt: group.createdAt.toISOString(),
        };
    }

    console.log(
        `[getPinataGroupByName] Group not found, creating new group: ${name}`
    );
    const newGroup = await createPinataGroup({
        name: name,
    });
    console.log(`[getPinataGroupByName] New group created: ${newGroup.name}`);

    return newGroup;
}

export async function getPinataGroups(): Promise<GroupResponseItem[]> {
    console.log(`[getPinataGroups] Fetching all Pinata groups`);
    const groups = await prisma.ipfsGroup.findMany();
    console.log(`[getPinataGroups] Found ${groups.length} groups`);

    return groups.map((group) => ({
        id: group.pinataId,
        is_public: true,
        name: group.name,
        createdAt: group.createdAt.toISOString(),
    }));
}
