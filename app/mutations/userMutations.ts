/// app/mutations/userMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getUserByEmail, setUserWithTelegram } from "@/app/actions/user";

import { queryKeys } from "../queryKeys";

export const useGetUserByEmail = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: getUserByEmail,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.user.byEmail(variables?.email || ""),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
};

export const useSetUserWithTelegram = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: setUserWithTelegram,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.user.byTelegramId(
                        variables?.user?.id.toString() || ""
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
};
