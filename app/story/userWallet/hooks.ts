/// app/story/userWallet/hooks.ts

import { useGetDefaultUserWalletQuery, useGetWalletsQuery } from "./queries";
import {
    useConnectWalletMutation,
    useVerifyWalletSignatureMutation,
    useUpdateWalletMutation,
    useDeleteWalletMutation,
} from "./mutations";
import { getDefaultUserWalletInput, getWalletsInput } from "./actions";

export interface useUserWalletInput {
    getDefaultUserWalletInput?: getDefaultUserWalletInput;
    getWalletsInput?: getWalletsInput;
}

export function useUserWallet(input?: useUserWalletInput) {
    const {
        data: defaultUserWallet,
        isLoading: isLoadingDefaultUserWallet,
        isError: isErrorDefaultUserWallet,
        refetch: refetchDefaultUserWallet,
    } = useGetDefaultUserWalletQuery(input?.getDefaultUserWalletInput);

    const {
        data: userWallets,
        isLoading: isLoadingWallets,
        isError: isErrorWallets,
        refetch: refetchWallets,
    } = useGetWalletsQuery(input?.getWalletsInput);

    const {
        mutate: connectWallet,
        mutateAsync: connectWalletAsync,
        isPending: isPendingConnectWallet,
        isSuccess: isSuccessConnectWallet,
        isError: isErrorConnectWallet,
    } = useConnectWalletMutation();

    const {
        mutate: verifyWalletSignature,
        mutateAsync: verifyWalletSignatureAsync,
        isPending: isPendingVerifyWalletSignature,
        isSuccess: isSuccessVerifyWalletSignature,
        isError: isErrorVerifyWalletSignature,
    } = useVerifyWalletSignatureMutation();

    const {
        mutate: updateWallet,
        mutateAsync: updateWalletAsync,
        isPending: isPendingUpdateWallet,
        isSuccess: isSuccessUpdateWallet,
        isError: isErrorUpdateWallet,
    } = useUpdateWalletMutation();

    const {
        mutate: deleteWallet,
        mutateAsync: deleteWalletAsync,
        isPending: isPendingDeleteWallet,
        isSuccess: isSuccessDeleteWallet,
        isError: isErrorDeleteWallet,
    } = useDeleteWalletMutation();

    return {
        defaultUserWallet,
        isLoadingDefaultUserWallet,
        isErrorDefaultUserWallet,
        refetchDefaultUserWallet,

        userWallets,
        isLoadingWallets,
        isErrorWallets,
        refetchWallets,

        connectWallet,
        connectWalletAsync,
        isPendingConnectWallet,
        isSuccessConnectWallet,
        isErrorConnectWallet,

        verifyWalletSignature,
        verifyWalletSignatureAsync,
        isPendingVerifyWalletSignature,
        isSuccessVerifyWalletSignature,
        isErrorVerifyWalletSignature,

        updateWallet,
        updateWalletAsync,
        isPendingUpdateWallet,
        isSuccessUpdateWallet,
        isErrorUpdateWallet,

        deleteWallet,
        deleteWalletAsync,
        isPendingDeleteWallet,
        isSuccessDeleteWallet,
        isErrorDeleteWallet,
    };
}
