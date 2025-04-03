/// components\atoms\FileUploader.tsx

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFiles } from "@/app/actions/files";
import { useFiles, useFilesByBucket } from "@/hooks/useFiles";
import { StoredFile } from "@/app/actions/files";

interface FileUploaderProps {
    purpose?: string;
    bucket?: string;
    onComplete?: (files: { id: string; url: string }[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
    className?: string;
}

export default function FileUploader({
    purpose,
    bucket,
    onComplete,
    accept = {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize = 5 * 1024 * 1024,
    multiple = true,
    className = "",
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    // Use the appropriate hook based on whether purpose or bucket is provided
    const { uploadFiles, isUploading } = useFiles();

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            const uploadedFiles = await uploadFiles(
                acceptedFiles,
                purpose || "other",
                bucket
            );

            if (onComplete && uploadedFiles && uploadedFiles.length > 0) {
                onComplete(
                    uploadedFiles.map((file: StoredFile) => ({
                        id: file.id,
                        url: file.url,
                    }))
                );
            }
        },
        [uploadFiles, purpose, bucket, onComplete]
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
                        <p>Drop files here or click to upload</p>
                    ) : (
                        <p>Drag and drop files here or click to upload</p>
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    Supported formats: PNG, JPG, JPEG, GIF, WEBP (Max{" "}
                    {maxSize / 1024 / 1024}MB)
                </p>
            </div>
        </div>
    );
}
