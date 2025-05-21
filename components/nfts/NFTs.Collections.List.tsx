/// components/nfts/NFTs.Collections.List.tsx

import type { Collection } from "@/app/actions/factoryContracts";
import { Canvas } from "@react-three/fiber";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useGesture, WebKitGestureEvent } from "@use-gesture/react";
import NFTsCollectionsCard3DR3F from "./NFTs.Collections.Card.R3F";
import { useThree, useFrame } from "@react-three/fiber";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import React from "react";
import { Mesh } from "three";
interface NFTsCollectionsListProps {
    collections: Collection[];
    initialTargetCameraZ?: number;
}

const Arrow = React.memo(function Arrow() {
    const arrowRef = useRef<Mesh>(null);

    useFrame(() => {
        if (arrowRef.current) {
            arrowRef.current.position.y =
                Math.sin(Date.now() * 0.005) * 0.2 + 9.3;
            arrowRef.current.rotation.y = Date.now() * 0.005;
        }
    });

    return (
        <mesh ref={arrowRef} position={[0, 9.3, 5]} rotation={[Math.PI, 0, 0]}>
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
    collections,
    initialTargetCameraZ = 35,
}: NFTsCollectionsListProps) {
    const [selected, setSelected] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [targetCameraZ, setTargetCameraZ] = useState(initialTargetCameraZ);
    const [width, setWidth] = useState(900);
    const [height, setHeight] = useState(500);
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

    const { radius, angleStep } = useMemo(() => {
        const baseRadius = 30;
        const radius = baseRadius + Math.max(0, len - 5) * 0.7;
        const angleStep = (2 * Math.PI) / len;
        return { radius, angleStep };
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

    useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
            if (window.innerWidth <= 640) {
                setTargetCameraZ(55);
                setHeight(window.innerHeight - 80);
            } else if (window.innerWidth <= 1024) {
                setTargetCameraZ(50);
                setHeight(window.innerHeight - 80);
            } else {
                setTargetCameraZ(45);
                setHeight(window.innerHeight - 130);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [window.innerWidth, window.innerHeight]);

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
                NFTs
            </h2>
            <Canvas camera={{ position: [0, 0, targetCameraZ], fov: 40 }}>
                <CameraLerp targetCameraZ={targetCameraZ} />
                <ambientLight intensity={0.1} color="#ffffab" />
                <directionalLight
                    position={[-4, 4.4, 12]}
                    intensity={1.2}
                    color="#ffffff"
                    castShadow={true}
                />
                <directionalLight
                    position={[4, -4.4, 12]}
                    intensity={0.3}
                    color="#ffffff"
                    castShadow={true}
                />
                <pointLight
                    position={[-1.5, 20, 10]} // y값을 18에서 12로 낮춤
                    intensity={35}
                    color="#aa00ff"
                    castShadow={true}
                    distance={50}
                    decay={2}
                />

                <spotLight
                    position={[-5, -15, 10]}
                    intensity={1}
                    color="#aa00ff"
                    castShadow={true}
                    decay={0.1}
                />

                <spotLight
                    position={[0, -15, 10]}
                    intensity={1}
                    color="#00ffbb"
                    castShadow={true}
                    decay={0.1}
                />
                <spotLight
                    position={[5, -15, 10]}
                    intensity={1}
                    color="#ff00aa"
                    castShadow={true}
                    decay={0.1}
                />

                <spotLight
                    position={[20, 0, 10]}
                    intensity={1}
                    color="#ff00aa"
                    castShadow={true}
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
                    castShadow={true}
                    decay={0.1}
                />

                <spotLight
                    position={[-20, 0, 10]}
                    intensity={1}
                    color="#aa00ff"
                    castShadow={true}
                    decay={0.1}
                />

                <spotLight
                    position={[-20, 10, 10]}
                    intensity={1}
                    color="#aa00ff"
                    castShadow={true}
                    decay={0.1}
                />

                <spotLight
                    position={[-20, -10, 10]}
                    intensity={1}
                    color="#ff00bb"
                    castShadow={true}
                    decay={0.1}
                />
                <Arrow />

                {collections.map(renderCollection)}
            </Canvas>
        </div>
    );
}
