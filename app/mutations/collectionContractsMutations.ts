/// app/mutations/collectionContractsMutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    setURI,
    mintTokens,
    burnTokens,
    lockTokens,
    unlockTokens,
    transferTokens,
    pauseCollection,
    unpauseCollection,
    addEscrowWallet,
    removeEscrowWallet,
    deployCollection,
    updateCollectionSettings,
} from "@/app/actions/collectionContracts";
import { NFT } from "@prisma/client";
import { collectionKeys } from "../queryKeys";
import { useToast } from "@/app/hooks/useToast";

export const useDeployCollectionMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: deployCollection,
        onSuccess: async (data, variables) => {
            if (data.success) {
                // 컬렉션 목록 쿼리 무효화
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.lists(),
                });
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.deployment.byNetwork(
                        variables.networkId
                    ),
                });

                toast.success(`컬렉션 배포 성공: ${data.data?.name}`);
            } else {
                toast.error(`컬렉션 배포 실패: ${data.error}`);
            }
        },
        onError: (error) => {
            toast.error(`컬렉션 배포 실패: ${error}`);
        },
    });
};

export const useSetURIMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: setURI,
        onSuccess: async (data, variables) => {
            if (data.success) {
                // URI 관련 쿼리 무효화
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.uri.base(
                        variables.collectionAddress
                    ),
                });
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.uri.contract(
                        variables.collectionAddress
                    ),
                });

                toast.success(
                    `URI 업데이트 성공: ${variables.collectionAddress}`
                );
            } else {
                toast.error(
                    `URI 업데이트 실패: ${variables.collectionAddress}`
                );
            }
        },
        onError: (error) => {
            toast.error(`URI 업데이트 실패: ${error}`);
        },
    });
};

export const useMintTokensMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: mintTokens,
        onMutate: async (variables) => {
            const previousTokens = queryClient.getQueryData(
                collectionKeys.tokens.byOwner(
                    variables.collectionAddress,
                    variables.walletId
                )
            );

            return { previousTokens };
        },
        onSuccess: async (data, variables, context) => {
            if (data.success) {
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.all(
                            variables.collectionAddress
                        ),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.byOwner(
                            variables.collectionAddress,
                            variables.walletId
                        ),
                    }),
                ]);

                toast.success(`${variables.quantity}개의 토큰 민팅 성공`);
            } else {
                toast.error(`토큰 민팅 실패: ${data.error}`);
            }
        },
        onError: (error) => {
            toast.error(`토큰 민팅 실패: ${error}`);
        },
    });
};

export const useLockTokensMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: lockTokens,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: collectionKeys.tokens.locked(
                    variables.collectionAddress
                ),
            });

            const previousLockedTokens = queryClient.getQueryData(
                collectionKeys.tokens.locked(variables.collectionAddress)
            );

            queryClient.setQueryData(
                collectionKeys.tokens.locked(variables.collectionAddress),
                (old: any) => ({
                    ...old,
                    tokenIds: [...(old?.tokenIds || []), ...variables.tokenIds],
                })
            );

            return { previousLockedTokens };
        },
        onSuccess: async (data, variables, context) => {
            if (data.success) {
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.locked(
                            variables.collectionAddress
                        ),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.byIds(
                            variables.collectionAddress,
                            variables.tokenIds
                        ),
                    }),
                ]);
            }
        },
        onError: (error) => {
            console.error("Failed to lock tokens:", error);
        },
    });
};

export const useUnlockTokensMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: unlockTokens,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: collectionKeys.tokens.locked(
                    variables.collectionAddress
                ),
            });

            const previousLockedTokens = queryClient.getQueryData(
                collectionKeys.tokens.locked(variables.collectionAddress)
            );

            queryClient.setQueryData(
                collectionKeys.tokens.locked(variables.collectionAddress),
                (old: any) => ({
                    ...old,
                    tokenIds: (old?.tokenIds ?? []).filter(
                        (id: number) => !variables.tokenIds.includes(id)
                    ),
                })
            );

            return { previousLockedTokens };
        },
        onSuccess: async (data, variables, context) => {
            if (data.success) {
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.locked(
                            variables.collectionAddress
                        ),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.filtered(
                            variables.collectionAddress,
                            { tokenIds: variables.tokenIds }
                        ),
                    }),
                ]);
            } else {
                if (context?.previousLockedTokens) {
                    queryClient.setQueryData(
                        collectionKeys.tokens.locked(
                            variables.collectionAddress
                        ),
                        context.previousLockedTokens
                    );
                }
            }
        },
        onError: (error, variables, context) => {
            if (context?.previousLockedTokens) {
                queryClient.setQueryData(
                    collectionKeys.tokens.locked(variables.collectionAddress),
                    context.previousLockedTokens
                );
            }
            console.error("Failed to unlock tokens:", error);
        },
    });
};

export const useBurnTokensMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: burnTokens,
        onMutate: async (variables) => {
            // 관련 쿼리들 취소
            await Promise.all([
                queryClient.cancelQueries({
                    queryKey: collectionKeys.tokens.all(
                        variables.collectionAddress
                    ),
                }),
                queryClient.cancelQueries({
                    queryKey: collectionKeys.tokens.byOwner(
                        variables.collectionAddress,
                        variables.walletId
                    ),
                }),
            ]);

            // 이전 상태 저장
            const previousTokens = queryClient.getQueryData(
                collectionKeys.tokens.byOwner(
                    variables.collectionAddress,
                    variables.walletId
                )
            );

            // 낙관적 업데이트: 소각될 토큰들을 목록에서 제거
            queryClient.setQueryData(
                collectionKeys.tokens.byOwner(
                    variables.collectionAddress,
                    variables.walletId
                ),
                (old: any) => ({
                    ...old,
                    nfts: (old?.nfts || []).filter(
                        (nft: NFT) => !variables.tokenIds.includes(nft.tokenId)
                    ),
                })
            );

            return { previousTokens };
        },
        onSuccess: async (data, variables, context) => {
            if (data.success) {
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.all(
                            variables.collectionAddress
                        ),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.byOwner(
                            variables.collectionAddress,
                            variables.walletId
                        ),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.byIds(
                            variables.collectionAddress,
                            variables.tokenIds
                        ),
                    }),
                ]);

                toast.success(
                    `${variables.tokenIds.length}개의 토큰 소각 성공`
                );
            } else {
                // 실패 시 이전 상태로 복원
                if (context?.previousTokens) {
                    queryClient.setQueryData(
                        collectionKeys.tokens.byOwner(
                            variables.collectionAddress,
                            variables.walletId
                        ),
                        context.previousTokens
                    );
                }
                toast.error(`토큰 소각 실패: ${data.error}`);
            }
        },
        onError: (error, variables, context) => {
            // 에러 시 이전 상태로 복원
            if (context?.previousTokens) {
                queryClient.setQueryData(
                    collectionKeys.tokens.byOwner(
                        variables.collectionAddress,
                        variables.walletId
                    ),
                    context.previousTokens
                );
            }
            toast.error(`토큰 소각 실패: ${error}`);
        },
    });
};

export const usePauseCollectionMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: pauseCollection,
        onSuccess: async (data, variables) => {
            if (data.success) {
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.status.paused(
                        variables.collectionAddress
                    ),
                });

                toast.success(`컬렉션 일시 중지 성공`);
            } else {
                toast.error(`컬렉션 일시 중지 실패: ${data.error}`);
            }
        },
    });
};

export const useUnpauseCollectionMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: unpauseCollection,
        onSuccess: async (data, variables) => {
            if (data.success) {
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.status.paused(
                        variables.collectionAddress
                    ),
                });

                toast.success(`컬렉션 일시 중지 해제 성공`);
            } else {
                toast.error(`컬렉션 일시 중지 해제 실패: ${data.error}`);
            }
        },
    });
};

export const useTransferTokensMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: transferTokens,
        onMutate: async (variables) => {
            await Promise.all([
                queryClient.cancelQueries({
                    queryKey: collectionKeys.tokens.byOwner(
                        variables.collectionAddress,
                        variables.fromAddress
                    ),
                }),
                queryClient.cancelQueries({
                    queryKey: collectionKeys.tokens.byOwner(
                        variables.collectionAddress,
                        variables.toAddress
                    ),
                }),
            ]);

            const previousFromTokens = queryClient.getQueryData(
                collectionKeys.tokens.byOwner(
                    variables.collectionAddress,
                    variables.fromAddress
                )
            );
            const previousToTokens = queryClient.getQueryData(
                collectionKeys.tokens.byOwner(
                    variables.collectionAddress,
                    variables.toAddress
                )
            );

            queryClient.setQueryData(
                collectionKeys.tokens.byOwner(
                    variables.collectionAddress,
                    variables.fromAddress
                ),
                (old: any) => ({
                    ...old,
                    nfts: (old?.nfts || []).filter(
                        (nft: NFT) => !variables.tokenIds.includes(nft.tokenId)
                    ),
                })
            );

            return { previousFromTokens, previousToTokens };
        },
        onSuccess: async (data, variables, context) => {
            if (data.success) {
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.byOwner(
                            variables.collectionAddress,
                            variables.fromAddress
                        ),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.byOwner(
                            variables.collectionAddress,
                            variables.toAddress
                        ),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionKeys.tokens.byIds(
                            variables.collectionAddress,
                            variables.tokenIds
                        ),
                    }),
                ]);

                toast.success(
                    `Successfully transferred ${variables.tokenIds.length} tokens`
                );
            } else {
                if (context?.previousFromTokens) {
                    queryClient.setQueryData(
                        collectionKeys.tokens.byOwner(
                            variables.collectionAddress,
                            variables.fromAddress
                        ),
                        context.previousFromTokens
                    );
                }
                toast.error(`Failed to transfer tokens: ${data.error}`);
            }
        },
        onError: (error, variables, context) => {
            if (context?.previousFromTokens) {
                queryClient.setQueryData(
                    collectionKeys.tokens.byOwner(
                        variables.collectionAddress,
                        variables.fromAddress
                    ),
                    context.previousFromTokens
                );
            }
            toast.error(`Failed to transfer tokens: ${error}`);
        },
    });
};

export const useAddEscrowWalletMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: addEscrowWallet,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: collectionKeys.escrowWallets.all(
                    variables.collectionAddress
                ),
            });

            const previousEscrowWallets = queryClient.getQueryData(
                collectionKeys.escrowWallets.all(variables.collectionAddress)
            );

            // 낙관적 업데이트: 새 에스크로 지갑 추가
            queryClient.setQueryData(
                collectionKeys.escrowWallets.all(variables.collectionAddress),
                (old: any) => ({
                    ...old,
                    wallets: [
                        ...(old?.wallets || []),
                        variables.escrowWalletAddress,
                    ],
                })
            );

            return { previousEscrowWallets };
        },
        onSuccess: async (data, variables, context) => {
            if (data.success) {
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.escrowWallets.all(
                        variables.collectionAddress
                    ),
                });

                toast.success(
                    `에스크로 지갑이 추가되었습니다: ${variables.escrowWalletAddress}`
                );
            } else {
                // 실패 시 이전 상태로 복원
                if (context?.previousEscrowWallets) {
                    queryClient.setQueryData(
                        collectionKeys.escrowWallets.all(
                            variables.collectionAddress
                        ),
                        context.previousEscrowWallets
                    );
                }
                toast.error(`에스크로 지갑 추가 실패: ${data.error}`);
            }
        },
        onError: (error, variables, context) => {
            // 에러 시 이전 상태로 복원
            if (context?.previousEscrowWallets) {
                queryClient.setQueryData(
                    collectionKeys.escrowWallets.all(
                        variables.collectionAddress
                    ),
                    context.previousEscrowWallets
                );
            }
            toast.error(`에스크로 지갑 추가 실패: ${error}`);
        },
    });
};

export const useRemoveEscrowWalletMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: removeEscrowWallet,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: collectionKeys.escrowWallets.all(
                    variables.collectionAddress
                ),
            });

            const previousEscrowWallets = queryClient.getQueryData(
                collectionKeys.escrowWallets.all(variables.collectionAddress)
            );

            // 낙관적 업데이트: 에스크로 지갑 제거
            queryClient.setQueryData(
                collectionKeys.escrowWallets.all(variables.collectionAddress),
                (old: any) => ({
                    ...old,
                    wallets: (old?.wallets || []).filter(
                        (wallet: string) =>
                            wallet !== variables.escrowWalletAddress
                    ),
                })
            );

            return { previousEscrowWallets };
        },
        onSuccess: async (data, variables, context) => {
            if (data.success) {
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.escrowWallets.all(
                        variables.collectionAddress
                    ),
                });

                toast.success(
                    `에스크로 지갑이 제거되었습니다: ${variables.escrowWalletAddress}`
                );
            } else {
                // 실패 시 이전 상태로 복원
                if (context?.previousEscrowWallets) {
                    queryClient.setQueryData(
                        collectionKeys.escrowWallets.all(
                            variables.collectionAddress
                        ),
                        context.previousEscrowWallets
                    );
                }
                toast.error(`에스크로 지갑 제거 실패: ${data.error}`);
            }
        },
        onError: (error, variables, context) => {
            // 에러 시 이전 상태로 복원
            if (context?.previousEscrowWallets) {
                queryClient.setQueryData(
                    collectionKeys.escrowWallets.all(
                        variables.collectionAddress
                    ),
                    context.previousEscrowWallets
                );
            }
            toast.error(`에스크로 지갑 제거 실패: ${error}`);
        },
    });
};

export const useUpdateCollectionSettingsMutation = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: updateCollectionSettings,
        onSuccess: async (data, variables) => {
            if (data.success) {
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.settings.byAddress(
                        variables.collectionAddress
                    ),
                });
                await queryClient.invalidateQueries({
                    queryKey: collectionKeys.detail(
                        variables.collectionAddress
                    ),
                });

                toast.success("컬렉션 설정이 업데이트되었습니다.");
            } else {
                toast.error("컬렉션 설정 업데이트 실패: ${data.error}");
            }
        },
        onError: (error, variables) => {
            toast.error("컬렉션 설정 업데이트 실패: ${error}");
        },
    });
};
