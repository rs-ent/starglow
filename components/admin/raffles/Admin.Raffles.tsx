"use client";

import { useState } from "react";
import AdminRafflesList from "./Admin.Raffles.List";
import AdminRafflesCreate from "./Admin.Raffles.Create";
import { Button } from "@/components/ui/button";

import type { RaffleWithDetails } from "@/app/actions/raffles/actions";

type RaffleMode = "web2" | "web3";
type ViewMode = "list" | "create" | "edit";

interface AdminRafflesProps {
    onBack: () => void;
    raffleMode: RaffleMode;
}

export default function AdminRaffles({
    onBack,
    raffleMode,
}: AdminRafflesProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [editingRaffle, setEditingRaffle] =
        useState<RaffleWithDetails | null>(null);

    const handleBackToList = () => {
        setViewMode("list");
        setEditingRaffle(null);
    };

    const handleCreateNew = () => {
        setEditingRaffle(null);
        setViewMode("create");
    };

    const handleEdit = (raffle: RaffleWithDetails) => {
        setEditingRaffle(raffle);
        setViewMode("edit");
    };

    if (raffleMode === "web3") {
        return (
            <div className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-4">
                    Web3 Raffles (Coming Soon)
                </h3>
                <p className="text-muted-foreground mb-4">
                    Web3 래플 기능이 곧 출시됩니다.
                </p>
                <Button variant="outline" onClick={onBack}>
                    ← Back
                </Button>
            </div>
        );
    }

    if (viewMode === "list") {
        return (
            <AdminRafflesList
                onBack={onBack}
                onEdit={handleEdit}
                onCreateNew={handleCreateNew}
            />
        );
    }

    if (viewMode === "create" || viewMode === "edit") {
        return (
            <AdminRafflesCreate
                onBack={handleBackToList}
                editData={editingRaffle}
            />
        );
    }

    return null;
}
