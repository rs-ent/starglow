/// app/actions/x/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tweetKeys } from "@/app/queryKeys";
import {
    validateRegisterXAuthor,
    checkIsActiveXAuthor,
    confirmRegisterXAuthor,
} from "./actions";

export function useValidateRegisterXAuthorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: validateRegisterXAuthor,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: tweetKeys.validateRegisterXAuthor(variables || {}),
            });
        },
    });
}

export function useCheckIsActiveXAuthorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: checkIsActiveXAuthor,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: tweetKeys.checkIsActiveXAuthor(variables || {}),
            });
        },
    });
}

export function useConfirmRegisterXAuthorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: confirmRegisterXAuthor,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: tweetKeys.confirmRegisterXAuthor(variables || {}),
            });
            queryClient.invalidateQueries({
                queryKey: tweetKeys.authorByPlayerId(variables?.playerId || ""),
            });
        },
    });
}
