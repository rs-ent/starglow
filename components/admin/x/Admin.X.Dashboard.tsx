/// components/admin/x/Admin.X.Dashboard.tsx

"use client";

import AdminXTweets from "./Admin.X.Tweets";

export type SortOption = "name" | "tweets" | "recent";

export interface SelectedTweetInfo {
    tweetId: string;
    authorId: string;
    authorName: string;
    text: string;
}

export default function AdminXDashboard() {
    return (
        <div>
            <AdminXTweets />
        </div>
    );
}
