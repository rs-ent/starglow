/// components\admin\data-migrations\Admin.DataMigrations.tsx

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/tailwind";

import AdminDataMigrationsPlayer from "./Admin.DataMigrations.Player";

export default function AdminDataMigrations() {
    const [selectedMigration, setSelectedMigration] = useState<string | null>(
        null
    );

    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mt-10">Data Migrations</h1>
            <div
                className={cn(
                    "flex flex-row items-center justify-center gap-4 my-4"
                )}
            >
                <Button
                    onClick={() => setSelectedMigration("player")}
                    variant={
                        selectedMigration === "player" ? "default" : "outline"
                    }
                >
                    Player Data
                </Button>
            </div>
            <div className="w-full p-6 bg-card rounded-md">
                {selectedMigration === "player" && (
                    <AdminDataMigrationsPlayer />
                )}
            </div>
        </div>
    );
}
