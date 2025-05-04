/// app/hooks/useCollectionContracts.ts

"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
    useTokens,
    useTokenOwners,
    useCollectionStatus,
    useEscrowWallets,
    useNonce,
    useCollectionsByNetwork,
    useCollectionSettings,
    useCollection,
} from "../queries/collectionContractsQueries";
import {
    useMintTokensMutation,
    useBurnTokensMutation,
    useLockTokensMutation,
    useUnlockTokensMutation,
    useTransferTokensMutation,
    usePauseCollectionMutation,
    useUnpauseCollectionMutation,
    useAddEscrowWalletMutation,
    useRemoveEscrowWalletMutation,
    useDeployCollectionMutation,
    useUpdateCollectionSettingsMutation,
} from "../mutations/collectionContractsMutations";
import { collectionKeys } from "../queryKeys";

// GET 훅 (조회 기능)
export interface UseCollectionGetProps {
    collectionAddress?: string;
    walletId?: string;
    options?: {
        tokenIds?: number[];
        ownerAddress?: string;
        isBurned?: boolean;
        isLocked?: boolean;
        isStaked?: boolean;
    };
}

export function useCollectionGet({
    collectionAddress = "",
    walletId,
    options,
}: UseCollectionGetProps = {}) {
    const {
        data: collection,
        isLoading: isCollectionLoading,
        error: collectionError,
    } = useCollection({
        collectionAddress,
    });

    // 기본 토큰 조회
    const tokensQuery = useTokens({
        collectionAddress,
        options,
    });

    // 컬렉션 상태
    const statusQuery = useCollectionStatus({
        collectionAddress,
    });

    // 에스크로 지갑
    const escrowWalletsQuery = useEscrowWallets({
        collectionAddress,
    });

    // 논스 (지갑 주소가 있을 때만)
    const nonceQuery = useNonce({
        collectionAddress,
        walletAddress: walletId || "",
    });

    // 컬렉션 설정
    const collectionSettingsQuery = useCollectionSettings({
        collectionAddress,
    });

    const hasCollectionAddress = !!collectionAddress;

    return {
        // 데이터
        collection,
        tokens: tokensQuery.data,
        status: statusQuery.data,
        escrowWallets: escrowWalletsQuery.data,
        nonce: nonceQuery.data,
        settings: collectionSettingsQuery.data,

        // 상태
        isLoading:
            isCollectionLoading ||
            (hasCollectionAddress && tokensQuery.isLoading) ||
            (hasCollectionAddress && statusQuery.isLoading) ||
            (hasCollectionAddress && escrowWalletsQuery.isLoading) ||
            (hasCollectionAddress && collectionSettingsQuery.isLoading) ||
            (hasCollectionAddress && walletId ? nonceQuery.isLoading : false),
        error:
            collectionError ||
            tokensQuery.error ||
            statusQuery.error ||
            escrowWalletsQuery.error ||
            collectionSettingsQuery.error ||
            (walletId ? nonceQuery.error : undefined),

        // 개별 쿼리 상태
        isLoadingCollection: isCollectionLoading,
        isLoadingTokens: hasCollectionAddress && tokensQuery.isLoading,
        isLoadingStatus: hasCollectionAddress && statusQuery.isLoading,
        isLoadingEscrow: hasCollectionAddress && escrowWalletsQuery.isLoading,
        isLoadingNonce:
            hasCollectionAddress && walletId ? nonceQuery.isLoading : false,
        isLoadingSettings:
            hasCollectionAddress && collectionSettingsQuery.isLoading,

        // 원본 쿼리 객체 (고급 사용 사례용)
        tokensQuery,
        statusQuery,
        escrowWalletsQuery,
        nonceQuery,
        collectionSettingsQuery,
    };
}

export interface UseCollectionSetProps {
    collectionAddress?: string;
    walletId?: string;
}

export function useCollectionSet({
    collectionAddress = "",
    walletId,
}: UseCollectionSetProps = {}) {
    const queryClient = useQueryClient();

    // Mutations
    const mintMutation = useMintTokensMutation();
    const burnMutation = useBurnTokensMutation();
    const lockMutation = useLockTokensMutation();
    const unlockMutation = useUnlockTokensMutation();
    const transferMutation = useTransferTokensMutation();
    const pauseMutation = usePauseCollectionMutation();
    const unpauseMutation = useUnpauseCollectionMutation();
    const addEscrowMutation = useAddEscrowWalletMutation();
    const removeEscrowMutation = useRemoveEscrowWalletMutation();
    const updateSettingsMutation = useUpdateCollectionSettingsMutation();

    return {
        // 작업 함수들
        mint: mintMutation.mutateAsync,
        burn: burnMutation.mutateAsync,
        lock: lockMutation.mutateAsync,
        unlock: unlockMutation.mutateAsync,
        transfer: transferMutation.mutateAsync,
        pause: pauseMutation.mutateAsync,
        unpause: unpauseMutation.mutateAsync,
        addEscrow: addEscrowMutation.mutateAsync,
        removeEscrow: removeEscrowMutation.mutateAsync,
        updateSettings: updateSettingsMutation.mutateAsync,

        // 작업 상태
        isProcessing:
            mintMutation.isPending ||
            burnMutation.isPending ||
            lockMutation.isPending ||
            unlockMutation.isPending ||
            transferMutation.isPending ||
            pauseMutation.isPending ||
            unpauseMutation.isPending ||
            addEscrowMutation.isPending ||
            removeEscrowMutation.isPending ||
            updateSettingsMutation.isPending,

        // 개별 작업 상태
        isMinting: mintMutation.isPending,
        isBurning: burnMutation.isPending,
        isLocking: lockMutation.isPending,
        isUnlocking: unlockMutation.isPending,
        isTransferring: transferMutation.isPending,
        isPausing: pauseMutation.isPending,
        isUnpausing: unpauseMutation.isPending,
        isAddingEscrow: addEscrowMutation.isPending,
        isRemovingEscrow: removeEscrowMutation.isPending,
        isUpdatingSettings: updateSettingsMutation.isPending,

        // 에러
        error:
            mintMutation.error ||
            burnMutation.error ||
            lockMutation.error ||
            unlockMutation.error ||
            transferMutation.error ||
            pauseMutation.error ||
            unpauseMutation.error ||
            addEscrowMutation.error ||
            removeEscrowMutation.error ||
            updateSettingsMutation.error,

        // 원본 mutation 객체들 (고급 사용 사례용)
        mintMutation,
        burnMutation,
        lockMutation,
        unlockMutation,
        transferMutation,
        pauseMutation,
        unpauseMutation,
        addEscrowMutation,
        removeEscrowMutation,
        updateSettingsMutation,

        // 캐시 갱신
        refresh: async () => {
            if (!collectionAddress) return;

            await queryClient.invalidateQueries({
                queryKey: collectionKeys.tokens.all(collectionAddress),
            });
            await queryClient.invalidateQueries({
                queryKey: collectionKeys.status.paused(collectionAddress),
            });
            await queryClient.invalidateQueries({
                queryKey: collectionKeys.escrowWallets.all(collectionAddress),
            });
            await queryClient.invalidateQueries({
                queryKey: collectionKeys.settings.byAddress(collectionAddress),
            });
        },
    };
}

export function useCollectionDeployment() {
    const deployMutation = useDeployCollectionMutation();

    return {
        deploy: deployMutation.mutateAsync,

        isDeploying: deployMutation.isPending,
        error: deployMutation.error,

        deployMutation,
    };
}
