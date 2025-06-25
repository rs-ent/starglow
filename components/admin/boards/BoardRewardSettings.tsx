/// components/admin/boards/BoardRewardSettings.tsx

"use client";

import { Award } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface BoardRewardSettingsProps {
    formData: any;
    setFormData: (data: any) => void;
    assets: any[];
}

export function BoardRewardSettings({
    formData,
    setFormData,
    assets,
}: BoardRewardSettingsProps) {
    return (
        <div className="space-y-6">
            {/* 게시글 작성 보상 */}
            <Card className="bg-gray-800 border-gray-600">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        게시글 작성 보상
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        사용자가 게시글을 작성했을 때 지급할 보상을 설정합니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.postCreationRewardEnabled}
                            onCheckedChange={(checked) =>
                                setFormData({
                                    ...formData,
                                    postCreationRewardEnabled: checked,
                                })
                            }
                        />
                        <Label className="text-white">
                            게시글 작성 보상 활성화
                        </Label>
                    </div>

                    {formData.postCreationRewardEnabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-white">보상 수량</Label>
                                <Input
                                    type="number"
                                    value={
                                        formData.postCreationRewardAmount || ""
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            postCreationRewardAmount: e.target
                                                .value
                                                ? parseInt(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    className="bg-gray-700 border-gray-600 text-white"
                                    placeholder="보상 수량을 입력하세요"
                                />
                            </div>

                            <div>
                                <Label className="text-white">보상 에셋</Label>
                                <Select
                                    value={formData.postCreationRewardAssetId}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            postCreationRewardAssetId: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                        <SelectValue placeholder="기본 에셋 사용" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600">
                                        <SelectItem value="default">
                                            기본 에셋
                                        </SelectItem>
                                        {assets.map((asset) => (
                                            <SelectItem
                                                key={asset.id}
                                                value={asset.id}
                                                className="text-white"
                                            >
                                                {asset.name} ({asset.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 인기 게시글 보상 */}
            <Card className="bg-gray-800 border-gray-600">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        🔥 인기 게시글 보상
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        게시글이 일정 추천 수에 도달했을 때 지급할 보상을
                        설정합니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.popularPostRewardEnabled}
                            onCheckedChange={(checked) =>
                                setFormData({
                                    ...formData,
                                    popularPostRewardEnabled: checked,
                                })
                            }
                        />
                        <Label className="text-white">
                            인기 게시글 보상 활성화
                        </Label>
                    </div>

                    {formData.popularPostRewardEnabled && (
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-white">
                                    추천 임계점
                                </Label>
                                <Input
                                    type="number"
                                    value={formData.popularPostThreshold || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            popularPostThreshold: e.target.value
                                                ? parseInt(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    className="bg-gray-700 border-gray-600 text-white"
                                    placeholder="추천 수를 입력하세요"
                                />
                            </div>

                            <div>
                                <Label className="text-white">보상 수량</Label>
                                <Input
                                    type="number"
                                    value={
                                        formData.popularPostRewardAmount || ""
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            popularPostRewardAmount: e.target
                                                .value
                                                ? parseInt(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    className="bg-gray-700 border-gray-600 text-white"
                                    placeholder="보상 수량을 입력하세요"
                                />
                            </div>

                            <div>
                                <Label className="text-white">보상 에셋</Label>
                                <Select
                                    value={formData.popularPostRewardAssetId}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            popularPostRewardAssetId: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                        <SelectValue placeholder="기본 에셋 사용" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600">
                                        <SelectItem value="default">
                                            기본 에셋
                                        </SelectItem>
                                        {assets.map((asset) => (
                                            <SelectItem
                                                key={asset.id}
                                                value={asset.id}
                                                className="text-white"
                                            >
                                                {asset.name} ({asset.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 품질 높은 콘텐츠 보상 */}
            <Card className="bg-gray-800 border-gray-600">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        ⭐ 품질 높은 콘텐츠 보상
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        관리자가 수동으로 지급하는 품질 높은 콘텐츠 보상을
                        설정합니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.qualityContentRewardEnabled}
                            onCheckedChange={(checked) =>
                                setFormData({
                                    ...formData,
                                    qualityContentRewardEnabled: checked,
                                })
                            }
                        />
                        <Label className="text-white">
                            품질 콘텐츠 보상 활성화
                        </Label>
                    </div>

                    {formData.qualityContentRewardEnabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-white">
                                    기본 보상 수량
                                </Label>
                                <Input
                                    type="number"
                                    value={
                                        formData.qualityContentRewardAmount ||
                                        ""
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            qualityContentRewardAmount: e.target
                                                .value
                                                ? parseInt(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    className="bg-gray-700 border-gray-600 text-white"
                                    placeholder="보상 수량을 입력하세요"
                                />
                            </div>

                            <div>
                                <Label className="text-white">보상 에셋</Label>
                                <Select
                                    value={formData.qualityContentRewardAssetId}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            qualityContentRewardAssetId: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                        <SelectValue placeholder="기본 에셋 사용" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600">
                                        <SelectItem value="default">
                                            없음
                                        </SelectItem>
                                        {assets.map((asset) => (
                                            <SelectItem
                                                key={asset.id}
                                                value={asset.id}
                                                className="text-white"
                                            >
                                                {asset.name} ({asset.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
