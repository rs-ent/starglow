/// app\actions\files.ts

"use server";

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma/client";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { requireAuth } from "../auth/authUtils";
import { revalidatePath } from "next/cache";

export interface StoredFile {
    id: string;
    url: string;
    name: string;
    type: string;
    size: number;
    purpose: string;
    bucket: string;
    order: number;
    createdAt: Date;
}

async function optimizeImage(
    file: File,
    quality: number = 90
): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return sharp(buffer).webp({ quality }).toBuffer();
}

export async function uploadFile(
    file: File,
    purpose: string,
    bucket: string
): Promise<StoredFile> {
    await requireAuth();

    let optimizedBuffer: Buffer | null = null;
    let optimizedType = file.type;
    let optimizedSize = file.size;

    if (file.type.startsWith("image/")) {
        try {
            optimizedBuffer = await optimizeImage(file);
            optimizedType = "image/webp";
            optimizedSize = optimizedBuffer.length;
        } catch (error) {
            console.error("Error optimizing image:", error);
        }
    }

    const fileExt = optimizedBuffer ? "webp" : file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    const fileToUpload = optimizedBuffer || file;

    const { url } = await put(fileName, fileToUpload, {
        access: "public",
    });

    const storedFile = await prisma.storedFiles.create({
        data: {
            url,
            name: fileName,
            type: optimizedType,
            mimeType: optimizedType,
            sizeBytes: optimizedSize,
            order: 0,
            purpose,
            bucket,
        },
    });

    return {
        id: storedFile.id,
        url: storedFile.url,
        name: storedFile.name || fileName,
        type: storedFile.type || optimizedType,
        size: storedFile.sizeBytes || optimizedSize,
        purpose: storedFile.purpose || purpose,
        bucket: storedFile.bucket || bucket,
        order: storedFile.order || 0,
        createdAt: storedFile.createdAt,
    };
}

export async function deleteFile(id: string): Promise<boolean> {
    await requireAuth();

    const file = await prisma.storedFiles.findUnique({
        where: { id },
    });

    if (!file) {
        throw new Error("File not found");
    }

    await prisma.storedFiles.delete({
        where: { id },
    });

    return true;
}

export async function uploadFiles(
    formData: FormData,
    purpose: string,
    bucket: string
): Promise<StoredFile[]> {
    await requireAuth();

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
        throw new Error("No files provided");
    }

    const currentFiles = await prisma.storedFiles.findMany({
        where: { purpose },
        orderBy: { order: "desc" },
        take: 1,
    });
    const nextOrder =
        currentFiles.length > 0 ? (currentFiles[0].order || 0) + 1 : 0;

    const uploadedFiles = await Promise.all(
        files.map(async (file, index) => {
            let optimizedBuffer: Buffer | null = null;
            let optimizedType = file.type;
            let optimizedSize = file.size;

            if (file.type.startsWith("image/")) {
                try {
                    optimizedBuffer = await optimizeImage(file);
                    optimizedType = "image/webp";
                    optimizedSize = optimizedBuffer.length;
                } catch (error) {
                    console.error("Error optimizing image:", error);
                }
            }

            const fileExt = optimizedBuffer
                ? "webp"
                : file.name.split(".").pop();
            const fileName = `${uuidv4()}.${fileExt}`;

            const fileToUpload = optimizedBuffer || file;

            const { url } = await put(fileName, fileToUpload, {
                access: "public",
            });

            const storedFile = await prisma.storedFiles.create({
                data: {
                    url,
                    name: fileName,
                    type: optimizedType,
                    mimeType: optimizedType,
                    sizeBytes: optimizedSize,
                    purpose,
                    order: nextOrder + index,
                    bucket: bucket,
                },
            });

            return {
                id: storedFile.id,
                url: storedFile.url,
                name: storedFile.name || fileName,
                type: storedFile.type || optimizedType,
                size: storedFile.sizeBytes || optimizedSize,
                purpose: storedFile.purpose || purpose,
                bucket: storedFile.bucket || bucket,
                order: storedFile.order || nextOrder + index,
                createdAt: storedFile.createdAt,
            };
        })
    );

    return uploadedFiles;
}

export async function getFilesByPurposeAndBucket(
    purpose: string,
    bucket: string = "default"
): Promise<StoredFile[]> {
    await requireAuth();

    const files = await prisma.storedFiles.findMany({
        where: {
            purpose,
            bucket,
        },
        orderBy: {
            order: "asc",
        },
    });

    return files.map((file) => ({
        id: file.id,
        url: file.url,
        name: file.name || "",
        type: file.type || "",
        size: file.sizeBytes || 0,
        purpose: file.purpose || "",
        bucket: file.bucket || "",
        order: file.order || 0,
        createdAt: file.createdAt,
    }));
}

export async function getFileById(id: string): Promise<StoredFile | null> {
    await requireAuth();

    const file = await prisma.storedFiles.findUnique({
        where: { id },
    });

    if (!file) {
        return null;
    }

    return {
        id: file.id,
        url: file.url,
        name: file.name || "",
        type: file.type || "",
        size: file.sizeBytes || 0,
        purpose: file.purpose || "",
        bucket: file.bucket || "",
        order: file.order || 0,
        createdAt: file.createdAt,
    };
}

export async function updateFileOrder(
    id: string,
    newOrder: number,
    purpose: string,
    bucket: string = "default"
): Promise<StoredFile> {
    await requireAuth();

    const updatedFile = await prisma.storedFiles.update({
        where: { id },
        data: { order: newOrder },
    });

    return {
        id: updatedFile.id,
        url: updatedFile.url,
        name: updatedFile.name || "",
        type: updatedFile.type || "",
        size: updatedFile.sizeBytes || 0,
        purpose: updatedFile.purpose || "",
        bucket: updatedFile.bucket || bucket,
        order: updatedFile.order || 0,
        createdAt: updatedFile.createdAt,
    };
}

export async function updateFilesOrder(
    files: { id: string; order: number }[],
    purpose: string,
    bucket: string = "default"
): Promise<StoredFile[]> {
    await requireAuth();

    const updatedFiles = await prisma.$transaction(
        files.map((file) =>
            prisma.storedFiles.update({
                where: { id: file.id },
                data: { order: file.order },
            })
        )
    );

    return updatedFiles.map((file) => ({
        id: file.id,
        url: file.url,
        name: file.name || "",
        type: file.type || "",
        size: file.sizeBytes || 0,
        purpose: file.purpose || "",
        bucket: file.bucket || bucket,
        order: file.order || 0,
        createdAt: file.createdAt,
    }));
}

export interface IPFSFileUploadResult {
    success: boolean;
    id?: string;
    cid?: string;
    url?: string;
    ipfsUrl?: string;
    gatewayUrl?: string;
    groupId?: string;
    name?: string;
    type?: string;
    size?: number;
    purpose?: string;
    bucket?: string;
    order?: number;
    createdAt?: Date;
    error?: string;
}

/**
 * 파일을 IPFS (Pinata)에 직접 업로드합니다.
 * Vercel Blob 대신 Pinata를 사용하여 탈중앙화된 저장소에 파일을 저장합니다.
 * 이미지인 경우 자동으로 최적화합니다.
 */
export async function uploadFileToIPFS(
    file: File,
    purpose: string,
    bucket: string,
    optimizeImages: boolean = true
): Promise<IPFSFileUploadResult> {
    await requireAuth();

    try {
        const pinataApiKey = process.env.PINATA_API_KEY;
        const pinataApiSecret = process.env.PINATA_API_SECRET;
        const pinataJWT = process.env.PINATA_JWT;

        if ((!pinataApiKey || !pinataApiSecret) && !pinataJWT) {
            console.error("Pinata API credentials not configured");
            return {
                success: false,
                error: "Pinata API credentials not configured. IPFS 핀닝 서비스 인증 정보를 설정해주세요.",
            };
        }

        // 파일 최적화 (이미지인 경우, 그리고 최적화 옵션이 켜져 있는 경우)
        let optimizedBuffer: Buffer | null = null;
        let optimizedType = file.type;
        let optimizedSize = file.size;

        if (optimizeImages && file.type.startsWith("image/")) {
            try {
                optimizedBuffer = await optimizeImage(file);
                optimizedType = "image/webp";
                optimizedSize = optimizedBuffer.length;
            } catch (error) {
                console.error("Error optimizing image:", error);
            }
        }

        const fileExt = optimizedBuffer ? "webp" : file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;

        // Pinata에 파일 업로드용 formData 생성
        const formData = new FormData();

        if (optimizedBuffer) {
            // Buffer를 Blob으로 변환
            const blob = new Blob([optimizedBuffer], { type: optimizedType });
            formData.append("file", blob, fileName);
        } else {
            formData.append("file", file, fileName);
        }

        formData.append(
            "pinataMetadata",
            JSON.stringify({
                name: fileName,
                keyvalues: {
                    purpose,
                    bucket,
                    originalName: file.name,
                    fileType: file.type,
                },
            })
        );

        // Pinata 인증 - JWT 또는 API 키/시크릿 사용
        let pinataHeaders: HeadersInit = {};
        if (pinataJWT) {
            pinataHeaders = {
                Authorization: `Bearer ${pinataJWT}`,
            };
        } else if (pinataApiKey && pinataApiSecret) {
            pinataHeaders = {
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataApiSecret,
            };
        } else {
            throw new Error("Pinata credentials not available");
        }

        // Pinata API로 파일 업로드
        const response = await fetch(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            {
                method: "POST",
                headers: pinataHeaders,
                body: formData,
            }
        );

        if (!response.ok) {
            console.error("Failed to upload to Pinata:", await response.text());
            return {
                success: false,
                error: "IPFS 업로드에 실패했습니다. 나중에 다시 시도해주세요.",
            };
        }

        const pinataResult = await response.json();
        const cid = pinataResult.IpfsHash;
        const ipfsUrl = `ipfs://${cid}`;
        const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;

        let storedFile = await prisma.storedFiles.findFirst({
            where: {
                OR: [{ url: gatewayUrl }, { sourceUrl: ipfsUrl }],
            },
        });

        if (!storedFile) {
            // 데이터베이스에 메타데이터 저장 (기존 StoredFiles 테이블 활용)
            storedFile = await prisma.storedFiles.create({
                data: {
                    url: gatewayUrl, // Pinata Gateway URL 저장
                    name: fileName,
                    type: optimizedType,
                    mimeType: optimizedType,
                    sizeBytes: optimizedSize,
                    sourceUrl: ipfsUrl, // IPFS URL을 sourceUrl에 저장
                    purpose,
                    bucket,
                    order: 0,
                    metadata: {
                        cid,
                        ipfsUrl,
                        gatewayUrl,
                        originalName: file.name,
                    },
                },
            });
        }

        if (!storedFile) {
            throw new Error("Failed to create stored file");
        }

        // 파일 업로드 결과 반환
        return {
            success: true,
            id: storedFile.id,
            cid,
            url: gatewayUrl,
            ipfsUrl,
            gatewayUrl,
            name: storedFile.name || fileName,
            type: storedFile.type || optimizedType,
            size: storedFile.sizeBytes || optimizedSize,
            purpose: storedFile.purpose || purpose,
            bucket: storedFile.bucket || bucket,
            order: storedFile.order || 0,
            createdAt: storedFile.createdAt,
        };
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}

/**
 * 여러 파일을 IPFS (Pinata)에 업로드합니다.
 */
export async function uploadFilesToIPFS(
    files: File[],
    purpose: string,
    bucket: string,
    optimizeImages: boolean = true
): Promise<IPFSFileUploadResult[]> {
    await requireAuth();

    if (!files || files.length === 0) {
        throw new Error("No files provided");
    }

    // 현재 순서 가져오기
    const currentFiles = await prisma.storedFiles.findMany({
        where: { purpose },
        orderBy: { order: "desc" },
        take: 1,
    });
    const nextOrder =
        currentFiles.length > 0 ? (currentFiles[0].order || 0) + 1 : 0;

    const uploadedFiles = await Promise.all(
        files.map((file, index) =>
            uploadFileToIPFS(file, purpose, bucket, optimizeImages)
        )
    );

    // order 값 업데이트
    const successfulUploads = uploadedFiles.filter(
        (result) => result.success && result.id
    );

    if (successfulUploads.length > 0) {
        await prisma.$transaction(
            successfulUploads.map((file, index) =>
                prisma.storedFiles.update({
                    where: { id: file.id! },
                    data: { order: nextOrder + index },
                })
            )
        );

        // order 값 업데이트
        return uploadedFiles.map((file, index) => {
            if (file.success) {
                return {
                    ...file,
                    order: nextOrder + index,
                };
            }
            return file;
        });
    }

    return uploadedFiles;
}

export interface IPFSMetadata {
    cid: string;
    metadata: any;
    ipfsUrl?: string;
    gatewayUrl?: string;
}

export async function getMetadataFromIPFS(cid: string): Promise<IPFSMetadata> {
    try {
        // 1. 먼저 DB에서 확인
        const savedMetadata = await prisma.ipfsMetadata.findUnique({
            where: { cid },
        });

        // 2. DB에 있으면 반환
        if (savedMetadata && savedMetadata.metadata) {
            try {
                const parsedMetadata =
                    typeof savedMetadata.metadata === "string"
                        ? JSON.parse(savedMetadata.metadata)
                        : savedMetadata.metadata;

                return {
                    cid,
                    metadata: parsedMetadata,
                    ipfsUrl: savedMetadata.ipfsUrl,
                    gatewayUrl: savedMetadata.gatewayUrl,
                };
            } catch (e) {
                console.error("Error parsing stored metadata:", e);
                // DB 파싱 오류시 다음 단계로 진행
            }
        }

        // 3. Pinata API로 핀 정보 조회 시도
        try {
            const pinataApiKey = process.env.PINATA_API_KEY;
            const pinataApiSecret = process.env.PINATA_API_SECRET;
            const pinataJWT = process.env.PINATA_JWT;

            // Pinata 인증 - JWT 또는 API 키/시크릿 사용
            let pinataHeaders: HeadersInit = {};
            if (pinataJWT) {
                pinataHeaders = {
                    Authorization: `Bearer ${pinataJWT}`,
                };
            } else if (pinataApiKey && pinataApiSecret) {
                pinataHeaders = {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataApiSecret,
                };
            } else {
                // 인증 정보 없음 - 건너뜀
                throw new Error("Pinata credentials not available");
            }

            const pinResponse = await fetch(
                `https://api.pinata.cloud/data/pinList?hashContains=${cid}`,
                {
                    headers: pinataHeaders,
                }
            );

            if (pinResponse.ok) {
                const pinData = await pinResponse.json();
                if (pinData.count > 0) {
                    const pinInfo = pinData.rows[0];

                    // 핀 정보만으로도 메타데이터 구성
                    return {
                        cid,
                        metadata: {
                            pinInfo,
                            message:
                                "Metadata content not available, but pin information found.",
                        },
                        ipfsUrl: `ipfs://${cid}`,
                        gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
                    };
                }
            }
        } catch (pinataError) {
            console.error(
                "Error querying Pinata pin information:",
                pinataError
            );
        }

        // 모든 방법으로 찾지 못한 경우 에러
        throw new Error(`Metadata not found for CID: ${cid}`);
    } catch (error) {
        console.error("Error fetching metadata from IPFS:", error);
        throw error;
    }
}

export interface IPFSUploadResult {
    success: boolean;
    cid?: string;
    url?: string;
    error?: string;
    ipfsUrl?: string;
    gatewayUrl?: string;
    groupId?: string;
}

/**
 * 메타데이터를 IPFS에 업로드합니다 (이전 uploadToIPFS 호환성 유지)
 */
export async function uploadToIPFS(data: any): Promise<IPFSUploadResult> {
    try {
        const pinataApiKey = process.env.PINATA_API_KEY;
        const pinataApiSecret = process.env.PINATA_API_SECRET;
        const pinataJWT = process.env.PINATA_JWT;

        if ((!pinataApiKey || !pinataApiSecret) && !pinataJWT) {
            console.error("Pinata API credentials not configured");
            return {
                success: false,
                error: "Pinata API credentials not configured. IPFS 핀닝 서비스 인증 정보를 설정해주세요.",
            };
        }

        // 메타데이터 JSON 준비
        const metadataBlob = new Blob([JSON.stringify(data)], {
            type: "application/json",
        });
        const metadataFile = new File([metadataBlob], "metadata.json", {
            type: "application/json",
        });

        // Pinata에 업로드
        const formData = new FormData();
        formData.append("file", metadataFile);
        formData.append(
            "pinataMetadata",
            JSON.stringify({
                name: `metadata-${data.name || "nft"}-${Date.now()}`,
                keyvalues: {
                    collection: data.name || "Default Collection",
                    contractAddress: data.contractAddress || "Unknown",
                },
            })
        );

        // Pinata 인증
        let pinataHeaders: HeadersInit = {};
        if (pinataJWT) {
            pinataHeaders = {
                Authorization: `Bearer ${pinataJWT}`,
            };
        } else if (pinataApiKey && pinataApiSecret) {
            pinataHeaders = {
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataApiSecret,
            };
        } else {
            throw new Error("Pinata credentials not available");
        }

        const pinataResponse = await fetch(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            {
                method: "POST",
                headers: pinataHeaders,
                body: formData,
            }
        );

        if (!pinataResponse.ok) {
            console.error(
                "Failed to upload to Pinata:",
                await pinataResponse.text()
            );
            return {
                success: false,
                error: "IPFS 업로드에 실패했습니다. 나중에 다시 시도해주세요.",
            };
        }

        const pinataResult = await pinataResponse.json();
        const cid = pinataResult.IpfsHash;
        const ipfsUrl = `ipfs://${cid}`;
        const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

        // 데이터베이스에 메타데이터 저장
        try {
            await prisma.ipfsMetadata.create({
                data: {
                    cid,
                    ipfsUrl,
                    gatewayUrl,
                    metadata: JSON.stringify(data),
                    type: "nft-metadata",
                },
            });
        } catch (dbError) {
            console.error("Failed to save metadata to database:", dbError);
        }

        // Revalidate related paths
        revalidatePath("/admin/onchain");

        return {
            success: true,
            cid,
            url: gatewayUrl,
            ipfsUrl,
            gatewayUrl,
        };
    } catch (error) {
        console.error("Error uploading to IPFS:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}

interface CreateGroupResult {
    success: boolean;
    group?: {
        id: string;
        name: string;
        isPublic: boolean;
        description?: string;
    };
    error?: string;
}

export async function createIpfsGroup(
    name: string,
    description?: string,
    isPublic: boolean = false
): Promise<CreateGroupResult> {
    try {
        const pinataJWT = process.env.PINATA_JWT;
        if (!pinataJWT) {
            return {
                success: false,
                error: "Pinata JWT not configured",
            };
        }

        // 1. Pinata에 그룹 생성
        const createGroupResponse = await fetch(
            "https://api.pinata.cloud/v3/groups/public",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${pinataJWT}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    is_public: isPublic,
                }),
            }
        );

        if (!createGroupResponse.ok) {
            const errorText = await createGroupResponse.text();
            return {
                success: false,
                error: `Failed to create Pinata group: ${errorText}`,
            };
        }

        const groupData = await createGroupResponse.json();
        const pinataGroupId = groupData.data.id;

        // 2. DB에 그룹 정보 저장
        const group = await prisma.ipfsGroup.create({
            data: {
                id: pinataGroupId,
                name,
                description,
                isPublic,
            },
        });

        return {
            success: true,
            group: {
                id: group.id,
                name: group.name,
                isPublic: group.isPublic,
                description: group.description || undefined,
            },
        };
    } catch (error) {
        console.error("Error creating IPFS group:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}

// 그룹 조회 함수
export async function getIpfsGroup(groupId: string) {
    try {
        const group = await prisma.ipfsGroup.findUnique({
            where: { id: groupId },
            include: {
                files: true, // 그룹에 속한 파일들도 함께 조회
            },
        });

        if (!group) {
            return {
                success: false,
                error: "Group not found",
            };
        }

        return {
            success: true,
            group,
        };
    } catch (error) {
        console.error("Error fetching IPFS group:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}

// 그룹 목록 조회 함수
export async function listIpfsGroups(limit: number = 10, offset: number = 0) {
    try {
        const groups = await prisma.ipfsGroup.findMany({
            include: {
                _count: {
                    select: { files: true },
                },
            },
            take: limit,
            skip: offset,
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            success: true,
            groups,
        };
    } catch (error) {
        console.error("Error listing IPFS groups:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}

/**
 * 메타데이터를 IPFS 그룹에 업로드합니다.
 * 토큰ID 기반이 아닌 그룹 단위로 메타데이터를 관리합니다.
 */
export async function uploadToIPFSGroup(
    data: any,
    groupName?: string,
    groupId?: string,
    description?: string
): Promise<IPFSUploadResult> {
    await requireAuth();

    try {
        const pinataJWT = process.env.PINATA_JWT;
        if (!pinataJWT) {
            return {
                success: false,
                error: "Pinata JWT not configured",
            };
        }

        // 1. 그룹 처리
        let targetGroupId = groupId;
        if (!targetGroupId && groupName) {
            // 기존 그룹 찾기
            const existingGroups = await listIpfsGroups(1);
            const existingGroup =
                existingGroups.success &&
                existingGroups.groups &&
                existingGroups.groups.find((g) => g.name === groupName);

            if (existingGroup) {
                targetGroupId = existingGroup.id;
            } else {
                // 새 그룹 생성
                const createGroupResult = await createIpfsGroup(
                    groupName,
                    description
                );
                if (!createGroupResult.success || !createGroupResult.group) {
                    return {
                        success: false,
                        error:
                            createGroupResult.error || "Failed to create group",
                    };
                }
                targetGroupId = createGroupResult.group.id;
            }
        }

        // 2. 메타데이터 JSON 준비
        const metadataBlob = new Blob(
            [
                JSON.stringify({
                    ...data,
                    groupId: targetGroupId,
                }),
            ],
            { type: "application/json" }
        );

        const metadataFile = new File(
            [metadataBlob],
            `group-metadata-${Date.now()}.json`,
            { type: "application/json" }
        );

        // 3. 파일 업로드
        const formData = new FormData();
        formData.append("file", metadataFile);

        if (targetGroupId) {
            formData.append("group", targetGroupId);
        }

        // Add network parameter (required)
        formData.append("network", "public");

        // 메타데이터에 그룹 정보 추가
        formData.append(
            "pinataMetadata",
            JSON.stringify({
                name: `${groupName || "Unknown Group"} Metadata`,
                keyvalues: {
                    isGroupMetadata: "true",
                    groupName: groupName || "Default Group",
                    groupId: targetGroupId || "",
                    purpose: "group-metadata",
                    timestamp: new Date().toISOString(),
                },
            })
        );

        // 4. Pinata에 업로드
        const uploadResponse = await fetch(
            "https://uploads.pinata.cloud/v3/files",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${pinataJWT}`,
                },
                body: formData,
            }
        );

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            return {
                success: false,
                error: `Failed to upload metadata to Pinata: ${errorText}`,
            };
        }

        const uploadResult = await uploadResponse.json();
        const fileData = uploadResult.data;

        const cid = fileData.cid;
        const ipfsUrl = `ipfs://${cid}`;
        const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;

        // 5. DB에 메타데이터 저장
        await prisma.ipfsMetadata.create({
            data: {
                cid,
                ipfsUrl,
                gatewayUrl,
                metadata: JSON.stringify({
                    ...data,
                    groupId: fileData.group_id,
                    fileId: fileData.id,
                    fileName: fileData.name,
                }),
                type: "group-metadata",
                isGroup: true,
                groupId: targetGroupId, // 그룹 ID 저장
            },
        });

        return {
            success: true,
            cid,
            url: gatewayUrl,
            ipfsUrl,
            gatewayUrl,
            groupId: fileData.group_id,
        };
    } catch (error) {
        console.error("Error uploading to IPFS group:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}

export async function getAllIPFSMetadata(
    type: string = "nft-metadata",
    limit: number = 100
): Promise<IPFSUploadResult[]> {
    await requireAuth();

    try {
        const metadata = await prisma.ipfsMetadata.findMany({
            where: { type },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return metadata.map((item) => ({
            success: true,
            cid: item.cid,
            ipfsUrl: item.ipfsUrl,
            gatewayUrl: item.gatewayUrl,
            url: item.gatewayUrl,
        }));
    } catch (error) {
        console.error("Error fetching all IPFS metadata:", error);
        return [];
    }
}
