/// app/mutations/userMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getUserByEmail, setUserWithTelegram } from "@/app/actions/user";

import { queryKeys } from "../queryKeys";

export const useGetUserByEmail = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: getUserByEmail,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.user.byEmail(variables?.email || ""),
            });
        },
    });
};

export const useSetUserWithTelegram = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: setUserWithTelegram,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.user.byTelegramId(
                    variables?.user?.id.toString() || ""
                ),
            });
        },
    });
};
