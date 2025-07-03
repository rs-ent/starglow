/// components/molecules/ArtistMessage.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, easeOut, motion } from "framer-motion";

import { useArtistsGet } from "@/app/hooks/useArtists";
import ArtistMessageMessage from "@/components/artists/ArtistMessage.Message";
import PartialLoading from "@/components/atoms/PartialLoading";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import ImageViewer from "../atoms/ImageViewer";

import type {
    Artist,
    ArtistMessage as ArtistMessageType,
} from "@prisma/client";

interface ArtistMessageProps {
    artistId: string;
    className?: string;
    artist?: Artist | null;
}

// 애니메이션 설정을 상수로 분리하여 재사용
const ANIMATION_VARIANTS = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

const ANIMATION_TRANSITION = {
    duration: 0.5,
    easeOut,
};

export default function ArtistMessage({
    artistId,
    className,
    artist,
}: ArtistMessageProps) {
    const [message, setMessage] = useState<ArtistMessageType | null>(null);

    // 메모이제이션된 쿼리 입력값
    const queryInput = useMemo(
        () => ({
            getArtistMessagesInput: {
                artistId: artist?.id ?? artistId,
            },
        }),
        [artist, artistId]
    );

    // 아티스트 메시지 데이터 가져오기
    const { artistMessages, isLoading, error } = useArtistsGet(queryInput);

    // 메시지 설정 로직 최적화
    useEffect(() => {
        if (artistMessages?.length) {
            setMessage(artistMessages[0]);
        }
    }, [artistMessages]);

    // 컨테이너 클래스 메모이제이션
    const containerClasses = useMemo(
        () =>
            cn(
                "w-full flex flex-col",
                getResponsiveClass(20).gapClass,
                className
            ),
        [className]
    );

    // 메시지 컨텐츠 렌더링 최적화
    const renderMessageContent = useMemo(() => {
        if (!message) return null;

        return (
            <div className={containerClasses}>
                {message.bannerUrl && (
                    <motion.div
                        initial={ANIMATION_VARIANTS.initial}
                        animate={ANIMATION_VARIANTS.animate}
                        exit={ANIMATION_VARIANTS.exit}
                        transition={ANIMATION_TRANSITION}
                        className="w-full"
                    >
                        <ImageViewer
                            img={message.bannerUrl}
                            title={message.message}
                            showTitle={false}
                            shadowColor={
                                artist ? ArtistBG(artist, 0, 100) : undefined
                            }
                        />
                    </motion.div>
                )}
                {message.message && message.message.length > 2 && (
                    <motion.div
                        initial={ANIMATION_VARIANTS.initial}
                        animate={ANIMATION_VARIANTS.animate}
                        exit={ANIMATION_VARIANTS.exit}
                        transition={{ ...ANIMATION_TRANSITION, delay: 0.1 }}
                        className="w-full"
                    >
                        <ArtistMessageMessage message={message.message} />
                    </motion.div>
                )}
            </div>
        );
    }, [message, containerClasses, artist]);

    // 로딩 상태 메모이제이션
    const loadingElement = useMemo(
        () =>
            isLoading ? (
                <div
                    className={cn(
                        "w-full flex justify-center",
                        getResponsiveClass(30).paddingClass
                    )}
                >
                    <PartialLoading text="Loading..." />
                </div>
            ) : null,
        [isLoading]
    );

    // 에러 상태 메모이제이션
    const errorElement = useMemo(
        () =>
            error ? (
                <div
                    className={cn(
                        "w-full text-center text-red-400",
                        getResponsiveClass(15).textClass
                    )}
                >
                    Error: {error.message}
                </div>
            ) : null,
        [error]
    );

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {isLoading && <div key="loading">{loadingElement}</div>}
                {error && <div key="error">{errorElement}</div>}
                {message && (
                    <div key={`message-${message.id}`}>
                        {renderMessageContent}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
