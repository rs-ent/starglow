/// components/admin/polls/Admin.Polls.List.tsx

"use client";

import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { usePollsResultsQuery } from "@/app/queries/pollsQueries";
import { Poll } from "@prisma/client";
import PollThumbnail from "@/components/atoms/Polls.Thumbnail";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PollCreateModal from "./Admin.Polls.CreateModal";
import { formatDate } from "@/lib/utils/format";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PollListProps {
    viewType: "table" | "card";
}

export default function AdminPollsList({ viewType }: PollListProps) {
    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 50,
    });
    const [editPoll, setEditPoll] = useState<Poll | null>(null);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const { pollsList, isLoading, error } = usePollsGet({
        pagination,
    });

    const { deletePoll } = usePollsSet();

    const polls = pollsList?.items;
    const pollIds = polls?.map((poll) => poll.id) || [];
    const totalItems = pollsList?.totalItems;
    const totalPages = pollsList?.totalPages;

    const { data: pollsResults } = usePollsResultsQuery({
        pollIds,
    });

    const resultsData = pollsResults?.results;
    console.log("resultsData", resultsData);

    const handleEditPoll = (poll: Poll) => {
        setEditPoll(poll);
        setOpen(true);
    };

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({
            ...prev,
            currentPage: page,
        }));
    };

    const handleDeletePoll = async (pollId: string) => {
        if (window.confirm("정말 삭제하시겠습니까?")) {
            await deletePoll(pollId);
            router.refresh();
        }
    };

    if (isLoading) return <div>로딩 중</div>;
    if (error) return <div>오류 발생: {error.message}</div>;

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
                                const result = resultsData?.find(
                                    (result) => result.pollId === poll.id
                                );
                                const pollResultData = result?.results?.map(
                                    (option) =>
                                        `${option.voteRate}% (${option.name})`
                                );
                                return (
                                    <tr
                                        key={poll.id}
                                        className="divide-x divide-[rgba(255,255,255,0.1)] h-[70px]"
                                    >
                                        <td className="px-2 py-2 align-middle">
                                            <div className="flex justify-center items-center w-[90px] h-[60px]">
                                                <PollThumbnail
                                                    poll={poll}
                                                    quality={100}
                                                    imageClassName="rounded-sm"
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
                                            {result?.totalVotes}
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
                                                    onClick={async () =>
                                                        handleDeletePoll(
                                                            poll.id
                                                        )
                                                    }
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

            {/* Pagination */}
            <div className="flex justify-center mt-4">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() =>
                                    handlePageChange(pagination.currentPage - 1)
                                }
                                className={
                                    pagination.currentPage === 1
                                        ? "pointer-events-none opacity-50"
                                        : ""
                                }
                            />
                        </PaginationItem>
                        {Array.from(
                            { length: totalPages || 0 },
                            (_, i) => i + 1
                        ).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    isActive={pagination.currentPage === page}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() =>
                                    handlePageChange(pagination.currentPage + 1)
                                }
                                className={
                                    pagination.currentPage === totalPages
                                        ? "pointer-events-none opacity-50"
                                        : ""
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
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
