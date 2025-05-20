// components/nfts/NFTs.Collections.Card.R3F.tsx

import { useEffect, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, Mesh } from "three";
import { Environment } from "@react-three/drei";

interface Card3DProps {
    imageUrl: string;
    position?: [number, number, number];
    rotationY?: number;
    isSelected?: boolean;
    onClick?: () => void;
}

function CardMesh({
    imageUrl,
    position = [0, 0, 0],
    rotationY = 0,
    isSelected = false,
    onClick,
}: Card3DProps) {
    const meshRef = useRef<Mesh>(null);
    const texture = useLoader(TextureLoader, imageUrl);
    useEffect(() => {
        if (!texture.image) return;
        const cardRatio = 4 / 3;
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

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.lerp(
                { x: position[0], y: position[1], z: position[2] },
                0.1 // lerp 속도 (0~1, 높을수록 빠름)
            );
            meshRef.current.rotation.y +=
                (rotationY - meshRef.current.rotation.y) * 0.1;
        }
        if (hovered) {
            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "default";
        }
    });

    return (
        <mesh
            ref={meshRef}
            scale={isSelected ? 1.1 : 0.8}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={onClick}
            frustumCulled={true}
        >
            <boxGeometry args={[2.4, 1.8, 0.1]} />
            <meshPhysicalMaterial
                map={texture}
                metalness={0.4}
                roughness={0.08}
                clearcoat={1}
                clearcoatRoughness={0.1}
                envMapIntensity={1.3}
                reflectivity={1}
            />
        </mesh>
    );
}

export default function NFTsCollectionsCard3DR3F({
    imageUrl,
    position,
    rotationY,
    isSelected,
    onClick,
}: {
    imageUrl: string;
    position?: [number, number, number];
    rotationY?: number;
    isSelected?: boolean;
    onClick?: () => void;
}) {
    return (
        <CardMesh
            imageUrl={imageUrl}
            position={position}
            rotationY={rotationY}
            isSelected={isSelected}
            onClick={onClick}
        />
    );
}
