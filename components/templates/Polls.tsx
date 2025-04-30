/// components\templates\Polls.tsx

"use client";

import { usePollsGet } from "@/app/hooks/usePolls";
import PollsList from "@/components/organisms/Polls.List";
import { GetPollsInput, PaginationInput } from "@/app/actions/polls";
import { useEffect, useState } from "react";
import { useLoading } from "@/app/hooks/useLoading";
import { useToast } from "@/app/hooks/useToast";
import { PollCategory } from "@prisma/client";

const today = new Date();
today.setHours(today.getHours() + 9);

const listFilter: Record<"ongoing" | "upcoming" | "ended", GetPollsInput> = {
    ongoing: {
        startDateBefore: today,
        endDateAfter: today,
    },
    upcoming: {
        startDateAfter: today,
        endDateAfter: today,
    },
    ended: {
        startDateBefore: today,
        endDateBefore: today,
    },
};

function setFilter(
    tab: "ongoing" | "upcoming" | "ended",
    publicTab: "public" | "private"
) {
    const filter = listFilter[tab];
    const publicOrPrivateFilter = {
        ...filter,
        category:
            publicTab === "public" ? PollCategory.PUBLIC : PollCategory.PRIVATE,
    };

    return publicOrPrivateFilter;
}

export default function Polls() {
    const toast = useToast();
    const { startLoading, endLoading } = useLoading();

    const [visibleTab, setVisibleTab] = useState<
        "ongoing" | "upcoming" | "ended"
    >("ongoing");
    const [publicTab, setPublicTab] = useState<"public" | "private">("public");
    const [pollListFilter, setPollListFilter] = useState<GetPollsInput>(
        setFilter("ongoing", "public")
    );

    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: pollListFilter,
    });

    useEffect(() => {
        if (isLoading) {
            startLoading();
        } else {
            endLoading();
        }
    }, [isLoading]);

    if (error) {
        toast.error(
            "Failed to fetch polls. Please try again later. If the problem persists, please contact the administrator."
        );
    }

    const handleTabChange = (tab: "ongoing" | "upcoming" | "ended") => {
        setVisibleTab(tab);
        setPollListFilter(setFilter(tab, publicTab));
    };

    const handlePublicTabChange = (tab: "public" | "private") => {
        setPublicTab(tab);
        setPollListFilter(setFilter(visibleTab, tab));
    };

    return (
        <div>
            <PollsList
                polls={pollsList?.items || []}
                publicTab={publicTab}
                visibleTab={visibleTab}
                onTabChange={handleTabChange}
                onPublicTabChange={handlePublicTabChange}
            />
        </div>
    );
}
