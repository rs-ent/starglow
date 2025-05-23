/// components/admin/artists/Admin.Artists.Create.tsx

"use client";

import { useArtistSet } from "@/app/hooks/useArtists";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import { Artist } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import FileUploader from "@/components/atoms/FileUploader";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/tailwind";

interface AdminArtistsCreateProps {
    mode: "create" | "update";
    initialData?: (Artist & { collectionContracts?: { id: string }[] }) | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function AdminArtistsCreate({
    mode,
    initialData,
    onSuccess,
    onCancel,
}: AdminArtistsCreateProps) {
    const {
        createArtist,
        isCreating,
        createArtistError,
        updateArtist,
        isUpdating,
        updateArtistError,
    } = useArtistSet();
    const { everyCollections, isLoading: isLoadingEveryCollections } =
        useFactoryGet({});
    const [name, setName] = useState(initialData?.name ?? "");
    const [description, setDescription] = useState(
        initialData?.description ?? ""
    );
    const [logoUrl, setLogoUrl] = useState<string | undefined>(
        initialData?.logoUrl ?? undefined
    );
    const [imageUrl, setImageUrl] = useState<string | undefined>(
        initialData?.imageUrl ?? undefined
    );
    const [externalUrl, setExternalUrl] = useState(
        initialData?.externalUrl ?? ""
    );
    const [reportUrl, setReportUrl] = useState(initialData?.reportUrl ?? "");
    const [company, setCompany] = useState(initialData?.company ?? "");
    const [sns, setSns] = useState<string[]>(initialData?.sns ?? []);
    const [gallery, setGallery] = useState<string[]>(
        initialData?.gallery ?? []
    );
    const [videos, setVideos] = useState<string[]>(initialData?.videos ?? []);
    const [music, setMusic] = useState<string[]>(initialData?.music ?? []);
    const [events, setEvents] = useState<string[]>(initialData?.events ?? []);
    const [additionalInfo, setAdditionalInfo] = useState<any>(
        initialData?.additionalInfo ?? ""
    );
    const [backgroundColors, setBackgroundColors] = useState<string[]>(
        initialData?.backgroundColors ?? []
    );
    const [foregroundColors, setForegroundColors] = useState<string[]>(
        initialData?.foregroundColors ?? []
    );
    const [selectedCollectionIds, setSelectedCollectionIds] = useState<
        string[]
    >(initialData?.collectionContracts?.map((c: any) => c.id) ?? []);

    // 수정 모드에서 initialData가 바뀔 때 상태 동기화
    useEffect(() => {
        if (initialData) {
            setName(initialData.name ?? "");
            setDescription(initialData.description ?? "");
            setLogoUrl(initialData.logoUrl ?? undefined);
            setImageUrl(initialData.imageUrl ?? undefined);
            setExternalUrl(initialData.externalUrl ?? "");
            setReportUrl(initialData.reportUrl ?? "");
            setCompany(initialData.company ?? "");
            setSns(initialData.sns ?? []);
            setGallery(initialData.gallery ?? []);
            setVideos(initialData.videos ?? []);
            setMusic(initialData.music ?? []);
            setEvents(initialData.events ?? []);
            setAdditionalInfo(initialData.additionalInfo ?? "");
            setSelectedCollectionIds(
                initialData.collectionContracts?.map((c: any) => c.id) ?? []
            );
            setBackgroundColors(initialData.backgroundColors ?? []);
            setForegroundColors(initialData.foregroundColors ?? []);
        }
    }, [initialData]);

    // FileUploader 완료 핸들러
    const handleLogoUpload = useCallback(
        (files: { id: string; url: string }[]) => {
            if (files.length > 0) setLogoUrl(files[0].url);
        },
        []
    );
    const handleImageUpload = useCallback(
        (files: { id: string; url: string }[]) => {
            if (files.length > 0) setImageUrl(files[0].url);
        },
        []
    );
    const handleGalleryUpload = useCallback(
        (files: { id: string; url: string }[]) => {
            setGallery(files.map((f) => f.url));
        },
        []
    );

    // 배열 입력 필드(예: SNS, videos 등) 추가/삭제
    const handleArrayChange = (
        setter: (v: string[]) => void,
        arr: string[],
        idx: number,
        value: string
    ) => {
        const newArr = [...arr];
        newArr[idx] = value;
        setter(newArr);
    };
    const handleArrayAdd = (setter: (v: string[]) => void, arr: string[]) => {
        setter([...arr, ""]);
    };
    const handleArrayRemove = (
        setter: (v: string[]) => void,
        arr: string[],
        idx: number
    ) => {
        setter(arr.filter((_, i) => i !== idx));
    };

    const isValid = name.trim().length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        // additionalInfo JSON 파싱 (선택)
        let parsedAdditionalInfo = additionalInfo;
        try {
            if (typeof additionalInfo === "string" && additionalInfo.trim()) {
                parsedAdditionalInfo = JSON.parse(additionalInfo);
            }
        } catch (e) {
            alert("Additional Info는 올바른 JSON이어야 합니다.");
            return;
        }

        if (mode === "update" && initialData?.id) {
            await updateArtist({
                id: initialData.id,
                name,
                description,
                logoUrl,
                imageUrl,
                externalUrl,
                reportUrl,
                company,
                sns: sns.filter(Boolean),
                gallery,
                videos: videos.filter(Boolean),
                music: music.filter(Boolean),
                events: events.filter(Boolean),
                additionalInfo: parsedAdditionalInfo,
                backgroundColors: backgroundColors,
                foregroundColors: foregroundColors,
                collectionContractIds: selectedCollectionIds,
            });
        } else {
            await createArtist({
                name,
                description,
                logoUrl,
                imageUrl,
                externalUrl,
                reportUrl,
                company,
                sns: sns.filter(Boolean),
                gallery,
                videos: videos.filter(Boolean),
                music: music.filter(Boolean),
                events: events.filter(Boolean),
                additionalInfo: parsedAdditionalInfo,
                backgroundColors: backgroundColors,
                foregroundColors: foregroundColors,
                collectionContractIds: selectedCollectionIds,
            });
        }
        if (onSuccess) onSuccess();
    };

    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[80%] bg-gray-900 p-6 rounded-xl shadow overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. 기본 정보 */}
                <div className="rounded-lg bg-card shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-foreground">
                        기본 정보
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Input
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-background text-foreground"
                            />
                            <Textarea
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-background text-foreground"
                            />
                            <Input
                                placeholder="External URL"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                className="bg-background text-foreground"
                            />
                            <Input
                                placeholder="Report URL"
                                value={reportUrl}
                                onChange={(e) => setReportUrl(e.target.value)}
                                className="bg-background text-foreground"
                            />
                            <Input
                                placeholder="Company"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="bg-background text-foreground"
                            />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-foreground">Logo</Label>
                                <FileUploader
                                    bucket="artist"
                                    multiple={false}
                                    onComplete={handleLogoUpload}
                                />
                                {logoUrl && (
                                    <img
                                        src={logoUrl}
                                        alt="Logo Preview"
                                        className="w-24 h-24 object-contain rounded mt-2 border"
                                    />
                                )}
                            </div>
                            <div>
                                <Label className="text-foreground">
                                    Main Image
                                </Label>
                                <FileUploader
                                    bucket="artist"
                                    multiple={false}
                                    onComplete={handleImageUpload}
                                />
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="Image Preview"
                                        className="w-32 h-32 object-cover rounded mt-2 border"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. 갤러리/미디어 */}
                <div className="rounded-lg bg-card shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-foreground">
                        갤러리 및 미디어
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-foreground">Gallery</Label>
                            <FileUploader
                                bucket="artist"
                                multiple={true}
                                onComplete={handleGalleryUpload}
                            />
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {gallery.map((url, idx) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`Gallery ${idx + 1}`}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                ))}
                            </div>
                        </div>
                        {/* 배열 입력: SNS, Videos, Music, Events */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="text-foreground">SNS</Label>
                                {sns.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 mb-1">
                                        <Input
                                            value={item}
                                            onChange={(e) =>
                                                handleArrayChange(
                                                    setSns,
                                                    sns,
                                                    idx,
                                                    e.target.value
                                                )
                                            }
                                            className="bg-background text-foreground"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                handleArrayRemove(
                                                    setSns,
                                                    sns,
                                                    idx
                                                )
                                            }
                                        >
                                            -
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => handleArrayAdd(setSns, sns)}
                                >
                                    + SNS
                                </Button>
                            </div>
                            <div>
                                <Label className="text-foreground">
                                    Videos
                                </Label>
                                {videos.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 mb-1">
                                        <Input
                                            value={item}
                                            onChange={(e) =>
                                                handleArrayChange(
                                                    setVideos,
                                                    videos,
                                                    idx,
                                                    e.target.value
                                                )
                                            }
                                            className="bg-background text-foreground"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                handleArrayRemove(
                                                    setVideos,
                                                    videos,
                                                    idx
                                                )
                                            }
                                        >
                                            -
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        handleArrayAdd(setVideos, videos)
                                    }
                                >
                                    + Video
                                </Button>
                            </div>
                            <div>
                                <Label className="text-foreground">Music</Label>
                                {music.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 mb-1">
                                        <Input
                                            value={item}
                                            onChange={(e) =>
                                                handleArrayChange(
                                                    setMusic,
                                                    music,
                                                    idx,
                                                    e.target.value
                                                )
                                            }
                                            className="bg-background text-foreground"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                handleArrayRemove(
                                                    setMusic,
                                                    music,
                                                    idx
                                                )
                                            }
                                        >
                                            -
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        handleArrayAdd(setMusic, music)
                                    }
                                >
                                    + Music
                                </Button>
                            </div>
                            <div>
                                <Label className="text-foreground">
                                    Events
                                </Label>
                                {events.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 mb-1">
                                        <Input
                                            value={item}
                                            onChange={(e) =>
                                                handleArrayChange(
                                                    setEvents,
                                                    events,
                                                    idx,
                                                    e.target.value
                                                )
                                            }
                                            className="bg-background text-foreground"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                handleArrayRemove(
                                                    setEvents,
                                                    events,
                                                    idx
                                                )
                                            }
                                        >
                                            -
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        handleArrayAdd(setEvents, events)
                                    }
                                >
                                    + Event
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Background Colors */}
                        <div>
                            <Label className="text-foreground mb-2 block">
                                Background Colors
                            </Label>
                            <div className="space-y-2">
                                {backgroundColors.map((color, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-2 items-center"
                                    >
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => {
                                                const newColors = [
                                                    ...backgroundColors,
                                                ];
                                                newColors[idx] = e.target.value;
                                                setBackgroundColors(newColors);
                                            }}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={color}
                                            onChange={(e) => {
                                                const newColors = [
                                                    ...backgroundColors,
                                                ];
                                                newColors[idx] = e.target.value;
                                                setBackgroundColors(newColors);
                                            }}
                                            className="bg-background text-foreground"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setBackgroundColors(
                                                    backgroundColors.filter(
                                                        (_, i) => i !== idx
                                                    )
                                                );
                                            }}
                                        >
                                            -
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        setBackgroundColors([
                                            ...backgroundColors,
                                            "#000000",
                                        ])
                                    }
                                >
                                    + Background Color
                                </Button>
                            </div>
                        </div>

                        {/* Foreground Colors */}
                        <div>
                            <Label className="text-foreground mb-2 block">
                                Foreground Colors
                            </Label>
                            <div className="space-y-2">
                                {foregroundColors.map((color, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-2 items-center"
                                    >
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => {
                                                const newColors = [
                                                    ...foregroundColors,
                                                ];
                                                newColors[idx] = e.target.value;
                                                setForegroundColors(newColors);
                                            }}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={color}
                                            onChange={(e) => {
                                                const newColors = [
                                                    ...foregroundColors,
                                                ];
                                                newColors[idx] = e.target.value;
                                                setForegroundColors(newColors);
                                            }}
                                            className="bg-background text-foreground"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setForegroundColors(
                                                    foregroundColors.filter(
                                                        (_, i) => i !== idx
                                                    )
                                                );
                                            }}
                                        >
                                            -
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        setForegroundColors([
                                            ...foregroundColors,
                                            "#FFFFFF",
                                        ])
                                    }
                                >
                                    + Foreground Color
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Color Preview */}
                    <div className="mt-4">
                        <Label className="text-foreground mb-2 block">
                            Color Preview
                        </Label>
                        <div className={cn("grid grid-cols-3 gap-4")}>
                            {backgroundColors.map((bgColor, bgIdx) =>
                                foregroundColors.map((fgColor, fgIdx) => (
                                    <div
                                        key={`${bgIdx}-${fgIdx}`}
                                        className="p-4 rounded-lg"
                                        style={{
                                            backgroundColor: bgColor,
                                            color: fgColor,
                                        }}
                                    >
                                        <p className="text-center">
                                            Background: {bgColor}
                                        </p>
                                        <p className="text-center">
                                            Foreground: {fgColor}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. 컬렉션 및 추가 정보 */}
                <div className="rounded-lg bg-card shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-foreground">
                        컬렉션 및 추가 정보
                    </h2>
                    <div className="mb-4">
                        <Label className="text-foreground">Collections</Label>
                        <div className="flex flex-wrap gap-2">
                            {isLoadingEveryCollections ? (
                                <div>Loading collections...</div>
                            ) : (
                                everyCollections?.map((col: any) => (
                                    <label
                                        key={col.id}
                                        className="flex items-center gap-1"
                                    >
                                        <Checkbox
                                            checked={selectedCollectionIds.includes(
                                                col.id
                                            )}
                                            onCheckedChange={() =>
                                                setSelectedCollectionIds(
                                                    (prev) =>
                                                        prev.includes(col.id)
                                                            ? prev.filter(
                                                                  (cid) =>
                                                                      cid !==
                                                                      col.id
                                                              )
                                                            : [...prev, col.id]
                                                )
                                            }
                                        />
                                        <span className="text-foreground">
                                            {col.name}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                    <Label className="text-foreground">
                        Additional Info (JSON)
                    </Label>
                    <Textarea
                        placeholder="Additional Info (JSON)"
                        value={
                            typeof additionalInfo === "string"
                                ? additionalInfo
                                : JSON.stringify(additionalInfo)
                        }
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        className="bg-background text-foreground"
                    />
                </div>

                {/* 4. 제출 버튼 */}
                <div className="flex justify-end gap-2">
                    <Button
                        variant="destructive"
                        onClick={() => {
                            if (onCancel) onCancel();
                        }}
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        disabled={!isValid || isCreating || isUpdating}
                        className="px-8 py-2 text-lg"
                    >
                        {mode === "update"
                            ? isUpdating
                                ? "수정중..."
                                : "수정하기"
                            : isCreating
                            ? "생성중..."
                            : "생성하기"}
                    </Button>
                </div>
                {(createArtistError || updateArtistError) && (
                    <div className="text-red-500 text-sm text-right">
                        {(createArtistError || updateArtistError)?.message}
                    </div>
                )}
            </form>
        </div>
    );
}
