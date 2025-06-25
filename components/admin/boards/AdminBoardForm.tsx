/// components/admin/boards/AdminBoardForm.tsx

"use client";

import { useState, useEffect } from "react";
import { Award, Users, Clock } from "lucide-react";

import { useBoards } from "@/app/actions/boards/hooks";
import type {
    BoardWithPosts,
    CreateBoardInput,
    UpdateBoardInput,
} from "@/app/actions/boards/actions";

import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BoardBasicSettings } from "./BoardBasicSettings";
import { BoardRewardSettings } from "./BoardRewardSettings";
import { BoardPermissionSettings } from "./BoardPermissionSettings";
import { BoardLimitSettings } from "./BoardLimitSettings";
import type { Artist, Asset } from "@prisma/client";

interface BoardFormData extends Omit<CreateBoardInput, "artistId"> {
    artistId: string;
}

interface AdminBoardFormProps {
    editingBoard: BoardWithPosts | null;
    onClose: () => void;
    onSuccess: () => void;
    assets: Asset[];
    artists: Artist[];
}

export function AdminBoardForm({
    editingBoard,
    onClose,
    onSuccess,
    assets,
    artists,
}: AdminBoardFormProps) {
    const {
        createBoard,
        updateBoard,
        isCreateBoardPending,
        isUpdateBoardPending,
    } = useBoards();

    // 기본 빈 폼 데이터
    const getDefaultFormData = (): BoardFormData => ({
        name: "",
        description: "",
        artistId: "none",
        isPublic: true,
        rules: "",
        order: 0,

        // 명시적 설정만 허용 - actions.ts와 동일
        postCreationRewardEnabled: false,
        postCreationRewardAmount: undefined,
        postCreationRewardAssetId: "default",

        popularPostRewardEnabled: false,
        popularPostThreshold: undefined,
        popularPostRewardAmount: undefined,
        popularPostRewardAssetId: "default",

        qualityContentRewardEnabled: false,
        qualityContentRewardAmount: undefined,
        qualityContentRewardAssetId: "default",

        // 권한도 명시적 설정만 허용 - actions.ts와 동일
        allowUserRewards: false,
        allowArtistRewards: false,
        allowTeamRewards: false,
        allowAdminRewards: false,

        dailyPostLimit: undefined,
        weeklyPostLimit: undefined,
        maxRewardPerPost: undefined,
    });

    const [formData, setFormData] = useState<BoardFormData>(getDefaultFormData);

    // editingBoard가 바뀔 때마다 formData 업데이트
    useEffect(() => {
        if (editingBoard) {
            setFormData({
                name: editingBoard.name,
                description: editingBoard.description || "",
                artistId: editingBoard.artistId || "none",
                isPublic: editingBoard.isPublic,
                rules: editingBoard.rules || "",
                order: editingBoard.order,

                postCreationRewardEnabled:
                    editingBoard.postCreationRewardEnabled ?? false,
                postCreationRewardAmount:
                    editingBoard.postCreationRewardAmount ?? undefined,
                postCreationRewardAssetId:
                    editingBoard.postCreationRewardAssetId || "default",

                popularPostRewardEnabled:
                    editingBoard.popularPostRewardEnabled ?? false,
                popularPostThreshold:
                    editingBoard.popularPostThreshold ?? undefined,
                popularPostRewardAmount:
                    editingBoard.popularPostRewardAmount ?? undefined,
                popularPostRewardAssetId:
                    editingBoard.popularPostRewardAssetId || "default",

                qualityContentRewardEnabled:
                    editingBoard.qualityContentRewardEnabled ?? false,
                qualityContentRewardAmount:
                    editingBoard.qualityContentRewardAmount ?? undefined,
                qualityContentRewardAssetId:
                    editingBoard.qualityContentRewardAssetId || "default",

                allowUserRewards: editingBoard.allowUserRewards ?? false,
                allowArtistRewards: editingBoard.allowArtistRewards ?? false,
                allowTeamRewards: editingBoard.allowTeamRewards ?? false,
                allowAdminRewards: editingBoard.allowAdminRewards ?? false,

                dailyPostLimit: editingBoard.dailyPostLimit || undefined,
                weeklyPostLimit: editingBoard.weeklyPostLimit || undefined,
                maxRewardPerPost: editingBoard.maxRewardPerPost || undefined,
            });
        } else {
            // 새 게시판 생성 모드일 때는 기본값으로 리셋
            setFormData(getDefaultFormData());
        }
    }, [editingBoard]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const input = {
                ...formData,
                artistId:
                    formData.artistId === "none"
                        ? undefined
                        : formData.artistId || undefined,
                postCreationRewardAssetId:
                    formData.postCreationRewardAssetId === "default"
                        ? undefined
                        : formData.postCreationRewardAssetId || undefined,
                popularPostRewardAssetId:
                    formData.popularPostRewardAssetId === "default"
                        ? undefined
                        : formData.popularPostRewardAssetId || undefined,
                qualityContentRewardAssetId:
                    formData.qualityContentRewardAssetId === "default"
                        ? undefined
                        : formData.qualityContentRewardAssetId || undefined,
            };

            if (editingBoard) {
                await updateBoard({
                    id: editingBoard.id,
                    ...input,
                } as UpdateBoardInput);
            } else {
                await createBoard(input as CreateBoardInput);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save board:", error);
        }
    };

    const isLoading = isCreateBoardPending || isUpdateBoardPending;

    return (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
            <DialogHeader>
                <DialogTitle className="text-white">
                    {editingBoard ? "게시판 수정" : "게시판 생성"}
                </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                        <TabsTrigger
                            value="basic"
                            className="text-white data-[state=active]:bg-gray-700"
                        >
                            기본 설정
                        </TabsTrigger>
                        <TabsTrigger
                            value="rewards"
                            className="text-white data-[state=active]:bg-gray-700"
                        >
                            <Award className="w-4 h-4 mr-1" />
                            보상 설정
                        </TabsTrigger>
                        <TabsTrigger
                            value="permissions"
                            className="text-white data-[state=active]:bg-gray-700"
                        >
                            <Users className="w-4 h-4 mr-1" />
                            권한 설정
                        </TabsTrigger>
                        <TabsTrigger
                            value="limits"
                            className="text-white data-[state=active]:bg-gray-700"
                        >
                            <Clock className="w-4 h-4 mr-1" />
                            제한 설정
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic">
                        <BoardBasicSettings
                            formData={formData}
                            setFormData={setFormData}
                            artists={artists}
                        />
                    </TabsContent>

                    <TabsContent value="rewards">
                        <BoardRewardSettings
                            formData={formData}
                            setFormData={setFormData}
                            assets={assets}
                        />
                    </TabsContent>

                    <TabsContent value="permissions">
                        <BoardPermissionSettings
                            formData={formData}
                            setFormData={setFormData}
                        />
                    </TabsContent>

                    <TabsContent value="limits">
                        <BoardLimitSettings
                            formData={formData}
                            setFormData={setFormData}
                        />
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="border-gray-600 text-white hover:bg-gray-700"
                        disabled={isLoading}
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "처리중..."
                            : editingBoard
                            ? "수정"
                            : "생성"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
