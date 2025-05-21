// components/nfts/NFTs.Collections.Card.R3F.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, Mesh, DoubleSide } from "three";
import { RoundedBox } from "@react-three/drei";
import { Text } from "@react-three/drei";
import { Collection } from "@/app/actions/factoryContracts";
import { METADATA_TYPE } from "@/app/actions/metadata";
import React from "react";

interface Card3DProps {
    backgroundColor: string;
    foregroundColor: string;
    imageUrl: string;
    name: string;
    status: string;
    dateLabel: string;
    dateValue: string;
    position?: [number, number, number];
    rotationY?: number;
    isSelected?: boolean;
    onClick?: () => void;
}

const CONSTANTS = {
    CARD_RATIO: 4 / 3,
    LERP_FACTOR: 0.1,
    SCALE: {
        SELECTED: 1.1,
        DEFAULT: 0.8,
    },
} as const;

const CardMesh = React.memo(function CardMesh({
    backgroundColor,
    foregroundColor,
    imageUrl,
    position = [0, 0, 0],
    rotationY = 0,
    isSelected = false,
    onClick,
    name,
    status = "SCHEDULED",
    dateLabel,
    dateValue,
}: Card3DProps) {
    const meshRef = useRef<Mesh>(null);
    const texture = useLoader(TextureLoader, imageUrl);

    useEffect(() => {
        if (!texture.image) return;
        const cardRatio = CONSTANTS.CARD_RATIO;
        const imageRatio = texture.image.width / texture.image.height;
        if (imageRatio > cardRatio) {
            const crop = cardRatio / imageRatio;
            texture.repeat.set(crop, 1);
            texture.offset.set((1 - crop) / 2, 0);
        } else {
            const crop = imageRatio / cardRatio;
            texture.repeat.set(1, crop);
            texture.offset.set(0, (1 - crop) / 2);
        }
        texture.needsUpdate = true;
    }, [texture]);

    const [hovered, setHovered] = useState(false);
    useEffect(() => {
        if (hovered) {
            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "default";
        }
    }, [hovered]);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.lerp(
                { x: position[0], y: position[1], z: position[2] },
                CONSTANTS.LERP_FACTOR
            );
            meshRef.current.rotation.y +=
                (rotationY - meshRef.current.rotation.y) *
                CONSTANTS.LERP_FACTOR;
        }
    });

    const scale = useMemo(() => {
        if (isSelected) return CONSTANTS.SCALE.SELECTED;
        return CONSTANTS.SCALE.DEFAULT;
    }, [isSelected]);

    const handlePointerOver = useCallback(() => setHovered(true), []);
    const handlePointerOut = useCallback(() => setHovered(false), []);

    const cardMaterialProps = useMemo(
        () => ({
            color: backgroundColor,
            transparent: true,
            opacity: 0.95,
            roughness: 0.01,
            metalness: 0.2,
            clearcoat: 1.5,
            clearcoatRoughness: 0.2,
            transmission: 0.3,
            ior: 2.5,
            emissive: backgroundColor,
            emissiveIntensity: 0.2,
            envMapIntensity: 1.2,
        }),
        [backgroundColor]
    );

    useEffect(() => {
        return () => {
            texture.dispose();
        };
    }, [texture]);

    return (
        <group
            ref={meshRef}
            scale={scale}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={onClick}
        >
            {/* 카드 본체 */}
            <RoundedBox args={[12, 16, 0.6]} radius={0.3} smoothness={5}>
                <meshPhysicalMaterial {...cardMaterialProps} />
            </RoundedBox>
            {/* 디스플레이(이미지) */}
            <mesh position={[0, 3.3, 0.31]}>
                <planeGeometry args={[10.56, 7.92]} />
                <meshPhysicalMaterial
                    map={texture}
                    transparent={true}
                    metalness={0.05}
                    roughness={0.5}
                    clearcoat={1.5}
                    clearcoatRoughness={0.1}
                    transmission={0.01}
                    ior={1}
                    envMapIntensity={0.5}
                />
            </mesh>
            {/* 디스플레이(정보) */}
            <mesh position={[0, -4.1, 0.1]}>
                <RoundedBox args={[10.7, 6.5, 0.5]} radius={0.3} smoothness={5}>
                    <meshPhysicalMaterial
                        color={backgroundColor}
                        transparent={true}
                        opacity={0.4}
                        roughness={0.8}
                        metalness={0.4}
                        clearcoat={1}
                        clearcoatRoughness={0.05}
                        transmission={0.5}
                        ior={1.7}
                    />
                    <Text
                        font="/fonts/conthrax.otf"
                        position={[0, 2.2, 0.26]}
                        fontSize={0.7}
                        color="#fff"
                        anchorX="center"
                        anchorY="middle"
                        glyphGeometryDetail={1}
                        maxWidth={10}
                    >
                        {name}
                    </Text>

                    <RoundedBox
                        args={[4.7, 2, 0.5]}
                        position={[-2.5, 0.5, 0.1]}
                        radius={0.3}
                        smoothness={5}
                    >
                        <meshPhysicalMaterial
                            color={backgroundColor}
                            transparent={true}
                            opacity={0.35}
                            roughness={0.05}
                            metalness={0.2}
                        />

                        <Text
                            font="/fonts/suit-variable.otf"
                            position={[0, 0.3, 0.26]}
                            fontSize={0.4}
                            color="#fff"
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={10}
                        >
                            Glow Chance
                        </Text>
                        <Text
                            font="/fonts/conthrax.otf"
                            position={[0, -0.4, 0.26]}
                            fontSize={0.45}
                            fontWeight={700}
                            color={foregroundColor}
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={10}
                        >
                            {status}
                        </Text>
                    </RoundedBox>

                    <RoundedBox
                        args={[4.7, 2, 0.5]}
                        position={[2.5, 0.5, 0.1]}
                        radius={0.3}
                        smoothness={5}
                    >
                        <meshPhysicalMaterial
                            color={backgroundColor}
                            transparent={true}
                            opacity={0.35}
                            roughness={0.05}
                            metalness={0.2}
                        />

                        <Text
                            font="/fonts/suit-variable.otf"
                            position={[0, 0.3, 0.26]}
                            fontSize={0.4}
                            color="#fff"
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={10}
                        >
                            {dateLabel}
                        </Text>
                        <Text
                            font="/fonts/conthrax.otf"
                            position={[0, -0.4, 0.26]}
                            fontSize={0.45}
                            fontWeight={700}
                            color={foregroundColor}
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={3}
                        >
                            {dateValue}
                        </Text>
                    </RoundedBox>

                    <RoundedBox
                        args={[4.7, 2, 0.5]}
                        position={[-2.5, -1.8, 0.1]}
                        radius={0.3}
                        smoothness={5}
                    >
                        <meshPhysicalMaterial
                            color={backgroundColor}
                            transparent={true}
                            opacity={0.35}
                            roughness={0.05}
                            metalness={0.2}
                        />

                        <Text
                            font="/fonts/suit-variable.otf"
                            position={[0, 0.3, 0.26]}
                            fontSize={0.4}
                            color="#fff"
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={10}
                        >
                            Stock
                        </Text>
                        <Text
                            font="/fonts/conthrax.otf"
                            position={[0, -0.4, 0.26]}
                            fontSize={0.45}
                            fontWeight={700}
                            color={foregroundColor}
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={3}
                        >
                            1000/1000
                        </Text>
                    </RoundedBox>

                    <RoundedBox
                        args={[4.7, 2, 0.5]}
                        position={[2.5, -1.8, 0.1]}
                        radius={0.3}
                        smoothness={5}
                    >
                        <meshPhysicalMaterial
                            color={backgroundColor}
                            transparent={true}
                            opacity={0.35}
                            roughness={0.05}
                            metalness={0.2}
                        />

                        <Text
                            font="/fonts/suit-variable.otf"
                            position={[0, 0.3, 0.26]}
                            fontSize={0.4}
                            color="#fff"
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={10}
                        >
                            Awaiters
                        </Text>
                        <Text
                            font="/fonts/conthrax.otf"
                            position={[0, -0.4, 0.26]}
                            fontSize={0.45}
                            fontWeight={700}
                            color={foregroundColor}
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={3}
                        >
                            654
                        </Text>
                    </RoundedBox>
                </RoundedBox>
            </mesh>
        </group>
    );
});

export default function NFTsCollectionsCard3DR3F({
    collection,
    position,
    rotationY,
    isSelected,
    onClick,
}: {
    collection: Collection;
    position?: [number, number, number];
    rotationY?: number;
    isSelected?: boolean;
    onClick?: () => void;
}) {
    const now = useMemo(() => new Date(), []);

    const {
        backgroundColor,
        foregroundColor,
        imageUrl,
        name,
        status,
        dateLabel,
        dateValue,
    } = useMemo(() => {
        const preSaleStart = collection.preSaleStart;
        const preSaleEnd = collection.preSaleEnd;
        const saleStart = collection.saleStart;
        const saleEnd = collection.saleEnd;
        const glowStart = collection.glowStart;
        const glowEnd = collection.glowEnd;

        let status = "SCHEDULED";
        let dateLabel = "Sale Open";
        let dateValue = "Unknown";

        if (glowStart && glowEnd) {
            if (now < glowStart) {
                status = "GLOWING";
                dateLabel = "Glow Start";
                dateValue = formatDate(glowStart.toISOString());
            } else if (now > glowStart && now < glowEnd) {
                status = "GLOWING";
                dateLabel = "Glow End";
                dateValue = formatDate(glowEnd.toISOString());
            } else {
                status = "GLOWED";
                dateLabel = "Glow Ended";
                dateValue = formatDate(glowEnd.toISOString());
            }
        }

        if (saleStart && saleEnd) {
            if (now < saleStart) {
                status = "SCHEDULED";
                dateLabel = "Sale Open";
                dateValue = formatDate(saleStart.toISOString());
            } else if (now > saleStart && now < saleEnd) {
                status = "ONGOING";
                dateLabel = "Sale End";
                dateValue = formatDate(saleEnd.toISOString());
            }
        }

        if (preSaleStart && preSaleEnd) {
            if (now < preSaleStart) {
                status = "PRE-REG";
                dateLabel = "Pre Reg Open";
                dateValue = formatDate(preSaleStart.toISOString());
            } else if (now > preSaleStart && now < preSaleEnd) {
                status = "PRE-REG";
                dateLabel = "Pre Sale End";
                dateValue = formatDate(preSaleEnd.toISOString());
            }
        }

        const metadata = collection.metadata?.metadata as METADATA_TYPE;
        const imageUrl = metadata.image || "";
        const name = collection.name || "";
        const { backgroundColor, foregroundColor } = formatColor(
            metadata.background_color || "#05010D"
        );

        return {
            backgroundColor,
            foregroundColor,
            imageUrl,
            name,
            status,
            dateLabel,
            dateValue,
        };
    }, [collection]);

    return (
        <CardMesh
            backgroundColor={backgroundColor}
            foregroundColor={foregroundColor}
            imageUrl={imageUrl}
            name={name}
            status={status}
            dateLabel={dateLabel}
            dateValue={dateValue}
            position={position}
            rotationY={rotationY}
            isSelected={isSelected}
            onClick={onClick}
        />
    );
}

/// YYYY.MM.DD
function formatDate(date: string) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const monthStr = month < 10 ? `0${month}` : month;
    const dayStr = day < 10 ? `0${day}` : day;
    return `${year}.${monthStr}.${dayStr}`;
}

function formatColor(mainColorInput: string) {
    const mainColor = mainColorInput.replace("#", "");
    const r = parseInt(mainColor.slice(0, 2), 16);
    const g = parseInt(mainColor.slice(2, 4), 16);
    const b = parseInt(mainColor.slice(4, 6), 16);

    const backgroundColor = `rgb(${r},${g},${b})`;

    // RGB를 HSL로 변환
    const [h, s, l] = rgbToHsl(r, g, b);

    // 밝기에 따라 적절한 대비 색상 선택
    const foregroundColor =
        l > 0.5
            ? hslToRgb(h, Math.min(1, s + 0.2), Math.max(0.2, l - 0.3))
            : hslToRgb(h, Math.min(1, s + 0.2), Math.min(0.8, l + 0.3));

    return { backgroundColor, foregroundColor };
}

// RGB를 HSL로 변환하는 함수
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h, s, l];
}

// HSL을 RGB로 변환하는 함수
function hslToRgb(h: number, s: number, l: number): string {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(
        b * 255
    )})`;
}
