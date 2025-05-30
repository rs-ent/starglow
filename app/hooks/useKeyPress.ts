/// app/hooks/useKeyPress.ts

"use client";

import {useCallback, useEffect} from "react";

/**
 * 특정 키가 눌렸을 때 콜백 함수를 실행하는 커스텀 훅
 * 
 * @param targetKey - 감지할 키 (예: "Escape", "ArrowRight")
 * @param callback - 키가 눌렸을 때 실행할 콜백 함수
 * @param options - 추가 옵션 (preventDefault, stopPropagation 등)
 */
export function useKeyPress(
    targetKey: string | string[],
    callback: () => void,
    options: {
        preventDefault?: boolean;
        stopPropagation?: boolean;
        enabled?: boolean;
        keyEvent?: "keydown" | "keyup" | "keypress";
    } = {}
) {
    const {
        preventDefault = false,
        stopPropagation = false,
        enabled = true,
        keyEvent = "keydown"
    } = options;

    // 키 이벤트 핸들러
    const handleKeyEvent = useCallback(
        (event: KeyboardEvent) => {
            // 비활성화된 경우 실행하지 않음
            if (!enabled) return;

            const keys = Array.isArray(targetKey) ? targetKey : [targetKey];
            
            // 대상 키가 눌렸는지 확인
            if (keys.includes(event.key)) {
                // 이벤트 기본 동작 방지 (옵션에 따라)
                if (preventDefault) {
                    event.preventDefault();
                }
                
                // 이벤트 전파 중단 (옵션에 따라)
                if (stopPropagation) {
                    event.stopPropagation();
                }
                
                // 콜백 함수 실행
                callback();
            }
        },
        [targetKey, callback, enabled, preventDefault, stopPropagation]
    );

    // 이벤트 리스너 등록 및 해제
    useEffect(() => {
        // 비활성화된 경우 이벤트 리스너를 등록하지 않음
        if (!enabled) return;
        
        // 이벤트 리스너 등록
        window.addEventListener(keyEvent, handleKeyEvent);
        
        // 컴포넌트 언마운트 시 이벤트 리스너 해제
        return () => {
            window.removeEventListener(keyEvent, handleKeyEvent);
        };
    }, [keyEvent, handleKeyEvent, enabled]);
}

/**
 * 여러 키 조합을 한 번에 처리하는 훅
 * 
 * @param keyMap - 키와 콜백 함수의 맵
 * @param options - 추가 옵션
 */
export function useKeyPressMap(
    keyMap: Record<string, () => void>,
    options: {
        preventDefault?: boolean;
        stopPropagation?: boolean;
        enabled?: boolean;
        keyEvent?: "keydown" | "keyup" | "keypress";
    } = {}
) {
    const {
        preventDefault = false,
        stopPropagation = false,
        enabled = true,
        keyEvent = "keydown"
    } = options;

    // 키 이벤트 핸들러
    const handleKeyEvent = useCallback(
        (event: KeyboardEvent) => {
            // 비활성화된 경우 실행하지 않음
            if (!enabled) return;
            
            // 눌린 키에 해당하는 콜백 함수가 있는지 확인
            const callback = keyMap[event.key];
            
            if (callback) {
                // 이벤트 기본 동작 방지 (옵션에 따라)
                if (preventDefault) {
                    event.preventDefault();
                }
                
                // 이벤트 전파 중단 (옵션에 따라)
                if (stopPropagation) {
                    event.stopPropagation();
                }
                
                // 콜백 함수 실행
                callback();
            }
        },
        [keyMap, enabled, preventDefault, stopPropagation]
    );

    // 이벤트 리스너 등록 및 해제
    useEffect(() => {
        // 비활성화된 경우 이벤트 리스너를 등록하지 않음
        if (!enabled) return;
        
        // 이벤트 리스너 등록
        window.addEventListener(keyEvent, handleKeyEvent);
        
        // 컴포넌트 언마운트 시 이벤트 리스너 해제
        return () => {
            window.removeEventListener(keyEvent, handleKeyEvent);
        };
    }, [keyEvent, handleKeyEvent, enabled]);
}

