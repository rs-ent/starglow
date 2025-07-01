/// components/notifications/GlobalNotificationManager.tsx

"use client";

import { useEffect, useMemo } from "react";
import { useNotificationModals } from "@/app/hooks/useNotificationModals";
import {
    initializeModalRegistry,
    cleanupModalRegistry,
} from "./modal-adapters";

/**
 * 🔔 동적 전역 알림 관리 컴포넌트
 *
 * ✨ 새로운 기능:
 * - 자동 모달 타입 감지 및 렌더링
 * - 우선순위 기반 모달 큐 관리
 * - 확장 가능한 모달 등록 시스템
 * - 동적 모달 컴포넌트 선택
 *
 * 🚀 사용법:
 * 1. modal-adapters.tsx에 새 모달 등록
 * 2. 알림 생성 시 적절한 type/category/tags 설정
 * 3. 자동으로 매칭되는 모달이 표시됨
 */
export default function GlobalNotificationManager() {
    const { currentModal, handleModalComplete, handleModalClose } =
        useNotificationModals();

    useEffect(() => {
        initializeModalRegistry();
        return () => {
            cleanupModalRegistry();
        };
    }, []);

    const renderCurrentModal = useMemo(() => {
        if (!currentModal) return null;

        const { registration, notification, id } = currentModal;
        const ModalComponent = registration.component;

        const extraProps = registration.extraProps
            ? registration.extraProps(notification)
            : {};

        return (
            <ModalComponent
                key={`modal-${id}`}
                isOpen={true}
                notification={notification}
                onClose={() => handleModalClose(id)}
                onComplete={() => handleModalComplete(id, notification.id)}
                {...extraProps}
            />
        );
    }, [currentModal, handleModalClose, handleModalComplete]);

    return <>{renderCurrentModal}</>;
}
