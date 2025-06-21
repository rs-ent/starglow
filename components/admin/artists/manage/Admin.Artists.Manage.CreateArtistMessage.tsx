/// components/admin/artists/Admin.Artists.Manage.CreateMessage.tsx

"use client";

import { useState } from "react";

import { useArtistSet } from "@/app/hooks/useArtists";
import { useToast } from "@/app/hooks/useToast";
import DateTimePicker from "@/components/atoms/DateTimePicker";
import FileUploader from "@/components/atoms/FileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/tailwind";

import type { ArtistMessage } from "@prisma/client";

interface CreateArtistMessageProps {
    mode: "create" | "update";
    artistId: string;
    initialData?: ArtistMessage;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function CreateArtistMessage({
    mode,
    artistId,
    initialData,
    onSuccess,
    onCancel,
}: CreateArtistMessageProps) {
    const toast = useToast();
    const { createArtistMessage, isCreatingArtistMessage, error } =
        useArtistSet();

    // 상태 관리
    const [message, setMessage] = useState(initialData?.message || "");
    const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl || "");
    const [externalUrl, setExternalUrl] = useState(
        initialData?.externalUrl || ""
    );
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [startDate, setStartDate] = useState(
        initialData?.startDate ? new Date(initialData.startDate) : new Date()
    );
    const [endDate, setEndDate] = useState(
        initialData?.endDate ? new Date(initialData.endDate) : new Date()
    );

    // 파일 업로드 완료 시 URL 저장
    const handleBannerUpload = (files: { id: string; url: string }[]) => {
        if (files && files[0]?.url) setBannerUrl(files[0].url);
    };

    // 폼 제출
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await createArtistMessage({
                artistId,
                message,
                bannerUrl,
                externalUrl,
                isActive,
                startDate,
                endDate,
            });
            toast.success("메시지가 성공적으로 등록되었습니다.");
            onSuccess?.();
        } catch (_error) {
            toast.error(
                "메시지 등록에 실패했습니다. 잠시 후 다시 시도해주세요."
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 max-w-2xl mx-auto p-6"
        >
            {/* 메시지 입력 */}
            <div className="space-y-2">
                <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="message"
                >
                    메시지
                </label>
                <Input
                    id="message"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className={cn(
                        "w-full px-4 py-3 rounded-lg",
                        "bg-gray-50 border-gray-200",
                        "inner-shadow",
                        "placeholder:text-gray-400",
                        "text-[rgba(0,0,0,0.8)]",
                        "focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                        "transition-all duration-200"
                    )}
                    placeholder="팬에게 전달할 메시지를 입력해주세요"
                />
            </div>

            {/* 배너 이미지 업로드 - Apple 스타일 */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    배너 이미지
                </label>
                <div className="relative flex flex-col gap-1 items-start">
                    <div className="relative">
                        <FileUploader
                            bucket="artist-banners"
                            onComplete={handleBannerUpload}
                            multiple={false}
                            className="bg-[rgba(0,0,0,0.6)] border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-800 transition-colors "
                        />
                    </div>
                    {bannerUrl && (
                        <div className="mt-3">
                            <img
                                src={bannerUrl}
                                alt="Banner Preview"
                                className="rounded-lg shadow-sm border border-gray-200 w-full object-contain"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 외부 링크 */}
            <div className="space-y-2">
                <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor="externalUrl"
                >
                    외부 링크
                    <span className="ml-2 text-gray-400 font-normal">
                        (선택)
                    </span>
                </label>
                <p className="text-sm text-gray-500">
                    공연, 이벤트, 뮤직비디오 등의 링크를 입력해주세요
                </p>
                <Input
                    id="externalUrl"
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className={cn(
                        "w-full px-4 py-3 rounded-lg",
                        "bg-gray-50 border-gray-200",
                        "inner-shadow",
                        "placeholder:text-gray-400",
                        "text-[rgba(0,0,0,0.8)]",
                        "focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                        "transition-all duration-200"
                    )}
                    placeholder="https://example.com"
                />
            </div>

            {/* 활성화 스위치 - Apple 스타일 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg inner-shadow">
                <div>
                    <label className="text-sm font-medium text-gray-700">
                        메시지 활성화
                    </label>
                    <p className="text-sm text-gray-500">
                        활성화된 메시지만 표시됩니다
                    </p>
                </div>
                <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    className="data-[state=checked]:bg-blue-500"
                />
            </div>

            {/* 날짜 선택 - Apple 스타일 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        시작일
                    </label>
                    <DateTimePicker
                        value={startDate}
                        onChange={setStartDate}
                        required
                        align="start"
                        side="bottom"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        종료일
                    </label>
                    <DateTimePicker
                        value={endDate}
                        onChange={setEndDate}
                        required
                        align="end"
                        side="bottom"
                    />
                </div>
            </div>

            {/* 구분선 */}
            <div className="border-t pt-6" />

            {/* 제출 버튼 - Apple 스타일 */}
            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        onCancel?.();
                    }}
                    className="flex-1 py-3 rounded-lg bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                    취소
                </Button>
                <Button
                    type="submit"
                    disabled={isCreatingArtistMessage}
                    className={cn(
                        "flex-1 py-3 rounded-lg",
                        "bg-blue-500 hover:bg-blue-600",
                        "text-white font-medium",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors"
                    )}
                >
                    {isCreatingArtistMessage ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            처리 중...
                        </span>
                    ) : mode === "create" ? (
                        "메시지 추가"
                    ) : (
                        "메시지 수정"
                    )}
                </Button>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error.message}</p>
                </div>
            )}
        </form>
    );
}
