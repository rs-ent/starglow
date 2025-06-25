/// components/admin/boards/AdminBoardCard.tsx

"use client";

import { Edit, Trash2 } from "lucide-react";

import type { BoardWithPosts } from "@/app/actions/boards/actions";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface AdminBoardCardProps {
    board: BoardWithPosts;
    onEdit: (board: BoardWithPosts) => void;
    onDelete: (boardId: string) => void;
}

export function AdminBoardCard({
    board,
    onEdit,
    onDelete,
}: AdminBoardCardProps) {
    const handleDelete = () => {
        if (confirm("정말로 이 게시판을 삭제하시겠습니까?")) {
            onDelete(board.id);
        }
    };

    return (
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-white flex items-center">
                            {board.name}
                            {!board.isPublic && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-600 text-white rounded">
                                    비공개
                                </span>
                            )}
                            {board.artist && (
                                <span className="ml-2 px-2 py-1 text-xs bg-purple-600 text-white rounded">
                                    {board.artist.name}
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            {board.description || "설명이 없습니다"}
                        </CardDescription>
                    </div>

                    <div className="flex space-x-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(board)}
                            className="border-gray-600 text-white hover:bg-gray-700"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-400">게시글 수:</span>
                        <span className="ml-1 text-white">
                            {board.posts.length}
                        </span>
                    </div>

                    <div>
                        <span className="text-gray-400">게시글 보상:</span>
                        <span className="ml-1 text-white">
                            {board.postCreationRewardEnabled
                                ? board.postCreationRewardAmount
                                    ? `${board.postCreationRewardAmount}포인트`
                                    : "설정 필요"
                                : "비활성화"}
                        </span>
                    </div>

                    <div>
                        <span className="text-gray-400">인기글 보상:</span>
                        <span className="ml-1 text-white">
                            {board.popularPostRewardEnabled
                                ? board.popularPostThreshold &&
                                  board.popularPostRewardAmount
                                    ? `추천 ${board.popularPostThreshold}개시 ${board.popularPostRewardAmount}포인트`
                                    : "설정 필요"
                                : "비활성화"}
                        </span>
                    </div>

                    <div>
                        <span className="text-gray-400">정렬 순서:</span>
                        <span className="ml-1 text-white">{board.order}</span>
                    </div>
                </div>

                {board.rules && (
                    <div className="mt-4 p-3 bg-gray-700 rounded text-sm">
                        <span className="text-gray-400">규칙:</span>
                        <p className="text-white mt-1">{board.rules}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
