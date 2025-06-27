/// components/atoms/DateTimePicker.tsx

"use client";

import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/tailwind";

interface DateTimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label?: string;
    required?: boolean;
    error?: string;
    showTime?: boolean;
    className?: string;
    disabled?: boolean;
}

export default function DateTimePicker({
    value,
    onChange,
    label,
    required,
    error,
    showTime = true,
    className = "",
    disabled = false,
}: DateTimePickerProps) {
    // Date 객체를 datetime-local input 형식으로 변환
    const formatDateTimeLocal = (date: Date): string => {
        if (!date || isNaN(date.getTime())) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        if (showTime) {
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
            return `${year}-${month}-${day}`;
        }
    };

    // datetime-local input 값을 Date 객체로 변환
    const parseDateTimeLocal = (dateTimeString: string): Date => {
        if (!dateTimeString) {
            return new Date();
        }

        const date = new Date(dateTimeString);
        return isNaN(date.getTime()) ? new Date() : date;
    };

    const [inputValue, setInputValue] = useState<string>(
        formatDateTimeLocal(value)
    );

    useEffect(() => {
        if (value instanceof Date && !isNaN(value.getTime())) {
            setInputValue(formatDateTimeLocal(value));
        }
    }, [value, showTime]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        if (newValue) {
            const newDate = parseDateTimeLocal(newValue);
            onChange(newDate);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <Label className="block text-slate-200">
                    {label}
                    {required && <span className="text-red-400"> *</span>}
                </Label>
            )}
            <Input
                type={showTime ? "datetime-local" : "date"}
                value={inputValue}
                onChange={handleInputChange}
                disabled={disabled}
                className={cn(
                    "bg-slate-700/50 border-slate-600 text-white",
                    "focus:border-purple-500 focus:ring-purple-500/20",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            />
            {error && <div className="text-sm text-red-400">{error}</div>}
        </div>
    );
}
