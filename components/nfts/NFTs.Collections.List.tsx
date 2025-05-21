/// components/nfts/NFTs.Collections.List.tsx

import type { Collection } from "@/app/actions/factoryContracts";
import { Canvas } from "@react-three/fiber";
import { useState, useRef, use, useMemo, useCallback } from "react";
import { useGesture, WebKitGestureEvent } from "@use-gesture/react";
import NFTsCollectionsCard3DR3F from "./NFTs.Collections.Card.R3F";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useThree, useFrame } from "@react-three/fiber";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { METADATA_TYPE } from "@/app/actions/metadata";
import React from "react";

interface NFTsCollectionsListProps {
    collections: Collection[];
    initialTargetCameraZ?: number;
}

export default function NFTsCollectionsList({
    collections,
    initialTargetCameraZ = 35,
}: NFTsCollectionsListProps) {
    const [selected, setSelected] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [targetCameraZ, setTargetCameraZ] = useState(initialTargetCameraZ);
    const containerRef = useRef<HTMLDivElement>(null);

    const len = collections.length;
    const handleDrag = useCallback(
        (state: any) => {
            const {
                movement: [mx],
                last,
                event,
            } = state;
            const target = event.target as HTMLElement;

            // 카드 영역 내부에서의 드래그는 무시
            if (target.closest(".card-container")) {
                return;
            }

            const offset = mx / 120;
            if (!last) {
                setDragOffset(offset);
            } else {
                let next = Math.round(selected - offset);
                if (next < 0) next += len;
                if (next >= len) next -= len;
                setSelected(next);
                setDragOffset(0);
            }
        },
        [selected, len]
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
            setTargetCameraZ((prev) => {
                let next = prev + dy * 0.05;
                if (next < 10) next = 10;
                if (next > 100) next = 100;
                return next;
            });
        },
        []
    );

    const handlePinch = useCallback(
        ({
            event,
            offset: [d],
        }: {
            event: WheelEvent | TouchEvent | PointerEvent | WebKitGestureEvent;
            offset: [number, number];
        }) => {
            event.preventDefault();
            setTargetCameraZ((prev) => {
                let next = prev - d * 0.05;
                if (next < 10) next = 10;
                if (next > 100) next = 100;
                return next;
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

    const { baseRadius, radius, angleStep } = useMemo(() => {
        const baseRadius = 30;
        const radius = baseRadius + Math.max(0, len - 5) * 0.7;
        const angleStep = (2 * Math.PI) / len;
        return { baseRadius, radius, angleStep };
    }, [len]);

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

    const renderCollection = useCallback(
        (collection: Collection, i: number) => {
            const effectiveSelected = selected - dragOffset;
            const angle = (i - effectiveSelected) * angleStep;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius - radius;
            const rotationY = angle;

            return (
                <NFTsCollectionsCard3DR3F
                    key={i}
                    collection={collection}
                    position={[x, 0, z]}
                    rotationY={rotationY}
                    isSelected={Math.round(effectiveSelected) === i}
                    onClick={() => setSelected(i)}
                />
            );
        },
        [selected, dragOffset, angleStep, radius]
    );

    return (
        <div>
            <h2
                className={cn(
                    "text-center text-4xl",
                    "mt-[70px] md:mt-[80px] lg:mt-[20px]",
                    getResponsiveClass(45).textClass
                )}
            >
                NFTs
            </h2>
            <div
                {...bind()}
                ref={containerRef}
                style={{ width: 1000, height: 600, touchAction: "none" }}
                className="mt-[10px]"
            >
                <Canvas camera={{ position: [0, 0, targetCameraZ], fov: 40 }}>
                    <CameraLerp targetCameraZ={targetCameraZ} />
                    <ambientLight intensity={1} color="#ffffff" />
                    <directionalLight
                        position={[-4, 4.4, 12]}
                        intensity={3}
                        color="#ffffff"
                        castShadow={true}
                    />
                    <directionalLight
                        position={[4, -4.4, 12]}
                        intensity={0.1}
                        color="#ffffff"
                        castShadow={true}
                    />

                    {collections.map(renderCollection)}
                    <EffectComposer>
                        <Bloom
                            blendFunction={BlendFunction.ADD}
                            intensity={0.3}
                            luminanceThreshold={0.7}
                            luminanceSmoothing={2}
                        />
                    </EffectComposer>
                </Canvas>
            </div>
        </div>
    );
}
