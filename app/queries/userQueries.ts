/// app/queries/userQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { getUserByEmail, GetUserByEmailInput } from "../actions/user";

export function useUserQuery({
    getUserByEmailInput,
}: {
    getUserByEmailInput?: GetUserByEmailInput;
}) {
    return useQuery({
        queryKey: queryKeys.user.byEmail(getUserByEmailInput?.email || ""),
        queryFn: () => getUserByEmail(getUserByEmailInput),
        enabled: !!getUserByEmailInput?.email,
        staleTime: 1000 * 60 * 60 * 24 * 30 * 365, // 1 year
        gcTime: 1000 * 60 * 60 * 24 * 30 * 365, // 1 year
    });
}
