/// components/admin/artists/Admin.Artists.Manage.Dashboard.tsx

"use client";

import {
    Building2,
    ExternalLink,
    Video,
    Image as ImageIcon,
    Link,
    MessageCircle,
    Grid3X3,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

import AdminArtistsManageFeeds from "./Admin.Artists.Manage.Feeds";
import AdminArtistsManageMessages from "./Admin.Artists.Manage.Messages";

import type { Artist, User } from "@prisma/client";

interface AdminArtistsManageDashboardProps {
    artist: Artist;
}

export default function AdminArtistsManageDashboard({
    artist,
}: AdminArtistsManageDashboardProps) {
    const { data: session } = useSession();
    const user = session?.user as User;

    if (!session || !session.user) {
        return (
            <div className="w-full h-full flex items-center justify-center min-h-screen">
                <div className="text-2xl font-bold">Unauthorized</div>
            </div>
        );
    } else if (user.role !== "admin" && user.role !== artist.code) {
        return (
            <div className="w-full h-full flex items-center justify-center min-h-screen">
                <div className="text-2xl font-bold">Unauthorized</div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-[#f5f5f7]">
            {/* Hero Section - Apple style */}
            <div className="relative w-full mb-[30px]">
                {/* Hero Content */}
                <div className="relative pt-20 pb-12 px-6">
                    <div className="max-w-7xl h-[300px] mx-auto">
                        {artist.imageUrl && (
                            <div className="absolute inset-0 w-full h-full z-10">
                                <Image
                                    src={artist.imageUrl}
                                    alt={`${artist.name} image`}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent to-[#f5f5f7] z-20" />
                            </div>
                        )}
                        <div className="flex flex-col items-center text-center">
                            {/* Logo - smaller and cleaner */}
                            {artist.logoUrl && (
                                <div className="relative w-24 h-24 mb-6 rounded-2xl overflow-hidden z-20">
                                    <Image
                                        src={artist.logoUrl}
                                        alt={`${artist.name} logo`}
                                        fill
                                        className="object-contain p-2"
                                        style={{
                                            filter: "drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))",
                                        }}
                                    />
                                </div>
                            )}

                            {/* Artist Name - Apple style typography */}
                            <h2
                                className="text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-900 tracking-tight mb-4 z-20"
                                style={{
                                    color: ArtistBG(artist, 0, 100),
                                    textShadow: `0 0 2px rgba(0, 0, 0, 0.3)`,
                                }}
                            >
                                {artist.name}
                            </h2>

                            {/* Accent line with artist color */}
                            <div
                                className="w-24 h-1 rounded-full mb-6 z-20"
                                style={{
                                    backgroundColor: ArtistBG(artist, 1, 100),
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-6 pb-20">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Quick Stats - Apple Card Style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Company Card */}
                        {artist.company && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <Building2
                                    className="w-6 h-6 mb-3"
                                    style={{ color: ArtistBG(artist, 0) }}
                                />
                                <p className="text-sm font-medium text-gray-500 mb-1">
                                    소속사
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {artist.company}
                                </p>
                            </div>
                        )}

                        {/* External Link Card */}
                        {artist.externalUrl && (
                            <a
                                href={artist.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
                            >
                                <ExternalLink
                                    className="w-6 h-6 mb-3 group-hover:scale-110 transition-transform"
                                    style={{ color: ArtistBG(artist, 1) }}
                                />
                                <p className="text-sm font-medium text-gray-500 mb-1">
                                    공식 사이트
                                </p>
                                <p className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    방문하기
                                </p>
                            </a>
                        )}

                        {/* Gallery Count Card */}
                        {artist.gallery && artist.gallery.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <ImageIcon
                                    className="w-6 h-6 mb-3"
                                    style={{ color: ArtistBG(artist, 2) }}
                                />
                                <p className="text-sm font-medium text-gray-500 mb-1">
                                    갤러리
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {artist.gallery.length}개
                                </p>
                            </div>
                        )}

                        {/* Videos Count Card */}
                        {artist.videos && artist.videos.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <Video
                                    className="w-6 h-6 mb-3"
                                    style={{ color: ArtistBG(artist, 0) }}
                                />
                                <p className="text-sm font-medium text-gray-500 mb-1">
                                    비디오
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {artist.videos.length}개
                                </p>
                            </div>
                        )}
                    </div>

                    {/* SNS Links - Apple Pills Style */}
                    {artist.sns && artist.sns.length > 0 && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                <Link className="w-6 h-6 text-gray-400" />
                                소셜 미디어
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {artist.sns.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        {/* You can detect platform and show appropriate name */}
                                        SNS {index + 1}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs for Messages and Feeds - Apple style */}
                    <Tabs defaultValue="messages" className="w-full">
                        <TabsList className="w-full h-full bg-white rounded-2xl shadow-sm p-1.5 grid grid-cols-2 gap-1">
                            <TabsTrigger
                                value="messages"
                                className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-sm rounded-xl py-3 transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5 text-[rgba(0,0,0,0.5)]" />
                                <span className="font-medium text-[rgba(0,0,0,0.5)]">
                                    메시지 관리
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="feeds"
                                className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-sm rounded-xl py-3 transition-all flex items-center justify-center gap-2"
                            >
                                <Grid3X3 className="w-5 h-5 text-[rgba(0,0,0,0.5)]" />
                                <span className="font-medium text-[rgba(0,0,0,0.5)]">
                                    아티스트 피드
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="messages" className="mt-8">
                            <AdminArtistsManageMessages artist={artist} />
                        </TabsContent>

                        <TabsContent value="feeds" className="mt-8">
                            <AdminArtistsManageFeeds artist={artist} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
