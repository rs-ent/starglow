/// app/queries/collectionContractsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { collectionKeys } from "../queryKeys";
import {
    getCollection,
    getTokenOwners,
    getTokens,
    getNonce,
    getCollectionStatus,
    getEscrowWallet,
    getCollectionsByNetwork,
    getCollectionSettings,
    updateCollectionSettings,
    getTokensLockStatus,
} from "../actions/collectionContracts";
import type {
    GetCollectionInput,
    GetCollectionResult,
    getTokenOwnersInput,
    getTokenOwnersResult,
    GetTokensInput,
    GetNonceInput,
    GetCollectionStatusInput,
    GetEscrowWalletInput,
    GetCollectionsByNetworkInput,
    GetCollectionSettingsInput,
    GetCollectionSettingsResult,
    UpdateCollectionSettingsInput,
    UpdateCollectionSettingsResult,
    GetTokensLockStatusInput,
} from "../actions/collectionContracts";
import { NFT } from "@prisma/client";

export const useCollection = (input: GetCollectionInput) => {
    return useQuery({
        queryKey: collectionKeys.byAddress(input.collectionAddress),
        queryFn: () => getCollection(input),
        enabled: !!input.collectionAddress,
    });
};

export const useCollectionsByNetwork = (
    input: GetCollectionsByNetworkInput
) => {
    return useQuery({
        queryKey: collectionKeys.deployment.byNetwork(input.networkId),
        queryFn: () => getCollectionsByNetwork(input),
        enabled: !!input.networkId,
    });
};

export const useTokenOwners = (input: getTokenOwnersInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.owners(
            input.collectionAddress,
            input.tokenIds ?? []
        ),
        queryFn: () => getTokenOwners(input),
        enabled: !!input.collectionAddress && !!input.tokenIds,
    });
};

export const useTokens = (input: GetTokensInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.filtered(
            input.collectionAddress,
            input.options
        ),
        queryFn: () => getTokens(input),
        select: (data) => data.tokens,
        enabled: !!input.collectionAddress,
    });
};

export const useTokenByIds = (input: GetTokensInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.byIds(
            input.collectionAddress,
            input.options?.tokenIds ?? []
        ),
        queryFn: () => getTokens(input),
        select: (data) => data.tokens,
        enabled: !!input.collectionAddress && !!input.options?.tokenIds,
    });
};

export const useTokenByOwner = (input: GetTokensInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.byOwner(
            input.collectionAddress,
            input.options?.ownerAddress ?? ""
        ),
        queryFn: () => getTokens(input),
        select: (data) => data.tokens,
        enabled: !!input.collectionAddress && !!input.options?.ownerAddress,
    });
};

export const useTokenByLocked = (input: GetTokensInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.locked(input.collectionAddress),
        queryFn: () => getTokens(input),
        select: (data) => data.tokens,
        enabled: !!input.collectionAddress && !!input.options?.isLocked,
    });
};

export const useTokenByBurned = (input: GetTokensInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.burned(input.collectionAddress),
        queryFn: () => getTokens(input),
        select: (data) => data.tokens,
        enabled: !!input.collectionAddress && !!input.options?.isBurned,
    });
};

export const useTokenByStaked = (input: GetTokensInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.staked(input.collectionAddress),
        queryFn: () => getTokens(input),
        select: (data) => data.tokens,
        enabled: !!input.collectionAddress && !!input.options?.isStaked,
    });
};

export const useCollectionStatus = (input: GetCollectionStatusInput) => {
    return useQuery({
        queryKey: collectionKeys.status.paused(input.collectionAddress),
        queryFn: () => getCollectionStatus(input),
        enabled: !!input.collectionAddress,
    });
};

export const useEscrowWallets = (input: GetEscrowWalletInput) => {
    return useQuery({
        queryKey: collectionKeys.escrowWallets.all(input.collectionAddress),
        queryFn: () => getEscrowWallet(input),
        select: (data) => data.wallet,
        enabled: !!input.collectionAddress,
    });
};

export const useNonce = (input: GetNonceInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.nonce(input.collectionAddress),
        queryFn: () => getNonce(input),
        enabled: !!input.collectionAddress && !!input.walletAddress,
    });
};

export const useCollectionSettings = (input: GetCollectionSettingsInput) => {
    return useQuery({
        queryKey: collectionKeys.settings.byAddress(input.collectionAddress),
        queryFn: () => getCollectionSettings(input),
        enabled: !!input.collectionAddress,
    });
};

export const useTokensLockStatus = (input: GetTokensLockStatusInput) => {
    return useQuery({
        queryKey: collectionKeys.tokens.locked(input.collectionAddress),
        queryFn: () => getTokensLockStatus(input),
        enabled: !!input.collectionAddress && input.tokenIds.length > 0,
    });
};
