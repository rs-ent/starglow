/// components/admin/quests/Admin.Quest.List.tsx

"use client";

import { useState, useMemo, useEffect } from "react";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Check, ChevronsUpDown, GripVertical } from "lucide-react";

import { useArtistsGet } from "@/app/hooks/useArtists";
import { useQuestGet, useQuestSet } from "@/app/hooks/useQuest";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/tailwind";

import AdminQuestCreate from "./Admin.Quest.Create";

import type { Quest, Artist, Asset } from "@prisma/client";

type QuestWithRelations = Quest & {
    artist?: Artist | null;
    rewardAsset?: Asset | null;
};

export default function AdminQuestList() {
    const { quests, isLoading, error } = useQuestGet({}) as {
        quests: { items: QuestWithRelations[] };
        isLoading: boolean;
        error: Error | null;
    };

    const { artists } = useArtistsGet({});

    const { deleteQuest, updateQuestOrder, updateQuestActive } = useQuestSet();

    const toast = useToast();

    const [open, setOpen] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [showOrderChange, setShowOrderChange] = useState(false);
    const registeredTypes = useMemo(() => {
        if (!quests) return [];

        return [
            ...new Set(
                quests.items
                    .filter(
                        (
                            quest
                        ): quest is QuestWithRelations & { type: string } =>
                            quest.type !== null && quest.type !== undefined
                    )
                    .map((quest) => quest.type)
            ),
        ];
    }, [quests]);

    const [filteredQuests, setFilteredQuests] = useState<QuestWithRelations[]>(
        quests?.items ?? []
    );

    const [questFilter, setQuestFilter] = useState({
        type: "world",
        artistId: "",
    });

    function filteringQuests() {
        const filtered = quests.items.filter((quest) => {
            if (questFilter.type === "world") {
                return !quest.artistId;
            } else if (questFilter.type === "exclusive") {
                return quest.artistId === questFilter.artistId;
            }
            return true;
        });

        setFilteredQuests(filtered);
    }

    useEffect(() => {
        if (!quests) return;
        filteringQuests();
    }, [questFilter, quests, filteringQuests]);

    const handleEdit = (quest: Quest) => {
        setSelectedQuest(quest);
        setShowCreate(true);
    };

    const handleDelete = async (quest: Quest) => {
        const confirm = window.confirm(
            `『${quest.title}』\n퀘스트를 삭제하시겠습니까?`
        );
        if (confirm) {
            const result = await deleteQuest({ id: quest.id });
            if (result) {
                toast.success(`『${quest.title}』 퀘스트를 삭제했습니다.`);
            } else {
                toast.error(`『${quest.title}』 퀘스트 삭제에 실패했습니다.`);
            }
        }
    };

    const handleCreateModalClose = () => {
        setSelectedQuest(null);
        setShowCreate(false);
    };

    const handleOrderChange = async () => {
        const result = await updateQuestOrder({
            quests: filteredQuests.map((quest) => ({
                id: quest.id,
                order: quest.order ?? 0,
            })),
        });
        if (result) {
            toast.success("퀘스트 순서 변경 사항을 저장했습니다.");
            setShowOrderChange(false);
        } else {
            toast.error("퀘스트 순서 변경 사항을 저장하는데 실패했습니다.");
        }
    };

    const handleActiveChange = async (quest: Quest) => {
        const result = await updateQuestActive({
            questId: quest.id,
            isActive: !quest.isActive,
        });

        if (result) {
            toast.success(`『${quest.title}』 퀘스트가 활성화되었습니다.`);
        } else {
            toast.success(`『${quest.title}』 퀘스트 비활성화되었습니다.`);
        }
    };

    if (isLoading) return <div>로딩 중</div>;
    if (error) return <div>오류 발생: {error.message}</div>;

    function SortableQuestRow({ quest }: { quest: QuestWithRelations }) {
        const { attributes, listeners, setNodeRef, transform, transition } =
            useSortable({ id: quest.id });

        const style = {
            transform: transform
                ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
                : undefined,
            transition,
        };

        return (
            <tr
                ref={setNodeRef}
                style={style}
                className="divide-x divide-[rgba(255,255,255,0.1)] h-[50px]"
            >
                {showOrderChange && (
                    <td className="px-1 py-1">
                        <button
                            className="cursor-grab p-1 hover:bg-accent rounded"
                            {...attributes}
                            {...listeners}
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                    </td>
                )}
                <td className="px-2 py-2 flex justify-center items-center">
                    {quest.icon ? (
                        <img
                            src={quest.icon}
                            alt={quest.title}
                            className="w-[30px] h-[30px] object-contain rounded"
                        />
                    ) : (
                        <div className="w-[30px] h-[30px] bg-muted rounded" />
                    )}
                </td>
                <td className="px-4 py-2">{quest.title}</td>
                <td className="px-4 py-2">{quest.artist?.name || "-"}</td>
                <td className="px-4 py-2">
                    {quest.rewardAmount} {quest.rewardAsset?.symbol || ""}
                </td>
                <td className="px-4 py-2">
                    {quest.repeatable
                        ? `O (${quest.repeatableCount ?? "무제한"})`
                        : "X"}
                </td>
                <td className="px-4 py-2">
                    {quest.startDate ? formatDate(quest.startDate) : "-"}
                </td>
                <td className="px-4 py-2">
                    {quest.endDate ? formatDate(quest.endDate) : "-"}
                </td>
                <td className="px-4 py-2">
                    <Switch
                        checked={quest.isActive}
                        onCheckedChange={() => handleActiveChange(quest)}
                    />
                </td>
                <td className="px-4 py-2">
                    <div className="flex gap-2 justify-center">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                handleEdit(quest);
                            }}
                        >
                            수정
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(quest)}
                        >
                            삭제
                        </Button>
                    </div>
                </td>
            </tr>
        );
    }

    function TableView() {
        const sensors = useSensors(
            useSensor(PointerSensor),
            useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
            })
        );

        const handleDragEnd = (event: any) => {
            const { active, over } = event;

            if (active.id !== over.id) {
                setFilteredQuests((items) => {
                    const oldIndex = items.findIndex(
                        (item) => item.id === active.id
                    );
                    const newIndex = items.findIndex(
                        (item) => item.id === over.id
                    );

                    return arrayMove(items, oldIndex, newIndex).map(
                        (quest, index) => ({
                            ...quest,
                            order: index * 10,
                        })
                    );
                });
            }
        };

        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <table className="bg-card min-w-full border border-[rgba(255,255,255,0.2)] text-center">
                    <thead>
                        <tr className="bg-secondary text-accent-foreground divide-x divide-[rgba(255,255,255,0.1)]">
                            {showOrderChange && <th className="px-2 py-2"></th>}
                            <th className="px-2 py-2">아이콘</th>
                            <th className="px-4 py-2">제목</th>
                            <th className="px-4 py-2">아티스트</th>
                            <th className="px-4 py-2">보상</th>
                            <th className="px-4 py-2">반복</th>
                            <th className="px-4 py-2">시작일</th>
                            <th className="px-4 py-2">종료일</th>
                            <th className="px-4 py-2">활성화</th>
                            <th className="px-4 py-2">기능</th>
                        </tr>
                    </thead>
                    <tbody className="align-middle divide-y text-sm divide-[rgba(255,255,255,0.2)]">
                        <SortableContext
                            items={filteredQuests.map((quest) => quest.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {filteredQuests?.map((quest) => (
                                <SortableQuestRow
                                    key={quest.id}
                                    quest={quest}
                                />
                            ))}
                        </SortableContext>
                    </tbody>
                </table>
            </DndContext>
        );
    }

    return (
        <div className="overflow-x-auto">
            {showCreate && (
                <AdminQuestCreate
                    onClose={handleCreateModalClose}
                    mode={selectedQuest ? "edit" : "create"}
                    open={showCreate}
                    initialData={selectedQuest}
                    registeredTypes={registeredTypes}
                />
            )}

            <div className="flex gap-2 mb-4 justify-between">
                <div className="flex gap-2">
                    <Button
                        variant={
                            questFilter.type === "world" ? "default" : "outline"
                        }
                        onClick={() => {
                            setQuestFilter({
                                ...questFilter,
                                type: "world",
                            });
                        }}
                    >
                        World
                    </Button>
                    <Button
                        variant={
                            questFilter.type === "exclusive"
                                ? "default"
                                : "outline"
                        }
                        onClick={() => {
                            setQuestFilter({
                                ...questFilter,
                                type: "exclusive",
                            });
                        }}
                    >
                        Exclusive
                    </Button>
                </div>
                <div className="flex gap-2">
                    {showOrderChange && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowOrderChange(false);
                                filteringQuests();
                            }}
                        >
                            순서 변경 취소
                        </Button>
                    )}
                    <Button
                        variant={showOrderChange ? "default" : "outline"}
                        onClick={() => {
                            if (showOrderChange) {
                                handleOrderChange().catch((err) => {
                                    console.error(err);
                                });
                            } else {
                                setShowOrderChange(true);
                            }
                        }}
                    >
                        {showOrderChange
                            ? "순서 변경 사항 저장"
                            : "퀘스트 순서 변경하기"}
                    </Button>
                    <Button onClick={() => setShowCreate(true)}>
                        퀘스트 생성
                    </Button>
                </div>
            </div>

            {questFilter.type === "exclusive" &&
                artists &&
                artists.length > 0 && (
                    <div className="flex gap-2 mb-4">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-[300px] justify-between"
                                >
                                    {questFilter.artistId
                                        ? artists.find(
                                              (artist: Artist) =>
                                                  artist.id ===
                                                  questFilter.artistId
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
                                                    setQuestFilter({
                                                        ...questFilter,
                                                        artistId: artist.id,
                                                    });
                                                    setOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        questFilter.artistId ===
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

            <TableView />
        </div>
    );
}
