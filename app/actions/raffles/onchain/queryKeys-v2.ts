/// app/actions/raffles/onchain/queryKeys-v2.ts

export const raffleV2QueryKeys = {
    all: ["raffles-v2"] as const,
    lists: () => [...raffleV2QueryKeys.all, "list"] as const,

    // 개별 래플 카드 정보 (contractId 기반)
    cardInfo: (contractId: string, raffleId: string) =>
        [...raffleV2QueryKeys.all, "card", contractId, raffleId] as const,

    // 배치 래플 카드 정보 (contractId 기반)
    cardInfoBatch: (contractId: string) =>
        [...raffleV2QueryKeys.all, "card-batch", contractId] as const,

    // 활성 래플들 (contractId 기반)
    activeRaffles: (contractId: string) =>
        [...raffleV2QueryKeys.all, "active", contractId] as const,

    // 모든 래플들 (contractId 기반)
    allRaffles: (contractId: string) =>
        [...raffleV2QueryKeys.all, "all", contractId] as const,

    // 전체 래플 정보 (contractId 기반)
    fullRaffleInfo: (contractId: string, raffleId: string) =>
        [...raffleV2QueryKeys.all, "full", contractId, raffleId] as const,

    // 사용자 참여 정보 (contractId 기반)
    userParticipation: (
        contractId: string,
        raffleId: string,
        playerId: string
    ) =>
        [
            ...raffleV2QueryKeys.all,
            "user",
            contractId,
            raffleId,
            playerId,
        ] as const,

    // 사용자 참여 횟수 (contractId 기반)
    userParticipationCount: (
        contractId: string,
        raffleId: string,
        playerId: string
    ) =>
        [
            ...raffleV2QueryKeys.all,
            "user-count",
            contractId,
            raffleId,
            playerId,
        ] as const,

    // 컨트랙트 메타데이터 (contractId 기반)
    contractMetadata: (contractId: string) =>
        [...raffleV2QueryKeys.all, "metadata", contractId] as const,

    // 배치 추첨 진행률 (contractId 기반)
    batchDrawProgress: (contractId: string, raffleId: string) =>
        [
            ...raffleV2QueryKeys.all,
            "batch-progress",
            contractId,
            raffleId,
        ] as const,

    // 참여 가능 여부 확인 (contractId 기반)
    participationCheck: (
        contractId: string,
        raffleId: string,
        playerId: string
    ) =>
        [
            ...raffleV2QueryKeys.all,
            "participation-check",
            contractId,
            raffleId,
            playerId,
        ] as const,

    // 가스비 추정 (contractId 기반)
    gasEstimate: (contractId: string, raffleId: string, playerId: string) =>
        [
            ...raffleV2QueryKeys.all,
            "gas-estimate",
            contractId,
            raffleId,
            playerId,
        ] as const,
} as const;
