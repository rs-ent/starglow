/// components/admin/polls/Admin.Polls.List.tsx

"use client";

import { usePollsGet } from "@/app/hooks/usePolls";
import { Button } from "@/components/ui/button";

export default function AdminPollsList() {
    const { data: polls, isLoading, error } = usePollsGet();

    if (isLoading) return <div>로딩 중</div>;
    if (error) return <div>오류 발생: {error.message}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Polls List</h2>
                <div>
                    <button onClick={() => setViewType("table")}>Table</button>
                    <button onClick={() => setViewType("card")}>Card</button>
                </div>
            </div>
            {viewType === "table" ? (
                <table className="w-full table-auto">
                    <thead>
                        <tr>
                            <th>Media</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {polls?.map((poll) => (
                            <PollTableRow key={poll.id} poll={poll} />
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {polls?.map((poll) => (
                        <PollCard key={poll.id} poll={poll} />
                    ))}
                </div>
            )}
        </div>
    );
}
