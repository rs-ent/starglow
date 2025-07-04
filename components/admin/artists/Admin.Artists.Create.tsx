/// components/admin/artists/Admin.Artists.Create.tsx

"use client";

import { useState, useCallback, useEffect } from "react";
import {
    X,
    User,
    Image as ImageIcon,
    Music,
    Palette,
    Save,
    Plus,
    Minus,
    Search,
    Users,
} from "lucide-react";

import { useArtistSet, useArtistsGet } from "@/app/hooks/useArtists";
import FileUploader from "@/components/atoms/FileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/tailwind";

import type { Artist, Player } from "@prisma/client";
import { Switch } from "@/components/ui/switch";

interface AdminArtistsCreateProps {
    mode: "create" | "update";
    initialData?:
        | (Artist & {
              collectionContracts?: { id: string }[];
              players?: Player[];
          })
        | null;
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

    // 플레이어 관련 상태
    const [playerSearch, setPlayerSearch] = useState("");
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
        initialData?.players?.map((p) => p.id) ?? []
    );

    // 플레이어 데이터 가져오기
    const { players, isPlayersLoading } = useArtistsGet({
        getPlayersInput: {
            search: playerSearch || undefined,
            excludeArtists: false,
            limit: 20,
        },
    });

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

    const [hidden, setHidden] = useState(initialData?.hidden ?? false);
    const [code, setCode] = useState(initialData?.code ?? "");

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
            setSelectedPlayerIds(initialData.players?.map((p) => p.id) ?? []);
            setHidden(initialData.hidden ?? false);
            setCode(initialData.code ?? "");
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

    // 플레이어 선택/해제 핸들러
    const handlePlayerToggle = (playerId: string) => {
        setSelectedPlayerIds((prev) =>
            prev.includes(playerId)
                ? prev.filter((id) => id !== playerId)
                : [...prev, playerId]
        );
    };

    // 선택된 플레이어들 가져오기
    const selectedPlayers =
        players?.filter((player) => selectedPlayerIds.includes(player.id)) ??
        [];

    const isValid = name.trim().length > 0;
    const isLoading = isCreating || isUpdating;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        // additionalInfo JSON 파싱 (선택)
        let parsedAdditionalInfo = additionalInfo;
        try {
            if (typeof additionalInfo === "string" && additionalInfo.trim()) {
                parsedAdditionalInfo = JSON.parse(additionalInfo);
            }
        } catch (error) {
            console.error(error);
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
                playerIds: selectedPlayerIds,
                hidden,
                code,
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
                playerIds: selectedPlayerIds,
                hidden,
                code,
            });
        }
        if (onSuccess) onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <User className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {mode === "update"
                                    ? "아티스트 수정"
                                    : "아티스트 생성"}
                            </h1>
                            <p className="text-sm text-slate-400">
                                {mode === "update"
                                    ? "아티스트 정보를 수정합니다"
                                    : "새로운 아티스트를 생성합니다"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isValid && (
                            <Badge
                                variant="secondary"
                                className="text-green-300 border-green-500/50 bg-green-500/20"
                            >
                                입력 완료
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* 1. 기본 정보 */}
                        <Card className="p-6 bg-slate-800/50 border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <User className="w-5 h-5 text-blue-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">
                                    기본 정보
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            아티스트명{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            placeholder="아티스트 이름을 입력하세요"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            required
                                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            설명
                                        </Label>
                                        <Textarea
                                            placeholder="아티스트에 대한 설명을 입력하세요"
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 min-h-[100px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            외부 링크
                                        </Label>
                                        <Input
                                            placeholder="https://example.com"
                                            value={externalUrl}
                                            onChange={(e) =>
                                                setExternalUrl(e.target.value)
                                            }
                                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            신고 URL
                                        </Label>
                                        <Input
                                            placeholder="https://report.example.com"
                                            value={reportUrl}
                                            onChange={(e) =>
                                                setReportUrl(e.target.value)
                                            }
                                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            소속사
                                        </Label>
                                        <Input
                                            placeholder="소속사명을 입력하세요"
                                            value={company}
                                            onChange={(e) =>
                                                setCompany(e.target.value)
                                            }
                                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            로고 이미지
                                        </Label>
                                        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                                            <FileUploader
                                                bucket="artist"
                                                multiple={false}
                                                onComplete={handleLogoUpload}
                                            />
                                            {logoUrl && (
                                                <div className="mt-3 flex items-center gap-3">
                                                    <img
                                                        src={logoUrl}
                                                        alt="Logo Preview"
                                                        className="w-16 h-16 object-contain rounded-lg border border-slate-600 bg-slate-800"
                                                    />
                                                    <div className="text-sm text-slate-400">
                                                        로고 업로드 완료
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            대표 이미지
                                        </Label>
                                        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                                            <FileUploader
                                                bucket="artist"
                                                multiple={false}
                                                onComplete={handleImageUpload}
                                            />
                                            {imageUrl && (
                                                <div className="mt-3 flex items-center gap-3">
                                                    <img
                                                        src={imageUrl}
                                                        alt="Image Preview"
                                                        className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                                                    />
                                                    <div className="text-sm text-slate-400">
                                                        이미지 업로드 완료
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 설정 옵션들 */}
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                                    <div className="space-y-1">
                                        <Label className="text-slate-300 font-medium">
                                            숨김 처리
                                        </Label>
                                        <p className="text-sm text-slate-400">
                                            숨김 처리된 아티스트는 목록에서는
                                            보이지만, 블러 처리된 기본 이미지가
                                            적용되고 아티스트명이 물음표로
                                            나옵니다.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={hidden}
                                        onCheckedChange={setHidden}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            아티스트 코드
                                        </Label>
                                        <Input
                                            placeholder="관리용 코드를 입력하세요"
                                            value={code}
                                            onChange={(e) =>
                                                setCode(e.target.value)
                                            }
                                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                                        />
                                        <p className="text-xs text-slate-400">
                                            아티스트 관리 페이지로 접근하기 위한
                                            코드입니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 2. 플레이어 선택 */}
                        <Card className="p-6 bg-slate-800/50 border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Users className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        플레이어 연결
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        이 아티스트와 연결할 플레이어를
                                        선택하세요
                                    </p>
                                </div>
                            </div>

                            {/* 플레이어 검색 */}
                            <div className="mb-6">
                                <Label className="text-slate-300 text-sm font-medium flex items-center gap-2 mb-2">
                                    <Search className="w-4 h-4" />
                                    플레이어 검색
                                </Label>
                                <Input
                                    placeholder="플레이어 이름, 닉네임, 이메일로 검색..."
                                    value={playerSearch}
                                    onChange={(e) =>
                                        setPlayerSearch(e.target.value)
                                    }
                                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500"
                                />
                            </div>

                            {/* 선택된 플레이어들 */}
                            {selectedPlayers.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            선택된 플레이어
                                        </Label>
                                        <Badge
                                            variant="secondary"
                                            className="text-purple-300 border-purple-500/50 bg-purple-500/20"
                                        >
                                            {selectedPlayers.length}명
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPlayers.map((player) => (
                                            <div
                                                key={player.id}
                                                className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/50 px-3 py-2 rounded-lg text-sm"
                                            >
                                                {player.image && (
                                                    <img
                                                        src={player.image}
                                                        alt=""
                                                        className="w-5 h-5 rounded-full border border-purple-500/30"
                                                    />
                                                )}
                                                <span className="text-purple-200">
                                                    {player.name ||
                                                        player.nickname ||
                                                        player.email ||
                                                        "Unknown"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handlePlayerToggle(
                                                            player.id
                                                        )
                                                    }
                                                    className="text-purple-300 hover:text-purple-100 ml-1 hover:bg-purple-500/30 rounded-full w-5 h-5 flex items-center justify-center"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 플레이어 목록 */}
                            <div className="bg-slate-700/30 border border-slate-600 rounded-lg max-h-64 overflow-y-auto">
                                {isPlayersLoading ? (
                                    <div className="p-6 text-center">
                                        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                        <p className="text-slate-400 text-sm">
                                            플레이어 목록을 불러오는 중...
                                        </p>
                                    </div>
                                ) : players && players.length > 0 ? (
                                    <div className="divide-y divide-slate-600/50">
                                        {players.map((player) => (
                                            <div
                                                key={player.id}
                                                className={cn(
                                                    "p-4 flex items-center justify-between hover:bg-slate-600/50 cursor-pointer transition-colors",
                                                    selectedPlayerIds.includes(
                                                        player.id
                                                    ) &&
                                                        "bg-purple-500/10 border-l-2 border-purple-500"
                                                )}
                                                onClick={() =>
                                                    handlePlayerToggle(
                                                        player.id
                                                    )
                                                }
                                            >
                                                <div className="flex items-center gap-3">
                                                    {player.image ? (
                                                        <img
                                                            src={player.image}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full border border-slate-600"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-white">
                                                            {player.name ||
                                                                player.nickname ||
                                                                "Unknown"}
                                                        </div>
                                                        <div className="text-sm text-slate-400">
                                                            {player.email}
                                                        </div>
                                                        {player.isArtist && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-orange-300 border-orange-500/50 mt-1"
                                                            >
                                                                이미 아티스트로
                                                                등록됨
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPlayerIds.includes(
                                                            player.id
                                                        )}
                                                        onChange={() =>
                                                            handlePlayerToggle(
                                                                player.id
                                                            )
                                                        }
                                                        className="w-4 h-4 text-purple-500 border-slate-500 rounded focus:ring-purple-500 focus:ring-2"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center">
                                        <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                        <p className="text-slate-400 text-sm">
                                            {playerSearch
                                                ? "검색 결과가 없습니다."
                                                : "등록된 플레이어가 없습니다."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* 3. 갤러리/미디어 */}
                        <Card className="p-6 bg-slate-800/50 border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Music className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        갤러리 및 미디어
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        아티스트의 갤러리 이미지와 미디어 링크를
                                        추가하세요
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        갤러리 이미지
                                    </Label>
                                    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                                        <FileUploader
                                            bucket="artist"
                                            multiple={true}
                                            onComplete={handleGalleryUpload}
                                        />
                                        {gallery.length > 0 && (
                                            <div className="flex gap-3 mt-4 flex-wrap">
                                                {gallery.map((url, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="relative group"
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Gallery ${
                                                                idx + 1
                                                            }`}
                                                            className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                            <span className="text-white text-xs">
                                                                이미지 {idx + 1}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 배열 입력: SNS, Videos, Music, Events */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            SNS 링크
                                        </Label>
                                        <div className="space-y-2">
                                            {sns.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex gap-2"
                                                >
                                                    <Input
                                                        value={item}
                                                        placeholder="https://instagram.com/artist"
                                                        onChange={(e) =>
                                                            handleArrayChange(
                                                                setSns,
                                                                sns,
                                                                idx,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleArrayRemove(
                                                                setSns,
                                                                sns,
                                                                idx
                                                            )
                                                        }
                                                        className="px-3 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleArrayAdd(setSns, sns)
                                                }
                                                className="bg-slate-700/50 border-slate-600 text-emerald-400 hover:bg-slate-600"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                SNS 추가
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            비디오 링크
                                        </Label>
                                        <div className="space-y-2">
                                            {videos.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex gap-2"
                                                >
                                                    <Input
                                                        value={item}
                                                        placeholder="https://youtube.com/watch?v=..."
                                                        onChange={(e) =>
                                                            handleArrayChange(
                                                                setVideos,
                                                                videos,
                                                                idx,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleArrayRemove(
                                                                setVideos,
                                                                videos,
                                                                idx
                                                            )
                                                        }
                                                        className="px-3 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleArrayAdd(
                                                        setVideos,
                                                        videos
                                                    )
                                                }
                                                className="bg-slate-700/50 border-slate-600 text-emerald-400 hover:bg-slate-600"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                비디오 추가
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            음악 링크
                                        </Label>
                                        <div className="space-y-2">
                                            {music.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex gap-2"
                                                >
                                                    <Input
                                                        value={item}
                                                        placeholder="https://spotify.com/track/..."
                                                        onChange={(e) =>
                                                            handleArrayChange(
                                                                setMusic,
                                                                music,
                                                                idx,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleArrayRemove(
                                                                setMusic,
                                                                music,
                                                                idx
                                                            )
                                                        }
                                                        className="px-3 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleArrayAdd(
                                                        setMusic,
                                                        music
                                                    )
                                                }
                                                className="bg-slate-700/50 border-slate-600 text-emerald-400 hover:bg-slate-600"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                음악 추가
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-slate-300 text-sm font-medium">
                                            이벤트 링크
                                        </Label>
                                        <div className="space-y-2">
                                            {events.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex gap-2"
                                                >
                                                    <Input
                                                        value={item}
                                                        placeholder="https://event.example.com/..."
                                                        onChange={(e) =>
                                                            handleArrayChange(
                                                                setEvents,
                                                                events,
                                                                idx,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-emerald-500"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleArrayRemove(
                                                                setEvents,
                                                                events,
                                                                idx
                                                            )
                                                        }
                                                        className="px-3 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleArrayAdd(
                                                        setEvents,
                                                        events
                                                    )
                                                }
                                                className="bg-slate-700/50 border-slate-600 text-emerald-400 hover:bg-slate-600"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                이벤트 추가
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 4. 색상 테마 */}
                        <Card className="p-6 bg-slate-800/50 border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-pink-500/20 rounded-lg">
                                    <Palette className="w-5 h-5 text-pink-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        색상 테마
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        아티스트 페이지의 배경색과 전경색을
                                        설정하세요
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Background Colors */}
                                <div className="space-y-4">
                                    <Label className="text-slate-300 text-sm font-medium block">
                                        배경 색상
                                    </Label>
                                    <div className="space-y-3">
                                        {backgroundColors.map((color, idx) => (
                                            <div
                                                key={idx}
                                                className="flex gap-3 items-center p-3 bg-slate-700/30 border border-slate-600 rounded-lg"
                                            >
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => {
                                                        const newColors = [
                                                            ...backgroundColors,
                                                        ];
                                                        newColors[idx] =
                                                            e.target.value;
                                                        setBackgroundColors(
                                                            newColors
                                                        );
                                                    }}
                                                    className="w-12 h-12 rounded-lg cursor-pointer border border-slate-500"
                                                />
                                                <Input
                                                    value={color}
                                                    onChange={(e) => {
                                                        const newColors = [
                                                            ...backgroundColors,
                                                        ];
                                                        newColors[idx] =
                                                            e.target.value;
                                                        setBackgroundColors(
                                                            newColors
                                                        );
                                                    }}
                                                    className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 focus:border-pink-500"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setBackgroundColors(
                                                            backgroundColors.filter(
                                                                (_, i) =>
                                                                    i !== idx
                                                            )
                                                        );
                                                    }}
                                                    className="px-3 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setBackgroundColors([
                                                    ...backgroundColors,
                                                    "#000000",
                                                ])
                                            }
                                            className="bg-slate-700/50 border-slate-600 text-pink-400 hover:bg-slate-600"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            배경색 추가
                                        </Button>
                                    </div>
                                </div>

                                {/* Foreground Colors */}
                                <div className="space-y-4">
                                    <Label className="text-slate-300 text-sm font-medium block">
                                        전경 색상
                                    </Label>
                                    <div className="space-y-3">
                                        {foregroundColors.map((color, idx) => (
                                            <div
                                                key={idx}
                                                className="flex gap-3 items-center p-3 bg-slate-700/30 border border-slate-600 rounded-lg"
                                            >
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => {
                                                        const newColors = [
                                                            ...foregroundColors,
                                                        ];
                                                        newColors[idx] =
                                                            e.target.value;
                                                        setForegroundColors(
                                                            newColors
                                                        );
                                                    }}
                                                    className="w-12 h-12 rounded-lg cursor-pointer border border-slate-500"
                                                />
                                                <Input
                                                    value={color}
                                                    onChange={(e) => {
                                                        const newColors = [
                                                            ...foregroundColors,
                                                        ];
                                                        newColors[idx] =
                                                            e.target.value;
                                                        setForegroundColors(
                                                            newColors
                                                        );
                                                    }}
                                                    className="bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 focus:border-pink-500"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setForegroundColors(
                                                            foregroundColors.filter(
                                                                (_, i) =>
                                                                    i !== idx
                                                            )
                                                        );
                                                    }}
                                                    className="px-3 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setForegroundColors([
                                                    ...foregroundColors,
                                                    "#FFFFFF",
                                                ])
                                            }
                                            className="bg-slate-700/50 border-slate-600 text-pink-400 hover:bg-slate-600"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            전경색 추가
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Color Preview */}
                            {backgroundColors.length > 0 &&
                                foregroundColors.length > 0 && (
                                    <div className="mt-6">
                                        <Label className="text-slate-300 text-sm font-medium mb-3 block">
                                            색상 조합 미리보기
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {backgroundColors.map(
                                                (bgColor, bgIdx) =>
                                                    foregroundColors.map(
                                                        (fgColor, fgIdx) => (
                                                            <div
                                                                key={`${bgIdx}-${fgIdx}`}
                                                                className="p-4 rounded-lg border border-slate-600"
                                                                style={{
                                                                    backgroundColor:
                                                                        bgColor,
                                                                    color: fgColor,
                                                                }}
                                                            >
                                                                <p className="text-center text-sm font-medium">
                                                                    샘플 텍스트
                                                                </p>
                                                                <p className="text-center text-xs opacity-80 mt-1">
                                                                    {bgColor} /{" "}
                                                                    {fgColor}
                                                                </p>
                                                            </div>
                                                        )
                                                    )
                                            )}
                                        </div>
                                    </div>
                                )}
                        </Card>

                        {/* 5. 제출 버튼 */}
                        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-6 -mx-6 -mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isLoading && (
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                            <span className="text-sm">
                                                {mode === "update"
                                                    ? "수정 중..."
                                                    : "생성 중..."}
                                            </span>
                                        </div>
                                    )}
                                    {(createArtistError ||
                                        updateArtistError) && (
                                        <div className="flex items-center gap-2 text-red-400">
                                            <X className="w-4 h-4" />
                                            <span className="text-sm">
                                                {
                                                    (
                                                        createArtistError ||
                                                        updateArtistError
                                                    )?.message
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (onCancel) onCancel();
                                        }}
                                        disabled={isLoading}
                                        className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!isValid || isLoading}
                                        className={cn(
                                            "px-6 py-2 font-medium",
                                            isValid
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                                : "bg-slate-600"
                                        )}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                {mode === "update"
                                                    ? "수정 중..."
                                                    : "생성 중..."}
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                {mode === "update"
                                                    ? "수정하기"
                                                    : "생성하기"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
