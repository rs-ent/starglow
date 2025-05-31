/// components/atoms/Portal.tsx

import {memo, ReactNode, useEffect, useId, useState} from "react";
import {createPortal} from "react-dom";

interface PortalProps {
    children: ReactNode;
    container?: HTMLElement | null;
    disabled?: boolean;
    onMount?: () => void;
}

/**
 * Portal 컴포넌트 - DOM 트리의 다른 부분에 자식 요소를 렌더링합니다.
 * 
 * @param children - 포털을 통해 렌더링할 React 노드
 * @param container - 포털 대상 DOM 요소 (기본값: #modal-root 또는 document.body)
 * @param disabled - true일 경우 포털을 사용하지 않고 일반 렌더링 (테스트용)
 * @param onMount - 포털이 마운트된 후 호출될 콜백 함수
 */
function Portal({ 
    children, 
    container,
    disabled = false,
    onMount
}: PortalProps) {
    const [mounted, setMounted] = useState(false);
    const id = useId();

    useEffect(() => {
        setMounted(true);
        
        // 포털이 마운트되면 콜백 호출
        if (onMount) {
            onMount();
        }

        return () => {
            // 필요한 경우 클린업 로직 추가
        };
    }, [onMount]);

    // SSR 지원: 서버에서 렌더링 중이거나 아직 마운트되지 않은 경우
    if (!mounted) return null;

    // 포털 비활성화 모드 (테스트용)
    if (disabled) {
        return <>{children}</>;
    }

    // 포털 대상 요소 결정
    // 1. 명시적으로 제공된 컨테이너
    // 2. #modal-root 요소
    // 3. document.body
    const targetElement = 
        container || 
        document.getElementById("modal-root") || 
        document.body;

    // React 19의 createPortal에 key 제공
    return createPortal(children, targetElement, id);
}

export default memo(Portal);
