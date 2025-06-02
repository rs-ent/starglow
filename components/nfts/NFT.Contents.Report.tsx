/// components/nfts/NFT.Contents.Report.tsx

"use client";

import { METADATA_TYPE } from "@/app/actions/metadata";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import React from "react";

interface NFTContentsReportProps {
    metadata: METADATA_TYPE;
}

export default React.memo(function NFTContentsReport({
    metadata,
}: NFTContentsReportProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [fullscreenSupported, setFullscreenSupported] = useState(false);

    // 전체화면 지원 여부 감지
    useEffect(() => {
        if (typeof document !== "undefined") {
            setFullscreenSupported(!!document.fullscreenEnabled);
        }
    }, []);

    // 전체화면 요청 함수
    const handleFullScreen = useCallback(() => {
        if (iframeRef.current) {
            // 표준 FullScreen API
            if (iframeRef.current.requestFullscreen) {
                iframeRef.current.requestFullscreen();
            }
            // Safari 등 벤더 프리픽스 대응
            else if ((iframeRef.current as any).webkitRequestFullscreen) {
                (iframeRef.current as any).webkitRequestFullscreen();
            }
        }
    }, []);

    const reportUrl = metadata?.external_url;

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50">
            {/* iframe */}
            {reportUrl && (
                <div className="w-full flex flex-col items-center">
                    {fullscreenSupported && (
                        <div className="fixed top-0 right-0 p-2">
                            <img
                                src="/ui/maximize.svg"
                                alt="maximize"
                                className={cn(
                                    "opacity-50 hover:opacity-100 cursor-pointer transition-opacity duration-300",
                                    getResponsiveClass(25).frameClass
                                )}
                                onClick={handleFullScreen}
                                loading="lazy"
                            />
                        </div>
                    )}
                    <iframe
                        ref={iframeRef}
                        src={reportUrl}
                        width="100%"
                        height="800"
                        style={{
                            borderRadius: "1rem",
                            background: "transparent",
                        }}
                        title="Official Report"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            )}
        </div>
    );
});
