/// components/molecules/ArtistMessage.tsx

"use client";

import {ArtistMessage as ArtistMessageType} from "@prisma/client";
import ArtistMessageMessage from "@/components/artists/ArtistMessage.Message";
import {useArtistsGet} from "@/app/hooks/useArtists";
import {useEffect, useMemo, useState} from "react";
import PartialLoading from "@/components/atoms/PartialLoading";
import ImageViewer from "../atoms/ImageViewer";
import {cn} from "@/lib/utils/tailwind";
import {AnimatePresence, motion} from "framer-motion";

interface ArtistMessageProps {
    artistId: string;
    className?: string;
}

// 애니메이션 설정을 상수로 분리하여 재사용
const ANIMATION_VARIANTS = {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 },
};

const ANIMATION_TRANSITION = {
    duration: 0.6,
    ease: "easeOut",
};

export default function ArtistMessage({
    artistId,
    className,
}: ArtistMessageProps) {
    const [message, setMessage] = useState<ArtistMessageType | null>(null);
    const [isReady, setIsReady] = useState(false);

    // 메모이제이션된 쿼리 입력값
    const queryInput = useMemo(() => ({
        getArtistMessagesInput: {
            artistId: artistId,
        },
    }), [artistId]);

    // 아티스트 메시지 데이터 가져오기
    const { artistMessages, isLoading, error } = useArtistsGet(queryInput);

    // 메시지 설정 로직 최적화
    useEffect(() => {
        if (artistMessages?.length) {
            setMessage(artistMessages[0]);
        }
    }, [artistMessages]);

    // 준비 상태 설정 로직 최적화
    useEffect(() => {
        if (message && !isLoading) {
            setIsReady(true);
        } else {
            setIsReady(false);
        }
    }, [message, isLoading]);

    // 컨테이너 클래스 메모이제이션
    const containerClasses = useMemo(() => cn(
        "max-w-[1000px] w-screen overflow-hidden px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px] h-auto",
        "flex flex-col gap-2",
        className
    ), [className]);

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
                    >
                        <ImageViewer
                            img={message.bannerUrl}
                            title={message.message}
                            framePadding={1}
                            showTitle={false}
                        />
                    </motion.div>
                )}
                <ArtistMessageMessage message={message.message} />
            </div>
        );
    }, [message, containerClasses]);

    // 로딩 상태 메모이제이션
    const loadingElement = useMemo(() => 
        isLoading ? <PartialLoading text="Loading..." size="sm" /> : null,
    [isLoading]);

    // 에러 상태 메모이제이션
    const errorElement = useMemo(() => 
        error ? <div>Error: {error.message}</div> : null,
    [error]);

    return (
        <AnimatePresence>
            {loadingElement}
            {errorElement}
            {message && renderMessageContent}
        </AnimatePresence>
    );
}