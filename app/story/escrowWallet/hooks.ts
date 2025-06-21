/// app/story/escrowWallet/hooks.ts

import {
    useRegisterEscrowWalletMutation,
    useFetchEscrowWalletPrivateKeyMutation,
    useSetActiveEscrowWalletMutation,
    useFetchEscrowWalletsBalanceMutation,
    useAddEscrowWalletToSPGMutation,
} from "./mutations";
import {
    useGetEscrowWalletsQuery,
    useGetRegisteredEscrowWalletsQuery,
} from "./queries";

import type {
    getEscrowWalletsInput,
    getRegisteredEscrowWalletsInput,
} from "./actions";

interface useEscrowWalletsInput {
    getEscrowWalletsInput?: getEscrowWalletsInput;
    getRegisteredEscrowWalletsInput?: getRegisteredEscrowWalletsInput;
}

export const useEscrowWallets = (input?: useEscrowWalletsInput) => {
    const {
        data: escrowWallets,
        isLoading: isLoadingEscrowWallets,
        isError: isErrorEscrowWallets,
        refetch: refetchEscrowWallets,
    } = useGetEscrowWalletsQuery(input?.getEscrowWalletsInput);

    const {
        data: registeredEscrowWallets,
        isLoading: isLoadingRegisteredEscrowWallets,
        isError: isErrorRegisteredEscrowWallets,
        refetch: refetchRegisteredEscrowWallets,
    } = useGetRegisteredEscrowWalletsQuery(
        input?.getRegisteredEscrowWalletsInput
    );

    const {
        mutate: registerEscrowWallet,
        mutateAsync: registerEscrowWalletAsync,
        isPending: isPendingRegisterEscrowWallet,
        isError: isErrorRegisterEscrowWallet,
    } = useRegisterEscrowWalletMutation();

    const {
        mutate: fetchEscrowWalletPrivateKey,
        mutateAsync: fetchEscrowWalletPrivateKeyAsync,
        isPending: isPendingFetchEscrowWalletPrivateKey,
        isError: isErrorFetchEscrowWalletPrivateKey,
    } = useFetchEscrowWalletPrivateKeyMutation();

    const {
        mutate: setActiveEscrowWallet,
        mutateAsync: setActiveEscrowWalletAsync,
        isPending: isPendingSetActiveEscrowWallet,
        isError: isErrorSetActiveEscrowWallet,
    } = useSetActiveEscrowWalletMutation();

    const {
        mutate: fetchEscrowWalletsBalance,
        mutateAsync: fetchEscrowWalletsBalanceAsync,
        isPending: isPendingFetchEscrowWalletsBalance,
        isError: isErrorFetchEscrowWalletsBalance,
    } = useFetchEscrowWalletsBalanceMutation();

    const {
        mutate: addEscrowWalletToSPG,
        mutateAsync: addEscrowWalletToSPGAsync,
        isPending: isPendingAddEscrowWalletToSPG,
        isError: isErrorAddEscrowWalletToSPG,
    } = useAddEscrowWalletToSPGMutation();

    return {
        escrowWallets,
        isLoadingEscrowWallets,
        isErrorEscrowWallets,
        refetchEscrowWallets,

        registeredEscrowWallets,
        isLoadingRegisteredEscrowWallets,
        isErrorRegisteredEscrowWallets,
        refetchRegisteredEscrowWallets,

        registerEscrowWallet,
        registerEscrowWalletAsync,
        isPendingRegisterEscrowWallet,
        isErrorRegisterEscrowWallet,

        fetchEscrowWalletPrivateKey,
        fetchEscrowWalletPrivateKeyAsync,
        isPendingFetchEscrowWalletPrivateKey,
        isErrorFetchEscrowWalletPrivateKey,

        setActiveEscrowWallet,
        setActiveEscrowWalletAsync,
        isPendingSetActiveEscrowWallet,
        isErrorSetActiveEscrowWallet,

        fetchEscrowWalletsBalance,
        fetchEscrowWalletsBalanceAsync,
        isPendingFetchEscrowWalletsBalance,
        isErrorFetchEscrowWalletsBalance,

        addEscrowWalletToSPG,
        addEscrowWalletToSPGAsync,
        isPendingAddEscrowWalletToSPG,
        isErrorAddEscrowWalletToSPG,
    };
};
