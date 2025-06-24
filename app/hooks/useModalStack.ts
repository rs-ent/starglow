/// app/hooks/useModalStack.ts

"use client";

import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
} from "react";
import type { ReactNode } from "react";

interface ModalState {
    modals: string[];
    activeModal: string | null;
    isInteracting: boolean;
    interactionBlockers: Set<string>;
}

type ModalAction =
    | { type: "PUSH_MODAL"; id: string }
    | { type: "POP_MODAL"; id: string }
    | { type: "SET_INTERACTING"; id: string; isInteracting: boolean }
    | { type: "CLEAR_ALL" };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case "PUSH_MODAL":
            return {
                ...state,
                modals: [...state.modals, action.id],
                activeModal: action.id,
            };

        case "POP_MODAL":
            const newModals = state.modals.filter((id) => id !== action.id);
            const newBlockers = new Set(state.interactionBlockers);
            newBlockers.delete(action.id);

            return {
                ...state,
                modals: newModals,
                activeModal: newModals[newModals.length - 1] || null,
                interactionBlockers: newBlockers,
                isInteracting: newBlockers.size > 0,
            };

        case "SET_INTERACTING":
            const updatedBlockers = new Set(state.interactionBlockers);
            if (action.isInteracting) {
                updatedBlockers.add(action.id);
            } else {
                updatedBlockers.delete(action.id);
            }

            return {
                ...state,
                interactionBlockers: updatedBlockers,
                isInteracting: updatedBlockers.size > 0,
            };

        case "CLEAR_ALL":
            return {
                modals: [],
                activeModal: null,
                isInteracting: false,
                interactionBlockers: new Set<string>(),
            };

        default:
            return state;
    }
};

interface ModalContextType {
    state: ModalState;
    dispatch: React.Dispatch<ModalAction>;
    pushModal: (id: string) => void;
    popModal: (id: string) => void;
    setInteracting: (id: string, isInteracting: boolean) => void;
    isModalBlocked: (id: string) => boolean;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(modalReducer, {
        modals: [],
        activeModal: null,
        isInteracting: false,
        interactionBlockers: new Set<string>(),
    });

    const pushModal = useCallback((id: string) => {
        dispatch({ type: "PUSH_MODAL", id });
    }, []);

    const popModal = useCallback((id: string) => {
        dispatch({ type: "POP_MODAL", id });
    }, []);

    const setInteracting = useCallback((id: string, isInteracting: boolean) => {
        dispatch({ type: "SET_INTERACTING", id, isInteracting });
    }, []);

    const isModalBlocked = useCallback(
        (id: string) => {
            return state.isInteracting && !state.interactionBlockers.has(id);
        },
        [state.isInteracting, state.interactionBlockers]
    );

    const contextValue: ModalContextType = {
        state,
        dispatch,
        pushModal,
        popModal,
        setInteracting,
        isModalBlocked,
    };

    return React.createElement(
        ModalContext.Provider,
        { value: contextValue },
        children
    );
}

export function useModalStack(): ModalContextType {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModalStack must be used within ModalProvider");
    }
    return context;
}
