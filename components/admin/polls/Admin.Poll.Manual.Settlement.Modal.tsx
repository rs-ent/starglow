"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Trophy,
    Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    getPollForManualSettlement,
    manualSettlePoll,
} from "@/app/actions/polls";
import type { PollForManualSettlement } from "@/app/actions/polls";

interface ManualSettlementModalProps {
    pollId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ManualSettlementModal({
    pollId,
    isOpen,
    onClose,
    onSuccess,
}: ManualSettlementModalProps) {
    const [poll, setPoll] = useState<PollForManualSettlement | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [settling, setSettling] = useState(false);
    const [settlementResult, setSettlementResult] = useState<any>(null);

    const loadPoll = async () => {
        if (!pollId) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getPollForManualSettlement(pollId);
            if (data) {
                setPoll(data);
            } else {
                setError("폴을 찾을 수 없거나 정산할 수 없는 상태입니다.");
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "폴 정보를 불러오는데 실패했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOptionToggle = (optionId: string) => {
        setSelectedOptions((prev) => {
            if (prev.includes(optionId)) {
                return prev.filter((id) => id !== optionId);
            } else {
                return [...prev, optionId];
            }
        });
    };

    const handleSettle = async () => {
        if (!poll || selectedOptions.length === 0) return;

        setSettling(true);
        setError(null);

        try {
            const result = await manualSettlePoll({
                pollId: poll.id,
                winningOptionIds: selectedOptions,
            });

            setSettlementResult(result);

            if (result.success) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                setError(result.error || "정산에 실패했습니다.");
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "정산 중 오류가 발생했습니다."
            );
        } finally {
            setSettling(false);
        }
    };

    const calculatePayout = () => {
        if (!poll || selectedOptions.length === 0) return 0;

        const totalWinningBets = selectedOptions.reduce((sum, optionId) => {
            const option = poll.options.find(
                (opt) => opt.optionId === optionId
            );
            return sum + (option?.betAmount || 0);
        }, 0);

        if (totalWinningBets === 0) return poll.totalBetAmount;

        return poll.totalBetAmount - poll.totalCommission;
    };

    useEffect(() => {
        if (isOpen && pollId) {
            loadPoll();
            setSelectedOptions([]);
            setSettlementResult(null);
            setError(null);
        }
    }, [isOpen, pollId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-white">
                                수동 정산
                            </h2>
                            <Badge
                                variant="outline"
                                className="bg-orange-500/20 text-orange-300 border-orange-500/50"
                            >
                                Manual Settlement
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {loading && (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                            <p className="text-slate-400">
                                폴 정보를 불러오는 중...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 text-red-300">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium">오류</span>
                            </div>
                            <p className="text-red-200 mt-1">{error}</p>
                        </div>
                    )}

                    {settlementResult && settlementResult.success && (
                        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 text-green-300">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">정산 완료</span>
                            </div>
                            <p className="text-green-200 mt-1">
                                총 {settlementResult.totalWinners}명에게{" "}
                                {settlementResult.totalPayout?.toLocaleString() ||
                                    0}{" "}
                                BERA가 지급되었습니다.
                            </p>
                        </div>
                    )}

                    {poll && (
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {poll.title}
                                </h3>
                                {poll.description && (
                                    <p className="text-slate-300 mb-3">
                                        {poll.description}
                                    </p>
                                )}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-400">
                                            종료 시간
                                        </div>
                                        <div className="text-white">
                                            {poll.endDate.toLocaleString(
                                                "ko-KR"
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400">
                                            총 베팅 금액
                                        </div>
                                        <div className="text-white font-medium">
                                            {poll.totalBetAmount.toLocaleString()}{" "}
                                            BERA
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400">
                                            수수료
                                        </div>
                                        <div className="text-white">
                                            {poll.totalCommission.toLocaleString()}{" "}
                                            BERA
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                    승리 옵션 선택
                                </h4>
                                <div className="space-y-3">
                                    {poll.options.map((option) => (
                                        <Card
                                            key={option.optionId}
                                            className={`p-4 cursor-pointer transition-colors ${
                                                selectedOptions.includes(
                                                    option.optionId
                                                )
                                                    ? "bg-purple-500/20 border-purple-500/50"
                                                    : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70"
                                            }`}
                                            onClick={() =>
                                                handleOptionToggle(
                                                    option.optionId
                                                )
                                            }
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={selectedOptions.includes(
                                                            option.optionId
                                                        )}
                                                        onChange={() => {}}
                                                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                                    />
                                                    <div>
                                                        <h5 className="font-medium text-white">
                                                            {option.name}
                                                        </h5>
                                                        {option.description && (
                                                            <p className="text-sm text-slate-400">
                                                                {
                                                                    option.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div>
                                                            <div className="text-slate-400">
                                                                베팅액
                                                            </div>
                                                            <div className="text-white font-medium">
                                                                {option.betAmount.toLocaleString()}{" "}
                                                                BERA
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400">
                                                                참가자
                                                            </div>
                                                            <div className="text-white font-medium flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                {
                                                                    option.betCount
                                                                }
                                                                명
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {selectedOptions.length > 0 && (
                                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                                    <h5 className="font-medium text-blue-300 mb-2">
                                        정산 예상 결과
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-slate-400">
                                                선택된 승리 옵션
                                            </div>
                                            <div className="text-white">
                                                {selectedOptions.length}개
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400">
                                                예상 배당 풀
                                            </div>
                                            <div className="text-white font-medium">
                                                {calculatePayout().toLocaleString()}{" "}
                                                BERA
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                >
                                    취소
                                </Button>
                                <Button
                                    onClick={handleSettle}
                                    disabled={
                                        selectedOptions.length === 0 ||
                                        settling ||
                                        settlementResult?.success
                                    }
                                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50"
                                >
                                    {settling ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            정산 중...
                                        </>
                                    ) : settlementResult?.success ? (
                                        "정산 완료"
                                    ) : (
                                        `정산 실행 (${selectedOptions.length}개 옵션)`
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
