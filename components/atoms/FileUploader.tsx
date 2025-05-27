/// components\atoms\FileUploader.tsx

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFiles } from "@/app/hooks/useFiles";
import { StoredFile } from "@/app/actions/files";
import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface FileUploaderProps {
    purpose?: string;
    bucket: string;
    onComplete?: (files: { id: string; url: string }[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
    className?: string;
}

export default function FileUploader({
    purpose = "other",
    bucket,
    onComplete,
    accept = {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize = 100 * 1024 * 1024,
    multiple = true,
    className = "",
}: FileUploaderProps) {
    const toast = useToast();
    const [isDragging, setIsDragging] = useState(false);

    const { uploadFiles, isUploading } = useFiles();

    const onDrop = useCallback(
        async (acceptedFiles: File[], rejectedFiles: any[]) => {
            const oversizedFiles = rejectedFiles.filter((file) =>
                file.errors.some(
                    (error: any) => error.code === "file-too-large"
                )
            );

            if (oversizedFiles.length > 0) {
                toast.error(
                    `File size exceeds ${maxSize / 1024 / 1024}MB limit`
                );
                return;
            }

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
        [uploadFiles, purpose, bucket, onComplete, maxSize]
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
            className={cn(
                "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300",
                isDragActive || isDragging
                    ? "border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] shadow-lg scale-[1.02] backdrop-blur-sm"
                    : "border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.05)] hover:shadow-md backdrop-blur-sm",
                isUploading ? "opacity-50 cursor-not-allowed" : "",
                className
            )}
        >
            <input {...getInputProps()} />
            <div className="space-y-1">
                <div className="text-gray-600">
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-[rgba(255,255,255,0.2)] border-t-white rounded-full animate-spin" />
                            <p className="text-[rgba(255,255,255,0.7)]">
                                Uploading files...
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            {/* Desktop View */}
                            <div className="hidden md:flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    className={cn(
                                        "px-6 py-3 bg-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.15)] transition-all duration-200 hover:scale-105",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Choose Image
                                </button>
                                <p
                                    className={cn(
                                        "text-[rgba(255,255,255,0.6)]",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    or drag and drop
                                </p>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden">
                                <button
                                    type="button"
                                    className={cn(
                                        "w-full px-6 py-3 bg-[rgba(255,255,255,0.1)] text-white rounded-lg hover:bg-[rgba(255,255,255,0.15)] transition-all duration-200 hover:scale-105",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Upload Image
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <p
                    className={cn(
                        "text-sm text-[rgba(255,255,255,0.5)]",
                        getResponsiveClass(10).textClass
                    )}
                >
                    Supported formats: {Object.keys(accept).join(", ")} (Max{" "}
                    {maxSize / 1024 / 1024}MB){" "}
                </p>
            </div>
        </div>
    );
}
