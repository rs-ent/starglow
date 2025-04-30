/// components/organisms/Polls.List.tsx

"use client";

import Link from "next/link";
import { Poll } from "@prisma/client";
import PollsCard from "@/components/molecules/Polls.Card";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface PollsListProps {
    polls: Poll[];
    publicTab: "public" | "private";
    visibleTab: "ongoing" | "upcoming" | "ended";
    onTabChange: (tab: "ongoing" | "upcoming" | "ended") => void;
    onPublicTabChange: (tab: "public" | "private") => void;
}

export default function PollsList({
    polls,
    publicTab,
    visibleTab,
    onTabChange,
    onPublicTabChange,
}: PollsListProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* Visible Tab */}
            <div className="flex justify-center gap-4 text-white border-b border-gray-600 pb-2 mb-12">
                <button
                    onClick={() => onTabChange("ongoing")}
                    className={`px-2 py-2 font-main text-sm ${
                        visibleTab === "ongoing"
                            ? "border-b-2 border-white"
                            : ""
                    }`}
                >
                    ONGOING
                </button>
                <button
                    onClick={() => onTabChange("ended")}
                    className={`px-2 py-2 font-main text-sm ${
                        visibleTab === "ended" ? "border-b-2 border-white" : ""
                    }`}
                >
                    ENDED
                </button>
                <button
                    onClick={() => onTabChange("upcoming")}
                    className={`px-2 py-2 font-main text-sm ${
                        visibleTab === "upcoming"
                            ? "border-b-2 border-white"
                            : ""
                    }`}
                >
                    UPCOMING
                </button>
            </div>

            {/* Public Tab */}
            <div className="flex justify-center gap-4 text-white border-b border-gray-600 pb-2 mb-12">
                <button
                    onClick={() => onPublicTabChange("public")}
                    className={`px-2 py-2 font-main text-sm ${
                        publicTab === "public" ? "border-b-2 border-white" : ""
                    }`}
                >
                    PUBLIC
                </button>
                <button
                    onClick={() => onPublicTabChange("private")}
                    className={`px-2 py-2 font-main text-sm ${
                        publicTab === "private" ? "border-b-2 border-white" : ""
                    }`}
                >
                    PRIVATE
                </button>
            </div>

            {/* Polls List */}
            <div className="px-4">
                <Slider
                    dots={true}
                    infinite={false}
                    speed={500}
                    slidesToShow={3}
                    slidesToScroll={1}
                    responsive={[
                        {
                            breakpoint: 1024,
                            settings: {
                                slidesToShow: 2,
                            },
                        },
                        {
                            breakpoint: 640,
                            settings: {
                                slidesToShow: 1,
                            },
                        },
                    ]}
                >
                    {polls.map((poll) => (
                        <div key={poll.id} className="px-2">
                            <Link href={`/polls/${poll.id}`}>
                                <PollsCard poll={poll} />
                            </Link>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}
