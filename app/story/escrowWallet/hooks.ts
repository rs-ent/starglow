/// app/story/escrowWallet/hooks.ts

import { useGetEscrowWalletsQuery } from "./queries";
import {
    useRegisterEscrowWalletMutation,
    useFetchEscrowWalletPrivateKeyMutation,
    useSetActiveEscrowWalletMutation,
    useFetchEscrowWalletsBalanceMutation,
} from "./mutations";
import { getEscrowWalletsInput } from "./actions";

interface useEscrowWalletsInput {
    getEscrowWalletsInput?: getEscrowWalletsInput;
}

export const useEscrowWallets = (input?: useEscrowWalletsInput) => {
    const {
        data: escrowWallets,
        isLoading: isLoadingEscrowWallets,
        isError: isErrorEscrowWallets,
        refetch: refetchEscrowWallets,
    } = useGetEscrowWalletsQuery(input?.getEscrowWalletsInput);

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

    return {
        escrowWallets,
        isLoadingEscrowWallets,
        isErrorEscrowWallets,
        refetchEscrowWallets,

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
    };
};
