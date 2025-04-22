/// components\atoms\FileUploader.IPFS.tsx
/// Vercel Blob이 아닌 IPFS에 업로드하는 파일 업로더

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useIpfs } from "@/app/hooks/useIpfs";
import type { UploadResponse } from "pinata";

interface FileUploaderIPFSProps {
    onComplete?: (results: UploadResponse[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
    className?: string;
    groupId?: string;
    gateway?: string;
    network?: string;
}

export default function FileUploaderIPFS({
    onComplete,
    accept = {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize = 50 * 1024 * 1024,
    multiple = true,
    className = "",
    groupId,
    gateway = "ipfs://",
    network = "mainnet",
}: FileUploaderIPFSProps) {
    const { uploadFiles, isUploading } = useIpfs();
    const [isDragging, setIsDragging] = useState(false);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            try {
                const result = await uploadFiles(acceptedFiles, {
                    groupId,
                    gateway,
                    network,
                });
                if (onComplete) {
                    onComplete(result);
                }
            } catch (error) {
                console.error("File upload error:", error);
            }
        },
        [onComplete, uploadFiles, groupId]
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
                        <p>Uploading files...</p>
                    ) : isDragActive || isDragging ? (
                        <p>Drop files here</p>
                    ) : (
                        <p>Drag and drop files here</p>
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    Max file size: {maxSize / 1024 / 1024}MB
                </p>
            </div>
        </div>
    );
}
