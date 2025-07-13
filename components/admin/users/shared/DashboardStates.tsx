"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Database } from "lucide-react";

interface DashboardLoadingProps {
    cardCount?: number;
    title?: string;
}

export function DashboardLoading({
    cardCount = 4,
    title,
}: DashboardLoadingProps) {
    return (
        <div className="space-y-6">
            {title && (
                <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-400">
                        {title} 로딩 중...
                    </span>
                </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(cardCount)].map((_, i) => (
                    <Card
                        key={i}
                        className="bg-slate-900 border-slate-700 animate-pulse"
                    >
                        <CardHeader className="space-y-0 pb-2">
                            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
    return (
        <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="h-4 bg-slate-700 rounded animate-pulse"
                            ></div>
                        ))}
                    </div>
                    {[...Array(rows)].map((_, i) => (
                        <div key={i} className="grid grid-cols-6 gap-4">
                            {[...Array(6)].map((_, j) => (
                                <div
                                    key={j}
                                    className="h-8 bg-slate-800 rounded animate-pulse"
                                ></div>
                            ))}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function ChartLoading({ height = "h-64" }: { height?: string }) {
    return (
        <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
                <div className="h-4 bg-slate-700 rounded w-1/3 animate-pulse"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
                <div
                    className={`${height} bg-slate-800 rounded animate-pulse`}
                ></div>
            </CardContent>
        </Card>
    );
}

interface DashboardErrorProps {
    title?: string;
    message?: string;
    error?: Error;
}

export function DashboardError({
    title = "데이터 로딩 오류",
    message = "데이터를 불러오는 중 오류가 발생했습니다.",
    error,
}: DashboardErrorProps) {
    return (
        <Alert className="bg-red-950 border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-200">{title}</AlertTitle>
            <AlertDescription className="text-red-300">
                {message}
                {error && (
                    <details className="mt-2 text-xs">
                        <summary className="cursor-pointer hover:text-red-200">
                            기술적 세부사항 보기
                        </summary>
                        <pre className="mt-1 p-2 bg-red-900 rounded text-red-200 overflow-auto">
                            {error.message}
                        </pre>
                    </details>
                )}
            </AlertDescription>
        </Alert>
    );
}

export function ConnectionError({ onRetry }: { onRetry?: () => void }) {
    return (
        <Alert className="bg-yellow-950 border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertTitle className="text-yellow-200">연결 오류</AlertTitle>
            <AlertDescription className="text-yellow-300">
                서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="ml-2 text-yellow-200 underline hover:text-yellow-100"
                    >
                        다시 시도
                    </button>
                )}
            </AlertDescription>
        </Alert>
    );
}

interface EmptyStateProps {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    action?: React.ReactNode;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    action,
}: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <Icon className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">{title}</h3>
            <p className="text-sm text-slate-400 mb-4">{description}</p>
            {action && action}
        </div>
    );
}

export function NoDataState({
    message = "표시할 데이터가 없습니다.",
}: {
    message?: string;
}) {
    return (
        <div className="text-center py-8">
            <Database className="h-8 w-8 mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">{message}</p>
        </div>
    );
}

export function formatNumber(value: number): string {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + "K";
    }
    return value.toString();
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
    }).format(value);
}

export function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case "active":
        case "완료":
        case "성공":
            return "text-emerald-400";
        case "pending":
        case "대기":
        case "진행중":
            return "text-yellow-400";
        case "inactive":
        case "실패":
        case "오류":
            return "text-red-400";
        default:
            return "text-slate-400";
    }
}

export function getRiskColor(level: string): string {
    switch (level.toLowerCase()) {
        case "high":
        case "높음":
            return "text-red-400";
        case "medium":
        case "보통":
            return "text-yellow-400";
        case "low":
        case "낮음":
            return "text-emerald-400";
        default:
            return "text-slate-400";
    }
}
