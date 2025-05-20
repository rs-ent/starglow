/// components/nfts/NFTs.Collections.List.tsx

import type { Collection } from "@/app/actions/factoryContracts";
import { Canvas } from "@react-three/fiber";
import { useState, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import NFTsCollectionsCard3DR3F from "./NFTs.Collections.Card.R3F";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Environment } from "@react-three/drei";

interface NFTsCollectionsListProps {
    collections: Collection[];
}

export default function NFTsCollectionsList({
    collections,
}: NFTsCollectionsListProps) {
    const [selected, setSelected] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // 카드 개수
    const len = collections.length;

    // 제스처 핸들러
    const bind = useGesture(
        {
            onDrag: ({ movement: [mx], last }) => {
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
            onWheel: ({ delta: [, dy] }) => {
                setSelected((prev) => {
                    let next = prev + (dy > 0 ? 1 : -1);
                    if (next < 0) next += len;
                    if (next >= len) next -= len;
                    return next;
                });
            },
        },
        {
            eventOptions: { passive: false },
        }
    );

    // 3D 원호에 카드 배치
    const baseRadius = 6;
    const radius = baseRadius + Math.max(0, len - 5) * 0.7;
    const angleStep = (2 * Math.PI) / len;

    return (
        <div
            {...bind()}
            ref={containerRef}
            style={{ width: 800, height: 500, touchAction: "none" }}
        >
            <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
                <Environment preset="city" />
                <ambientLight intensity={5} />
                <directionalLight position={[0, 5, 10]} intensity={0.7} />
                {(() => {
                    const effectiveSelected = selected - dragOffset;
                    const angle =
                        (Math.round(effectiveSelected) - effectiveSelected) *
                        angleStep;
                    const x = Math.sin(angle) * radius;
                    const z = Math.cos(angle) * radius - radius;
                    return (
                        <>
                            <spotLight
                                position={[x, 8, z + 8]}
                                angle={0.8}
                                penumbra={1}
                                intensity={2}
                                color="#fffbe6"
                                castShadow={true}
                            />
                            <pointLight
                                position={[x - 2, 2, z]}
                                intensity={2}
                                color="#fb7185"
                                distance={3}
                                castShadow={true}
                            />
                            <pointLight
                                position={[x + 2, 2, z]}
                                intensity={2}
                                color="#818cf8"
                                distance={3}
                                castShadow={true}
                            />
                        </>
                    );
                })()}
                {collections.map((collection, i) => {
                    const effectiveSelected = selected - dragOffset;
                    const angle = (i - effectiveSelected) * angleStep;
                    const x = Math.sin(angle) * radius;
                    const z = Math.cos(angle) * radius - radius;
                    const rotationY = angle;

                    const status = "SCHEDULED";
                    return (
                        <NFTsCollectionsCard3DR3F
                            key={i}
                            imageUrl={
                                (
                                    collection.metadata?.metadata as {
                                        image?: string;
                                    }
                                )?.image || ""
                            }
                            position={[x, 0, z]}
                            rotationY={rotationY}
                            isSelected={Math.round(effectiveSelected) === i}
                            onClick={() => setSelected(i)}
                        />
                    );
                })}
                <EffectComposer>
                    <Bloom
                        blendFunction={BlendFunction.ADD}
                        intensity={0.2}
                        luminanceThreshold={0.9}
                        luminanceSmoothing={0.8}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
