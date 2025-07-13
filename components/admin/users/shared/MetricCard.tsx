"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    badge?: {
        text: string;
        variant?: "default" | "secondary" | "destructive" | "outline";
    };
    progress?: {
        value: number;
        max?: number;
    };
    className?: string;
}

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    badge,
    progress,
    className = "",
}: MetricCardProps) {
    return (
        <Card className={`bg-slate-900 border-slate-700 ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-slate-200">
                    {title}
                </CardTitle>
                <div className="flex items-center gap-2">
                    {badge && (
                        <Badge
                            variant={badge.variant || "default"}
                            className="text-xs bg-slate-800 text-slate-200 border-slate-600"
                        >
                            {badge.text}
                        </Badge>
                    )}
                    <Icon className="h-4 w-4 text-slate-400" />
                </div>
            </CardHeader>

            <CardContent>
                <div className="text-2xl font-bold text-white">
                    {typeof value === "number" ? value.toLocaleString() : value}
                </div>

                {description && (
                    <p className="text-xs text-slate-400 mt-1">{description}</p>
                )}

                {trend && (
                    <div className="flex items-center gap-1 mt-2">
                        <TrendingUp
                            className={`h-3 w-3 ${
                                trend.isPositive
                                    ? "text-emerald-400"
                                    : "text-red-400"
                            }`}
                        />
                        <span
                            className={`text-xs ${
                                trend.isPositive
                                    ? "text-emerald-400"
                                    : "text-red-400"
                            }`}
                        >
                            {trend.isPositive ? "+" : ""}
                            {trend.value}%
                        </span>
                    </div>
                )}

                {progress && (
                    <div className="mt-3">
                        <Progress
                            value={
                                progress.max
                                    ? (progress.value / progress.max) * 100
                                    : progress.value
                            }
                            className="h-1.5 bg-slate-800"
                        />
                        {progress.max && (
                            <p className="text-xs text-slate-400 mt-1">
                                {progress.value.toLocaleString()} /{" "}
                                {progress.max.toLocaleString()}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function DataCard({
    title,
    value,
    subtitle,
    icon: Icon,
    className = "",
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    className?: string;
}) {
    return (
        <Card className={`bg-slate-900 border-slate-700 ${className}`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-200">
                            {title}
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {typeof value === "number"
                                ? value.toLocaleString()
                                : value}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-slate-400">{subtitle}</p>
                        )}
                    </div>
                    <Icon className="h-5 w-5 text-slate-400" />
                </div>
            </CardContent>
        </Card>
    );
}

export function StatCard({
    label,
    value,
    change,
    changeLabel,
    className = "",
}: {
    label: string;
    value: string | number;
    change?: {
        value: number;
        isPositive: boolean;
        label?: string;
    };
    changeLabel?: string;
    className?: string;
}) {
    return (
        <div
            className={`p-4 rounded-lg bg-slate-800 border border-slate-700 ${className}`}
        >
            <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xl font-bold text-white">
                    {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                {change && (
                    <div className="flex items-center gap-1">
                        <TrendingUp
                            className={`h-3 w-3 ${
                                change.isPositive
                                    ? "text-emerald-400"
                                    : "text-red-400"
                            }`}
                        />
                        <span
                            className={`text-xs ${
                                change.isPositive
                                    ? "text-emerald-400"
                                    : "text-red-400"
                            }`}
                        >
                            {change.isPositive ? "+" : ""}
                            {change.value}%
                        </span>
                        {changeLabel && (
                            <span className="text-xs text-slate-400">
                                {changeLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ChartCard({
    title,
    description,
    children,
    className = "",
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Card className={`bg-slate-900 border-slate-700 ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-white">
                    {title}
                </CardTitle>
                {description && (
                    <p className="text-sm text-slate-400">{description}</p>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
