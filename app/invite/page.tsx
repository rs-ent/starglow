/// app\invite\page.tsx

import { redirect } from "next/navigation";
import { requireAuthUser } from "../actions/auth";
import { invitePlayer } from "../actions/player";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
type InviteMethod = "Telegram" | "Web App";

export default async function InviteAuthPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const { referral, method } = await searchParams;

    if (!referral || typeof referral !== "string") {
        redirect("/error?message=Invalid referral code&returnUrl=/");
    }

    if (
        !method ||
        typeof method !== "string" ||
        !["Telegram", "Web App"].includes(method)
    ) {
        redirect("/error?message=Invalid invitation method&returnUrl=/");
    }

    try {
        const user = await requireAuthUser(
            `/invite?ref=${referral}&method=${method}`
        );

        try {
            await invitePlayer({
                currentUser: user,
                referralId: referral,
                method: method as InviteMethod,
            });

            redirect("/quests");
        } catch (error: any) {
            let errorMessage = "An error occurred during invitation";

            switch (error.message) {
                case "ALREADY_INVITED":
                    errorMessage = "You have already been invited by someone";
                    break;
                case "REFERRER_NOT_FOUND":
                    errorMessage = "The inviter was not found";
                    break;
                case "SELF_INVITE_NOT_ALLOWED":
                    errorMessage = "You cannot invite yourself";
                    break;
            }

            const returnUrl = `/invite?ref=${referral}&method=${method}`;
            redirect(
                `/error?message=${encodeURIComponent(
                    errorMessage
                )}&returnUrl=${encodeURIComponent(returnUrl)}`
            );
        }
    } catch (error: any) {
        redirect(
            `/error?message=${encodeURIComponent(
                "Authentication error. Please try again."
            )}&returnUrl=/`
        );
    }
}
