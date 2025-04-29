/// components/organisms/Polls.List.tsx

"use client";

import Link from "next/link";
import { Poll } from "@prisma/client";
import PollsCard from "@/components/molecules/Polls.Card";

interface PollsListProps {
    polls: Poll[];
}

export default function PollsList({ polls }: PollsListProps) {
    return (
        <div className="flex flex-col gap-4">
            {polls.map((poll) => (
                <Link href={`/polls/${poll.id}`} key={poll.id}>
                    <PollsCard poll={poll} />
                </Link>
            ))}
        </div>
    );
}
