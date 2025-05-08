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
}

export default function PollsList({ polls }: PollsListProps) {
    const sliderSettings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        centerMode: true,
        responsive: [
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
        ],
    };

    return (
        <Slider {...sliderSettings}>
            {polls.map((poll) => (
                <div key={poll.id} className="px-2">
                    <PollsCard poll={poll} />
                </div>
            ))}
        </Slider>
    );
}
