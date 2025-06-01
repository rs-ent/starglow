/// components/organisms/Quests.Private.tsx

"use client";

import {memo, useCallback, useMemo, useState} from "react";
import {Artist, Player, QuestLog, ReferralLog} from "@prisma/client";
import ArtistMessage from "../artists/ArtistMessage";
import ArtistSlideSelector from "../artists/ArtistSlideSelector";
import QuestsArtistMissions from "./Quests.Contents.Private.ArtistMissions";
import {useArtistsGet} from "@/app/hooks/useArtists";
import {cn} from "@/lib/utils/tailwind";
import {User} from "next-auth";
import {ArtistBG} from "@/lib/utils/get/artist-colors";
import PartialLoading from "../atoms/PartialLoading";
import {AnimatePresence, motion} from "framer-motion";

interface QuestsPrivateProps {
    user: User | null;
    player: Player | null;
    questLogs: QuestLog[];
    privateTabClicked: boolean;
    referralLogs?: ReferralLog[];
}

function QuestsPrivate({
    user,
    player,
    questLogs,
    referralLogs,
}: QuestsPrivateProps) {
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    
    const {
        tokenGatingResult,
        isTokenGatingLoading,
    } = useArtistsGet({
        getTokenGatingInput: {
            artist: selectedArtist,
            userId: user?.id || null,
        },
    });

    // 아티스트 선택 핸들러 메모이제이션
    const handleArtistSelect = useCallback((artist: Artist | null) => {
        setSelectedArtist(artist);
    }, []);

    // 배경 스타일 메모이제이션
    const backgroundStyle = useMemo(() => {
        if (!selectedArtist) {
            return {
                background: `linear-gradient(to bottom right, rgba(109,40,217,0.4), rgba(109,40,217,0.15))`,
            };
        }
        
        return {
            background: `linear-gradient(to bottom right, ${ArtistBG(selectedArtist, 0, 100)}, ${ArtistBG(selectedArtist, 1, 100)})`,
        };
    }, [selectedArtist]);

    // 애니메이션 변수 - 컴포넌트 외부로 이동하여 리렌더링 방지
    const animations = useMemo(() => ({
        contentVariants: {
            hidden: { opacity: 0, y: 20 },
            visible: { 
                opacity: 1, 
                y: 0,
                transition: { 
                    duration: 0.5,
                    staggerChildren: 0.1
                }
            },
            exit: { 
                opacity: 0, 
                y: -20,
                transition: { duration: 0.3 } 
            }
        },
        selectorVariants: {
            hidden: { opacity: 0, y: -10 },
            visible: { 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.4 }
            }
        }
    }), []);

    // 로딩 상태 메모이제이션
    const isLoading = useMemo(() => 
        isTokenGatingLoading && !!selectedArtist,
    [isTokenGatingLoading, selectedArtist]);

    // 컨텐츠 표시 조건 메모이제이션
    const shouldShowContent = useMemo(() => 
        selectedArtist && !isTokenGatingLoading,
    [selectedArtist, isTokenGatingLoading]);

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <motion.div 
                className="w-full flex items-center justify-center"
                variants={animations.selectorVariants}
                initial="hidden"
                animate="visible"
            >
                <ArtistSlideSelector
                    className="mt-[10px] sm:mt-[15px] md:mt-[20px] lg:mt-[25px] xl:mt-[30px]"
                    onSelect={handleArtistSelect}
                />
            </motion.div>
            
            {/* 로딩 상태 표시 */}
            {isLoading && (
                <div className="w-full h-full flex items-center justify-center my-6">
                    <PartialLoading text="Authenticating..." size="sm" />
                </div>
            )}
            
            {/* 배경 그라데이션 - 성능 최적화를 위해 조건부 스타일 적용 */}
            <div
                className={cn(
                    "fixed inset-0 w-screen h-screen -z-50",
                    "transition-opacity duration-[2000ms] ease-in-out",
                    selectedArtist ? "opacity-100" : "opacity-0"
                )}
                style={backgroundStyle}
            />
            
            {/* 아티스트 콘텐츠 - AnimatePresence로 애니메이션 최적화 */}
            <AnimatePresence mode="wait">
                {shouldShowContent && selectedArtist && (
                    <motion.div 
                        className="relative w-full h-full"
                        key={selectedArtist.id}
                        variants={animations.contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="w-full h-full z-0 relative">
                            <motion.div
                                variants={animations.contentVariants}
                                className={cn(
                                    "mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]",
                                    "flex items-center justify-center"
                                )}
                            >
                                <ArtistMessage
                                    artistId={selectedArtist.id}
                                />
                            </motion.div>
                            
                            <motion.div
                                variants={animations.contentVariants}
                                className={cn(
                                    "w-full h-full",
                                    "mt-[20px] sm:mt-[35px] md:mt-[40px] lg:mt-[45px] xl:mt-[50px]"
                                )}
                            >
                                <QuestsArtistMissions
                                    artist={selectedArtist}
                                    player={player}
                                    questLogs={questLogs}
                                    tokenGatingResult={tokenGatingResult}
                                    referralLogs={referralLogs || []}
                                    bgColorFrom={ArtistBG(selectedArtist, 2, 100)}
                                    bgColorTo={ArtistBG(selectedArtist, 0, 100)}
                                    showInviteFriends={true}
                                    bgColorFromInviteFriends={ArtistBG(selectedArtist, 2, 100)}
                                    bgColorToInviteFriends={ArtistBG(selectedArtist, 3, 100)}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default memo(QuestsPrivate);
