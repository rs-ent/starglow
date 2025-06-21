/// components/atoms/DateTimePicker.tsx

"use client";

import { useState, useEffect } from "react";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import Popover from "@/components/atoms/Popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/tailwind";

interface DateTimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label?: string;
    required?: boolean;
    error?: string;
    showTime?: boolean;
    dateFormat?: string;
    timeFormat?: string;
    className?: string;
    disabled?: boolean;
    align?: "start" | "center" | "end";
    side?: "top" | "bottom" | "left" | "right";
}

export default function DateTimePicker({
    value,
    onChange,
    label,
    required,
    error,
    showTime = true,
    dateFormat = "PPP",
    timeFormat = "HH:mm",
    className = "",
    disabled = false,
    align = "start",
    side = "bottom",
}: DateTimePickerProps) {
    const initialDate =
        value instanceof Date && !isNaN(value.getTime())
            ? new Date(value.getTime())
            : new Date();

    const [date, setDate] = useState<Date>(initialDate);
    const [timeString, setTimeString] = useState<string>(
        format(initialDate, timeFormat)
    );

    useEffect(() => {
        if (value instanceof Date && !isNaN(value.getTime())) {
            setDate(new Date(value));
            setTimeString(format(value, timeFormat));
        }
    }, [value, timeFormat]);

    const handleDateChange = (newDate: Date | undefined) => {
        if (newDate) {
            const updatedDate = new Date(newDate);
            if (showTime) {
                updatedDate.setHours(date.getHours());
                updatedDate.setMinutes(date.getMinutes());
            }
            setDate(updatedDate);
            onChange(updatedDate);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!showTime) return;

        setTimeString(e.target.value);

        const timeValue = e.target.value;
        const [hours, minutes] = timeValue.split(":");

        if (
            hours &&
            minutes &&
            !isNaN(Number(hours)) &&
            !isNaN(Number(minutes))
        ) {
            const updatedDate = new Date(date);
            updatedDate.setHours(Number(hours));
            updatedDate.setMinutes(Number(minutes));
            onChange(updatedDate);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="block font-semibold">
                    {label}{" "}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="space-y-2 overflow-visible">
                <Popover
                    trigger={
                        <Button
                            type="button"
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={disabled}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(
                                date,
                                `${dateFormat}${showTime ? " HH:mm" : ""}`,
                                { locale: ko }
                            )}
                        </Button>
                    }
                    className="w-auto p-0"
                    align={align}
                    side={side}
                >
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateChange}
                        className="rounded-md"
                        classNames={{
                            day_today: "border border-blue-500",
                        }}
                    />

                    {showTime && (
                        <Input
                            type="time"
                            value={timeString}
                            onChange={handleTimeChange}
                            className="w-full mt-1 rounded-none"
                            disabled={disabled}
                        />
                    )}
                </Popover>
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
    );
}
