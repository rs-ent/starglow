/// app/queries/userQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { getUserByEmail, getUsers, getUserProvider } from "../actions/user";
import { queryKeys } from "../queryKeys";

import type {
    GetUserByEmailInput,
    getUserProviderInput,
    GetUsersInput,
} from "../actions/user";

export function useUsersQuery({
    getUsersInput,
}: {
    getUsersInput?: GetUsersInput;
}) {
    return useQuery({
        queryKey: queryKeys.user.list(getUsersInput),
        queryFn: () => getUsers(getUsersInput),
        enabled: !!getUsersInput,
    });
}

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

export function useUserProviderQuery({
    getUserProviderInput,
}: {
    getUserProviderInput?: getUserProviderInput;
}) {
    return useQuery({
        queryKey: queryKeys.user.provider(getUserProviderInput?.userId || ""),
        queryFn: () => getUserProvider(getUserProviderInput),
        enabled: !!getUserProviderInput?.userId,
        staleTime: 1000 * 60 * 60 * 24 * 30 * 365, // 1 year
        gcTime: 1000 * 60 * 60 * 24 * 30 * 365, // 1 year
    });
}
