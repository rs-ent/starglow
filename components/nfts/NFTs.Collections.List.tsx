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
import PartialLoading from "../atoms/PartialLoading";

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

    useFrame(() => {
        if (arrowRef.current) {
            arrowRef.current.position.y =
                Math.sin(Date.now() * 0.005 * confirmedAlpha) * 0.2 +
                (9 + positionY);
            arrowRef.current.rotation.y = Date.now() * 0.005 * confirmedAlpha;
        }
    });

    const position = useMemo(() => {
        return new Vector3(0, 9 + positionY, 5);
    }, [positionY]);

    return (
        <mesh ref={arrowRef} position={position} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.6, 1.4, 4]} />
            <meshPhysicalMaterial
                color="rgb(97, 59, 150)"
                metalness={0.5}
                roughness={0.6}
                transparent
                opacity={1}
                reflectivity={0.3}
                envMapIntensity={1.5}
                emissive="rgb(107, 69, 170)"
                emissiveIntensity={0.25}
            />
        </mesh>
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

    console.log("Get SPGs Data", getSPGsData);

    const sortedSPGsData = useMemo(() => {
        if (!getSPGsData) return null;

        return getSPGsData.sort((a, b) => {
            const aIsNormal = !a.comingSoon && !a.hiddenDetails;
            const bIsNormal = !b.comingSoon && !b.hiddenDetails;

            const aIsComingSoon = a.comingSoon && !a.hiddenDetails;
            const bIsComingSoon = b.comingSoon && !b.hiddenDetails;

            const aIsHidden = a.hiddenDetails;
            const bIsHidden = b.hiddenDetails;

            if (aIsNormal && !bIsNormal) return -1;
            if (!aIsNormal && bIsNormal) return 1;

            if (aIsComingSoon && !bIsComingSoon && !bIsNormal) return -1;
            if (!aIsComingSoon && bIsComingSoon && !aIsNormal) return 1;

            if (aIsHidden && !bIsHidden && !bIsNormal && !bIsComingSoon)
                return -1;
            if (!aIsHidden && bIsHidden && !aIsNormal && !aIsComingSoon)
                return 1;

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

            const urls = (
                await Promise.all(
                    sortedSPGsData.map(async (c) => {
                        if (c.imageUrl) return c.imageUrl;
                        if (!c.contractURI) return null;

                        const contractURI = c.contractURI;
                        const metadata = await fetchURI({ uri: contractURI });
                        return metadata?.image || null;
                    })
                )
            ).filter(Boolean) as string[];
            if (cancelled) return;
            if (urls.length === 0) {
                setIsPreloaded(true);
                return;
            }
            await prefetchTextures(urls);
            if (!cancelled) setIsPreloaded(true);
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
                    <ambientLight intensity={0.1} color="#ffffab" />
                    <directionalLight
                        position={[-4, 4.4, 12]}
                        intensity={1.2}
                        color="#ffffff"
                    />
                    <directionalLight
                        position={[4, -4.4, 12]}
                        intensity={0.3}
                        color="#ffffff"
                    />
                    <pointLight
                        position={[-1.5, 20, 10]}
                        intensity={35}
                        color="#aa00ff"
                        distance={50}
                        decay={2}
                    />

                    <spotLight
                        position={[-5, -15, 10]}
                        intensity={1}
                        color="#aa00ff"
                        decay={0.1}
                    />

                    <spotLight
                        position={[0, -15, 10]}
                        intensity={1}
                        color="#00ffbb"
                        decay={0.1}
                    />
                    <spotLight
                        position={[5, -15, 10]}
                        intensity={1}
                        color="#ff00aa"
                        decay={0.1}
                    />

                    <spotLight
                        position={[20, 0, 10]}
                        intensity={1}
                        color="#ff00aa"
                        decay={0.1}
                    />

                    <spotLight
                        position={[20, 10, 10]}
                        intensity={1}
                        color="#00ffbb"
                        castShadow={true}
                        decay={0.1}
                    />

                    <spotLight
                        position={[20, -10, 10]}
                        intensity={1}
                        color="#aa00ff"
                        decay={0.1}
                    />

                    <spotLight
                        position={[-20, 0, 10]}
                        intensity={1}
                        color="#aa00ff"
                        decay={0.1}
                    />

                    <spotLight
                        position={[-20, 10, 10]}
                        intensity={1}
                        color="#aa00ff"
                        decay={0.1}
                    />

                    <spotLight
                        position={[-20, -10, 10]}
                        intensity={1}
                        color="#ff00bb"
                        decay={0.1}
                    />
                    <Arrow
                        positionY={positionY}
                        confirmedAlpha={confirmedAlpha}
                    />

                    {sortedSPGsData?.map(renderCollection)}
                </Canvas>
            ) : (
                <PartialLoading text="Loading..." />
            )}
        </div>
    );
}
