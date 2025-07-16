/// app/hooks/useUser.ts

"use client";

import {
    useGetUserByEmail,
    useSetUserWithTelegram,
} from "@/app/mutations/userMutations";

import {
    useUserQuery,
    useUsersQuery,
    useUserProviderQuery,
} from "../queries/userQueries";

import type {
    GetUserByEmailInput,
    GetUsersInput,
    getUserProviderInput,
} from "@/app/actions/user";

export function useUserGet({
    getUserByEmailInput,
    getUsersInput,
    getUserProviderInput,
}: {
    getUserByEmailInput?: GetUserByEmailInput;
    getUsersInput?: GetUsersInput;
    getUserProviderInput?: getUserProviderInput;
}) {
    const {
        data: users,
        isLoading: isUsersLoading,
        error: usersError,
    } = useUsersQuery({ getUsersInput });

    const {
        data: user,
        isLoading: isUserLoading,
        error: userError,
    } = useUserQuery({ getUserByEmailInput });

    const {
        data: provider,
        isLoading: isProviderLoading,
        error: providerError,
    } = useUserProviderQuery({
        getUserProviderInput,
    });

    const isLoading = isUserLoading || isUsersLoading || isProviderLoading;
    const error = userError || usersError || providerError;

    return {
        users,
        isUsersLoading,
        usersError,

        user,
        isUserLoading,
        userError,

        provider,
        isProviderLoading,
        providerError,

        isLoading,
        error,

        useUsersQuery,
        useUserQuery,
        useUserProviderQuery,
    };
}

export function useUserSet() {
    const {
        mutateAsync: getUserByEmail,
        isPending: isGetUserByEmailPending,
        error: getUserByEmailError,
    } = useGetUserByEmail();

    const {
        mutateAsync: setUserWithTelegram,
        isPending: isSetUserWithTelegramPending,
        error: setUserWithTelegramError,
    } = useSetUserWithTelegram();

    const isLoading = isGetUserByEmailPending || isSetUserWithTelegramPending;
    const error = getUserByEmailError || setUserWithTelegramError;

    return {
        getUserByEmail,
        isGetUserByEmailPending,
        getUserByEmailError,

        setUserWithTelegram,
        isSetUserWithTelegramPending,
        setUserWithTelegramError,

        isLoading,
        error,

        useGetUserByEmail,
        useSetUserWithTelegram,
    };
}
