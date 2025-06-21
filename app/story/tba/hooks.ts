/// app/story/tba/hooks.ts

import {
    useDeployTBARegistryMutation,
    useDeployTBAImplementationMutation,
    useSetTBAAddressMutation,
} from "./mutations";
import { useGetTBAContractsQuery, useGetTBAAddressesQuery } from "./queries";

import type { getTBAContractsInput, getTBAAddressesInput } from "./actions";

interface useTBAInput {
    getTBAContractsInput?: getTBAContractsInput;
    getTBAAddressesInput?: getTBAAddressesInput;
}

export function useTBA(input?: useTBAInput) {
    const {
        data: tbaContracts,
        isLoading: isTBAContractsLoading,
        isError: isTBAContractsError,
        error: tbaContractsError,
        refetch: refetchTBAContracts,
    } = useGetTBAContractsQuery(input?.getTBAContractsInput);

    const {
        data: tbaAddresses,
        isLoading: isTBAAddressesLoading,
        isError: isTBAAddressesError,
        error: tbaAddressesError,
        refetch: refetchTBAAddresses,
    } = useGetTBAAddressesQuery(
        input?.getTBAAddressesInput || { networkId: "" }
    );

    const deployTBARegistryMutation = useDeployTBARegistryMutation();
    const deployTBAImplementationMutation =
        useDeployTBAImplementationMutation();
    const setTBAAddressMutation = useSetTBAAddressMutation();

    return {
        tbaContracts,
        isTBAContractsLoading,
        isTBAContractsError,
        tbaContractsError,
        refetchTBAContracts,

        tbaAddresses,
        isTBAAddressesLoading,
        isTBAAddressesError,
        tbaAddressesError,
        refetchTBAAddresses,

        deployTBARegistryMutation,
        deployTBAImplementationMutation,
        setTBAAddressMutation,
    };
}
