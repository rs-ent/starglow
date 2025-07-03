/// components/admin/polls/Admin.Poll.Create.Betting.tsx

"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Section } from "./shared-components";
import { POLL_FORM_VALIDATION, type PollFormProps } from "./types";

export function BettingTab({ formData, onChange, assets }: PollFormProps) {
    return (
        <Section
            title="베팅 설정"
            icon={<BarChart3 className="w-5 h-5" />}
            bgColor="bg-gradient-to-br from-orange-900/30 to-yellow-900/30"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <Label className="mb-2 block text-orange-200">
                        베팅 에셋 <span className="text-red-400">*</span>
                    </Label>
                    <Select
                        value={formData.bettingAssetId || ""}
                        onValueChange={(value) =>
                            onChange("bettingAssetId", value)
                        }
                    >
                        <SelectTrigger className="bg-slate-700/50 border-orange-600/50 text-white">
                            <SelectValue placeholder="베팅에 사용할 에셋을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {assets?.assets?.map((asset: any) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                    <div className="flex items-center gap-2">
                                        {asset.iconUrl && (
                                            <Image
                                                src={asset.iconUrl}
                                                alt={asset.name}
                                                width={20}
                                                height={20}
                                            />
                                        )}
                                        <span>
                                            {asset.name} ({asset.symbol})
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="mb-2 block text-orange-200">
                        수수료율 (%)
                    </Label>
                    <Input
                        type="number"
                        value={
                            (formData.houseCommissionRate ||
                                POLL_FORM_VALIDATION.DEFAULT_COMMISSION_RATE) * 100
                        }
                        onChange={(e) => {
                            const value = Number(e.target.value) / 100;
                            onChange("houseCommissionRate", value);
                        }}
                        min={0}
                        max={50}
                        step={0.1}
                        placeholder="5.0"
                        className="bg-slate-700/50 border-orange-600/50 text-white"
                    />
                </div>
                <div>
                    <Label className="mb-2 block text-orange-200">
                        최소 베팅 금액
                    </Label>
                    <Input
                        type="number"
                        value={formData.minimumBet || ""}
                        onChange={(e) =>
                            onChange("minimumBet", Number(e.target.value))
                        }
                        min={1}
                        placeholder="1000"
                        className="bg-slate-700/50 border-orange-600/50 text-white"
                    />
                </div>
                <div>
                    <Label className="mb-2 block text-orange-200">
                        최대 베팅 금액
                    </Label>
                    <Input
                        type="number"
                        value={formData.maximumBet || ""}
                        onChange={(e) =>
                            onChange("maximumBet", Number(e.target.value))
                        }
                        min={formData.minimumBet || 1}
                        placeholder="10000"
                        className="bg-slate-700/50 border-orange-600/50 text-white"
                    />
                </div>
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 rounded-lg border border-orange-600/30">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-400">💰</span>
                    <span className="font-semibold text-orange-200">
                        베팅 모드 안내
                    </span>
                </div>
                <div className="text-sm text-orange-300/80">
                    • 사용자들이 선택지에 베팅할 수 있습니다
                    <br />
                    • 폴 종료 후 관리자가 수동으로 정답을 설정하고 정산해야 합니다
                    <br />• 승리자들은 베팅 풀을 나누어 배당을 받습니다
                </div>
            </div>
        </Section>
    );
} 