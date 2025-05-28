"use client";

import Image from "next/image";
import { Events } from "@prisma/client";
import { H2, H3 } from "../atoms/Typography";
import { useState } from "react";
import {
    Calendar,
    MapPin,
    User,
    Clock,
    Tag,
    Link as LinkIcon,
    Globe,
} from "lucide-react";

type EventDescriptionProps = {
    event: Pick<
        Events,
        | "id"
        | "title"
        | "description"
        | "bannerImg"
        | "galleryImgs"
        | "detailImg"
        | "startDate"
        | "endDate"
        | "location"
        | "locationAddress"
        | "artist"
        | "category"
        | "status"
        | "content"
        | "url"
        | "tags"
    >;
};

export default function EventDescription({ event }: EventDescriptionProps) {
    // 언어 선택 상태 추가
    const [language, setLanguage] = useState<"en" | "ko">("en");

    // 사용 가능한 언어 확인
    const availableLanguages = {
        content: event.content
            ? Object.keys(event.content as Record<string, any>)
            : [],
        detailImg: event.detailImg
            ? Object.keys(event.detailImg as Record<string, any>)
            : [],
    };

    const hasMultipleLanguages =
        availableLanguages.content.length > 1 ||
        availableLanguages.detailImg.length > 1;

    // Format date for display
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get content based on selected language
    const getContent = () => {
        if (!event.content) return null;

        const content = event.content as Record<string, string>;
        // 선택한 언어의 콘텐츠가 없으면 다른 언어 시도
        return (
            content[language] ||
            content[language === "en" ? "ko" : "en"] ||
            Object.values(content)[0] ||
            null
        );
    };

    const eventContent = getContent();

    // 이미지 URL 가져오기
    const getDetailImageUrl = () => {
        if (!event.detailImg) return "";

        const detailImg = event.detailImg as Record<string, string>;
        // 선택한 언어의 이미지가 없으면 다른 언어 시도
        return (
            detailImg[language] ||
            detailImg[language === "en" ? "ko" : "en"] ||
            Object.values(detailImg)[0] ||
            ""
        );
    };

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50">
            {/* Banner Image */}
            <div className="relative w-full h-60 sm:h-72 md:h-96">
                {event.bannerImg ? (
                    <Image
                        src={event.bannerImg}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 66vw"
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                        <p className="text-foreground/50 font-main">
                            No image available
                        </p>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>

                {/* Status badge on top-right */}
                <div className="absolute top-4 right-4">
                    <StatusBadge status={event.status} />
                </div>
            </div>

            {/* Event Info */}
            <div className="p-4 sm:p-6 md:p-8">
                <H2 className="text-xl md:text-2xl lg:text-3xl mb-4 break-words">
                    {event.title}
                </H2>

                {/* Key info row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
                    <div className="flex items-center text-foreground/70 text-sm md:text-base">
                        <Calendar className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                        <span className="truncate">
                            {formatDate(event.startDate)}
                        </span>
                    </div>

                    {event.endDate &&
                        event.endDate.toString() !==
                            event.startDate.toString() && (
                            <div className="flex items-center text-foreground/70 text-sm md:text-base">
                                <Clock className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                                <span className="truncate">
                                    Until {formatDate(event.endDate)}
                                </span>
                            </div>
                        )}

                    {event.location && (
                        <div className="flex items-center text-foreground/70 text-sm md:text-base">
                            <MapPin className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}

                    {event.artist && (
                        <div className="flex items-center text-foreground/70 text-sm md:text-base">
                            <User className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            <span className="truncate">{event.artist}</span>
                        </div>
                    )}

                    {event.url && (
                        <div className="flex items-center text-foreground/70 text-sm md:text-base">
                            <LinkIcon className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            <a
                                href={event.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                            >
                                Official Website
                            </a>
                        </div>
                    )}

                    {event.category && (
                        <div className="flex items-center text-foreground/70 text-sm md:text-base">
                            <Tag className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            <span className="capitalize truncate">
                                {event.category}
                            </span>
                        </div>
                    )}
                </div>

                {/* Description */}
                {event.description && (
                    <div className="mb-6 md:mb-8">
                        <H3 className="mb-2 md:mb-3 text-lg md:text-xl">
                            Description
                        </H3>
                        <p className="text-sm md:text-base text-foreground/80 whitespace-pre-line">
                            {event.description}
                        </p>
                    </div>
                )}

                {/* Language Selector */}
                {hasMultipleLanguages && (
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex items-center text-foreground/70 text-sm">
                            <Globe className="w-4 h-4 mr-1 text-primary" />
                            <span>Language:</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`px-2 py-1 text-xs rounded ${
                                    language === "en"
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "bg-secondary/30 text-foreground/60 border border-border/30"
                                }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage("ko")}
                                className={`px-2 py-1 text-xs rounded ${
                                    language === "ko"
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "bg-secondary/30 text-foreground/60 border border-border/30"
                                }`}
                            >
                                한국어
                            </button>
                        </div>
                    </div>
                )}

                {/* Full content */}
                {(eventContent || event.detailImg) && (
                    <div className="mb-6 md:mb-8">
                        <H3 className="font-accent mb-2 md:mb-3 text-lg md:text-xl">
                            Details
                        </H3>
                        <div className="border-t border-border/50 py-4" />
                        <div>
                            {event.detailImg && (
                                <Image
                                    src={getDetailImageUrl()}
                                    alt={event.title}
                                    width={1000}
                                    height={1000}
                                    className="w-full h-auto rounded-lg mb-10"
                                />
                            )}
                        </div>
                        {eventContent && (
                            <div
                                className="text-sm md:text-base text-foreground/80 prose prose-invert max-w-none prose-img:rounded-lg prose-img:mx-auto prose-headings:text-foreground prose-p:text-foreground/80"
                                dangerouslySetInnerHTML={{
                                    __html: eventContent,
                                }}
                            />
                        )}
                    </div>
                )}

                <div className="border-t border-border/50 my-6 md:my-8" />

                {/* Gallery */}
                {event.galleryImgs && event.galleryImgs.length > 0 && (
                    <div className="">
                        <H3 className="font-accent mb-3 md:mb-4 text-lg md:text-xl">
                            Gallery
                        </H3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                            {event.galleryImgs.map((img, index) => (
                                <div
                                    key={index}
                                    className="relative aspect-square rounded-lg overflow-hidden"
                                >
                                    <Image
                                        src={img}
                                        alt={`Gallery image ${index + 1}`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                        className="object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                    <div className="mt-6 md:mt-8 flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 sm:px-3 py-1 bg-secondary/40 text-foreground/80 text-xs sm:text-sm rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: Events["status"] }) {
    let bgColor = "bg-chart-5/20";
    let textColor = "text-chart-5";
    let borderColor = "border-chart-5/30";

    switch (status) {
        case "upcoming":
            bgColor = "bg-chart-2/20";
            textColor = "text-chart-2";
            borderColor = "border-chart-2/30";
            break;
        case "ongoing":
            bgColor = "bg-chart-1/20";
            textColor = "text-chart-1";
            borderColor = "border-chart-1/30";
            break;
        case "completed":
            bgColor = "bg-muted/30";
            textColor = "text-muted-foreground";
            borderColor = "border-muted/30";
            break;
        case "cancelled":
            bgColor = "bg-destructive/20";
            textColor = "text-destructive";
            borderColor = "border-destructive/30";
            break;
    }

    return (
        <span
            className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-main border ${bgColor} ${textColor} ${borderColor}`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
