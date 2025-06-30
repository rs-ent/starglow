// components/nfts/NFTs.Collections.Card.R3F.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";

import { CollectionParticipantType } from "@prisma/client";
import { animated, useSpring } from "@react-spring/three";
import { RoundedBox, Text, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, LinearFilter, Vector3 } from "three";

import { useNFT } from "@/app/story/nft/hooks";
import { formatDate } from "@/lib/utils/format";
import { useCachedTexture } from "@/lib/utils/useCachedTexture";

import type { SPG } from "@/app/story/spg/actions";
import type { Mesh } from "three";

/**
 * CardMesh 컴포넌트에 전달되는 props 타입
 */
export interface CardMeshProps {
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
    circulationLoading: boolean;
    artistName: string;
    position?: [number, number, number];
    rotationY?: number;
    isSelected?: boolean;
    onClick?: () => void;
    onBuyNowClick?: () => void;
    confirmedAlpha?: number;
    comingSoon?: boolean;
}

/**
 * NFTsCollectionsCard3DR3F 컴포넌트에 전달되는 props 타입
 */
export interface NFTsCollectionsCard3DR3FProps {
    spg: SPG;
    position?: [number, number, number];
    rotationY?: number;
    isSelected?: boolean;
    onClick?: () => void;
    onBuyNowClick?: () => void;
    confirmedAlpha?: number;
    comingSoon?: boolean;
}

const CONSTANTS = {
    CARD_RATIO: 4 / 3,
    LOGO_RATIO: 1,
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
            outlineWidth: 0.015,
            outlineColor: "#fff",
        },
        VALUE: {
            fontSize: 0.5,
            fontWeight: 700,
            outlineWidth: 0.05,
            outlineBlur: 0.3,
            outlineOpacity: 0.2,
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
            args: [5, 2.1, 0.5] as [number, number, number],
            radius: 0.2,
            smoothness: 5,
            materialProps: {
                transparent: true,
                opacity: 0.9,
                roughness: 0.1,
                metalness: 0.8,
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
            LEFT: [-2.57, 0.5, 0.15] as [number, number, number],
            RIGHT: [2.57, 0.5, 0.15] as [number, number, number],
            BOTTOM_LEFT: [-2.57, -1.8, 0.15] as [number, number, number],
            BOTTOM_RIGHT: [2.57, -1.8, 0.15] as [number, number, number],
        },
        TEXT: {
            LABEL: [0, 0.4, 0.26] as [number, number, number],
            VALUE: [0, -0.3, 0.26] as [number, number, number],
            TITLE: [0, 2.2, 0.26] as [number, number, number],
        },
        TEXT_ACCENT: {
            LABEL: [0, 0.4, 0.26] as [number, number, number],
            VALUE: [0, -0.3, 2] as [number, number, number],
            TITLE: [0, 2.5, 5] as [number, number, number],
        },
    },
} as const;

// LOD(레벨 오브 디테일) 계산 함수 분리
function getDetailLevel(
    isSelected: boolean,
    distance: number
): "high" | "medium" | "low" {
    if (isSelected) return "high";
    if (distance < 25) return "medium";
    return "low";
}

/**
 * InfoBox: 카드 하단 정보(라벨+값) 박스 컴포넌트
 */
interface InfoBoxProps {
    label: string;
    value: string | number;
    labelFont?: string;
    valueFont?: string;
    labelPosition: [number, number, number];
    valuePosition: [number, number, number];
    boxPosition: [number, number, number];
    backgroundColor: string;
    foregroundColor: string;
    isSelected: boolean;
    isLoading?: boolean;
}

const InfoBox = React.memo(function InfoBox({
    label,
    value,
    labelFont = "/fonts/suit-variable.otf",
    valueFont = "/fonts/conthrax.otf",
    labelPosition,
    valuePosition,
    boxPosition,
    backgroundColor,
    foregroundColor,
    isSelected,
    isLoading = false,
}: InfoBoxProps) {
    const LoadingDots = React.memo(function LoadingDots() {
        const { scale, opacity } = useSpring({
            from: { scale: 0.5, opacity: 0.5 },
            to: { scale: 0.5, opacity: 1 },
            loop: true,
            config: { duration: 2000 },
        });

        return (
            <group>
                {[0, 1, 2].map((i) => (
                    <animated.mesh
                        key={i}
                        position={[i * 0.3 - 0.3, 0, 0.1]}
                        scale={scale}
                    >
                        <sphereGeometry args={[0.1, 16, 16]} />
                        <animated.meshPhysicalMaterial
                            color="#ffffff"
                            transparent
                            opacity={opacity}
                            metalness={0.8}
                            roughness={0.1}
                        />
                    </animated.mesh>
                ))}
            </group>
        );
    });

    return (
        <RoundedBox {...CONSTANTS.BOX.INFO} position={boxPosition}>
            <meshPhysicalMaterial
                {...CONSTANTS.BOX.INFO.materialProps}
                color={backgroundColor}
            />
            <Text
                font={labelFont}
                position={labelPosition}
                maxWidth={10}
                {...CONSTANTS.TEXT.COMMON}
                {...CONSTANTS.TEXT.LABEL}
            >
                {label}
            </Text>
            {isLoading ? (
                <group position={valuePosition}>
                    <LoadingDots />
                </group>
            ) : (
                <Text
                    font={valueFont}
                    position={
                        isSelected
                            ? CONSTANTS.POSITION.TEXT_ACCENT.VALUE
                            : valuePosition
                    }
                    maxWidth={3}
                    color={foregroundColor}
                    outlineColor={backgroundColor}
                    {...CONSTANTS.TEXT.COMMON}
                    {...CONSTANTS.TEXT.VALUE}
                >
                    {value}
                </Text>
            )}
        </RoundedBox>
    );
});

const CardMesh = React.memo(function CardMesh({
    backgroundColor,
    foregroundColor,
    imageUrl,
    name,
    status,
    dateLabel,
    dateValue,
    remainStock,
    totalStock,
    circulationLoading,
    artistName,
    position = [0, 0, 0],
    isSelected = false,
    onClick,
    onBuyNowClick,
    confirmedAlpha = 1,
    comingSoon = false,
}: CardMeshProps) {
    const meshRef = useRef<Mesh>(null);
    const { camera } = useThree();

    const texture = useCachedTexture(imageUrl, (loadedTexture) => {
        loadedTexture.minFilter = LinearFilter;
        loadedTexture.magFilter = LinearFilter;
        loadedTexture.generateMipmaps = false;
        loadedTexture.needsUpdate = true;

        if (comingSoon) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (ctx && loadedTexture.image) {
                canvas.width = loadedTexture.image.width;
                canvas.height = loadedTexture.image.height;

                ctx.filter = "blur(8px)";
                ctx.drawImage(loadedTexture.image, 0, 0);

                // 블러 처리된 이미지로 텍스처 업데이트
                loadedTexture.image = canvas;
            }
        }
    });

    const logoTexture = useCachedTexture("/logo/3d.svg", (loadedTexture) => {
        loadedTexture.minFilter = LinearFilter;
        loadedTexture.magFilter = LinearFilter;
        loadedTexture.generateMipmaps = false;
        loadedTexture.needsUpdate = true;
    });

    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    const [detailLevel, setDetailLevel] = useState<"high" | "medium" | "low">(
        "low"
    );

    useEffect(() => {
        if (!texture?.image) return;
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

    useFrame((state) => {
        if (!meshRef.current) return;
        const meshPos = meshRef.current.getWorldPosition(new Vector3());
        const camPos = camera.position;
        const distance = meshPos.distanceTo(camPos);
        const nextLevel = getDetailLevel(isSelected, distance);
        if (detailLevel !== nextLevel) setDetailLevel(nextLevel);

        const t = state.clock.getElapsedTime();
        if (isSelected) {
            meshRef.current.position.lerp(
                { x: position[0], y: position[1], z: position[2] },
                CONSTANTS.LERP_FACTOR
            );
            if (confirmedAlpha > 0) {
                meshRef.current.position.y =
                    position[1] + Math.sin(t * 5 * confirmedAlpha) * 0.2;
            }
            let y = meshRef.current.rotation.y;
            y = ((y + Math.PI) % (2 * Math.PI)) - Math.PI;
            if (Math.abs(y) < 0.01) {
                meshRef.current.rotation.y = 0;
            } else {
                meshRef.current.rotation.y += (0 - y) * CONSTANTS.LERP_FACTOR;
            }
        } else {
            const currentX = meshRef.current.position.x;
            const currentY = meshRef.current.position.y;
            const currentZ = meshRef.current.position.z;
            if (
                Math.abs(currentX - position[0]) > 0.01 ||
                Math.abs(currentY - position[1]) > 0.01 ||
                Math.abs(currentZ - position[2]) > 0.01
            ) {
                meshRef.current.position.set(
                    position[0],
                    position[1],
                    position[2]
                );
            }
            meshRef.current.rotation.y = (t * 0.5) % (Math.PI * 2);
        }
    });

    const { scale: cardScale } = useSpring({
        scale: isSelected ? CONSTANTS.SCALE.SELECTED : CONSTANTS.SCALE.DEFAULT,
        config: {
            mass: 0.8,
            tension: 120,
            friction: 29,
        },
    });

    const handlePointerOver = () => setHovered(true);
    const handlePointerOut = () => setHovered(false);
    const handleBuyNowClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (comingSoon) return;
        onBuyNowClick?.();
    };

    const { emissiveIntensity } = useMemo(
        () => ({
            emissiveIntensity:
                detailLevel === "high"
                    ? 0.1
                    : detailLevel === "medium"
                    ? 0.05
                    : 0,
        }),
        [detailLevel]
    );

    const cardMaterialProps = useMemo(
        () => ({
            color: backgroundColor,
            transparent: true,
            opacity: 0.95,
            roughness: 0.01,
            metalness: 0.2,
            clearcoat:
                detailLevel === "high"
                    ? 1.5
                    : detailLevel === "medium"
                    ? 0.75
                    : 0.1,
            clearcoatRoughness: 0.2,
            transmission:
                detailLevel === "high"
                    ? 0.3
                    : detailLevel === "medium"
                    ? 0.15
                    : 0.05,
            ior:
                detailLevel === "high"
                    ? 2.5
                    : detailLevel === "medium"
                    ? 2.0
                    : 1.5,
            reflectivity:
                detailLevel === "high"
                    ? 0.8
                    : detailLevel === "medium"
                    ? 0.65
                    : 0.5,
            thickness: 0.5,
            emissive: backgroundColor,
            emissiveIntensity: emissiveIntensity,
            envMapIntensity:
                detailLevel === "high"
                    ? 1.2
                    : detailLevel === "medium"
                    ? 1.0
                    : 0.8,
        }),
        [backgroundColor, detailLevel, emissiveIntensity]
    );

    useEffect(() => {
        return () => {
            texture.dispose();
        };
    }, [texture]);

    const {
        scale: buyNowScale,
        opacity,
        animatedPositionY,
    } = useSpring<{
        scale: number;
        opacity: number;
        animatedPositionY: number;
    }>({
        scale: confirmedAlpha > 1 ? 1 : 0,
        opacity: confirmedAlpha > 1 ? 1 : 0,
        animatedPositionY: confirmedAlpha > 1 ? 0 : 15,
        config: {
            mass: 0.4,
            tension: 200,
            friction: 6,
        },
    });

    return (
        <animated.group
            ref={meshRef}
            scale={cardScale}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={onClick}
        >
            {/* 카드 본체 */}
            <RoundedBox {...CONSTANTS.BOX.MAIN}>
                <meshPhysicalMaterial {...cardMaterialProps} />
            </RoundedBox>
            {isSelected && (
                <animated.group
                    scale={buyNowScale}
                    position-y={animatedPositionY}
                >
                    <RoundedBox
                        args={[10.5, 3, 1]}
                        position={[0, 0, 6]}
                        rotation={[0, 0, 0]}
                        radius={0.3}
                        smoothness={5}
                        onClick={handleBuyNowClick}
                    >
                        <animated.meshPhysicalMaterial
                            color="rgb(78,59,153)"
                            transparent={true}
                            opacity={opacity}
                            metalness={0.9}
                            roughness={0.1}
                            clearcoat={2}
                            clearcoatRoughness={0.2}
                            transmission={0.2}
                            ior={1.5}
                            reflectivity={1}
                            envMapIntensity={1.5}
                            emissive="rgb(78,59,153)"
                            emissiveIntensity={opacity.to((o) => o * 1.2)}
                        />
                        <Text
                            font="/fonts/conthrax.otf"
                            position={[0, -0.1, 0.7]}
                            color="#fff"
                            fontSize={comingSoon ? 0.95 : 1.2}
                            maxWidth={10}
                            outlineWidth={0.05}
                            outlineColor="rgb(255,255,255)"
                            outlineBlur={0.8}
                            outlineOpacity={0.3}
                        >
                            {comingSoon ? "COMING SOON" : "SEE MORE"}
                        </Text>
                    </RoundedBox>
                </animated.group>
            )}
            {/* 디스플레이(이미지) */}
            <mesh position={[0, 3.3, 0.32]}>
                <planeGeometry args={[10.56, 7.92]} />
                {texture && texture.image ? (
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
                ) : (
                    <meshPhysicalMaterial
                        color="rgb(78,59,153)"
                        transparent={true}
                        opacity={0.7}
                        roughness={0.7}
                        metalness={0.1}
                        clearcoat={1}
                        clearcoatRoughness={0.8}
                    />
                )}
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
                    {/* InfoBox로 분리된 정보 박스들 */}
                    <InfoBox
                        label="Glow Chance"
                        value={status}
                        labelPosition={CONSTANTS.POSITION.TEXT.LABEL}
                        valuePosition={CONSTANTS.POSITION.TEXT.VALUE}
                        boxPosition={CONSTANTS.POSITION.INFO_BOX.LEFT}
                        backgroundColor={backgroundColor}
                        foregroundColor={foregroundColor}
                        isSelected={isSelected}
                    />
                    <InfoBox
                        label={dateLabel}
                        value={dateValue}
                        labelPosition={CONSTANTS.POSITION.TEXT.LABEL}
                        valuePosition={CONSTANTS.POSITION.TEXT.VALUE}
                        boxPosition={CONSTANTS.POSITION.INFO_BOX.RIGHT}
                        backgroundColor={backgroundColor}
                        foregroundColor={foregroundColor}
                        isSelected={isSelected}
                    />
                    <InfoBox
                        label="Stock"
                        value={`${remainStock}/${totalStock}`}
                        labelPosition={CONSTANTS.POSITION.TEXT.LABEL}
                        valuePosition={CONSTANTS.POSITION.TEXT.VALUE}
                        boxPosition={CONSTANTS.POSITION.INFO_BOX.BOTTOM_LEFT}
                        backgroundColor={backgroundColor}
                        foregroundColor={foregroundColor}
                        isSelected={isSelected}
                        isLoading={circulationLoading}
                    />
                    <InfoBox
                        label="Artist"
                        value={artistName}
                        labelPosition={CONSTANTS.POSITION.TEXT.LABEL}
                        valuePosition={CONSTANTS.POSITION.TEXT.VALUE}
                        boxPosition={CONSTANTS.POSITION.INFO_BOX.BOTTOM_RIGHT}
                        backgroundColor={backgroundColor}
                        foregroundColor={foregroundColor}
                        isSelected={isSelected}
                    />
                </RoundedBox>
            </mesh>
            <mesh position={[0, 0, -0.45]}>
                <planeGeometry args={[4.5, 4.5]} />
                {logoTexture && logoTexture.image ? (
                    <meshPhysicalMaterial
                        map={logoTexture}
                        transparent={true}
                        metalness={0.01}
                        roughness={0.1}
                        side={DoubleSide}
                    />
                ) : (
                    <meshPhysicalMaterial
                        color={foregroundColor}
                        transparent={true}
                        opacity={0.5}
                        metalness={0.01}
                        roughness={0.1}
                        side={DoubleSide}
                    />
                )}
            </mesh>
        </animated.group>
    );
});

export default React.memo(function NFTsCollectionsCard3DR3F({
    spg,
    position,
    rotationY,
    isSelected,
    onClick,
    onBuyNowClick,
    confirmedAlpha,
}: NFTsCollectionsCard3DR3FProps) {
    const { circulation, isCirculationLoading } = useNFT({
        getCirculationInput: {
            spgAddress: spg.address,
        },
    });

    const {
        backgroundColor,
        foregroundColor,
        imageUrl,
        name,
        status,
        dateLabel,
        dateValue,
        artistName,
        comingSoon,
    } = useMemo(() => {
        const now = new Date();
        const preSaleStart = spg.preOrderStart;
        const preSaleEnd = spg.preOrderEnd;
        const saleStart = spg.saleStart;
        const saleEnd = spg.saleEnd;
        const glowStart = spg.glowStart;
        const glowEnd = spg.glowEnd;

        let status = "SCHEDULED";
        let dateLabel = "Sale Open";
        let dateValue = "Unknown";
        let participantsType: CollectionParticipantType =
            CollectionParticipantType.PREREGISTRATION;

        if (glowStart && glowEnd) {
            if (now < glowStart) {
                participantsType = CollectionParticipantType.GLOW;
                status = "GLOWING";
                dateLabel = "Glow Start";
                dateValue = formatDate(glowStart, false);
            } else if (now > glowStart && now < glowEnd) {
                participantsType = CollectionParticipantType.GLOW;
                status = "GLOWING";
                dateLabel = "Glow End";
                dateValue = formatDate(glowEnd, false);
            } else {
                participantsType = CollectionParticipantType.GLOW;
                status = "GLOWED";
                dateLabel = "Glow Ended";
                dateValue = formatDate(glowEnd, false);
            }
        }

        if (saleStart && saleEnd) {
            if (now < saleStart) {
                participantsType = CollectionParticipantType.PRIVATESALE;
                status = "SCHEDULED";
                dateLabel = "Sale Open";
                dateValue = formatDate(saleStart, false);
            } else if (now > saleStart && now < saleEnd) {
                participantsType = CollectionParticipantType.PUBLICSALE;
                status = "ONGOING";
                dateLabel = "Sale End";
                dateValue = formatDate(saleEnd, false);
            }
        }

        if (preSaleStart && preSaleEnd) {
            if (now < preSaleStart) {
                participantsType = CollectionParticipantType.PREREGISTRATION;
                status = "PREORDER";
                dateLabel = "Pre Order Open";
                dateValue = formatDate(preSaleStart, false);
            } else if (now > preSaleStart && now < preSaleEnd) {
                participantsType = CollectionParticipantType.PREREGISTRATION;
                status = "PREORDER";
                dateLabel = "Pre Order End";
                dateValue = formatDate(preSaleEnd, false);
            }
        }

        const name = spg.name || "";
        const imageUrl = spg.imageUrl || "";
        const backgroundColor = spg.backgroundColor || "#05010D";
        const foregroundColor = spg.foregroundColor || "#ffffff";

        const artistName = spg.artist?.name || "";

        const comingSoon = spg.comingSoon || false;

        return {
            backgroundColor,
            foregroundColor,
            imageUrl,
            name,
            status,
            dateLabel,
            dateValue,
            participantsType,
            artistName,
            comingSoon,
        };
    }, [spg]);

    // 이벤트 핸들러 단순화 (useCallback 제거)
    return (
        <CardMesh
            backgroundColor={backgroundColor}
            foregroundColor={foregroundColor}
            imageUrl={imageUrl || ""}
            name={name}
            status={status}
            dateLabel={dateLabel}
            dateValue={dateValue}
            participants={0}
            remainStock={circulation?.remain || 0}
            totalStock={circulation?.total || 0}
            circulationLoading={isCirculationLoading}
            artistName={artistName}
            position={position}
            rotationY={rotationY}
            isSelected={isSelected}
            onClick={onClick}
            onBuyNowClick={onBuyNowClick}
            confirmedAlpha={confirmedAlpha}
            comingSoon={comingSoon}
        />
    );
});
