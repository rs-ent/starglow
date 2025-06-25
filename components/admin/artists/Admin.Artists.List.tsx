/// components/admin/artists/Admin.Artists.List.tsx

"use client";

import { useState } from "react";

import Link from "next/link";

import { useArtistsGet, useArtistSet } from "@/app/hooks/useArtists";
import { Button } from "@/components/ui/button";

import AdminArtistsCreate from "./Admin.Artists.Create";

import type { Artist } from "@prisma/client";

export default function AdminArtistsList() {
    const { artists, isLoading, error } = useArtistsGet({});
    const { deleteArtist, isDeleting } = useArtistSet();
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

    return (
        <div className="w-full mx-auto">
            {createOpen && (
                <AdminArtistsCreate
                    mode={selectedArtist ? "update" : "create"}
                    initialData={selectedArtist}
                    onSuccess={() => {
                        setCreateOpen(false);
                        setSelectedArtist(null);
                    }}
                    onCancel={() => {
                        setCreateOpen(false);
                        setSelectedArtist(null);
                    }}
                />
            )}
            <Button
                className="mb-4"
                onClick={() => {
                    setSelectedArtist(null);
                    setCreateOpen(true);
                }}
            >
                새로운 아티스트 추가하기
            </Button>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-card rounded-lg shadow">
                    <thead>
                        <tr className="bg-muted text-foreground divide-x divide-[rgba(255,255,255,0.1)]">
                            <th className="px-4 py-2 text-center">로고</th>
                            <th className="px-4 py-2 text-center">이름</th>
                            <th className="px-4 py-2 text-center">설명</th>
                            <th className="px-4 py-2 text-center">회사</th>
                            <th className="px-4 py-2 text-center">플레이어</th>
                            <th className="px-4 py-2 text-center">컬렉션</th>
                            <th className="px-4 py-2 text-center">
                                퀘스트 갯수
                            </th>
                            <th className="px-4 py-2 text-center">폴 갯수</th>
                            <th className="px-4 py-2 text-center">작업</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {isLoading && (
                            <tr>
                                <td colSpan={9} className="text-center py-8">
                                    로딩 중...
                                </td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="text-center text-red-500 py-8"
                                >
                                    오류가 발생했습니다: {error.message}
                                </td>
                            </tr>
                        )}
                        {artists && artists.length === 0 && (
                            <tr>
                                <td colSpan={9} className="text-center py-8">
                                    등록된 아티스트가 없습니다.
                                </td>
                            </tr>
                        )}
                        {artists &&
                            artists.map((artist: any) => (
                                <tr
                                    key={artist.id}
                                    className="border-b last:border-b-0 hover:bg-muted/50 transition divide-x divide-y divide-[rgba(255,255,255,0.1)]"
                                >
                                    <td className="px-4 py-2 flex items-center justify-center">
                                        {artist.logoUrl ? (
                                            <img
                                                src={artist.logoUrl}
                                                alt={artist.name}
                                                className="w-12 h-12 object-contain"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                                없음
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 font-semibold text-foreground text-center align-middle">
                                        {artist.name}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-muted-foreground max-w-[200px] truncate align-middle">
                                        {artist.description}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-center align-middle">
                                        {artist.company}
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        {artist.players &&
                                        artist.players.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="text-sm font-medium">
                                                    {artist.players.length}명
                                                </div>
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {artist.players
                                                        .slice(0, 3)
                                                        .map((player: any) => (
                                                            <div
                                                                key={player.id}
                                                                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full max-w-[80px] truncate"
                                                                title={
                                                                    player.name ||
                                                                    player.nickname ||
                                                                    player.email ||
                                                                    "Unknown"
                                                                }
                                                            >
                                                                {player.name ||
                                                                    player.nickname ||
                                                                    player.email ||
                                                                    "Unknown"}
                                                            </div>
                                                        ))}
                                                    {artist.players.length >
                                                        3 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            +
                                                            {artist.players
                                                                .length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                없음
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        {artist.collectionContracts
                                            ? artist.collectionContracts
                                                  .map((col: any) => col.name)
                                                  .join(", ")
                                            : ""}
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        {artist.quests && artist.quests.length}
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        {artist.polls && artist.polls.length}
                                    </td>
                                    <td className="px-4 py-2 text-center align-middle">
                                        <div className="flex gap-2 justify-center items-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedArtist(artist);
                                                    setCreateOpen(true);
                                                }}
                                            >
                                                수정
                                            </Button>
                                            <Link
                                                href={`/artists/manage/${artist.id}`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    관리
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={async () => {
                                                    if (
                                                        window.confirm(
                                                            `${artist.name} 아티스트를 삭제하시겠습니까?`
                                                        )
                                                    ) {
                                                        try {
                                                            await deleteArtist({
                                                                id: artist.id,
                                                            });
                                                            // 삭제 후 목록 새로고침이 필요할 수 있습니다
                                                        } catch (error) {
                                                            console.error(
                                                                "아티스트 삭제 중 오류 발생:",
                                                                error
                                                            );
                                                            alert(
                                                                "아티스트 삭제 중 오류가 발생했습니다."
                                                            );
                                                        }
                                                    }
                                                }}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting
                                                    ? "삭제 중..."
                                                    : "삭제"}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
