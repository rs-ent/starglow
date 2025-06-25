/// components/admin/boards/BoardBasicSettings.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BoardBasicSettingsProps {
    formData: any;
    setFormData: (data: any) => void;
    artists: any[];
}

export function BoardBasicSettings({
    formData,
    setFormData,
    artists,
}: BoardBasicSettingsProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name" className="text-white">
                        게시판 이름 *
                    </Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                name: e.target.value,
                            })
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="order" className="text-white">
                        정렬 순서
                    </Label>
                    <Input
                        id="order"
                        type="number"
                        value={formData.order}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                order: parseInt(e.target.value) || 0,
                            })
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="description" className="text-white">
                    설명
                </Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            description: e.target.value,
                        })
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                />
            </div>

            <div>
                <Label htmlFor="artist" className="text-white">
                    아티스트 (선택)
                </Label>
                <Select
                    value={formData.artistId}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            artistId: value,
                        })
                    }
                >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="아티스트 선택 (전체 게시판의 경우 비워두기)" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="none">전체 게시판</SelectItem>
                        {artists.map((artist) => (
                            <SelectItem
                                key={artist.id}
                                value={artist.id}
                                className="text-white"
                            >
                                {artist.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                        setFormData({
                            ...formData,
                            isPublic: checked,
                        })
                    }
                />
                <Label htmlFor="isPublic" className="text-white">
                    공개 게시판
                </Label>
            </div>

            <div>
                <Label htmlFor="rules" className="text-white">
                    게시판 규칙
                </Label>
                <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            rules: e.target.value,
                        })
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="게시판 이용 규칙을 입력하세요"
                />
            </div>
        </div>
    );
}
