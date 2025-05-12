/// app/hooks/useUser.ts

"use client";

import { GetUserByEmailInput } from "@/app/actions/user";
import {
    useGetUserByEmail,
    useSetUserWithTelegram,
} from "@/app/mutations/userMutations";
import { useUserQuery } from "../queries/userQueries";

export function useUserGet({
    getUserByEmailInput,
}: {
    getUserByEmailInput?: GetUserByEmailInput;
}) {
    const {
        data: user,
        isLoading: isUserLoading,
        error: userError,
    } = useUserQuery({ getUserByEmailInput });

    const isLoading = isUserLoading;
    const error = userError;

    return {
        user,
        isUserLoading,
        userError,

        isLoading,
        error,

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
