/// components/admin/polls/Admin.Poll.Create.Basic.tsx

"use client";

import React from "react";
import { Settings } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Section } from "./shared-components";
import { POLL_FORM_VALIDATION, type PollFormProps } from "./types";

export function BasicInfoTab({ formData, onChange }: PollFormProps) {
    return (
        <Section title="기본 정보" icon={<Settings className="w-5 h-5" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <Label className="mb-2 block text-slate-200">ID</Label>
                    <Input
                        value={formData.id || ""}
                        onChange={(e) => onChange("id", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white"
                    />
                </div>
                <div>
                    <Label className="mb-2 block text-slate-200">
                        제목 <span className="text-red-400">*</span>
                    </Label>
                    <Input
                        value={formData.title || ""}
                        onChange={(e) => onChange("title", e.target.value)}
                        maxLength={POLL_FORM_VALIDATION.MAX_TITLE_LENGTH}
                        placeholder="제목을 입력하세요"
                        className="bg-slate-700/50 border-slate-600 text-white"
                    />
                </div>
                <div>
                    <Label className="mb-2 block text-slate-200">
                        짧은 제목
                    </Label>
                    <Input
                        value={formData.titleShorten || ""}
                        onChange={(e) =>
                            onChange("titleShorten", e.target.value)
                        }
                        maxLength={POLL_FORM_VALIDATION.MAX_SHORT_TITLE_LENGTH}
                        placeholder="짧은 제목을 입력하세요"
                        className="bg-slate-700/50 border-slate-600 text-white"
                    />
                </div>
                <div>
                    <Label className="mb-2 block text-slate-200">설명</Label>
                    <Textarea
                        value={formData.description || ""}
                        onChange={(e) =>
                            onChange("description", e.target.value)
                        }
                        maxLength={POLL_FORM_VALIDATION.MAX_DESCRIPTION_LENGTH}
                        placeholder="설명을 입력하세요"
                        className="bg-slate-700/50 border-slate-600 text-white"
                    />
                </div>
            </div>
        </Section>
    );
}
