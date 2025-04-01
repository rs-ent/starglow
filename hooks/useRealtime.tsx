/// hooks/useRealtime.tsx

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
    RealtimeChannel,
    RealtimePostgresInsertPayload,
    RealtimePostgresUpdatePayload,
    RealtimePostgresDeletePayload,
} from "@supabase/supabase-js";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseRealtimeProps {
    table: string;
    event: RealtimeEvent;
    rowId?: string;
    onDataChange: (newData: any) => void;
}

export const useRealtime = ({
    table,
    event,
    rowId,
    onDataChange,
}: UseRealtimeProps) => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );

    useEffect(() => {
        const channel: RealtimeChannel = supabase.channel(
            `realtime-${event}-${table}-${rowId || "all"}`
        );

        const filter = rowId ? `id=eq.${rowId}` : undefined;

        if (event === "INSERT") {
            channel.on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table, filter },
                (payload: RealtimePostgresInsertPayload<any>) => {
                    onDataChange(payload.new);
                    console.log(`[Realtime][INSERT][${table}]`, payload.new);
                }
            );
        } else if (event === "UPDATE") {
            channel.on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table, filter },
                (payload: RealtimePostgresUpdatePayload<any>) => {
                    onDataChange(payload.new);
                    console.log(`[Realtime][UPDATE][${table}]`, payload.new);
                }
            );
        } else if (event === "DELETE") {
            channel.on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table, filter },
                (payload: RealtimePostgresDeletePayload<any>) => {
                    onDataChange(payload.old);
                    console.log(`[Realtime][DELETE][${table}]`, payload.old);
                }
            );
        }

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, event, rowId, onDataChange, supabase]);
};
