/// app/story/metadata/actions.ts

"use server";

import * as Proof from "@web3-storage/w3up-client/proof";
import { fetchWeb3StorageClient } from "../client";
import { prisma } from "@/lib/prisma/client";
import { ipfs, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";
import { filesFromPaths } from "files-from-path";
import { nanoid } from "nanoid";

const SPACE_PROOF = process.env.WEB3STORAGE_SPACE_PROOF;

export type ERC7572Metadata = {
    name: string;
    description: string;
    image?: string;
    banner_image?: string;
    featured_image?: string;
    external_link?: string;
    collaborators?: string[];
};

export type IPAssetMetadata = {
    title: string;
    description: string;
    image?: string;
    imageHash?: string;
    mediaUrl?: string;
    mediaHash?: string;
    mediaType?: string;
    videoUrl?: string;
    videoHash?: string;
    creators?: Array<{
        name: string;
        address: string;
        description?: string;
        contributionPercent: number;
        socialMedia?: Array<{
            platform: string;
            url: string;
        }>;
    }>;
    tags?: string[];
    createdAt?: string;
};

export type ERC721Metadata = {
    name: string;
    description: string;
    image: string;
    external_url?: string;
    attributes?: Array<{
        display_type?:
            | "boost_percentage"
            | "boost_number"
            | "number"
            | "date"
            | "string";
        trait_type: string;
        value: string | number | Date;
    }>;
    animation_url?: string;
    youtube_url?: string;
    banner_image?: string;
    featured_image?: string;
    collaborators?: string[];
};

export type ipfsType =
    | "spg-nft-collection-metadata"
    | "ip-asset-metadata"
    | "erc721-metadata"
    | "base-uri-directory"
    | "default"
    | "image"
    | "video"
    | "audio"
    | "document"
    | "other";

export interface createMetadataInput {
    userId: string;
    metadata: ERC7572Metadata | IPAssetMetadata | ERC721Metadata;
    type: ipfsType;
}

export async function createMetadata(
    input: createMetadataInput
): Promise<ipfs> {
    if (!SPACE_PROOF) {
        throw new Error("Web3.Storage 인증 정보가 누락되었습니다.");
    }

    const client = await fetchWeb3StorageClient();
    const proof = await Proof.parse(SPACE_PROOF);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    const json = JSON.stringify(input.metadata, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const cidObj = await client.uploadFile(blob);
    const cid = cidObj.toString();
    const url = `https://w3s.link/ipfs/${cid}`;

    // CID가 이미 존재하는지 확인
    const existingMetadata = await prisma.ipfs.findUnique({
        where: { cid },
    });

    if (existingMetadata) {
        console.log(`Reusing existing metadata with CID: ${cid}`);
        return existingMetadata;
    }

    // 새로운 메타데이터 생성
    const metadata = await prisma.ipfs.create({
        data: {
            cid,
            url,
            type: input.type,
        },
    });

    return metadata;
}

export interface getMetadataInput {
    id?: string;
    cid?: string;
    url?: string;
}

export async function getMetadata(
    input?: getMetadataInput
): Promise<ipfs | null> {
    if (!input) {
        return null;
    }

    if (!input.id && !input.cid && !input.url) {
        return null;
    }

    try {
        let metadata: ipfs | null = null;

        if (input.id) {
            metadata = await prisma.ipfs.findUnique({
                where: { id: input.id },
            });
        } else if (input.cid) {
            metadata = await prisma.ipfs.findUnique({
                where: { cid: input.cid },
            });
        } else if (input.url) {
            metadata = await prisma.ipfs.findUnique({
                where: { url: input.url },
            });
        }

        return metadata;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface getMetadataListInput {
    type?: ipfsType;
}

export async function getMetadataList(
    input?: getMetadataListInput
): Promise<ipfs[]> {
    if (!input) {
        return await prisma.ipfs.findMany();
    }

    try {
        const metadataList = await prisma.ipfs.findMany({
            where: {
                type: input?.type,
            },
        });

        return metadataList;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export interface updateMetadataInput {
    id: string;
    cid?: string;
    url?: string;
    type?: ipfsType;
}

export async function updateMetadata(input: updateMetadataInput) {
    try {
        const data: Prisma.ipfsUpdateInput = {
            updatedAt: new Date(),
        };

        if (input.cid) {
            data.cid = input.cid;
        }

        if (input.url) {
            data.url = input.url;
        }

        if (input.type) {
            data.type = input.type;
        }

        const metadata = await prisma.ipfs.update({
            where: { id: input.id },
            data,
        });

        return metadata;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface deleteMetadataInput {
    id: string;
}

export async function deleteMetadata(input: deleteMetadataInput) {
    try {
        const metadata = await prisma.ipfs.delete({
            where: { id: input.id },
        });

        return metadata;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface UploadMediaInput {
    userId: string;
    media: File;
    previewUrl?: string;
    previewWidth?: number;
    previewHeight?: number;
    previewMimeType?: string;
    previewSizeBytes?: number;
    type: ipfsType;
}

export interface uploadMediaOutput {
    cid: string;
    url: string;
    type: ipfsType;
    previewUrl?: string;
    previewWidth?: number;
    previewHeight?: number;
    previewMimeType?: string;
    previewSizeBytes?: number;
}

export async function uploadMedia(input: UploadMediaInput) {
    if (!SPACE_PROOF) {
        throw new Error("Web3.Storage 인증 정보가 누락되었습니다.");
    }

    const client = await fetchWeb3StorageClient();
    const proof = await Proof.parse(SPACE_PROOF);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    const blob = new Blob([input.media], { type: input.media.type });
    const cidObj = await client.uploadFile(blob);
    const cid = cidObj.toString();
    const url = `https://w3s.link/ipfs/${cid}`;

    // CID가 이미 존재하는지 확인
    const existingMedia = await prisma.ipfs.findUnique({
        where: { cid },
    });

    if (existingMedia) {
        console.log(`Reusing existing media with CID: ${cid}`);
        return { cid, url: existingMedia.url, type: existingMedia.type };
    }

    // 새로운 미디어 생성
    await prisma.ipfs.create({
        data: {
            cid,
            url,
            type: input.type,
            previewUrl: input.previewUrl,
            previewWidth: input.previewWidth,
            previewHeight: input.previewHeight,
            previewMimeType: input.previewMimeType,
            previewSizeBytes: input.previewSizeBytes,
        },
    });

    return {
        cid,
        url,
        type: input.type,
        previewUrl: input.previewUrl,
        previewWidth: input.previewWidth,
        previewHeight: input.previewHeight,
        previewMimeType: input.previewMimeType,
        previewSizeBytes: input.previewSizeBytes,
    } as uploadMediaOutput;
}

export interface createTokenURIsMetadataInput {
    userId: string;
    networkId: string;
    walletAddress: string;
    baseMetadata: ERC721Metadata;
    quantity: number;
    reuseMetadata?: boolean;
}

export async function createTokenURIsMetadata(
    input: createTokenURIsMetadataInput
): Promise<ipfs[]> {
    if (input.reuseMetadata) {
        const sharedMetadata = await createMetadata({
            userId: input.userId,
            metadata: input.baseMetadata,
            type: "erc721-metadata",
        });

        return Array(input.quantity).fill(sharedMetadata);
    }

    const tokenURIs = await Promise.all(
        Array.from({ length: input.quantity }, async (_, i) => {
            const uniqueMetadata: ERC721Metadata = {
                ...input.baseMetadata,
                name: `${input.baseMetadata.name} #${i + 1}`,
                attributes: [
                    ...(input.baseMetadata.attributes || []),
                    {
                        trait_type: "Token ID",
                        value: i + 1,
                        display_type: "number" as const,
                    },
                ],
            };

            const tokenURI = await createMetadata({
                userId: input.userId,
                metadata: uniqueMetadata,
                type: "erc721-metadata",
            });
            return tokenURI;
        })
    );
    return tokenURIs;
}

export interface createBaseURIInput {
    userId: string;
    networkId: string;
    walletAddress: string;
    selectedMetadata: ipfs;
}

export async function createBaseURI(input: createBaseURIInput) {
    if (!SPACE_PROOF) {
        throw new Error("Web3.Storage 인증 정보가 누락되었습니다.");
    }

    const client = await fetchWeb3StorageClient();
    const proof = await Proof.parse(SPACE_PROOF);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    const pathName = nanoid();

    if (!fs.existsSync(pathName)) {
        fs.mkdirSync(pathName, { recursive: true });
    }

    const contractJsonPath = path.join(pathName, "contract.json");
    fs.writeFileSync(
        contractJsonPath,
        JSON.stringify(input.selectedMetadata, null, 2)
    );

    const files = await filesFromPaths([pathName]);
    const directoryCid = await client.uploadDirectory(files);
    const baseURI = `ipfs://${directoryCid}/`;
    const url = `https://w3s.link/ipfs/${directoryCid}/`;
    const cid = directoryCid.toString();

    // CID가 이미 존재하는지 확인
    const existingDirectory = await prisma.ipfs.findUnique({
        where: { cid },
    });

    if (!existingDirectory) {
        // 새로운 디렉토리 생성
        await prisma.ipfs.create({
            data: {
                cid,
                url,
                type: "base-uri-directory",
            },
        });
    } else {
        console.log(`Reusing existing directory with CID: ${cid}`);
    }

    return { baseURI, cid, url };
}

export interface fetchURIInput {
    uri: string;
}

export async function fetchURI(input: fetchURIInput): Promise<any> {
    const { uri } = input;
    let url = uri;

    if (uri.startsWith("ipfs://")) {
        url = "https://w3s.link/ipfs/" + uri.slice(7);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}
