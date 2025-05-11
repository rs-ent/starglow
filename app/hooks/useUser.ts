/// app/hooks/useUser.ts

"use client";

import { GetUserByEmailInput } from "@/app/actions/user";
import { useGetUserByEmail } from "@/app/mutations/userMutations";
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

export function useUserSet({
    getUserByEmailInput,
}: {
    getUserByEmailInput?: GetUserByEmailInput;
}) {
    const { mutateAsync: getUserByEmail } = useGetUserByEmail();

    return {
        getUserByEmail,
    };
}
