/// app\polls\[id]\page.tsx

import { getPoll } from "@/app/actions/polls";
import SinglePoll from "@/components/templates/Poll";

export default async function PollPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const poll = await getPoll(id);

    if (!poll) {
        return <div>Poll not found</div>;
    }

    return <SinglePoll poll={poll} />;
}
