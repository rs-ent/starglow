/// components/admin/artists/Admin.Artists.Manage.CreateMessage.tsx

"use client";

import { useState } from "react";
import FileUploader from "@/components/atoms/FileUploader";
import DateTimePicker from "@/components/atoms/DateTimePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useArtistSet } from "@/app/hooks/useArtists";
import { ArtistMessage } from "@prisma/client";
import { useToast } from "@/app/hooks/useToast";

interface CreateArtistMessageProps {
    mode: "create" | "update";
    artistId: string;
    initialData?: ArtistMessage;
}

export default function CreateArtistMessage({
    mode,
    artistId,
    initialData,
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
        } catch (error) {
            toast.error(
                "메시지 등록에 실패했습니다. 잠시 후 다시 시도해주세요. 지속적으로 발생할 경우 관리자에게 문의해주세요."
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-8 p-8 rounded-2xl bg-card shadow-2xl border border-border animate-fade-in"
            style={{
                background: "var(--color-card)",
                color: "var(--color-card-foreground)",
                fontFamily: "var(--font-body)",
                maxWidth: 480,
                margin: "0 auto",
            }}
        >
            {/* 메시지 입력 */}
            <div className="space-y-2">
                <label className="block font-main text-lg" htmlFor="message">
                    메시지 (영어)
                </label>
                <Input
                    id="message"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary transition-all duration-200"
                    placeholder="팬에게 전달할 메시지를 입력해주세요."
                />
            </div>

            {/* 배너 이미지 업로드 */}
            <div className="space-y-2">
                <label className="block font-main text-lg">배너 이미지</label>
                <FileUploader
                    bucket="artist-banners"
                    onComplete={handleBannerUpload}
                    multiple={false}
                    className="transition-all duration-300"
                />
                {bannerUrl && (
                    <div className="mt-2 flex justify-center">
                        <img
                            src={bannerUrl}
                            alt="Banner Preview"
                            className="rounded-xl shadow-lg max-h-48 border border-accent animate-fade-in"
                            style={{
                                background: "var(--color-card)",
                                transition:
                                    "box-shadow 0.3s cubic-bezier(.4,0,.2,1)",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* 외부 링크 */}
            <div className="space-y-2">
                <label
                    className="block font-main text-lg"
                    htmlFor="externalUrl"
                >
                    외부 링크 (선택)
                </label>
                <p className="text-sm text-muted-foreground">
                    공연, 이벤트, 뮤직비디오 등 사용자가 외부 링크를 통해 참여할
                    수 있는 링크를 입력해주세요.
                </p>
                <Input
                    id="externalUrl"
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary transition-all duration-200"
                    placeholder="https://"
                />
            </div>

            {/* 활성화 스위치 */}
            <div className="flex items-center space-x-4">
                <label className="font-main text-lg">활성화</label>
                <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted transition-colors duration-200"
                />
            </div>

            {/* 시작일/종료일 */}
            <div className="flex space-x-4">
                <DateTimePicker
                    value={startDate}
                    onChange={setStartDate}
                    label="시작일"
                    required
                    className="flex-1"
                    align="start"
                    side="top"
                />
                <DateTimePicker
                    value={endDate}
                    onChange={setEndDate}
                    label="종료일"
                    required
                    className="flex-1"
                    align="start"
                    side="top"
                />
            </div>

            {/* 제출 버튼 */}
            <Button
                type="submit"
                disabled={isCreatingArtistMessage}
                className="w-full py-3 rounded-xl font-superbold text-lg bg-primary text-primary-foreground hover:bg-accent transition-all duration-200 animate-fade-in"
                style={{
                    boxShadow: "0 4px 24px 0 rgba(91,78,193,0.10)",
                }}
            >
                {isCreatingArtistMessage ? "등록 중..." : "메시지 등록"}
            </Button>
            {error && (
                <div className="text-destructive text-sm mt-2 animate-shake">
                    {error.message}
                </div>
            )}
        </form>
    );
}
