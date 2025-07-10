/// components/admin/boards/Admin.Boards.Sandbox.tsx

"use client";

import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useBoards } from "@/app/actions/boards/hooks";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6" />
                        Boards Sandbox
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Test board functionality and create posts as admin
                    </p>
                </div>

                <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                >
                    Admin Testing Mode
                </Badge>
            </div>

            {/* Board Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Board</CardTitle>
                    <CardDescription>
                        Choose a board to test posting and community features
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Select
                                value={selectedBoardId}
                                onValueChange={setSelectedBoardId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a board to test..." />
                                </SelectTrigger>
                                <SelectContent>
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
                                                            className="text-xs"
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
                            <div className="text-sm text-gray-600">
                                Selected: <strong>{selectedBoard.name}</strong>
                                {selectedBoard.artist && (
                                    <span className="ml-2">
                                        ({selectedBoard.artist.name})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Board Content */}
            {selectedBoard ? (
                <div className="min-h-[600px]">
                    <AdminBoardsSandboxBoard board={selectedBoard} />
                </div>
            ) : selectedBoardId && !selectedBoard ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="text-gray-500">
                            Loading board content...
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Select a board to start testing
                        </h3>
                        <p className="text-gray-500">
                            Choose a board from the dropdown above to test
                            posting, commenting, and other community features.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
