/// components/nfts/NFT.Contents.Report.tsx

"use client";

import Image from "next/image";
import { Collection } from "@/app/actions/factoryContracts";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { H2, H3 } from "../atoms/Typography";
import {
    Globe,
    ExternalLink,
    Share2,
    CircleDollarSign,
    Calendar,
    Users,
} from "lucide-react";
import { useMemo } from "react";

interface NFTContentsReportProps {
    collection: Collection;
    metadata: METADATA_TYPE;
}

export default function NFTContentsReport({
    collection,
    metadata,
}: NFTContentsReportProps) {
    const { reportUrl } = useMemo(() => {
        const reportUrl = metadata?.external_url;

        return { reportUrl };
    }, [metadata]);

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50">
            {/* Collection Info */}
            <div className="p-4 sm:p-6 md:p-8">
                {/* iframe */}
                {reportUrl && (
                    <div className="flex justify-center mb-6 md:mb-8">
                        <iframe
                            src={reportUrl}
                            width="100%"
                            height="600"
                            style={{
                                borderRadius: "1rem",
                                background: "transparent",
                            }}
                            title="Official Report"
                            allowFullScreen
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
