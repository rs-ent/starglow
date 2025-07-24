/// app/actions/raffles/onchain/mutations-v2.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { raffleV2QueryKeys } from "./queryKeys-v2";

import { distributePrize, participateV2 } from "./actions-write-v2";
import {
    createRaffleV2,
    allocatePrizeV2,
    activateRaffleV2,
    batchDrawV2,
    completeRaffleV2,
    manageRole,
    pauseContract,
    deployRafflesV2Contract,
} from "./actions-admin-v2";
import { playerAssetsKeys } from "@/app/queryKeys";

// 에러 메시지 포맷팅 함수
function formatErrorMessage(error: any): string {
    const errorMessage = error?.message || "Unknown error occurred";

    if (error?.isRevert) {
        if (errorMessage.toLowerCase().includes("already participated")) {
            return "Already participated in this raffle";
        }
        if (
            errorMessage.toLowerCase().includes("raffle ended") ||
            errorMessage.toLowerCase().includes("not active")
        ) {
            return "This raffle is no longer active";
        }
        if (errorMessage.toLowerCase().includes("insufficient")) {
            return "Insufficient balance to participate";
        }
        if (errorMessage.toLowerCase().includes("already drawn")) {
            return "This raffle has already been drawn";
        }
        if (errorMessage.toLowerCase().includes("access denied")) {
            return "Access denied - insufficient permissions";
        }

        return errorMessage.includes("reverted:")
            ? errorMessage
            : `Smart contract error: ${errorMessage}`;
    }

    if (
        errorMessage.toLowerCase().includes("user rejected") ||
        errorMessage.toLowerCase().includes("user denied")
    ) {
        return "Transaction was cancelled by user";
    }

    return errorMessage;
}

// 🎯 V2 래플 참여 뮤테이션 (contractAddress 기반)
export function useParticipateV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof participateV2>[0]) => {
            const result = await participateV2(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // participateV2는 contractAddress 기반이므로 기존 방식 유지
            // 향후 contractId 기반으로 변경 시 수정 필요

            // 사용자 참여 정보 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.userParticipation(
                        variables.contractAddress,
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error("❌ ParticipateV2 mutation error:", error);
                });

            // 사용자 참여 횟수 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.userParticipationCount(
                        variables.contractAddress,
                        variables.raffleId,
                        variables.playerId
                    ),
                })
                .catch((error) => {
                    console.error("❌ ParticipateV2 mutation error:", error);
                });

            // 래플 카드 정보 무효화 (참여자 수 변경)
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.cardInfo(
                        variables.contractAddress,
                        variables.raffleId
                    ),
                })
                .catch((error) => {
                    console.error("❌ ParticipateV2 mutation error:", error);
                });

            // 활성 래플 목록 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.activeRaffles(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ ParticipateV2 mutation error:", error);
                });
        },
        onError: (error) => {
            console.error("❌ ParticipateV2 error:", error);
        },
    });
}

// 🏗️ V2 래플 생성 뮤테이션
export function useCreateRaffleV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof createRaffleV2>[0]) => {
            const result = await createRaffleV2(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // contractAddress 기반 캐시 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.contractMetadata(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ CreateRaffleV2 mutation error:", error);
                });

            // 모든 래플 목록 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.allRaffles(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ CreateRaffleV2 mutation error:", error);
                });
        },
        onError: (error) => {
            console.error("❌ CreateRaffleV2 error:", error);
        },
    });
}

// 🎁 V2 상품 할당 뮤테이션
export function useAllocatePrizeV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof allocatePrizeV2>[0]) => {
            const result = await allocatePrizeV2(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // 전체 래플 정보 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.fullRaffleInfo(
                        variables.contractAddress,
                        variables.raffleId
                    ),
                })
                .catch((error) => {
                    console.error("❌ AllocatePrizeV2 mutation error:", error);
                });
        },
        onError: (error) => {
            console.error("❌ AllocatePrizeV2 error:", error);
        },
    });
}

// ✅ V2 래플 활성화 뮤테이션
export function useActivateRaffleV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof activateRaffleV2>[0]) => {
            const result = await activateRaffleV2(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // 래플 카드 정보 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.cardInfo(
                        variables.contractAddress,
                        variables.raffleId
                    ),
                })
                .catch((error) => {
                    console.error("❌ ActivateRaffleV2 mutation error:", error);
                });

            // 활성 래플 목록 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.activeRaffles(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ ActivateRaffleV2 mutation error:", error);
                });

            // 전체 래플 정보 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.fullRaffleInfo(
                        variables.contractAddress,
                        variables.raffleId
                    ),
                })
                .catch((error) => {
                    console.error("❌ ActivateRaffleV2 mutation error:", error);
                });
        },
        onError: (error) => {
            console.error("❌ ActivateRaffleV2 error:", error);
        },
    });
}

// 🎲 V2 배치 추첨 뮤테이션
export function useBatchDrawV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof batchDrawV2>[0]) => {
            const result = await batchDrawV2(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // 배치 추첨 진행률 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.batchDrawProgress(
                        variables.contractAddress,
                        variables.raffleId
                    ),
                })
                .catch((error) => {
                    console.error("❌ BatchDrawV2 mutation error:", error);
                });

            // 래플 카드 정보 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.cardInfo(
                        variables.contractAddress,
                        variables.raffleId
                    ),
                })
                .catch((error) => {
                    console.error("❌ BatchDrawV2 mutation error:", error);
                });
        },
        onError: (error) => {
            console.error("❌ BatchDrawV2 error:", error);
        },
    });
}

// 🏁 V2 래플 완료 뮤테이션
export function useCompleteRaffleV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof completeRaffleV2>[0]) => {
            const result = await completeRaffleV2(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // 래플 카드 정보 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.cardInfo(
                        variables.contractAddress,
                        variables.raffleId
                    ),
                })
                .catch((error) => {
                    console.error("❌ CompleteRaffleV2 mutation error:", error);
                });

            // 활성 래플 목록 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.activeRaffles(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ CompleteRaffleV2 mutation error:", error);
                });

            // 컨트랙트 메타데이터 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.contractMetadata(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ CompleteRaffleV2 mutation error:", error);
                });
        },
        onError: (error) => {
            console.error("❌ CompleteRaffleV2 error:", error);
        },
    });
}

// 👥 V2 역할 관리 뮤테이션
export function useManageRoleV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof manageRole>[0]) => {
            const result = await manageRole(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // 컨트랙트 메타데이터 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.contractMetadata(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ ManageRoleV2 mutation error:", error);
                });
        },
        onError: (error) => {
            console.error("❌ ManageRoleV2 error:", error);
        },
    });
}

// ⏸️ V2 컨트랙트 일시정지 뮤테이션
export function usePauseContractV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: Parameters<typeof pauseContract>[0]) => {
            const result = await pauseContract(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // 컨트랙트 메타데이터 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.contractMetadata(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ PauseContractV2 mutation error:", error);
                });

            // 활성 래플 목록 무효화
            queryClient
                .invalidateQueries({
                    queryKey: raffleV2QueryKeys.activeRaffles(
                        variables.contractAddress
                    ),
                })
                .catch((error) => {
                    console.error("❌ PauseContractV2 mutation error:", error);
                });
        },
        onError: (error) => {
            console.error("❌ PauseContractV2 error:", error);
        },
    });
}

// 🚀 V2 컨트랙트 배포 뮤테이션
export function useDeployRafflesV2ContractMutation() {
    return useMutation({
        mutationFn: async (
            params: Parameters<typeof deployRafflesV2Contract>[0]
        ) => {
            const result = await deployRafflesV2Contract(params);
            if (!result.success) {
                const errorMessage = formatErrorMessage({
                    message: result.error,
                });
                throw new Error(errorMessage);
            }
            return result.data;
        },
        onError: (error) => {
            console.error("❌ DeployRafflesV2Contract error:", error);
        },
    });
}

export function useDistributePrizeV2Mutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: distributePrize,
        onSuccess: (_data, variables) => {
            if (variables.prizeData.prizeType === 1) {
                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.balance(
                            variables.playerId,
                            variables.prizeData.assetId || ""
                        ),
                    })
                    .catch((error) => {
                        console.error(
                            "❌ DistributePrizeV2 mutation error:",
                            error
                        );
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: playerAssetsKeys.balances(
                            variables.playerId,
                            [variables.prizeData.assetId || ""]
                        ),
                    })
                    .catch((error) => {
                        console.error(
                            "❌ DistributePrizeV2 mutation error:",
                            error
                        );
                    });
            }
        },
        onError: (error) => {
            console.error("❌ DistributePrizeV2 mutation error:", error);
        },
    });
}
