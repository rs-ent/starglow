/// app/actions/x/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tweetKeys } from "@/app/queryKeys";
import { validateRegisterXAuthor } from "./actions";

export function useValidateRegisterXAuthorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: validateRegisterXAuthor,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: tweetKeys.validateRegisterXAuthor(variables || {}),
            });
            queryClient.invalidateQueries({
                queryKey: tweetKeys.authorByPlayerId(variables?.playerId || ""),
            });
        },
    });
}
