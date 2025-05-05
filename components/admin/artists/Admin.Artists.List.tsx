/// components/admin/artists/Admin.Artists.List.tsx

"use client";

import { useArtistsGet } from "@/app/hooks/useArtists";
import AdminArtistsCreate from "./Admin.Artists.Create";
import { Artist } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminArtistsList() {
    const { artists, isLoading, error } = useArtistsGet({});
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
                                <td colSpan={7} className="text-center py-8">
                                    로딩 중...
                                </td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center text-red-500 py-8"
                                >
                                    오류가 발생했습니다: {error.message}
                                </td>
                            </tr>
                        )}
                        {artists && artists.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-8">
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
