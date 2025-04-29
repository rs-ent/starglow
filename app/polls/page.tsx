/// app\polls\page.tsx

import { getPolls } from "@/app/actions/polls";
import Polls from "@/components/templates/Polls";

export default async function PollsPage() {
    const today = new Date();
    const polls = await getPolls({
        input: {
            startDate: today,
            endDate: today,
        },
        pagination: {
            currentPage: 1,
            itemsPerPage: 9,
        },
    });

    return <Polls activePolls={polls.items} />;
}
