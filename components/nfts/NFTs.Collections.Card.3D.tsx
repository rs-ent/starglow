/// components/nfts/NFTs.Collections.Card.3D.tsx

import type { Collection } from "@/app/actions/factoryContracts";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import ImageMetadata from "../atoms/ImageMetadata";
import { METADATA_TYPE } from "@/app/actions/metadata";

interface NFTsCollectionsCard3DProps {
    collection: Collection;
    isSelected: boolean;
    position: "center" | "left" | "right" | "far-left" | "far-right" | "hidden";
}

export default function NFTsCollectionsCard3D({
    collection,
    isSelected,
    position,
}: NFTsCollectionsCard3DProps) {
    // 3D transform 스타일 결정
    let transform = "";
    let zIndex = 1;
    let opacity = 1;
    let boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.37)";
    let extraStyle: React.CSSProperties = {};

    switch (position) {
        case "center":
            transform =
                "perspective(1200px) rotateY(0deg) scale(1.08) translateZ(60px)";
            zIndex = 5;
            boxShadow =
                "0 16px 48px 0 rgba(0,0,0,0.28), 0 0 32px 8px rgba(127,90,240,0.22)";
            extraStyle = {
                filter: "drop-shadow(0 0 32px rgba(127,90,240,0.22))",
            };
            opacity = 1;
            break;
        case "left":
            transform =
                "perspective(1200px) rotateY(-25deg) scale(0.96) translateX(-60px) translateZ(-20px)";
            zIndex = 3;
            boxShadow = "0 4px 16px 0 rgba(31, 38, 135, 0.13)";
            opacity = 0.8;
            break;
        case "right":
            transform =
                "perspective(1200px) rotateY(25deg) scale(0.96) translateX(60px) translateZ(-20px)";
            zIndex = 3;
            boxShadow = "0 4px 16px 0 rgba(31, 38, 135, 0.13)";
            opacity = 0.8;
            break;
        case "far-left":
            transform =
                "perspective(1200px) rotateY(-50deg) scale(0.90) translateX(-120px) translateZ(-60px)";
            zIndex = 2;
            opacity = 0.35;
            boxShadow = "none";
            break;
        case "far-right":
            transform =
                "perspective(1200px) rotateY(50deg) scale(0.90) translateX(120px) translateZ(-60px)";
            zIndex = 2;
            opacity = 0.35;
            boxShadow = "none";
            break;
        case "hidden":
            opacity = 0;
            zIndex = 1;
            transform = "scale(0.7)";
            boxShadow = "none";
            break;
    }

    return (
        <div
            className={cn(
                "relative max-w-[480px] mx-auto",
                "bg-gradient-to-br from-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0.2)]",
                "rounded-[12px] p-3",
                "flex items-center justify-center",
                position === "center" &&
                    "scale-[1.05] hover:shadow-[0_0_64px_0_#7f5af0cc] cursor-pointer"
            )}
            style={{
                transform,
                zIndex,
                opacity,
                boxShadow,
                pointerEvents: position === "hidden" ? "none" : "auto",
                animation:
                    position === "center"
                        ? "scale-up 2.5s ease-in-out infinite"
                        : undefined,
                animationPlayState: "running",
                ...extraStyle,
                transition:
                    "transform 0.7s cubic-bezier(0.77,0,0.18,1), " +
                    "opacity 0.5s cubic-bezier(0.77,0,0.18,1), " +
                    "box-shadow 0.7s cubic-bezier(0.77,0,0.18,1), " +
                    "filter 0.7s cubic-bezier(0.77,0,0.18,1)",
            }}
        >
            {/* 바닥 그림자 */}
            <div
                className={cn(
                    "absolute left-1/2 -translate-x-1/2 bottom-0",
                    "transition-all duration-500 ease-[cubic-bezier(0.77,0,0.18,1)]",
                    "pointer-events-none",
                    position === "center"
                        ? "bottom-[-40px] w-[70%] h-[36px] opacity-60"
                        : position === "left" || position === "right"
                        ? "bottom-[-32px] w-[60%] h-[28px] opacity-30"
                        : position === "far-left" || position === "far-right"
                        ? "bottom-[-24px] w-[50%] h-[18px] opacity-10"
                        : "hidden"
                )}
                style={{
                    background:
                        "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.01) 50%, transparent 100%)",
                    filter: "blur(2px)",
                }}
            />
            {/* 컨텐츠 */}
            <div className="w-full h-full flex flex-col items-center justify-center">
                {/* 이미지 */}
                <div className="w-full h-full">
                    <ImageMetadata
                        metadata={
                            collection.metadata?.metadata as METADATA_TYPE
                        }
                        className="w-full h-full rounded-[12px]"
                        showCustomText={true}
                        customText={collection.name}
                    />
                </div>
                {/* 텍스트 */}
                <div className="w-full h-full rounded-[12px] bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)]">
                    <div>
                        <p className={cn(getResponsiveClass(10).textClass)}>
                            Glow Chance
                        </p>
                        <h3 className={cn(getResponsiveClass(15).textClass)}>
                            Scheduled
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
