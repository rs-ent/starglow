/// app/hooks/useUser.ts

"use client";

import {
    useGetUserByEmail,
    useSetUserWithTelegram,
} from "@/app/mutations/userMutations";

import { useUserQuery, useUsersQuery } from "../queries/userQueries";

import type { GetUserByEmailInput, GetUsersInput } from "@/app/actions/user";

export function useUserGet({
    getUserByEmailInput,
    getUsersInput,
}: {
    getUserByEmailInput?: GetUserByEmailInput;
    getUsersInput?: GetUsersInput;
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

    const isLoading = isUserLoading || isUsersLoading;
    const error = userError || usersError;

    return {
        users,
        isUsersLoading,
        usersError,

        user,
        isUserLoading,
        userError,

        isLoading,
        error,

        useUsersQuery,
        useUserQuery,
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
