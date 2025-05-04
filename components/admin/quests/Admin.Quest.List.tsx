/// components/admin/quests/Admin.Quest.List.tsx

"use client";

import { useQuestGet } from "@/app/hooks/useQuest";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { Quest, Artist, Asset } from "@prisma/client";
import { useState } from "react";
import AdminQuestCreate from "./Admin.Quest.Create";

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

    const [showCreate, setShowCreate] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

    const handleEdit = (quest: Quest) => {
        setSelectedQuest(quest);
        setShowCreate(true);
    };

    const handleCreate = () => {
        setSelectedQuest(null);
        setShowCreate(true);
    };

    if (isLoading) return <div>로딩 중</div>;
    if (error) return <div>오류 발생: {error.message}</div>;

    console.log(quests);

    return (
        <div className="overflow-x-auto">
            <div className="flex justify-end mb-4">
                <Button onClick={() => setShowCreate(true)}>퀘스트 생성</Button>
            </div>

            {showCreate && (
                <AdminQuestCreate
                    onClose={() => setShowCreate(false)}
                    mode={selectedQuest ? "edit" : "create"}
                    open={showCreate}
                    initialData={selectedQuest}
                />
            )}
            <table className="bg-card min-w-full border border-[rgba(255,255,255,0.2)] text-center">
                <thead>
                    <tr className="bg-secondary text-accent-foreground divide-x divide-[rgba(255,255,255,0.1)]">
                        <th className="px-2 py-2">아이콘</th>
                        <th className="px-4 py-2">제목</th>
                        <th className="px-4 py-2">아티스트</th>
                        <th className="px-4 py-2">보상</th>
                        <th className="px-4 py-2">반복</th>
                        <th className="px-4 py-2">시작일</th>
                        <th className="px-4 py-2">종료일</th>
                        <th className="px-4 py-2">기능</th>
                    </tr>
                </thead>
                <tbody className="align-middle divide-y text-sm divide-[rgba(255,255,255,0.2)]">
                    {quests?.items?.map((quest) => (
                        <tr
                            key={quest.id}
                            className="divide-x divide-[rgba(255,255,255,0.1)] h-[50px]"
                        >
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
                            <td className="px-4 py-2">
                                {quest.artist?.name || "-"}
                            </td>
                            <td className="px-4 py-2">
                                {quest.rewardAmount}{" "}
                                {quest.rewardAsset?.symbol || ""}
                            </td>
                            <td className="px-4 py-2">
                                {quest.repeatable
                                    ? `O (${quest.repeatableCount ?? "무제한"})`
                                    : "X"}
                            </td>
                            <td className="px-4 py-2">
                                {quest.startDate
                                    ? formatDate(quest.startDate)
                                    : "-"}
                            </td>
                            <td className="px-4 py-2">
                                {quest.endDate
                                    ? formatDate(quest.endDate)
                                    : "-"}
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
                                    <Button size="sm" variant="destructive">
                                        삭제
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
