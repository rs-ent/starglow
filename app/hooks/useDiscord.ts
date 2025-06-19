/// app/hooks/useDiscord.ts

import { useCreateDiscordCodeMutation } from "../mutations/discordMutations";

export function useDiscord() {
    const {
        mutate: createDiscordCode,
        mutateAsync: createDiscordCodeAsync,
        isPending: createDiscordCodePending,
        isSuccess: createDiscordCodeSuccess,
        isError: createDiscordCodeError,
    } = useCreateDiscordCodeMutation();

    return {
        createDiscordCode,
        createDiscordCodeAsync,
        createDiscordCodePending,
        createDiscordCodeSuccess,
        createDiscordCodeError,
    };
}
