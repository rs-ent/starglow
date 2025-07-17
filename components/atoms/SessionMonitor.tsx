"use client";

import { useSessionRecovery } from "@/app/hooks/useSessionRecovery";

export default function SessionMonitor() {
    useSessionRecovery();
    
    return null;
} 