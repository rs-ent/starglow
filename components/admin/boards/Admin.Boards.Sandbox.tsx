/// components/admin/boards/Admin.Boards.Sandbox.tsx

"use client";

import React, { useState } from "react";
import { MessageSquare, TestTube } from "lucide-react";
import { useBoards } from "@/app/actions/boards/hooks";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import AdminBoardsSandboxBoard from "./Admin.Boards.Sandbox.Board";

export default function AdminBoardsSandbox() {
    const [selectedBoardId, setSelectedBoardId] = useState<string>("");

    const { boardsData, isBoardsLoading } = useBoards({
        getBoardsInput: {
            isPublic: true,
            isActive: true,
        },
    });

    const selectedBoard = boardsData?.boards?.find(
        (board) => board.id === selectedBoardId
    );

    return (
        <div className="space-y-8 p-6">
            {/* Modern Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            Boards Sandbox
                        </h1>
                    </div>
                    <p className="text-slate-400">
                        Test board functionality and create posts as admin
                    </p>
                </div>

                <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-purple-300 border-purple-500/30 px-4 py-2"
                >
                    <TestTube className="w-4 h-4 mr-2" />
                    Admin Testing Mode
                </Badge>
            </div>

            {/* Board Selection */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Select Board
                        </h2>
                        <p className="text-slate-400">
                            Choose a board to test posting and community
                            features
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Select
                                value={selectedBoardId}
                                onValueChange={setSelectedBoardId}
                            >
                                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white h-12 rounded-xl">
                                    <SelectValue
                                        placeholder="Choose a board to test..."
                                        className="text-slate-300"
                                    />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {isBoardsLoading ? (
                                        <SelectItem value="loading" disabled>
                                            Loading boards...
                                        </SelectItem>
                                    ) : boardsData?.boards?.length === 0 ? (
                                        <SelectItem value="empty" disabled>
                                            No boards available
                                        </SelectItem>
                                    ) : (
                                        boardsData?.boards?.map((board) => (
                                            <SelectItem
                                                key={board.id}
                                                value={board.id}
                                                className="text-white hover:bg-slate-700"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {board.iconUrl && (
                                                        <img
                                                            src={board.iconUrl}
                                                            alt={board.name}
                                                            className="w-4 h-4 rounded"
                                                        />
                                                    )}
                                                    <span>{board.name}</span>
                                                    {board.artist && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs bg-blue-500/20 text-blue-300"
                                                        >
                                                            {board.artist.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedBoard && (
                            <div className="text-sm text-slate-400 bg-slate-700/50 px-4 py-2 rounded-lg">
                                Selected:{" "}
                                <span className="text-white font-medium">
                                    {selectedBoard.name}
                                </span>
                                {selectedBoard.artist && (
                                    <span className="ml-2 text-slate-500">
                                        ({selectedBoard.artist.name})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Board Content */}
            {selectedBoard ? (
                <div className="min-h-[600px]">
                    <AdminBoardsSandboxBoard board={selectedBoard} />
                </div>
            ) : selectedBoardId && !selectedBoard ? (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading board content...</p>
                </div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                        Select a board to start testing
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Choose a board from the dropdown above to test posting,
                        commenting, and other community features.
                    </p>
                </div>
            )}
        </div>
    );
}
