/// components/atoms/ImagePopup.tsx

import { useEffect, useState, memo, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import CustomCarousel from "./CustomCarousel";
import PortalEnhanced from "./Portal.Enhanced";
import Image from "next/image";
import PartialLoading from "./PartialLoading";

interface ImageVideoPopupProps {
    images: string[];
    initialIndex?: number;
    onClose: () => void;
    isOpen: boolean;
}

async function getImageDimensions(imageSrc: string) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = document.createElement("img");
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
}

export default memo(function ImageVideoPopup({
    images,
    initialIndex = 0,
    onClose,
    isOpen,
}: ImageVideoPopupProps) {
    const [imageDimensions, setImageDimensions] = useState<
        { width: number; height: number }[]
    >([]);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [loadingStates, setLoadingStates] = useState<boolean[]>(
        new Array(images.length).fill(true)
    );

    // 이미지 로딩 완료 처리
    const handleImageLoad = useCallback((index: number) => {
        setLoadingStates((prev) => {
            const newStates = [...prev];
            newStates[index] = false;
            return newStates;
        });
    }, []);

    // 키보드 이벤트 처리
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    setCurrentIndex((prev) =>
                        prev > 0 ? prev - 1 : images.length - 1
                    );
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    setCurrentIndex((prev) =>
                        prev < images.length - 1 ? prev + 1 : 0
                    );
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        // 스크롤 방지
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose, images.length]);

    // 이미지 치수 로딩
    useEffect(() => {
        if (!isOpen) return;

        const fetchImageDimensions = async () => {
            try {
                const dimensions = await Promise.all(
                    images.map(getImageDimensions)
                );
                setImageDimensions(dimensions);
            } catch (error) {
                console.error("Error fetching image dimensions:", error);
                // 기본 치수 설정
                setImageDimensions(
                    images.map(() => ({ width: 1920, height: 1080 }))
                );
            }
        };

        fetchImageDimensions();
    }, [images, isOpen]);

    // 초기 인덱스 설정
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    if (!isOpen) return null;

    return (
        <PortalEnhanced layer="popup">
            <div
                className="fixed inset-0 w-screen h-screen bg-black/90 flex items-center justify-center z-50"
                onClick={(e) => {
                    // 배경 클릭 시 닫기
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    aria-label="Close gallery"
                >
                    <X className={cn(getResponsiveClass(20).frameClass)} />
                </button>

                {/* 이미지 카운터 */}
                <div
                    className={cn(
                        "absolute top-4 left-4 z-60 px-3 py-1 rounded-full bg-black/50 text-white",
                        getResponsiveClass(15).textClass
                    )}
                >
                    {currentIndex + 1} / {images.length}
                </div>

                {/* 이전/다음 버튼 (이미지가 2개 이상일 때만) */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={() =>
                                setCurrentIndex((prev) =>
                                    prev > 0 ? prev - 1 : images.length - 1
                                )
                            }
                            className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors",
                                "transition-opacity duration-300",
                                currentIndex === 0
                                    ? "opacity-0 pointer-events-none"
                                    : "opacity-100 pointer-events-auto"
                            )}
                            aria-label="Previous image"
                        >
                            <ChevronLeft
                                className={cn(
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                        </button>

                        <button
                            onClick={() =>
                                setCurrentIndex((prev) =>
                                    prev < images.length - 1 ? prev + 1 : 0
                                )
                            }
                            className={cn(
                                "absolute right-4 top-1/2 -translate-y-1/2 z-60 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors",
                                "transition-opacity duration-300",
                                currentIndex === images.length - 1
                                    ? "opacity-0 pointer-events-none"
                                    : "opacity-100 pointer-events-auto"
                            )}
                            aria-label="Next image"
                        >
                            <ChevronRight
                                className={cn(
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                        </button>
                    </>
                )}

                {/* 캐러셀 */}
                <div className="w-full h-full flex items-center justify-center">
                    <CustomCarousel
                        direction="horizontal"
                        onIndexChange={setCurrentIndex}
                        currentIndex={currentIndex}
                        showIndicators={images.length > 1}
                        indicatorClassName="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                        speed={300}
                    >
                        {images.map((image, index) => (
                            <div
                                key={index}
                                className="w-full h-full flex items-center justify-center relative"
                            >
                                {/* 로딩 스피너 */}
                                {loadingStates[index] && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PartialLoading text="Loading..." />
                                    </div>
                                )}

                                <div className="relative flex items-center justify-center">
                                    <Image
                                        src={image}
                                        alt={`Gallery image ${index + 1}`}
                                        width={
                                            imageDimensions[index]?.width ||
                                            1920
                                        }
                                        height={
                                            imageDimensions[index]?.height ||
                                            1080
                                        }
                                        className={cn(
                                            "max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300",
                                            loadingStates[index]
                                                ? "opacity-0 pointer-events-none"
                                                : "opacity-100 pointer-events-auto"
                                        )}
                                        quality={100}
                                        priority={index <= 2} // 처음 3개 이미지는 우선 로딩
                                        onLoad={() => handleImageLoad(index)}
                                        onError={() => handleImageLoad(index)}
                                        sizes="100vw"
                                        style={{
                                            maxWidth: "95vw",
                                            maxHeight: "95vh",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CustomCarousel>
                </div>
            </div>
        </PortalEnhanced>
    );
});
