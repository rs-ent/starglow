/// components\templates\Polls.tsx

"use client";

import { usePollsGet } from "@/app/hooks/usePolls";
import { Poll } from "@prisma/client";
import PollsList from "@/components/organisms/Polls.List";

interface PollsProps {
    activePolls: Poll[];
}

export default function Polls({ activePolls }: PollsProps) {
    console.log(activePolls);

    return (
        <div>
            <PollsList polls={activePolls} />
        </div>
    );
}
