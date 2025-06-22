/// app/mutations/factoryContractsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    deployFactory,
    updateFactory,
    createCollection,
    deleteCollection,
} from "../actions/factoryContracts";
import { useToast } from "../hooks/useToast";
import { factoryKeys, collectionKeys } from "../queryKeys";

export function useDeployFactoryMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: deployFactory,
        onSuccess: (data, variables) => {
            if (data.success) {
                // Factory 목록 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: factoryKeys.byNetwork(variables.networkId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                // 배포 완료 상태 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: factoryKeys.deployment.completed(
                            variables.networkId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                toast.success("Factory 컨트랙트 배포 성공");
            } else {
                toast.error(`Factory 배포 실패: ${data.error}`);
            }
        },
        onError: (error) => {
            toast.error(`Factory 배포 실패: ${error}`);
        },
    });
}

export function useUpdateFactoryMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: updateFactory,
        onSuccess: (data, variables) => {
            if (data.success) {
                // Factory 목록 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: factoryKeys.all,
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                // Factory 상태 관련 쿼리도 무효화
                if (data.data?.isActive) {
                    queryClient
                        .invalidateQueries({
                            queryKey: factoryKeys.status.active(
                                data.data.networkId
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                } else {
                    queryClient
                        .invalidateQueries({
                            queryKey: factoryKeys.status.inactive(
                                data.data?.networkId || ""
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }

                toast.success("Factory 상태 업데이트 성공");
            } else {
                toast.error(`Factory 업데이트 실패: ${data.error}`);
            }
        },
        onError: (error) => {
            toast.error(`Factory 업데이트 실패: ${error}`);
        },
    });
}

export function useCreateCollectionMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: createCollection,
        onSuccess: (data, variables) => {
            if (data.success) {
                // Factory의 컬렉션 목록 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: factoryKeys.collections.all(
                            variables.factoryId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                // 전체 컬렉션 목록도 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: collectionKeys.all,
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                toast.success(`${variables.params.name} 컬렉션 생성 성공`);
            } else {
                toast.error(`컬렉션 생성 실패: ${data.error}`);
            }
        },
        onError: (error) => {
            toast.error(`컬렉션 생성 실패: ${error}`);
        },
    });
}

export function useDeleteCollectionMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: deleteCollection,
        onSuccess: (data, variables) => {
            if (data.success) {
                // Factory의 컬렉션 목록 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: factoryKeys.collections.all(
                            variables.factoryId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                // 삭제된 컬렉션의 특정 쿼리 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: factoryKeys.collections.byAddress(
                            variables.factoryId,
                            variables.collectionAddress
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
                // 전체 컬렉션 목록도 무효화
                queryClient
                    .invalidateQueries({
                        queryKey: collectionKeys.all,
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                toast.success("컬렉션 삭제 성공");
            } else {
                toast.error(`컬렉션 삭제 실패: ${data.error}`);
            }
        },
        onError: (error) => {
            toast.error(`컬렉션 삭제 실패: ${error}`);
        },
    });
}
