/// components/admin/boards/Admin.Boards.Contents.tsx

"use client";

import { useState } from "react";
import { Plus, TestTube, Settings } from "lucide-react";

import { useBoards } from "@/app/actions/boards/hooks";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useArtistsGet } from "@/app/hooks/useArtists";
import type { BoardWithPosts } from "@/app/actions/boards/actions";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdminBoardForm } from "./AdminBoardForm";
import { AdminBoardCard } from "./AdminBoardCard";
import AdminBoardsSandbox from "./Admin.Boards.Sandbox";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Modern header with gradient */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Board Management
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Manage community boards and test features
                    </p>
                </div>

                <Tabs defaultValue="management" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1">
                        <TabsTrigger
                            value="management"
                            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center gap-2 rounded-lg transition-all duration-200"
                        >
                            <Settings className="w-4 h-4" />
                            Board Management
                        </TabsTrigger>
                        <TabsTrigger
                            value="sandbox"
                            className="text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center gap-2 rounded-lg transition-all duration-200"
                        >
                            <TestTube className="w-4 h-4" />
                            Sandbox Testing
                        </TabsTrigger>
                    </TabsList>

                    {/* 보드 관리 탭 */}
                    <TabsContent value="management" className="space-y-6 mt-8">
                        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white mb-2">
                                        Board List
                                    </h2>
                                    <p className="text-slate-400">
                                        총 {boards.length}개의 게시판이 있습니다
                                    </p>
                                </div>

                                <Dialog
                                    open={dialogOpen}
                                    onOpenChange={setDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            onClick={() =>
                                                setEditingBoard(null)
                                            }
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Board
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
                        </div>

                        <div className="grid gap-6">
                            {boards.map((board) => (
                                <AdminBoardCard
                                    key={board.id}
                                    board={board}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    {/* 샌드박스 테스트 탭 */}
                    <TabsContent value="sandbox" className="mt-8">
                        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                            <AdminBoardsSandbox />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
