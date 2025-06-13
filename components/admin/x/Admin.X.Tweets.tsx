/// components/admin/x/Admin.X.Tweets.tsx

"use client";

import { useX } from "@/app/actions/x/hooks";
import { useMemo } from "react";
import { Tweet } from "@prisma/client";

export default function AdminXTweets() {
    const {
        latestSyncData,
        isLatestSyncDataLoading,
        latestSyncDataError,
        refetchLatestSyncData,

        tweets,
        isTweetsLoading,
        tweetsError,
        refetchTweets,
    } = useX();

    const formattedTweets = useMemo(() => {
        const foldedTweets = new Map<string, Tweet[]>();
        tweets?.forEach((tweet) => {
            const author = tweet.authorId;
            if (author) {
                foldedTweets.set(author, [
                    ...(foldedTweets.get(author) || []),
                    tweet,
                ]);
            }
        });

        return foldedTweets;
    }, [tweets]);

    console.log(formattedTweets);

    return (
        <div>
            <h1>X Tweets</h1>
            <div>
                <h2>Latest Sync Data</h2>
                <p>{latestSyncData?.syncStatus}</p>
            </div>
            <div>
                <h2>Tweets</h2>
                <div>
                    {Array.from(formattedTweets.entries()).map(
                        ([authorId, tweets]) => (
                            <div key={authorId}>
                                <h3>Author: {authorId}</h3>
                                {tweets.map((tweet) => (
                                    <div key={tweet.id} className="tweet-item">
                                        <p>{tweet.text}</p>
                                        <small>
                                            {new Date(
                                                tweet.createdAt
                                            ).toLocaleString()}
                                        </small>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
