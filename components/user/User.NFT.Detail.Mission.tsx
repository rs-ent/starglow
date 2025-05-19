/// components/user/User.NFT.Detail.Mission.tsx

"use client";

import {
    TokenGateResult,
    AdvancedTokenGateResult,
} from "@/app/actions/blockchain";
import { CollectionContract, Player } from "@prisma/client";
import { User } from "next-auth";
import { useQuestGet } from "@/app/hooks/useQuest";
import { usePollsGet } from "@/app/hooks/usePolls";
import QuestsMissions from "../molecules/Quests.Missions";
import PollsList from "../organisms/Polls.List";
import { useMemo } from "react";

interface UserNFTDetailMissionProps {
    user: User | null;
    player: Player | null;
    collection: CollectionContract;
    tokenGateResult: TokenGateResult;
}

export default function UserNFTDetailMission({
    user,
    player,
    collection,
    tokenGateResult,
}: UserNFTDetailMissionProps) {
    const { quests, isLoadingQuests, questsError, questLogs } = useQuestGet({
        getQuestsInput: {
            artistId: collection.artistId ?? undefined,
            isActive: true,
        },
        getQuestLogsInput: {
            playerId: player?.id ?? undefined,
        },
    });

    const { pollsList, isLoadingPolls, pollsError, playerPollLogs } =
        usePollsGet({
            getPollsInput: {
                artistId: collection.artistId ?? undefined,
                isActive: true,
            },
            getPlayerPollLogsInput: {
                playerId: player?.id ?? undefined,
            },
        });

    const takenGateData = useMemo(() => {
        return toAdvancedTokenGateResult(tokenGateResult, collection.address);
    }, [tokenGateResult]);

    return (
        <div>
            <QuestsMissions
                player={player}
                quests={quests?.items ?? []}
                questLogs={questLogs?.items ?? []}
                isLoading={isLoadingQuests}
                error={questsError}
                permission={tokenGateResult.data?.hasToken ?? false}
                tokenGatingResult={takenGateData}
                referralLogs={[]}
            />

            <PollsList
                player={player}
                polls={pollsList?.items ?? []}
                pollLogs={playerPollLogs ?? []}
                tokenGatingData={takenGateData}
            />
        </div>
    );
}

function toAdvancedTokenGateResult(
    tokenGateResult: TokenGateResult,
    key: string
): AdvancedTokenGateResult {
    if (!tokenGateResult.data) {
        return {
            success: tokenGateResult.success,
            error: tokenGateResult.error,
        };
    }
    return {
        success: tokenGateResult.success,
        data: {
            hasToken: { [key]: tokenGateResult.data.hasToken },
            tokenCount: { [key]: tokenGateResult.data.tokenCount },
            ownerWallets: { [key]: tokenGateResult.data.ownerWallets },
        },
        error: tokenGateResult.error,
    };
}
