/// components/admin/boards/BoardPermissionSettings.tsx

"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface BoardPermissionSettingsProps {
    formData: any;
    setFormData: (data: any) => void;
}

export function BoardPermissionSettings({
    formData,
    setFormData,
}: BoardPermissionSettingsProps) {
    return (
        <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-600">
                <CardHeader>
                    <CardTitle className="text-white">보상 지급 권한</CardTitle>
                    <CardDescription className="text-gray-400">
                        누가 이 게시판에서 보상을 지급할 수 있는지 설정합니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.allowUserRewards}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        allowUserRewards: checked,
                                    })
                                }
                            />
                            <Label className="text-white">일반 사용자</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.allowArtistRewards}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        allowArtistRewards: checked,
                                    })
                                }
                            />
                            <Label className="text-white">아티스트</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.allowTeamRewards}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        allowTeamRewards: checked,
                                    })
                                }
                            />
                            <Label className="text-white">팀 멤버</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.allowAdminRewards}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        allowAdminRewards: checked,
                                    })
                                }
                            />
                            <Label className="text-white">관리자</Label>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-700 rounded-md">
                        <p className="text-sm text-gray-300">
                            <strong>권한 설명:</strong>
                        </p>
                        <ul className="text-sm text-gray-400 mt-2 space-y-1">
                            <li>
                                • <strong>일반 사용자:</strong> 모든 사용자가
                                수동 보상을 줄 수 있습니다
                            </li>
                            <li>
                                • <strong>아티스트:</strong> 해당 아티스트
                                계정이 보상을 줄 수 있습니다
                            </li>
                            <li>
                                • <strong>팀 멤버:</strong> 아티스트 팀 멤버가
                                보상을 줄 수 있습니다
                            </li>
                            <li>
                                • <strong>관리자:</strong> 플랫폼 관리자가
                                보상을 줄 수 있습니다
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
