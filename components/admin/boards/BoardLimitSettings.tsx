/// components/admin/boards/BoardLimitSettings.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface BoardLimitSettingsProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function BoardLimitSettings({
    formData,
    setFormData,
}: BoardLimitSettingsProps) {
    return (
        <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-600">
                <CardHeader>
                    <CardTitle className="text-white">
                        게시글 보상 제한 설정
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        게시글 작성 보상의 일일/주간 한도를 설정합니다. 게시글
                        작성 자체는 제한되지 않습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="text-white">
                                일일 게시글 작성 보상 제한
                            </Label>
                            <Input
                                type="number"
                                value={formData.dailyPostLimit || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        dailyPostLimit: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="제한 없음"
                            />
                        </div>

                        <div>
                            <Label className="text-white">
                                주간 게시글 작성 보상 제한
                            </Label>
                            <Input
                                type="number"
                                value={formData.weeklyPostLimit || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        weeklyPostLimit: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="제한 없음"
                            />
                        </div>

                        <div>
                            <Label className="text-white">
                                게시글당 최대 보상
                            </Label>
                            <Input
                                type="number"
                                value={formData.maxRewardPerPost || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        maxRewardPerPost: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="제한 없음"
                            />
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-700 rounded-md">
                        <p className="text-sm text-gray-300">
                            <strong>보상 제한 설정 가이드:</strong>
                        </p>
                        <ul className="text-sm text-gray-400 mt-2 space-y-1">
                            <li>
                                • <strong>일일 게시글 작성 보상 제한:</strong>{" "}
                                사용자당 하루에 받을 수 있는 게시글 작성 보상
                                횟수
                            </li>
                            <li>
                                • <strong>주간 게시글 작성 보상 제한:</strong>{" "}
                                사용자당 일주일에 받을 수 있는 게시글 작성 보상
                                횟수
                            </li>
                            <li>
                                • <strong>게시글당 최대 보상:</strong> 하나의
                                게시글에 대해 지급할 수 있는 최대 보상량
                            </li>
                            <li>
                                • <strong>중요:</strong> 게시글 작성 자체는
                                제한되지 않으며, 보상만 제한됩니다
                            </li>
                            <li>• 빈 값으로 두면 제한이 없습니다</li>
                        </ul>
                    </div>

                    <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600/30 rounded-md">
                        <p className="text-sm text-blue-300">
                            <strong>💡 예시:</strong>
                        </p>
                        <ul className="text-sm text-blue-200 mt-2 space-y-1">
                            <li>
                                • 일일 보상 제한 1: 하루에 게시글 10개 작성
                                가능, 보상은 1번만 지급
                            </li>
                            <li>
                                • 일일 보상 제한 2: 하루에 게시글 5개 작성 가능,
                                보상은 2번만 지급
                            </li>
                            <li>
                                • 제한 초과 시: 게시글 작성은 가능하지만 보상은
                                지급되지 않음
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
