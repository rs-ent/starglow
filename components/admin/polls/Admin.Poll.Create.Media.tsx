/// components/admin/polls/Admin.Poll.Create.Media.tsx

"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUploader from "@/components/atoms/FileUploader";
import YoutubeViewer from "@/components/atoms/YoutubeViewer";
import { useToast } from "@/app/hooks/useToast";
import { getYoutubeVideoId } from "@/lib/utils/youtube";

import { Section } from "./shared-components";
import type { PollFormProps } from "./types";

export function MediaTab({ formData, onChange }: PollFormProps) {
    const toast = useToast();

    return (
        <Section title="미디어" icon={<ImageIcon className="w-5 h-5" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <Label className="mb-3 block text-slate-200">이미지</Label>
                    <div className="space-y-4">
                        {formData.imgUrl && (
                            <div className="rounded-lg overflow-hidden border border-slate-600">
                                <Image
                                    src={formData.imgUrl}
                                    alt="이미지"
                                    width={200}
                                    height={200}
                                    className="object-cover w-full h-48"
                                />
                            </div>
                        )}
                        <Input
                            value={formData.imgUrl || ""}
                            onChange={(e) => onChange("imgUrl", e.target.value)}
                            placeholder="이미지 URL을 입력하세요"
                            className="bg-slate-700/50 border-slate-600 text-white"
                        />
                        <FileUploader
                            purpose="poll-option"
                            bucket="images"
                            onComplete={(files) => {
                                if (files && files.length > 0) {
                                    onChange("imgUrl", files[0].url);
                                    toast.success(
                                        "이미지가 성공적으로 업로드되었습니다."
                                    );
                                }
                            }}
                            accept={{
                                "image/*": [
                                    ".png",
                                    ".jpg",
                                    ".jpeg",
                                    ".gif",
                                    ".webp",
                                ],
                            }}
                            maxSize={5 * 1024 * 1024}
                            multiple={false}
                        />
                    </div>
                </div>
                <div>
                    <Label className="mb-3 block text-slate-200">
                        유튜브 URL
                    </Label>
                    <div className="space-y-4">
                        {formData.youtubeUrl && (
                            <div className="rounded-lg overflow-hidden">
                                <YoutubeViewer
                                    videoId={
                                        getYoutubeVideoId(
                                            formData.youtubeUrl
                                        ) || undefined
                                    }
                                    autoPlay={false}
                                    framePadding={0}
                                />
                            </div>
                        )}
                        <Input
                            value={formData.youtubeUrl || ""}
                            onChange={(e) =>
                                onChange("youtubeUrl", e.target.value)
                            }
                            placeholder="유튜브 URL을 입력하세요"
                            className="bg-slate-700/50 border-slate-600 text-white"
                        />
                    </div>
                </div>
            </div>
        </Section>
    );
}
