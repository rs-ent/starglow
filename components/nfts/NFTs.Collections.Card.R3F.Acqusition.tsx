/// components/nfts/NFTs.Collections.Card.R3F.Acqusition.tsx

import React, { useEffect, useMemo, useRef } from "react";

import { RoundedBox, Text, OrbitControls, Sparkles } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useSession } from "next-auth/react";
import { TextureLoader, DoubleSide, LinearFilter } from "three";

import { formatDate } from "@/lib/utils/format";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";

import type { SPG } from "@/app/story/spg/actions";
import type { Mesh } from "three";
interface NFTsCollectionsCardR3FAcqusitionProps {
    spg: SPG;
}

export default function NFTsCollectionsCardR3FAcqusition({
    spg,
}: NFTsCollectionsCardR3FAcqusitionProps) {
    const { data: session } = useSession();
    const user = session?.user;
    const player = session?.player;

    const meshRef = useRef<Mesh>(null);
    const hologramRef = useRef<Mesh>(null);

    const { artist, backgroundColor, foregroundColor } = useMemo(() => {
        const artist = spg?.artist;
        const backgroundColor =
            spg?.backgroundColor ||
            (artist ? ArtistBG(artist, 0, 100) : "#5B21B6");
        const foregroundColor =
            spg?.foregroundColor ||
            (artist ? ArtistFG(artist, 0, 100) : "#FFFFFF");
        return { artist, backgroundColor, foregroundColor };
    }, [spg]);

    const texture = useLoader(
        TextureLoader,
        spg?.imageUrl || "/placeholder.png"
    );
    const logoTexture = useLoader(TextureLoader, "/logo/3d.svg");

    const now = new Date();

    // 텍스처 품질 개선
    useEffect(() => {
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;

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

        if (!logoTexture.image) return;
        const logoRatio = 1;
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

    // 부드러운 회전과 애니메이션
    useFrame((state) => {
        if (meshRef.current) {
            // floating 애니메이션
            meshRef.current.position.y =
                Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }

        // 홀로그램 애니메이션
        if (hologramRef.current) {
            hologramRef.current.rotation.z = state.clock.elapsedTime * 0.5;
        }
    });

    return (
        <>
            {/* OrbitControls로 마우스/터치 상호작용 처리 */}
            <OrbitControls
                enableZoom={true}
                enablePan={false}
                enableRotate={true}
                zoomSpeed={0.5}
                rotateSpeed={0.8}
                minDistance={30}
                maxDistance={60}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.5}
            />

            {/* NFTs.Collections.List와 유사한 조명 설정 */}
            <ambientLight intensity={0.2} color="#ffffab" />
            <directionalLight
                position={[-4, 4.4, 12]}
                intensity={1.5}
                color="#ffffff"
            />
            <directionalLight
                position={[4, -4.4, 12]}
                intensity={0.5}
                color="#ffffff"
            />

            {/* 메인 포인트 라이트 - 홀로그램 효과 강화 */}
            <pointLight
                position={[-1.5, 10, 5]}
                intensity={30}
                color="#aa00ff"
                distance={30}
                decay={2}
            />

            {/* 화려한 스포트라이트들 - 강도 증가 */}
            <spotLight
                position={[-3, -8, 5]}
                intensity={1.5}
                color="#aa00ff"
                angle={0.6}
                penumbra={0.5}
                decay={0.1}
            />
            <spotLight
                position={[0, -8, 5]}
                intensity={1.5}
                color="#00ffbb"
                angle={0.6}
                penumbra={0.5}
                decay={0.1}
            />
            <spotLight
                position={[3, -8, 5]}
                intensity={1.5}
                color="#ff00aa"
                angle={0.6}
                penumbra={0.5}
                decay={0.1}
            />

            {/* 측면 조명 */}
            <spotLight
                position={[8, 0, 5]}
                intensity={1}
                color="#ff00aa"
                angle={0.8}
                penumbra={0.7}
                decay={0.1}
            />
            <spotLight
                position={[-8, 0, 5]}
                intensity={1}
                color="#aa00ff"
                angle={0.8}
                penumbra={0.7}
                decay={0.1}
            />

            <group ref={meshRef}>
                {/* 반짝이는 파티클 효과 */}
                <Sparkles
                    count={200}
                    scale={40}
                    size={6}
                    speed={0.8}
                    opacity={0.6}
                    color={backgroundColor}
                />

                {/* 카드 본체 - 홀로그램 효과 강화 */}
                <RoundedBox args={[18, 25.2, 0.3]} radius={0.15} smoothness={5}>
                    <meshPhysicalMaterial
                        color={backgroundColor}
                        transparent={true}
                        opacity={0.9}
                        metalness={0.6}
                        roughness={0.01}
                        clearcoat={1.2}
                        clearcoatRoughness={0.2}
                        reflectivity={0.9}
                        iridescence={1}
                        iridescenceIOR={1.8}
                        iridescenceThicknessRange={[100, 800]}
                        sheen={1}
                        sheenRoughness={0.1}
                        sheenColor="#ff00ff"
                        transmission={0.2}
                        thickness={0.5}
                        envMapIntensity={3}
                        emissive={backgroundColor}
                        emissiveIntensity={0.1}
                    />
                </RoundedBox>

                {/* 카드 이미지 - 4:3 비율 */}
                <mesh position={[0, 5.5, 0.16]}>
                    <planeGeometry args={[15.6, 11.7]} />
                    <meshPhysicalMaterial
                        map={texture}
                        metalness={0.4}
                        roughness={0.1}
                        clearcoat={1}
                        clearcoatRoughness={0}
                        transparent
                        emissive="#ffffff"
                        emissiveIntensity={0.05}
                        emissiveMap={texture}
                    />
                </mesh>

                {/* 추가 글로우 효과 */}
                <mesh position={[0, 5.5, 0.18]}>
                    <planeGeometry args={[15.6, 11.7]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.1}
                        blending={2} // Additive blending
                    />
                </mesh>

                <Text
                    font="/fonts/conthrax.otf"
                    position={[0, -3.5, 0.16]}
                    fontSize={0.6}
                    color={foregroundColor}
                    outlineWidth={0.03}
                    outlineColor={backgroundColor}
                    outlineBlur={0.3}
                    outlineOpacity={0.2}
                    anchorX="center"
                    anchorY="middle"
                >
                    {artist?.name || " "}
                </Text>

                {/* 카드 타이틀 - 더 빛나게 */}
                <Text
                    font="/fonts/conthrax.otf"
                    position={[0, -5, 0.16]}
                    fontSize={1}
                    color={foregroundColor}
                    outlineWidth={0.03}
                    outlineColor={backgroundColor}
                    outlineBlur={0.3}
                    outlineOpacity={0.2}
                    anchorX="center"
                    anchorY="middle"
                >
                    {spg.name}
                </Text>

                <Text
                    font="/fonts/conthrax.otf"
                    position={[0, -9.8, 0.16]}
                    fontSize={0.3}
                    color={foregroundColor}
                    outlineWidth={0.03}
                    outlineColor={backgroundColor}
                    outlineBlur={0.3}
                    outlineOpacity={0.2}
                    anchorX="center"
                    anchorY="middle"
                >
                    {player?.nickname || user?.name || user?.email || " "}
                </Text>

                <Text
                    font="/fonts/conthrax.otf"
                    position={[0, -10.5, 0.16]}
                    fontSize={0.3}
                    color={foregroundColor}
                    outlineWidth={0.03}
                    outlineColor={backgroundColor}
                    outlineBlur={0.3}
                    outlineOpacity={0.2}
                    anchorX="center"
                    anchorY="middle"
                >
                    {formatDate(now)}
                </Text>

                <mesh position={[0, 0, -0.16]}>
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
        </>
    );
}
