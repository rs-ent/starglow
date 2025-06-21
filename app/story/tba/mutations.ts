/// app/story/tba/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../queryKeys";
import {
    deployTBARegistry,
    deployTBAImplementation,
    setTBAAddress,
} from "./actions";

export function useDeployTBARegistryMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deployTBARegistry,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tba.all });
            queryClient.invalidateQueries({
                queryKey: queryKeys.tba.contracts(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.tba.addresses(data.networkId),
            });
        },
    });
}

export function useDeployTBAImplementationMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deployTBAImplementation,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tba.all });
            queryClient.invalidateQueries({
                queryKey: queryKeys.tba.contracts(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.tba.addresses(data.networkId),
            });
        },
    });
}

export function useSetTBAAddressMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: setTBAAddress,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tba.all });
            queryClient.invalidateQueries({
                queryKey: queryKeys.tba.contracts(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.tba.addresses(data.networkId),
            });
        },
    });
}
