/// components/admin/polls/Admin.Polls.List.tsx

"use client";

import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { usePollsResultsQuery } from "@/app/queries/pollsQueries";
import { Artist, Poll } from "@prisma/client";
import PollThumbnail from "@/components/atoms/Polls.Thumbnail";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils/tailwind";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useArtistsGet } from "@/app/hooks/useArtists";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/app/hooks/useToast";

interface PollListProps {
    viewType: "table" | "card";
}

export default function AdminPollsList({ viewType }: PollListProps) {
    const toast = useToast();
    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 50,
    });
    const [editPoll, setEditPoll] = useState<Poll | null>(null);
    const [open, setOpen] = useState(false);
    const [pollFilter, setPollFilter] = useState<{
        type: "world" | "exclusive";
        artistId: string;
    }>({
        type: "world",
        artistId: "",
    });

    const [artistPopoverOpen, setArtistPopoverOpen] = useState(false);
    const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
    const router = useRouter();

    const { pollsList, isLoading, error } = usePollsGet({
        pagination,
    });

    const {
        updateActivePoll,
        isLoading: isUpdatingActivePoll,
        error: updateActivePollError,
    } = usePollsSet();

    const {
        artists,
        isLoading: isLoadingArtists,
        error: errorArtists,
    } = useArtistsGet({});

    const { deletePoll } = usePollsSet();

    const polls = pollsList?.items;
    const pollIds = polls?.map((poll) => poll.id) || [];
    const totalPages = pollsList?.totalPages;

    const { data: pollsResults } = usePollsResultsQuery({
        pollIds,
    });

    const resultsData = pollsResults?.results;

    useEffect(() => {
        if (!polls) return;
        filteringPolls();
    }, [pollFilter, polls]);

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

    function filteringPolls() {
        const filtered = polls?.filter((poll) => {
            if (pollFilter.type === "world") {
                return !poll.artistId;
            } else if (pollFilter.type === "exclusive") {
                return poll.artistId === pollFilter.artistId;
            }
            return true;
        });

        setFilteredPolls(filtered ?? []);
    }

    const handleActiveChange = async (poll: Poll, checked: boolean) => {
        if (!poll) return;

        const result = await updateActivePoll({
            pollId: poll.id,
            isActive: checked,
        });

        if (result) {
            toast.success(`『${poll.title}』 투표가 활성화되었습니다.`);
        } else {
            toast.success(`『${poll.title}』 투표 비활성화되었습니다.`);
        }
    };

    return (
        <div>
            <div className="flex gap-2 mb-4">
                <div className="flex gap-2">
                    <Button
                        variant={
                            pollFilter.type === "world" ? "default" : "outline"
                        }
                        onClick={() => {
                            setPollFilter({
                                ...pollFilter,
                                type: "world",
                            });
                        }}
                    >
                        World
                    </Button>
                    <Button
                        variant={
                            pollFilter.type === "exclusive"
                                ? "default"
                                : "outline"
                        }
                        onClick={() => {
                            setPollFilter({
                                ...pollFilter,
                                type: "exclusive",
                            });
                        }}
                    >
                        Exclusive
                    </Button>
                </div>

                {pollFilter.type === "exclusive" &&
                    artists &&
                    artists.length > 0 && (
                        <div className="flex gap-2 mb-4">
                            <Popover
                                open={artistPopoverOpen}
                                onOpenChange={setArtistPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={artistPopoverOpen}
                                        className="w-[300px] justify-between"
                                    >
                                        {pollFilter.artistId
                                            ? artists.find(
                                                  (artist: Artist) =>
                                                      artist.id ===
                                                      pollFilter.artistId
                                              )?.name
                                            : "아티스트 선택..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="아티스트 검색..." />
                                        <CommandEmpty>
                                            아티스트를 찾을 수 없습니다.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {artists.map((artist: Artist) => (
                                                <CommandItem
                                                    key={artist.id}
                                                    value={artist.name}
                                                    onSelect={() => {
                                                        setPollFilter({
                                                            ...pollFilter,
                                                            artistId: artist.id,
                                                        });
                                                        setArtistPopoverOpen(
                                                            false
                                                        );
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            pollFilter.artistId ===
                                                                artist.id
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {artist.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
            </div>
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
                                    활성화
                                </th>
                                <th className="px-4 py-2 align-middle">
                                    총 투표 수
                                </th>
                                <th className="px-4 py-2 align-middle">
                                    고유 투표자 수
                                </th>
                                <th className="px-4 py-2 align-middle">결과</th>
                                <th className="px-4 py-2 align-middle">기능</th>
                            </tr>
                        </thead>
                        <tbody className="align-middle divide-y text-sm divide-[rgba(255,255,255,0.2)]">
                            {filteredPolls?.map((poll) => {
                                const result = resultsData?.find(
                                    (result) => result.pollId === poll.id
                                );
                                const pollResultData = result?.results?.map(
                                    (option) =>
                                        `${option.voteRate.toFixed(2)}% (${
                                            option.name
                                        })`
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
                                            <Switch
                                                checked={poll.isActive}
                                                onCheckedChange={() =>
                                                    handleActiveChange(
                                                        poll,
                                                        !poll.isActive
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {result?.totalVotes.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            {poll.uniqueVoters.toLocaleString()}
                                            명
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
                initialData={editPoll}
                mode={editPoll ? "edit" : "create"}
            />
        </div>
    );
}
