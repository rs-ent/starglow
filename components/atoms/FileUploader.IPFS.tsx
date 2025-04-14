/// components\atoms\FileUploader.IPFS.tsx
/// Vercel Blob이 아닌 IPFS에 업로드하는 파일 업로더

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploaderIPFSProps {
    onComplete?: (files: File[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
    className?: string;
}

export default function FileUploaderIPFS({
    onComplete,
    accept = {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize = 50 * 1024 * 1024,
    multiple = true,
    className = "",
}: FileUploaderIPFSProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            try {
                setIsUploading(true);
                if (onComplete) {
                    onComplete(acceptedFiles);
                }
            } catch (error) {
                console.error("File upload error:", error);
            } finally {
                setIsUploading(false);
            }
        },
        [onComplete]
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
