// components/nfts/NFTs.Collections.Card.R3F.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, Mesh, DoubleSide, Color, MathUtils } from "three";
import { RoundedBox } from "@react-three/drei";
import { Text } from "@react-three/drei";
import { Collection } from "@/app/actions/factoryContracts";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { Environment } from "@react-three/drei";
import { useCollectionGet } from "@/app/hooks/useCollectionContracts";
import React from "react";

interface Card3DProps {
    backgroundColor: string;
    foregroundColor: string;
    imageUrl: string;
    name: string;
    status: string;
    dateLabel: string;
    dateValue: string;
    participants: number;
    remainStock: number;
    totalStock: number;
    position?: [number, number, number];
    rotationY?: number;
    isSelected?: boolean;
    onClick?: () => void;
}

const CONSTANTS = {
    CARD_RATIO: 4 / 3,
    LOGO_RATIO: 1 / 1,
    LERP_FACTOR: 0.1,
    SCALE: {
        SELECTED: 1.1,
        DEFAULT: 0.8,
    },
    TEXT: {
        TITLE: {
            fontSize: 0.7,
            outlineWidth: 0.05,
            outlineBlur: 0.5,
            outlineOpacity: 0.4,
            renderOrder: 2,
        },
        LABEL: {
            fontSize: 0.45,
            color: "#fff",
        },
        VALUE: {
            fontSize: 0.5,
            fontWeight: 700,
            outlineWidth: 0.05,
            outlineBlur: 0.6,
            outlineOpacity: 0.25,
            renderOrder: 1,
        },
        COMMON: {
            anchorX: "center" as const,
            anchorY: "middle" as const,
            glyphGeometryDetail: 4,
        },
    },
    BOX: {
        INFO: {
            args: [5, 2.1, 0.3] as [number, number, number],
            radius: 0.2,
            smoothness: 5,
            materialProps: {
                transparent: true,
                opacity: 0.1,
                roughness: 0.01,
                metalness: 1,
                color: "#000",
            },
        },
        MAIN: {
            args: [12, 16, 0.6] as [number, number, number],
            radius: 0.3,
            smoothness: 5,
        },
        DISPLAY: {
            args: [10.7, 6.5, 0.5] as [number, number, number],
            radius: 0.3,
            smoothness: 5,
            materialProps: {
                transparent: true,
                opacity: 0,
            },
        },
    },
    POSITION: {
        INFO_BOX: {
            LEFT: [-2.57, 0.5, 0.3] as [number, number, number],
            RIGHT: [2.57, 0.5, 0.3] as [number, number, number],
            BOTTOM_LEFT: [-2.57, -1.8, 0.3] as [number, number, number],
            BOTTOM_RIGHT: [2.57, -1.8, 0.3] as [number, number, number],
        },
        TEXT: {
            LABEL: [0, 0.4, 0.16] as [number, number, number],
            VALUE: [0, -0.3, 0.16] as [number, number, number],
            TITLE: [0, 2.2, 0.26] as [number, number, number],
        },
        TEXT_ACCENT: {
            LABEL: [0, 0.4, 0.16] as [number, number, number],
            VALUE: [0, -0.3, 0.26] as [number, number, number],
            TITLE: [0, 2.2, 4] as [number, number, number],
        },
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
    participants,
    remainStock,
    totalStock,
}: Card3DProps) {
    const meshRef = useRef<Mesh>(null);
    const texture = useLoader(TextureLoader, imageUrl);
    const logoTexture = useLoader(TextureLoader, "/logo/3d.svg");

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

        if (!logoTexture.image) return;
        const logoRatio = CONSTANTS.LOGO_RATIO;
        const logoImageRatio =
            logoTexture.image.width / logoTexture.image.height;
        if (logoImageRatio > logoRatio) {
            const crop = logoRatio / logoImageRatio;
            logoTexture.repeat.set(crop, 1);
            logoTexture.offset.set((1 - crop) / 2, 0);
        } else {
            const crop = logoImageRatio / logoRatio;
            logoTexture.repeat.set(1, crop);
            logoTexture.offset.set(0, (1 - crop) / 2);
        }
        logoTexture.needsUpdate = true;
    }, [texture, logoTexture]);

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
            if (isSelected) {
                // 선택된 카드만 애니메이션 + 부드러운 이동/회전
                meshRef.current.position.lerp(
                    { x: position[0], y: position[1], z: position[2] },
                    CONSTANTS.LERP_FACTOR
                );
                meshRef.current.position.y =
                    position[1] + Math.sin(Date.now() * 0.005) * 0.2;

                let y = meshRef.current.rotation.y;
                y = ((y + Math.PI) % (2 * Math.PI)) - Math.PI;
                meshRef.current.rotation.y = y;

                meshRef.current.rotation.y +=
                    (0 - meshRef.current.rotation.y) * CONSTANTS.LERP_FACTOR;

                if (Math.abs(meshRef.current.rotation.y) < 0.01) {
                    meshRef.current.rotation.y = 0;
                }
            } else {
                // 선택되지 않은 카드는 목표 위치/회전으로 "즉시" 고정
                meshRef.current.position.set(
                    position[0],
                    position[1],
                    position[2]
                );
                meshRef.current.rotation.y = Date.now() * 0.001;
            }
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
            reflectivity: 0.8,
            thickness: 0.5,
            emissive: backgroundColor,
            emissiveIntensity: 0.1,
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
        <>
            <Environment preset="city" />
            <group
                ref={meshRef}
                scale={scale}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                onClick={onClick}
            >
                {/* 카드 본체 */}
                <RoundedBox {...CONSTANTS.BOX.MAIN}>
                    <meshPhysicalMaterial {...cardMaterialProps} />
                </RoundedBox>
                {/* 디스플레이(이미지) */}
                <mesh position={[0, 3.3, 0.32]}>
                    <planeGeometry args={[10.56, 7.92]} />
                    <meshPhysicalMaterial
                        map={texture}
                        transparent={true}
                        metalness={0.1}
                        roughness={0.01}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        transmission={0.01}
                        ior={1.2}
                        reflectivity={0.6}
                        thickness={0.5}
                        envMapIntensity={1}
                    />
                </mesh>
                {/* 디스플레이(정보) */}
                <mesh position={[0, -4.1, 0.1]}>
                    <RoundedBox {...CONSTANTS.BOX.DISPLAY}>
                        <meshPhysicalMaterial
                            {...CONSTANTS.BOX.DISPLAY.materialProps}
                        />
                        <Text
                            font="/fonts/conthrax.otf"
                            position={
                                isSelected
                                    ? CONSTANTS.POSITION.TEXT_ACCENT.TITLE
                                    : CONSTANTS.POSITION.TEXT.TITLE
                            }
                            color="#fff"
                            maxWidth={10}
                            outlineColor={foregroundColor}
                            {...CONSTANTS.TEXT.COMMON}
                            {...CONSTANTS.TEXT.TITLE}
                        >
                            {name}
                        </Text>

                        <RoundedBox
                            {...CONSTANTS.BOX.INFO}
                            position={CONSTANTS.POSITION.INFO_BOX.LEFT}
                        >
                            <meshPhysicalMaterial
                                {...CONSTANTS.BOX.INFO.materialProps}
                            />
                            <Text
                                font="/fonts/suit-variable.otf"
                                position={CONSTANTS.POSITION.TEXT.LABEL}
                                maxWidth={10}
                                {...CONSTANTS.TEXT.COMMON}
                                {...CONSTANTS.TEXT.LABEL}
                            >
                                Glow Chance
                            </Text>
                            <Text
                                font="/fonts/conthrax.otf"
                                position={CONSTANTS.POSITION.TEXT.VALUE}
                                maxWidth={3}
                                color={foregroundColor}
                                outlineColor={foregroundColor}
                                {...CONSTANTS.TEXT.COMMON}
                                {...CONSTANTS.TEXT.VALUE}
                            >
                                {status}
                            </Text>
                        </RoundedBox>

                        <RoundedBox
                            {...CONSTANTS.BOX.INFO}
                            position={CONSTANTS.POSITION.INFO_BOX.RIGHT}
                        >
                            <meshPhysicalMaterial
                                {...CONSTANTS.BOX.INFO.materialProps}
                            />
                            <Text
                                font="/fonts/suit-variable.otf"
                                position={CONSTANTS.POSITION.TEXT.LABEL}
                                maxWidth={10}
                                {...CONSTANTS.TEXT.COMMON}
                                {...CONSTANTS.TEXT.LABEL}
                            >
                                {dateLabel}
                            </Text>
                            <Text
                                font="/fonts/conthrax.otf"
                                position={CONSTANTS.POSITION.TEXT.VALUE}
                                maxWidth={3}
                                color={foregroundColor}
                                outlineColor={foregroundColor}
                                {...CONSTANTS.TEXT.COMMON}
                                {...CONSTANTS.TEXT.VALUE}
                            >
                                {dateValue}
                            </Text>
                        </RoundedBox>

                        <RoundedBox
                            {...CONSTANTS.BOX.INFO}
                            position={CONSTANTS.POSITION.INFO_BOX.BOTTOM_LEFT}
                        >
                            <meshPhysicalMaterial
                                {...CONSTANTS.BOX.INFO.materialProps}
                            />
                            <Text
                                font="/fonts/suit-variable.otf"
                                position={CONSTANTS.POSITION.TEXT.LABEL}
                                maxWidth={10}
                                {...CONSTANTS.TEXT.COMMON}
                                {...CONSTANTS.TEXT.LABEL}
                            >
                                Stock
                            </Text>
                            <Text
                                font="/fonts/conthrax.otf"
                                position={CONSTANTS.POSITION.TEXT.VALUE}
                                maxWidth={3}
                                color={foregroundColor}
                                outlineColor={foregroundColor}
                                {...CONSTANTS.TEXT.COMMON}
                                {...CONSTANTS.TEXT.VALUE}
                            >
                                {remainStock}/{totalStock}
                            </Text>
                        </RoundedBox>

                        <RoundedBox
                            {...CONSTANTS.BOX.INFO}
                            position={CONSTANTS.POSITION.INFO_BOX.BOTTOM_RIGHT}
                        >
                            <meshPhysicalMaterial
                                {...CONSTANTS.BOX.INFO.materialProps}
                            />
                            <Text
                                font="/fonts/suit-variable.otf"
                                position={CONSTANTS.POSITION.TEXT.LABEL}
                                maxWidth={10}
                                {...CONSTANTS.TEXT.COMMON}
                                {...CONSTANTS.TEXT.LABEL}
                            >
                                Awaiters
                            </Text>
                            <Text
                                font="/fonts/conthrax.otf"
                                position={CONSTANTS.POSITION.TEXT.VALUE}
                                maxWidth={3}
                                color={foregroundColor}
                                outlineColor={foregroundColor}
                                {...CONSTANTS.TEXT.COMMON}
                                {...CONSTANTS.TEXT.VALUE}
                            >
                                {participants}
                            </Text>
                        </RoundedBox>
                    </RoundedBox>
                </mesh>
                // 카드 뒷면 로고+배경
                <group position={[0, 0, -0.25]}>
                    {/* 반투명 원형 배경 */}
                    <mesh>
                        <circleGeometry args={[2.8, 64]} />
                        <meshPhysicalMaterial
                            color={backgroundColor}
                            transparent={true}
                            opacity={0.35}
                            roughness={0.5}
                            metalness={0.2}
                            side={DoubleSide}
                        />
                    </mesh>
                    {/* 글로우 효과용 mesh (emissive) */}
                    <mesh position={[0, 0, -0.1]}>
                        <circleGeometry args={[4, 64]} />
                        <meshPhysicalMaterial
                            color={foregroundColor}
                            transparent={true}
                            opacity={0.18}
                            emissive={foregroundColor}
                            emissiveIntensity={0.7}
                            side={DoubleSide}
                        />
                    </mesh>
                    {/* 로고 */}
                    <mesh position={[0, 0, -0.15]}>
                        <planeGeometry args={[4.5, 4.5]} />
                        <meshPhysicalMaterial
                            map={logoTexture}
                            transparent={true}
                            metalness={0.01}
                            roughness={0.1}
                            side={DoubleSide}
                            emissive={foregroundColor}
                            emissiveIntensity={0.25}
                        />
                    </mesh>
                </group>
            </group>
        </>
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

    const { collectionStock } = useCollectionGet({
        collectionAddress: collection.address,
    });

    return (
        <CardMesh
            backgroundColor={backgroundColor}
            foregroundColor={foregroundColor}
            imageUrl={imageUrl}
            name={name}
            status={status}
            dateLabel={dateLabel}
            dateValue={dateValue}
            participants={0}
            remainStock={collectionStock?.remain || 0}
            totalStock={collectionStock?.total || 0}
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
