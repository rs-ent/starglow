/// components\atoms\FileUploader.IPFS.tsx
/// Vercel Blob이 아닌 IPFS에 업로드하는 파일 업로더

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFiles } from "@/app/hooks/useFiles";
import { IPFSFileUploadResult } from "@/app/actions/files";

interface FileUploaderIPFSProps {
    purpose?: string;
    bucket: string;
    onComplete?: (
        files: {
            id: string;
            url: string;
            cid?: string;
            ipfsUrl?: string;
            groupId?: string;
        }[]
    ) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
    className?: string;
    optimizeImages?: boolean;
    groupId?: string;
    groupName?: string;
}

export default function FileUploaderIPFS({
    purpose = "other",
    bucket,
    onComplete,
    accept = {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize = 50 * 1024 * 1024,
    multiple = true,
    className = "",
    optimizeImages = true,
    groupId,
    groupName,
}: FileUploaderIPFSProps) {
    const [isDragging, setIsDragging] = useState(false);

    // IPFS 업로드 훅 사용
    const { uploadFilesToIPFS, uploadFilesToIPFSGroup, isUploading } =
        useFiles();

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            try {
                let uploadedFiles;

                // 그룹 ID가 있으면 해당 그룹에 업로드
                if (groupId) {
                    uploadedFiles = await uploadFilesToIPFSGroup(
                        acceptedFiles,
                        purpose,
                        bucket,
                        {
                            groupId,
                            optimizeImages,
                        }
                    );
                }
                // 그룹명이 있으면 새 그룹 생성 또는 기존 그룹 사용
                else if (groupName) {
                    uploadedFiles = await uploadFilesToIPFSGroup(
                        acceptedFiles,
                        purpose,
                        bucket,
                        {
                            groupName,
                            optimizeImages,
                        }
                    );
                }
                // 일반 업로드
                else {
                    uploadedFiles = await uploadFilesToIPFS(
                        acceptedFiles,
                        purpose,
                        bucket,
                        optimizeImages
                    );
                }

                if (onComplete && uploadedFiles && uploadedFiles.length > 0) {
                    const successfulUploads = uploadedFiles
                        .filter((file) => file.success)
                        .map((file) => ({
                            id: file.id || "",
                            url: file.url || "",
                            cid: file.cid,
                            ipfsUrl: file.ipfsUrl,
                            groupId: file.groupId,
                        }));

                    if (successfulUploads.length > 0) {
                        onComplete(successfulUploads);
                    }
                }
            } catch (error) {
                console.error("File upload error:", error);
                // 에러 처리 추가
            }
        },
        [
            uploadFilesToIPFS,
            uploadFilesToIPFSGroup,
            purpose,
            bucket,
            optimizeImages,
            onComplete,
            groupId,
            groupName,
        ]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        disabled: isUploading,
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${
                    isDragActive || isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                }
                ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
                ${className}`}
        >
            <input {...getInputProps()} />
            <div className="space-y-2">
                <div className="text-gray-600">
                    {isUploading ? (
                        <p>Uploading files to IPFS...</p>
                    ) : isDragActive || isDragging ? (
                        <p>Drop files here to upload to IPFS</p>
                    ) : (
                        <p>Drag and drop files here to upload to IPFS</p>
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    Files will be stored on IPFS via Pinata (Max{" "}
                    {maxSize / 1024 / 1024}MB)
                </p>
            </div>
        </div>
    );
}
