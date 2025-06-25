/// components/admin/boards/Admin.Boards.Contents.tsx

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { useBoards } from "@/app/actions/boards/hooks";
import { useAssetsGet } from "@/app/hooks/useAssets";
import { useArtistsGet } from "@/app/hooks/useArtists";
import type { BoardWithPosts } from "@/app/actions/boards/actions";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import { AdminBoardForm } from "./AdminBoardForm";
import { AdminBoardCard } from "./AdminBoardCard";

export function AdminBoardsContents() {
    const { boardsData, isBoardsLoading, refetchBoards, deleteBoard } =
        useBoards();

    const { assets } = useAssetsGet({
        getAssetsInput: {
            isActive: true,
        },
    });
    const { artists } = useArtistsGet({
        getArtistsInput: {},
    });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBoard, setEditingBoard] = useState<BoardWithPosts | null>(
        null
    );

    const handleEdit = (board: BoardWithPosts) => {
        setEditingBoard(board);
        setDialogOpen(true);
    };

    const handleDelete = async (boardId: string) => {
        try {
            await deleteBoard(boardId);
            refetchBoards().catch((error) => {
                console.error("Failed to refetch boards:", error);
            });
        } catch (error) {
            console.error("Failed to delete board:", error);
        }
    };

    const handleClose = () => {
        setDialogOpen(false);
        setEditingBoard(null);
    };

    const handleSuccess = () => {
        refetchBoards().catch((error) => {
            console.error("Failed to refetch boards:", error);
        });
    };

    if (isBoardsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    const boards = boardsData?.boards || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">
                        게시판 목록
                    </h2>
                    <p className="text-gray-400">
                        총 {boards.length}개의 게시판
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => setEditingBoard(null)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            게시판 생성
                        </Button>
                    </DialogTrigger>

                    <AdminBoardForm
                        editingBoard={editingBoard}
                        onClose={handleClose}
                        onSuccess={handleSuccess}
                        assets={assets?.assets || []}
                        artists={artists || []}
                    />
                </Dialog>
            </div>

            <div className="grid gap-4">
                {boards.map((board) => (
                    <AdminBoardCard
                        key={board.id}
                        board={board}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}
