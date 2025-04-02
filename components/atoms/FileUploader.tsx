/// components\atoms\FileUploader.tsx

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploaderProps {
    onFileSelect: (files: File[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
}

export default function FileUploader({
    onFileSelect,
    accept = {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize = 5 * 1024 * 1024,
    multiple = true,
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            onFileSelect(acceptedFiles);
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${
                    isDragActive || isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                }`}
        >
            <input {...getInputProps()} />
            <div className="space-y-2">
                <div className="text-gray-600">
                    {isDragActive || isDragging ? (
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
