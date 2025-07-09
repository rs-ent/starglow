/// components/admin/assets/Assets.Tutorial.Preview.tsx

"use client";

import NotifyAssetTutorialCustom from "@/components/notifications/Notify.Asset.Tutorial.Custom";

import type { TutorialPreviewProps } from "./Assets.Tutorial.Types";

export default function TutorialPreview({
    steps,
    customization,
    asset,
    isOpen,
    onClose,
}: TutorialPreviewProps) {
    // 실제 알림 컴포넌트에서 사용할 데이터 구조로 변환
    const convertedTutorial = {
        id: "preview",
        assetId: asset.id,
        steps: {
            steps: steps,
            customization: customization,
        } as any, // JsonValue 타입으로 캐스팅
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const handleComplete = () => {
        // 미리보기에서는 완료 시 단순히 닫기
        onClose();
    };

    return (
        <NotifyAssetTutorialCustom
            isOpen={isOpen}
            onClose={onClose}
            onComplete={handleComplete}
            asset={asset}
            tutorial={convertedTutorial}
        />
    );
}
