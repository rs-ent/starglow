import type { GetOnchainRafflesInput, RaffleDataKeys } from "./actions-read";

export const raffleQueryKeys = {
    all: ["raffles"] as const,
    lists: () => [...raffleQueryKeys.all, "list"] as const,
    list: (filters: GetOnchainRafflesInput) =>
        [...raffleQueryKeys.lists(), filters] as const,
    contracts: () => [...raffleQueryKeys.all, "contract"] as const,
    contract: (
        contractAddress: string,
        raffleId: string,
        dataKeys?: RaffleDataKeys[]
    ) =>
        [
            ...raffleQueryKeys.contracts(),
            contractAddress,
            raffleId,
            dataKeys,
        ] as const,
    status: (contractAddress: string, raffleId: string) =>
        [
            ...raffleQueryKeys.contracts(),
            contractAddress,
            raffleId,
            "status",
        ] as const,
    raffleList: (
        raffles: Array<{ contractAddress: string; raffleId: string }>
    ) => [...raffleQueryKeys.lists(), "bulk", raffles] as const,
    raffleListStatus: (
        raffles: Array<{ contractAddress: string; raffleId: string }>
    ) => [...raffleQueryKeys.lists(), "bulk-status", raffles] as const,
    userParticipation: (
        contractAddress: string,
        raffleId: string,
        playerId: string
    ) =>
        [
            ...raffleQueryKeys.all,
            "user",
            contractAddress,
            raffleId,
            playerId,
        ] as const,
    lotteryResult: (contractAddress: string, resultId: string) =>
        [...raffleQueryKeys.all, "result", contractAddress, resultId] as const,
} as const;
