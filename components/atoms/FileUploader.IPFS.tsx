/// components/atoms/FileUploader.IPFS.tsx

import { useState } from "react";
import { useMetadata } from "@/app/story/metadata/hooks";
import { uploadMediaOutput } from "@/app/story/metadata/actions";
import { ipfsType } from "@/app/story/metadata/actions";
import FileUploader, { FileData } from "./FileUploader";
import { SiIpfs } from "react-icons/si";
import { TbHexagon } from "react-icons/tb";
import Image from "next/image";

interface FileUploaderIPFSProps {
    userId: string;
    type: ipfsType;
    onComplete?: (results: uploadMediaOutput[]) => void;
    multiple?: boolean;
    className?: string;
}

export default function FileUploaderIPFS({
    userId,
    type,
    onComplete,
    multiple = true,
    className = "",
}: FileUploaderIPFSProps) {
    const { uploadMediaAsync, isPendingUploadMedia, isErrorUploadMedia } =
        useMetadata();
    const [previews, setPreviews] = useState<FileData[]>([]);

    const handleUpload = async (files: FileData[]) => {
        setPreviews(files);

        const results = await Promise.all(
            files.map(async (fileData) => {
                const result = await uploadMediaAsync({
                    userId,
                    media: fileData.file,
                    previewUrl: fileData.url,
                    previewWidth: fileData.width,
                    previewHeight: fileData.height,
                    previewMimeType: fileData.mimeType,
                    previewSizeBytes: fileData.sizeBytes,
                    type,
                });
                return result as uploadMediaOutput;
            })
        );
        onComplete?.(results);
    };

    return (
        <div className={`flex flex-col gap-4 ${className} relative`}>
            {/* React Icon을 배경으로 사용 */}
            <TbHexagon className="absolute text-[8rem] text-blue-900/10 left-[-2rem] top-[-2rem] pointer-events-none select-none z-0" />
            <SiIpfs className="absolute text-[4rem] text-cyan-400/20 right-2 top-2 pointer-events-none select-none z-0" />

            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#181c2b] to-[#2a2342] border border-blue-900/30 shadow-xl z-10">
                <div className="absolute top-2 right-2 flex items-center gap-2">
                    <span className="text-xs text-[#00e0ffcc] font-bold">
                        IPFS
                    </span>
                </div>
                <div className="flex flex-row gap-2 flex-wrap">
                    {previews.map((fileData, idx) => {
                        const ext = fileData.file.name
                            .split(".")
                            .pop()
                            ?.toLowerCase();
                        const isImage = /\.(png|jpe?g|gif|webp)$/i.test(
                            fileData.file.name
                        );
                        const isVideo = /\.(mp4|webm)$/i.test(
                            fileData.file.name
                        );
                        const isAudio = /\.(mp3|wav)$/i.test(
                            fileData.file.name
                        );

                        return (
                            <div
                                key={idx}
                                className="relative w-24 h-24 rounded-xl border-2 border-[#00e0ff88] bg-[#0a0a1a] shadow-[0_0_12px_#00e0ff44] overflow-hidden flex items-center justify-center transition-transform hover:scale-105"
                            >
                                {isImage ? (
                                    <Image
                                        src={fileData.url}
                                        alt="ipfs-preview"
                                        width={fileData.width}
                                        height={fileData.height}
                                        className="object-cover w-full h-full"
                                    />
                                ) : isVideo ? (
                                    <video
                                        src={fileData.url}
                                        className="object-cover w-full h-full"
                                        controls
                                    />
                                ) : isAudio ? (
                                    <audio
                                        src={fileData.url}
                                        className="w-full"
                                        controls
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center w-full h-full text-xs text-[#00e0ffcc]">
                                        <span>File</span>
                                        <a
                                            href={fileData.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline text-[10px] mt-1"
                                        >
                                            Download
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4">
                    <FileUploader
                        purpose={type}
                        bucket={"ipfs-preview"}
                        onFiles={handleUpload}
                        accept={{
                            "image/*": [
                                ".png",
                                ".jpg",
                                ".jpeg",
                                ".gif",
                                ".webp",
                            ],
                            "video/*": [".mp4", ".webm"],
                            "audio/*": [".mp3", ".wav"],
                        }}
                        multiple={multiple}
                    />
                </div>
                {isPendingUploadMedia && (
                    <div className="text-sm text-[#00e0ff] mt-2">
                        Uploading to IPFS...
                    </div>
                )}
                {isErrorUploadMedia && (
                    <div className="text-sm text-red-500 mt-2">
                        Upload failed. Please try again.
                    </div>
                )}
            </div>
        </div>
    );
}
