/// app/mutations/discordMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createDiscordCode } from "../actions/discord";
import { discordKeys } from "../queryKeys";

export function useCreateDiscordCodeMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createDiscordCode,
        onSuccess: (data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: discordKeys.discordCode(data.code),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
