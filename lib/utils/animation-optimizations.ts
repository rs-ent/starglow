// 애니메이션 성능 최적화 관련 유틸리티

export const ANIMATION_VARIANTS = {
    modal: {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] },
    },
    backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 },
    },
    content: {
        initial: {
            opacity: 0,
            transform: "perspective(1200px) rotateX(-20deg) scale(0.9)",
        },
        animate: {
            opacity: 1,
            transform: "perspective(1200px) rotateX(0deg) scale(1)",
        },
        exit: {
            opacity: 0,
            transform: "perspective(1200px) rotateX(-20deg) scale(0.9)",
        },
        transition: { duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
    },
};

// 파티클 애니메이션을 위한 최적화된 설정
export const generateParticleConfig = (
    index: number,
    totalParticles: number = 36
) => {
    const angle = (360 / totalParticles) * index + Math.random() * 10; // 약간의 랜덤성 추가
    const startRadius = 20 + Math.random() * 20;
    const endRadius = 80 + Math.random() * 100;
    const delay = 0.1 + (index / totalParticles) * 0.4; // 순차적 지연

    return {
        angle,
        startRadius,
        endRadius,
        delay,
        duration: 1 + Math.random() * 0.5,
    };
};

// will-change 속성을 동적으로 관리하는 훅
export const useWillChange = (isAnimating: boolean) => {
    return isAnimating ? "transform, opacity" : "auto";
};

// 리듀스드 모션 감지
export const useReducedMotion = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
