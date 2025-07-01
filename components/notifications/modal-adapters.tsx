"use client";

import { registerModal } from "@/app/hooks/useNotificationModals";
import {
    type ModalComponentProps,
    unregisterModal,
} from "@/app/hooks/useNotificationModals";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";

import NotifyWalletsBackup from "./Notify.Wallets.Backup";
import NotifyPollsBettingResult from "./Notify.Polls.Betting.Result";

const WalletBackupModalAdapter = ({
    isOpen,
    onClose,
    onComplete,
    notification,
}: ModalComponentProps) => {
    const walletAddress = notification.entityId || "";

    return (
        <NotifyWalletsBackup
            isOpen={isOpen}
            onClose={onClose}
            onComplete={onComplete}
            walletAddress={walletAddress}
        />
    );
};

const BettingResultModalAdapter = ({
    isOpen,
    onClose,
    notification,
}: ModalComponentProps) => {
    return (
        <NotifyPollsBettingResult
            isOpen={isOpen}
            onClose={onClose}
            notification={notification}
        />
    );
};

export function initializeModalRegistry() {
    registerModal("wallet-backup", {
        component: WalletBackupModalAdapter,
        filter: {
            types: ["ACCOUNT_SECURITY"],
            categories: ["SYSTEM"],
            entityTypes: ["wallet"],
            tags: ["backup"],
        },
        priority: 100,
        showCondition: () => true,
        extraProps: (notification: NotificationWithEntity) => ({
            walletAddress: notification.entityId,
        }),
    });

    registerModal("betting-success", {
        component: BettingResultModalAdapter,
        filter: {
            types: ["BETTING_SUCCESS"],
            categories: ["BETTING"],
        },
        priority: 80,
        showCondition: (notification: NotificationWithEntity) => {
            return (
                notification.betAmount !== undefined &&
                notification.betAmount > 0
            );
        },
    });

    registerModal("betting-win", {
        component: BettingResultModalAdapter,
        filter: {
            types: ["POLL_BETTING_WIN"],
            categories: ["BETTING"],
        },
        priority: 90,
        showCondition: (notification: NotificationWithEntity) => {
            return (
                notification.winAmount !== undefined &&
                notification.winAmount > 0
            );
        },
    });

    registerModal("betting-refund", {
        component: BettingResultModalAdapter,
        filter: {
            types: ["POLL_BETTING_REFUND"],
            categories: ["BETTING"],
        },
        priority: 85,
        showCondition: (notification: NotificationWithEntity) => {
            return (
                notification.rewardAmount !== undefined &&
                notification.rewardAmount > 0
            );
        },
    });

    registerModal("betting-failed", {
        component: BettingResultModalAdapter,
        filter: {
            types: ["BETTING_FAILED"],
            categories: ["BETTING"],
        },
        priority: 70,
        showCondition: () => true,
    });

    registerModal("poll-result", {
        component: BettingResultModalAdapter,
        filter: {
            types: ["POLL_RESULT_ANNOUNCED"],
            categories: ["POLLS"],
        },
        priority: 60,
        showCondition: (notification: NotificationWithEntity) => {
            const entityData = notification.entityData as any;
            return entityData?.userParticipated === true;
        },
    });

    registerModal("settlement-complete", {
        component: BettingResultModalAdapter,
        filter: {
            types: ["SETTLEMENT_COMPLETE"],
            categories: ["BETTING"],
        },
        priority: 75,
    });
}

export function cleanupModalRegistry() {
    const modalIds = [
        "wallet-backup",
        "betting-success",
        "betting-win",
        "betting-refund",
        "betting-failed",
        "poll-result",
        "settlement-complete",
    ];

    modalIds.forEach((id) => unregisterModal(id));
}
