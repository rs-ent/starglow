"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNotifications } from "./useNotifications";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";
import type { NotificationFilter } from "./useNotifications";

export interface ModalComponentProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    notification: NotificationWithEntity;
    [key: string]: any;
}

export interface ModalRegistration {
    component: React.ComponentType<ModalComponentProps>;
    filter: NotificationFilter;
    priority: number;
    showCondition?: (notification: NotificationWithEntity) => boolean;
    extraProps?: (notification: NotificationWithEntity) => Record<string, any>;
}

export interface NotificationModalConfig {
    id: string;
    notification: NotificationWithEntity;
    priority: number;
}

class NotificationModalRegistry {
    private static instance: NotificationModalRegistry;
    private modals: Map<string, ModalRegistration> = new Map();

    static getInstance(): NotificationModalRegistry {
        if (!NotificationModalRegistry.instance) {
            NotificationModalRegistry.instance =
                new NotificationModalRegistry();
        }
        return NotificationModalRegistry.instance;
    }

    register(id: string, registration: ModalRegistration): void {
        this.modals.set(id, registration);
    }

    unregister(id: string): void {
        this.modals.delete(id);
    }

    getAll(): Map<string, ModalRegistration> {
        return new Map(this.modals);
    }

    findMatchingModals(
        notification: NotificationWithEntity
    ): Array<{ id: string; registration: ModalRegistration }> {
        const matches = [];

        for (const [id, registration] of this.modals.entries()) {
            if (this.isMatch(notification, registration)) {
                matches.push({ id, registration });
            }
        }

        return matches.sort(
            (a, b) => b.registration.priority - a.registration.priority
        );
    }

    private isMatch(
        notification: NotificationWithEntity,
        registration: ModalRegistration
    ): boolean {
        const { filter, showCondition } = registration;

        if (filter.types && !filter.types.includes(notification.type)) {
            return false;
        }

        if (
            filter.categories &&
            !filter.categories.includes(notification.category)
        ) {
            return false;
        }

        if (
            filter.entityTypes &&
            notification.entityType &&
            !filter.entityTypes.includes(notification.entityType)
        ) {
            return false;
        }

        if (filter.tags) {
            const hasTag = filter.tags.some((tag) =>
                notification.tags.includes(tag)
            );
            if (!hasTag) {
                return false;
            }
        }

        if (filter.customFilter && !filter.customFilter(notification)) {
            return false;
        }

        if (showCondition && !showCondition(notification)) {
            return false;
        }

        return true;
    }
}

export function useNotificationModals() {
    const { notifications, markAsRead } = useNotifications();
    const [modalQueue, setModalQueue] = useState<NotificationModalConfig[]>([]);
    const registry = useMemo(() => NotificationModalRegistry.getInstance(), []);

    const addToModalQueue = useCallback((config: NotificationModalConfig) => {
        setModalQueue((prev) => {
            const exists = prev.some((item) => item.id === config.id);
            if (exists) return prev;

            const newQueue = [...prev, config].sort(
                (a, b) => b.priority - a.priority
            );
            return newQueue;
        });
    }, []);

    const removeFromModalQueue = useCallback((configId: string) => {
        setModalQueue((prev) =>
            prev.filter((config) => config.id !== configId)
        );
    }, []);

    useEffect(() => {
        for (const notification of notifications) {
            const matchingModals = registry.findMatchingModals(notification);

            for (const { id, registration } of matchingModals) {
                const configId = `${id}-${notification.id}`;

                addToModalQueue({
                    id: configId,
                    notification,
                    priority: registration.priority,
                });

                break;
            }
        }
    }, [notifications, registry, addToModalQueue]);

    const currentModal = useMemo(() => {
        if (modalQueue.length === 0) return null;

        const config = modalQueue[0];
        const matchingModals = registry.findMatchingModals(config.notification);

        if (matchingModals.length === 0) return null;

        const { id, registration } = matchingModals[0];

        return {
            id: config.id,
            modalId: id,
            registration,
            notification: config.notification,
        };
    }, [modalQueue, registry]);

    const handleModalComplete = async (
        configId: string,
        notificationId: string
    ) => {
        await markAsRead(notificationId);
        removeFromModalQueue(configId);
    };

    const handleModalClose = (configId: string) => {
        removeFromModalQueue(configId);
    };

    return {
        currentModal,
        modalQueue,
        handleModalComplete,
        handleModalClose,
        registry,
    };
}

export const registerModal = (id: string, registration: ModalRegistration) => {
    const registry = NotificationModalRegistry.getInstance();
    registry.register(id, registration);
};

export const unregisterModal = (id: string) => {
    const registry = NotificationModalRegistry.getInstance();
    registry.unregister(id);
};
