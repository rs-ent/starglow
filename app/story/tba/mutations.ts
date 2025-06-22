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
        onSuccess: (data) => {
            queryClient
                .invalidateQueries({ queryKey: queryKeys.tba.all })
                .catch(console.error);
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.tba.contracts(),
                })
                .catch(console.error);
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.tba.addresses(data.networkId),
                })
                .catch(console.error);
        },
        onError: (error) => {
            console.error(error);
        },
    });
}

export function useDeployTBAImplementationMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deployTBAImplementation,
        onSuccess: (data) => {
            queryClient
                .invalidateQueries({ queryKey: queryKeys.tba.all })
                .catch(console.error);
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.tba.contracts(),
                })
                .catch(console.error);
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.tba.addresses(data.networkId),
                })
                .catch(console.error);
        },
        onError: (error) => {
            console.error(error);
        },
    });
}

export function useSetTBAAddressMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: setTBAAddress,
        onSuccess: (data) => {
            queryClient
                .invalidateQueries({ queryKey: queryKeys.tba.all })
                .catch(console.error);
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.tba.contracts(),
                })
                .catch(console.error);
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.tba.addresses(data.networkId),
                })
                .catch(console.error);
        },
        onError: (error) => {
            console.error(error);
        },
    });
}
