/// components/admin/polls/Admin.Polls.List.tsx

"use client";

import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { getYoutubeVideoId, getYoutubeThumbnailUrl } from "@/lib/utils/youtube";
import { Poll } from "@prisma/client";
import PollThumbnail from "@/components/atoms/PollThumbnail";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
async function getThumbnail(poll: Poll) {
    if (poll.imgUrl) return poll.imgUrl;
    if (poll.youtubeUrl) {
        const videoId = getYoutubeVideoId(poll.youtubeUrl);
        if (videoId) {
            return await getYoutubeThumbnailUrl(videoId);
        }
    }
    return null;
}
import PollCreateModal from "./Admin.Polls.CreateModal";
import { formatDate } from "@/lib/utils/format";

interface PollListProps {
    viewType: "table" | "card";
}

export default function AdminPollsList({ viewType }: PollListProps) {
    const { polls, isLoading, error } = usePollsGet({});
    const { deletePoll } = usePollsSet();
    const [editPoll, setEditPoll] = useState<Poll | null>(null);
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const handleEditPoll = (poll: Poll) => {
        setEditPoll(poll);
        setOpen(true);
    };

    if (isLoading) return <div>로딩 중</div>;
    if (error) return <div>오류 발생: {error.message}</div>;

    console.log(polls);

    return (
        <div>
            {viewType === "table" ? (
                <div className="overflow-x-auto">
                    <table className="bg-card min-w-full border border-[rgba(255,255,255,0.2)] text-center">
                        <thead>
                            <tr className="bg-secondary text-accent-foreground divide-x divide-[rgba(255,255,255,0.1)]">
                                <th className="px-2 py-2 align-middle">
                                    썸네일
                                </th>
                                <th className="px-4 py-2 align-middle">ID</th>
                                <th className="px-4 py-2 align-middle">제목</th>
                                <th className="px-4 py-2 align-middle">
                                    카테고리
                                </th>
                                <th className="px-4 py-2 align-middle">
                                    시작일
                                </th>
                                <th className="px-4 py-2 align-middle">
                                    종료일
                                </th>
                                <th className="px-4 py-2 align-middle">
                                    총 투표 수
                                </th>
                                <th className="px-4 py-2 align-middle">결과</th>
                                <th className="px-4 py-2 align-middle">기능</th>
                            </tr>
                        </thead>
                        <tbody className="align-middle divide-y text-sm divide-[rgba(255,255,255,0.2)]">
                            {polls?.map((poll) => {
                                const pollResult = PollResult({ poll });
                                const pollResultData = pollResult?.results.map(
                                    (option) =>
                                        `${option.voteRate}% (${option.name})`
                                );
                                return (
                                    <tr
                                        key={poll.id}
                                        className="divide-x divide-[rgba(255,255,255,0.1)] h-[100px]"
                                    >
                                        <td className="px-2 py-2 align-middle">
                                            <div className="flex justify-center items-center h-full w-full">
                                                <PollThumbnail
                                                    poll={poll}
                                                    width={100}
                                                    height={50}
                                                    quality={100}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {poll.id}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {poll.title}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {poll.category}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {formatDate(poll.startDate)}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {formatDate(poll.endDate)}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {pollResult?.totalVotes}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {pollResultData?.join(" : ")}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            <div className="flex gap-2 items-center justify-center h-full">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleEditPoll(poll)
                                                    }
                                                >
                                                    수정
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={async () => {
                                                        if (
                                                            window.confirm(
                                                                "정말 삭제하시겠습니까?"
                                                            )
                                                        ) {
                                                            await deletePoll(
                                                                poll.id
                                                            );
                                                            router.refresh();
                                                        }
                                                    }}
                                                >
                                                    삭제
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div>카드 뷰</div>
            )}
            <PollCreateModal
                open={open}
                onClose={() => setOpen(false)}
                initialData={
                    editPoll ? mapPollToInitialData(editPoll) : undefined
                }
                mode={editPoll ? "edit" : "create"}
            />
        </div>
    );
}

function mapPollToInitialData(poll: Poll | null) {
    if (!poll) return undefined;
    let options: any[] = [];
    if (Array.isArray(poll.options)) {
        options = poll.options.map((opt: any) =>
            typeof opt === "string" ? JSON.parse(opt) : opt
        );
    } else if (typeof poll.options === "string") {
        options = JSON.parse(poll.options);
    }
    return {
        ...poll,
        titleShorten: poll.titleShorten ?? undefined,
        description: poll.description ?? undefined,
        imgUrl: poll.imgUrl ?? undefined,
        youtubeUrl: poll.youtubeUrl ?? undefined,
        needTokenAddress: poll.needTokenAddress ?? undefined,
        minimumPoints: poll.minimumPoints ?? undefined,
        minimumSGP: poll.minimumSGP ?? undefined,
        minimumSGT: poll.minimumSGT ?? undefined,
        participationRewards: poll.participationRewards ?? undefined,
        options,
    };
}

function PollResult({ poll }: { poll: Poll }) {
    const {
        pollResult,
        isLoading: isLoadingPollResult,
        error: errorPollResult,
    } = usePollsGet({
        pollResultInput: {
            pollId: poll.id,
        },
    });

    console.log(pollResult);
    return pollResult;
}
