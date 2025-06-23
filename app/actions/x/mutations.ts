/// app/actions/x/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tweetKeys, playerAssetsKeys } from "@/app/queryKeys";

import {
    validateRegisterXAuthor,
    checkIsActiveXAuthor,
    confirmRegisterXAuthor,
    disconnectXAccount,
    giveGlowingReward,
} from "./actions";

export function useValidateRegisterXAuthorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: validateRegisterXAuthor,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: tweetKeys.validateRegisterXAuthor(
                        variables || {}
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useCheckIsActiveXAuthorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: checkIsActiveXAuthor,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: tweetKeys.checkIsActiveXAuthor(variables || {}),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useConfirmRegisterXAuthorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: confirmRegisterXAuthor,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: tweetKeys.confirmRegisterXAuthor(variables || {}),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: tweetKeys.authorByPlayerId(
                        variables?.playerId || ""
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDisconnectXAccountMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: disconnectXAccount,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: tweetKeys.authorByPlayerId(
                        variables?.playerId || ""
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useGiveGlowingRewardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: giveGlowingReward,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: tweetKeys.authorByPlayerId(
                        variables?.playerId || ""
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.balances(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
