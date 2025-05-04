/// components/organisms/Quests.Contents.tsx

"use client";

import { useState } from "react";
import PublicPrivateTab from "@/components/molecules/PublicPrivateTab";

export default function QuestsContents() {
    const [isPublic, setIsPublic] = useState(true);

    return (
        <div>
            <PublicPrivateTab
                isPublic={isPublic}
                onPublic={() => setIsPublic(true)}
                onPrivate={() => setIsPublic(false)}
                frameSize={15}
                textSize={20}
                gapSize={5}
                paddingSize={10}
            />
        </div>
    );
}
