/// components/admin/polls/Admin.Polls.Table.tsx

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
} from "lucide-react";
import type { Poll } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

interface PollsTableProps {
    polls: Poll[];
    results: PollResult[];
    onEdit: (poll: Poll) => void;
    onDelete: (pollId: string) => void;
    onActiveChange: (poll: Poll, isActive: boolean) => void;
}

export default function PollsTable({
    polls,
    results,
    onEdit,
    onDelete,
    onActiveChange,
}: PollsTableProps) {
    const getStatusBadge = (poll: Poll) => {
        const now = new Date();
        const isStarted = poll.startDate <= now;
        const isEnded = poll.endDate <= now;

        if (!poll.isActive) {
            return (
                <Badge
                    variant="secondary"
                    className="bg-gray-500/20 text-gray-300"
                >
                    비활성화
                </Badge>
            );
        }

        if (!isStarted) {
            return (
                <Badge
                    variant="outline"
                    className="bg-blue-500/20 text-blue-300 border-blue-500/50"
                >
                    예정
                </Badge>
            );
        }

        if (isEnded) {
            return (
                <Badge
                    variant="outline"
                    className="bg-red-500/20 text-red-300 border-red-500/50"
                >
                    종료
                </Badge>
            );
        }

        return (
            <Badge
                variant="outline"
                className="bg-green-500/20 text-green-300 border-green-500/50"
            >
                진행중
            </Badge>
        );
    };

    const getPollModeInfo = (poll: Poll) => {
        if (poll.bettingMode) {
            return {
                icon: <BarChart3 className="w-4 h-4 text-orange-400" />,
                label: "🎰 베팅",
                className:
                    "bg-orange-500/20 text-orange-300 border-orange-500/50",
            };
        }
        return {
            icon: <Vote className="w-4 h-4 text-blue-400" />,
            label: "일반",
            className: "bg-blue-500/20 text-blue-300 border-blue-500/50",
        };
    };

    return (
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    {/* 헤더 */}
                    <thead className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-b border-slate-600/50">
                        <tr>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                썸네일
                            </th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                폴 정보
                            </th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                모드
                            </th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                일정
                            </th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                참여 현황
                            </th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                상태
                            </th>
                            <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                결과
                            </th>
                            <th className="px-4 py-4 text-center text-sm font-semibold text-slate-200">
                                관리
                            </th>
                        </tr>
                    </thead>

                    {/* 바디 */}
                    <tbody className="divide-y divide-slate-700/50">
                        {polls.map((poll) => {
                            const result = results.find(
                                (r) => r.pollId === poll.id
                            );
                            const pollMode = getPollModeInfo(poll);
                            // 득표수가 가장 많은 옵션을 찾기 위해 정렬
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
                                <tr
                                    key={poll.id}
                                    className={cn(
                                        "hover:bg-slate-700/30 transition-colors",
                                        poll.bettingMode &&
                                            "border-l-2 border-orange-400/50"
                                    )}
                                >
                                    {/* 썸네일 */}
                                    <td className="px-4 py-4">
                                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center">
                                            <PollThumbnail
                                                poll={poll}
                                                quality={100}
                                                imageClassName="rounded-lg object-cover w-full h-full"
                                            />
                                        </div>
                                    </td>

                                    {/* 폴 정보 */}
                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-300">
                                                    {poll.id}
                                                </span>
                                                {poll.category ===
                                                    "PRIVATE" && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50"
                                                    >
                                                        PRIVATE
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-white text-sm leading-tight">
                                                {poll.title}
                                            </h3>
                                            {poll.titleShorten && (
                                                <p className="text-xs text-slate-400">
                                                    {poll.titleShorten}
                                                </p>
                                            )}
                                        </div>
                                    </td>

                                    {/* 모드 */}
                                    <td className="px-4 py-4">
                                        <Badge
                                            variant="outline"
                                            className={pollMode.className}
                                        >
                                            <div className="flex items-center gap-1">
                                                {pollMode.icon}
                                                <span>{pollMode.label}</span>
                                            </div>
                                        </Badge>
                                    </td>

                                    {/* 일정 */}
                                    <td className="px-4 py-4">
                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    시작:{" "}
                                                    {formatDate(poll.startDate)}
                                                </span>
                                            </div>
                                            <div className="text-slate-400">
                                                종료: {formatDate(poll.endDate)}
                                            </div>
                                        </div>
                                    </td>

                                    {/* 참여 현황 */}
                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-sm">
                                                <TrendingUp className="w-4 h-4 text-green-400" />
                                                <span className="text-white font-medium">
                                                    {result?.totalVotes?.toLocaleString() ||
                                                        0}
                                                </span>
                                                <span className="text-slate-400">
                                                    {poll.bettingMode
                                                        ? "베팅"
                                                        : "투표"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Users className="w-4 h-4 text-blue-400" />
                                                <span className="text-white font-medium">
                                                    {poll.uniqueVoters?.toLocaleString() ||
                                                        0}
                                                </span>
                                                <span className="text-slate-400">
                                                    명
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 상태 */}
                                    <td className="px-4 py-4">
                                        <div className="space-y-2">
                                            {getStatusBadge(poll)}
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={poll.isActive}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        onActiveChange(
                                                            poll,
                                                            checked
                                                        )
                                                    }
                                                />
                                                <span className="text-xs text-slate-400">
                                                    {poll.isActive
                                                        ? "활성"
                                                        : "비활성"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 결과 */}
                                    <td className="px-4 py-4">
                                        {topResult ? (
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium text-white">
                                                    {topResult.name}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {topResult.voteRate.toFixed(
                                                        1
                                                    )}
                                                    % (
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
                                        ) : (
                                            <span className="text-xs text-slate-500">
                                                결과 없음
                                            </span>
                                        )}
                                    </td>

                                    {/* 관리 */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onEdit(poll)}
                                                className="bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
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
                                                onClick={() =>
                                                    onDelete(poll.id)
                                                }
                                                className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* 빈 상태 */}
                {polls.length === 0 && (
                    <div className="text-center py-12">
                        <Vote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300 mb-2">
                            폴이 없습니다
                        </h3>
                        <p className="text-slate-400 text-sm">
                            새로운 폴을 생성해보세요.
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}
