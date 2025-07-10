/// components/admin/polls/Admin.Polls.Cards.tsx

"use client";

import React from "react";
import {
    Edit,
    Trash2,
    BarChart3,
    Vote,
    Clock,
    Users,
    TrendingUp,
    Eye,
    Calendar,
    Trophy,
} from "lucide-react";
import type { Poll } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PollThumbnail from "@/components/atoms/Polls.Thumbnail";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/tailwind";

interface PollResult {
    pollId: string;
    totalVotes: number;
    results: Array<{
        optionId: string;
        name: string;
        voteCount: number;
        voteRate: number;
        actualVoteCount?: number;
    }>;
}

interface PollsCardsProps {
    polls: Poll[];
    results: PollResult[];
    onEdit: (poll: Poll) => void;
    onDelete: (pollId: string) => void;
    onActiveChange: (poll: Poll, isActive: boolean) => void;
}

export default function PollsCards({
    polls,
    results,
    onEdit,
    onDelete,
    onActiveChange,
}: PollsCardsProps) {
    const getStatusInfo = (poll: Poll) => {
        const now = new Date();
        const isStarted = poll.startDate <= now;
        const isEnded = poll.endDate <= now;

        if (!poll.isActive) {
            return {
                label: "비활성화",
                className: "bg-gray-500/20 text-gray-300 border-gray-500/50",
                dotColor: "bg-gray-400",
            };
        }

        if (!isStarted) {
            return {
                label: "예정",
                className: "bg-blue-500/20 text-blue-300 border-blue-500/50",
                dotColor: "bg-blue-400",
            };
        }

        if (isEnded) {
            return {
                label: "종료",
                className: "bg-red-500/20 text-red-300 border-red-500/50",
                dotColor: "bg-red-400",
            };
        }

        return {
            label: "진행중",
            className: "bg-green-500/20 text-green-300 border-green-500/50",
            dotColor: "bg-green-400",
        };
    };

    const getPollModeInfo = (poll: Poll) => {
        if (poll.bettingMode) {
            return {
                icon: <BarChart3 className="w-4 h-4" />,
                label: "🎰 베팅 폴",
                className:
                    "bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500/50",
                cardBorder: "border-orange-400/30",
                headerBg:
                    "bg-gradient-to-r from-orange-500/10 to-yellow-500/10",
            };
        }
        return {
            icon: <Vote className="w-4 h-4" />,
            label: "일반 폴",
            className:
                "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50",
            cardBorder: "border-slate-600/50",
            headerBg: "bg-gradient-to-r from-slate-700/30 to-slate-600/30",
        };
    };

    if (polls.length === 0) {
        return (
            <div className="text-center py-16">
                <Vote className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-slate-300 mb-3">
                    폴이 없습니다
                </h3>
                <p className="text-slate-400">새로운 폴을 생성해보세요.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {polls.map((poll) => {
                const result = results.find((r) => r.pollId === poll.id);
                const pollMode = getPollModeInfo(poll);
                const status = getStatusInfo(poll);
                const topResult = poll.bettingMode
                    ? result?.results?.sort(
                          (a, b) =>
                              (b.actualVoteCount || b.voteCount) -
                              (a.actualVoteCount || a.voteCount)
                      )?.[0]
                    : result?.results?.sort(
                          (a, b) => b.voteCount - a.voteCount
                      )?.[0];

                return (
                    <Card
                        key={poll.id}
                        className={cn(
                            "group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden",
                            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm",
                            pollMode.cardBorder,
                            poll.bettingMode && "ring-1 ring-orange-400/20"
                        )}
                    >
                        {/* 헤더 */}
                        <CardHeader
                            className={cn("relative p-0", pollMode.headerBg)}
                        >
                            {/* 썸네일 */}
                            <div className="relative h-40 w-full overflow-hidden">
                                <PollThumbnail
                                    poll={poll}
                                    quality={100}
                                    imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* 오버레이 */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                                {/* 배지들 */}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <Badge
                                        variant="outline"
                                        className={pollMode.className}
                                    >
                                        <div className="flex items-center gap-1">
                                            {pollMode.icon}
                                            <span className="text-xs">
                                                {pollMode.label}
                                            </span>
                                        </div>
                                    </Badge>
                                    {poll.category === "PRIVATE" && (
                                        <Badge
                                            variant="outline"
                                            className="bg-purple-500/20 text-purple-300 border-purple-500/50"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            PRIVATE
                                        </Badge>
                                    )}
                                </div>

                                {/* 상태 */}
                                <div className="absolute top-3 right-3">
                                    <Badge
                                        variant="outline"
                                        className={status.className}
                                    >
                                        <div className="flex items-center gap-1">
                                            <div
                                                className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    status.dotColor
                                                )}
                                            />
                                            <span className="text-xs">
                                                {status.label}
                                            </span>
                                        </div>
                                    </Badge>
                                </div>

                                {/* 폴 ID */}
                                <div className="absolute bottom-3 left-3">
                                    <Badge
                                        variant="secondary"
                                        className="bg-slate-800/60 text-slate-200 backdrop-blur-sm"
                                    >
                                        {poll.id}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        {/* 컨텐츠 */}
                        <CardContent className="p-4 space-y-4">
                            {/* 제목 */}
                            <div>
                                <h3 className="font-semibold text-white text-lg leading-tight mb-1">
                                    {poll.title}
                                </h3>
                                {poll.titleShorten && (
                                    <p className="text-sm text-slate-400">
                                        {poll.titleShorten}
                                    </p>
                                )}
                            </div>

                            {/* 일정 정보 */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    <span className="text-slate-400">
                                        시작:
                                    </span>
                                    <span className="text-white">
                                        {formatDate(poll.startDate)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-red-400" />
                                    <span className="text-slate-400">
                                        종료:
                                    </span>
                                    <span className="text-white">
                                        {formatDate(poll.endDate)}
                                    </span>
                                </div>
                            </div>

                            {/* 참여 현황 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                        <span className="text-xs text-slate-400">
                                            {poll.bettingMode
                                                ? "총 베팅"
                                                : "총 투표"}
                                        </span>
                                    </div>
                                    <div className="text-lg font-bold text-white">
                                        {result?.totalVotes?.toLocaleString() ||
                                            0}
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs text-slate-400">
                                            참여자
                                        </span>
                                    </div>
                                    <div className="text-lg font-bold text-white">
                                        {poll.uniqueVoters?.toLocaleString() ||
                                            0}
                                    </div>
                                </div>
                            </div>

                            {/* 최고 득표 옵션 */}
                            {topResult && (
                                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                        <span className="text-xs text-slate-400">
                                            {poll.bettingMode
                                                ? "최고 베팅"
                                                : "최고 득표"}
                                        </span>
                                    </div>
                                    <div className="font-medium text-white text-sm">
                                        {topResult.name}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {topResult.voteRate.toFixed(1)}% (
                                        {poll.bettingMode
                                            ? `${
                                                  topResult.actualVoteCount ||
                                                  topResult.voteCount
                                              }표`
                                            : `${topResult.voteCount}표`}
                                        {poll.bettingMode &&
                                            ` • ${topResult.voteCount.toLocaleString()} 베팅`}
                                        )
                                    </div>
                                </div>
                            )}

                            {/* 활성화 토글 */}
                            <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                                <span className="text-sm text-slate-300">
                                    활성화 상태
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">
                                        {poll.isActive ? "활성" : "비활성"}
                                    </span>
                                    <Switch
                                        checked={poll.isActive}
                                        onCheckedChange={(checked) =>
                                            onActiveChange(poll, checked)
                                        }
                                    />
                                </div>
                            </div>

                            {/* 액션 버튼들 */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(poll)}
                                    className="flex-1 bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
                                >
                                    <Edit className="w-3 h-3 mr-1" />
                                    수정
                                </Button>

                                {poll.bettingMode && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            // Navigate to betting management page
                                            window.open(
                                                `/admin/polls/betting-mode`,
                                                "_blank"
                                            );
                                        }}
                                        className="bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30 text-orange-300"
                                    >
                                        <BarChart3 className="w-3 h-3 mr-1" />
                                        베팅 관리
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDelete(poll.id)}
                                    className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
