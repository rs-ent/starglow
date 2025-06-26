"use client";

import { useState } from "react";
import AdminRafflesList from "./Admin.Raffles.List";
import AdminRafflesCreate from "./Admin.Raffles.Create";

import type { RaffleWithDetails } from "@/app/actions/raffles/actions";

interface AdminRafflesProps {
    onBack: () => void;
}

type ViewMode = "list" | "create" | "edit";

export default function AdminRaffles({ onBack }: AdminRafflesProps) {
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
