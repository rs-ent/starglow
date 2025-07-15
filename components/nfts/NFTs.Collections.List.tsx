/// components/nfts/NFTs.Collections.List.tsx

import React, {
    useState,
    useRef,
    useMemo,
    useCallback,
    useEffect,
} from "react";

import { Environment } from "@react-three/drei";
import { useThree, useFrame, Canvas } from "@react-three/fiber";
import { useGesture } from "@use-gesture/react";
import { Vector3 } from "three";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import NFTsCollectionsCard3DR3F from "./NFTs.Collections.Card.R3F";

import type { SPG } from "@/app/story/spg/actions";
import type { WebKitGestureEvent } from "@use-gesture/react";
import type { Mesh } from "three";
import { useSPG } from "@/app/story/spg/hooks";
import { fetchURI } from "@/app/story/metadata/actions";
import { prefetchTextures } from "@/lib/utils/useCachedTexture";

interface NFTsCollectionsListProps {
    initialTargetCameraZ?: number;
    onBuyNowClick: (spg: SPG) => void;
}

const Arrow = React.memo(function Arrow({
    positionY,
    confirmedAlpha,
}: {
    positionY: number;
    confirmedAlpha: number;
}) {
    const arrowRef = useRef<Mesh>(null);
    const glowRef = useRef<Mesh>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        if (arrowRef.current) {
            arrowRef.current.position.y =
                Math.sin(t * 2 * confirmedAlpha) * 0.3 + (9 + positionY);
            arrowRef.current.rotation.y = t * 0.8 * confirmedAlpha;
            arrowRef.current.rotation.z = Math.sin(t * 3) * 0.1;
        }

        if (glowRef.current) {
            glowRef.current.position.y =
                Math.sin(t * 2 * confirmedAlpha) * 0.3 + (9 + positionY);
            glowRef.current.rotation.y = t * 0.8 * confirmedAlpha;
            glowRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.1);
        }
    });

    const position = useMemo(() => {
        return new Vector3(0, 9 + positionY, 5);
    }, [positionY]);

    return (
        <group position={position}>
            {/* 메인 화살표 */}
            <mesh ref={arrowRef} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.6, 1.4, 6]} />
                <meshPhysicalMaterial
                    color="rgb(147, 99, 200)"
                    metalness={0.8}
                    roughness={0.2}
                    transparent
                    opacity={1}
                    reflectivity={0.6}
                    envMapIntensity={1.8}
                    emissive="rgb(127, 79, 180)"
                    emissiveIntensity={0.4}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>

            {/* 글로우 효과 */}
            <mesh ref={glowRef} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.8, 1.6, 6]} />
                <meshPhysicalMaterial
                    color="rgb(167, 119, 220)"
                    metalness={0.1}
                    roughness={0.8}
                    transparent
                    opacity={0.3}
                    emissive="rgb(147, 99, 200)"
                    emissiveIntensity={0.6}
                />
            </mesh>
        </group>
    );
});

export default function NFTsCollectionsList({
    onBuyNowClick,
    initialTargetCameraZ = 35,
}: NFTsCollectionsListProps) {
    // 모든 훅을 최상단에서 호출
    const [selected, setSelected] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [targetCameraZ, setTargetCameraZ] = useState(initialTargetCameraZ);
    const [cameraZByWidth, setCameraZByWidth] = useState(initialTargetCameraZ);
    const [width, setWidth] = useState(900);
    const [height, setHeight] = useState(500);
    const [positionY, setPositionY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPinching, setIsPinching] = useState(false);
    const [confirmedAlpha, setConfirmedAlpha] = useState(1);
    const [isPreloaded, setIsPreloaded] = useState(false);

    const { getSPGsData } = useSPG({
        getSPGsInput: { isListed: true },
    });

    const sortedSPGsData = useMemo(() => {
        if (!getSPGsData) return null;

        return [...getSPGsData].sort((a, b) => {
            // 상태 우선순위: normal > comingSoon > hidden
            const getPriority = (item: SPG) => {
                if (!item.comingSoon && !item.hiddenDetails) return 0; // normal
                if (item.comingSoon && !item.hiddenDetails) return 1; // comingSoon
                if (item.hiddenDetails) return 2; // hidden
                return 3; // fallback
            };

            const aPriority = getPriority(a);
            const bPriority = getPriority(b);

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            // 같은 우선순위 내에서는 이름순 정렬
            return a.name.localeCompare(b.name);
        });
    }, [getSPGsData]);

    const handleDrag = useCallback(
        (state: any) => {
            if (isPinching || !sortedSPGsData) {
                return;
            }
            const len = sortedSPGsData.length;
            const {
                movement: [mx],
                last,
            } = state;
            const offset = mx / 120;
            if (!last) {
                setDragOffset(offset);
            } else {
                let next = Math.round(selected - offset);
                if (next < 0) next += len;
                if (next >= len) next -= len;
                setSelected(next);
                setDragOffset(0);
                setConfirmedAlpha(1);
            }
        },
        [selected, sortedSPGsData, isPinching]
    );

    const handleWheel = useCallback(
        ({
            event,
            delta: [, dy],
        }: {
            event: WheelEvent;
            delta: [number, number];
        }) => {
            event.preventDefault();

            if (!sortedSPGsData) return;

            const len = sortedSPGsData.length;
            if (Math.abs(dy) > 0.5) {
                // 최소 임계값으로 민감도 조절
                let nextSelected = selected;

                if (dy > 0) {
                    // 마우스휠 아래로 굴리기 → 다음 카드
                    nextSelected = (selected + 1) % len;
                } else {
                    // 마우스휠 위로 굴리기 → 이전 카드
                    nextSelected = selected === 0 ? len - 1 : selected - 1;
                }

                setSelected(nextSelected);
                setConfirmedAlpha(1);
                setTargetCameraZ(cameraZByWidth);
            }
        },
        [selected, sortedSPGsData, cameraZByWidth]
    );
    const handlePinch = useCallback(
        ({
            event,
            movement: [md],
            first,
            last,
        }: {
            event: WheelEvent | TouchEvent | PointerEvent | WebKitGestureEvent;
            movement: [number, number];
            first: boolean;
            last: boolean;
        }) => {
            event.preventDefault();
            if (first) {
                setIsPinching(true);
            } else if (last) {
                setIsPinching(false);
            }
            setTargetCameraZ((prev) => {
                return Math.min(
                    Math.max(prev - (md - 1) * (md < 1 ? 3 : 1.5), 10),
                    100
                );
            });
        },
        []
    );
    const bind = useGesture(
        {
            onDrag: handleDrag,
            onWheel: handleWheel,
            onPinch: handlePinch,
        },
        {
            eventOptions: { passive: false },
        }
    );
    const { radius, angleStep } = useMemo(() => {
        const baseRadius = 30;
        if (!sortedSPGsData) return { radius: baseRadius, angleStep: 0 };

        const len = sortedSPGsData.length;
        const radius = baseRadius + Math.max(0, len - 5) * 0.7;
        const angleStep = (2 * Math.PI) / len;
        return { radius, angleStep };
    }, [sortedSPGsData]);

    const CameraLerp = React.memo(function CameraLerp({
        targetCameraZ,
    }: {
        targetCameraZ: number;
    }) {
        const { camera } = useThree();
        useFrame(() => {
            camera.position.z += (targetCameraZ - camera.position.z) * 0.1;
        });
        return null;
    });

    const handleClickCollection = useCallback(
        (collectionId: string, buyNowClicked: boolean) => {
            if (!sortedSPGsData) return;

            const index = sortedSPGsData.findIndex(
                (c) => c.id === collectionId
            );
            if (buyNowClicked && index !== -1) {
                const cameraZ = 5;
                setTargetCameraZ(cameraZ);
                onBuyNowClick(sortedSPGsData[index]);
            }
            if (selected === index) {
                if (!buyNowClicked && confirmedAlpha > 1) {
                    setConfirmedAlpha(1);
                    setTargetCameraZ(cameraZByWidth);
                } else {
                    const cameraZ = cameraZByWidth - 9;
                    setTargetCameraZ(cameraZ);
                    setConfirmedAlpha(2.5);
                }
            }
        },
        [
            sortedSPGsData,
            selected,
            confirmedAlpha,
            onBuyNowClick,
            cameraZByWidth,
        ]
    );

    const renderCollection = useCallback(
        (spg: SPG, i: number) => {
            const effectiveSelected = selected - dragOffset;
            const angle = (i - effectiveSelected) * angleStep;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius - radius;
            const rotationY = angle;
            return (
                <NFTsCollectionsCard3DR3F
                    key={i}
                    spg={spg}
                    position={[x, positionY, z]}
                    rotationY={rotationY}
                    isSelected={Math.round(effectiveSelected) === i}
                    onClick={() => handleClickCollection(spg.id, false)}
                    onBuyNowClick={() => handleClickCollection(spg.id, true)}
                    confirmedAlpha={confirmedAlpha}
                />
            );
        },
        [
            selected,
            dragOffset,
            angleStep,
            radius,
            positionY,
            confirmedAlpha,
            handleClickCollection,
        ]
    );

    useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
            if (window.innerWidth <= 640) {
                setTargetCameraZ(40);
                setCameraZByWidth(40);
                setPositionY(1.5);
                setHeight(window.innerHeight - 80);
            } else if (window.innerWidth <= 1024) {
                setTargetCameraZ(45);
                setCameraZByWidth(45);
                setPositionY(2);
                setHeight(window.innerHeight - 80);
            } else {
                setTargetCameraZ(45);
                setCameraZByWidth(45);
                setPositionY(1);
                setHeight(window.innerHeight - 130);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function preload() {
            if (!sortedSPGsData) {
                setIsPreloaded(true);
                return;
            }

            // 우선순위 기반 로딩: normal > comingSoon > hidden
            const prioritizedData = sortedSPGsData.slice().sort((a, b) => {
                const getPriority = (item: SPG) => {
                    if (!item.comingSoon && !item.hiddenDetails) return 0;
                    if (item.comingSoon && !item.hiddenDetails) return 1;
                    return 2;
                };
                return getPriority(a) - getPriority(b);
            });

            const urls = (
                await Promise.all(
                    prioritizedData.map(async (c) => {
                        if (c.imageUrl) return c.imageUrl;
                        if (!c.contractURI) return null;

                        try {
                            const contractURI = c.contractURI;
                            const metadata = await fetchURI({
                                uri: contractURI,
                            });
                            return metadata?.image || null;
                        } catch (error) {
                            console.warn(
                                `Failed to fetch metadata for ${c.name}:`,
                                error
                            );
                            return null;
                        }
                    })
                )
            ).filter(Boolean) as string[];

            if (cancelled) return;

            if (urls.length === 0) {
                setIsPreloaded(true);
                return;
            }

            try {
                // 중요한 텍스처 먼저 로딩 (처음 5개)
                const priorityUrls = urls.slice(0, 5);
                const remainingUrls = urls.slice(5);

                // 우선순위 텍스처 로딩
                await prefetchTextures(priorityUrls);

                if (!cancelled) {
                    setIsPreloaded(true);

                    // 나머지 텍스처는 백그라운드에서 로딩
                    if (remainingUrls.length > 0) {
                        prefetchTextures(remainingUrls).catch((error) => {
                            console.warn(
                                "Background texture loading failed:",
                                error
                            );
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to preload priority textures:", error);
                // 오류가 발생해도 UI를 표시하되, 개별 텍스처 로딩에 의존
                if (!cancelled) setIsPreloaded(true);
            }
        }

        void preload();
        return () => {
            cancelled = true;
        };
    }, [sortedSPGsData]);

    return (
        <div
            {...bind()}
            ref={containerRef}
            style={{ width: width, height: height, touchAction: "none" }}
        >
            <h2
                className={cn(
                    "text-center text-4xl",
                    "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                    getResponsiveClass(45).textClass
                )}
            >
                Glow
            </h2>

            <p
                className={cn(
                    "text-center text-[rgba(255,255,255,0.8)]",
                    getResponsiveClass(10).textClass
                )}
            >
                GLOW AND GROW WITH YOUR STAR
            </p>
            {isPreloaded ? (
                <Canvas
                    camera={{ position: [0, 0, targetCameraZ], fov: 40 }}
                    style={{
                        width: "100%",
                        display: "block",
                    }}
                >
                    <Environment preset="city" />
                    <CameraLerp targetCameraZ={targetCameraZ} />

                    {/* 전체 조명 */}
                    <ambientLight intensity={0.15} color="#f0f0ff" />

                    {/* 메인 조명 */}
                    <directionalLight
                        position={[-6, 8, 15]}
                        intensity={1.8}
                        color="#ffffff"
                        castShadow={true}
                    />
                    <directionalLight
                        position={[6, -6, 15]}
                        intensity={0.6}
                        color="#e0e0ff"
                    />

                    {/* 키 포인트 라이트 */}
                    <pointLight
                        position={[0, 25, 12]}
                        intensity={40}
                        color="#9d4edd"
                        distance={60}
                        decay={1.5}
                    />

                    {/* 하단 스포트라이트 - 더 조화로운 색상 */}
                    <spotLight
                        position={[-8, -18, 12]}
                        intensity={1.2}
                        color="#c77dff"
                        decay={0.08}
                        angle={Math.PI / 6}
                    />
                    <spotLight
                        position={[0, -18, 12]}
                        intensity={1.2}
                        color="#7209b7"
                        decay={0.08}
                        angle={Math.PI / 6}
                    />
                    <spotLight
                        position={[8, -18, 12]}
                        intensity={1.2}
                        color="#480ca8"
                        decay={0.08}
                        angle={Math.PI / 6}
                    />

                    {/* 사이드 라이트 */}
                    <spotLight
                        position={[25, 0, 12]}
                        intensity={0.8}
                        color="#b388ff"
                        decay={0.06}
                        angle={Math.PI / 4}
                    />
                    <spotLight
                        position={[-25, 0, 12]}
                        intensity={0.8}
                        color="#e1bee7"
                        decay={0.06}
                        angle={Math.PI / 4}
                    />

                    {/* 상단 액센트 라이트 */}
                    <spotLight
                        position={[15, 15, 12]}
                        intensity={0.6}
                        color="#ce93d8"
                        decay={0.05}
                        angle={Math.PI / 3}
                    />
                    <spotLight
                        position={[-15, 15, 12]}
                        intensity={0.6}
                        color="#ba68c8"
                        decay={0.05}
                        angle={Math.PI / 3}
                    />
                    <Arrow
                        positionY={positionY}
                        confirmedAlpha={confirmedAlpha}
                    />

                    {sortedSPGsData?.map(renderCollection)}
                </Canvas>
            ) : (
                <div
                    className="flex flex-col items-center justify-center"
                    style={{ height: height }}
                >
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-purple-500/20 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500 rounded-full animate-spin border-t-transparent"></div>
                        <div className="absolute inset-2 w-20 h-20 border-2 border-cyan-400/40 rounded-full animate-ping"></div>
                    </div>
                    <div className="mt-8 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">
                            Loading Glows
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Preparing your stellar experience...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
