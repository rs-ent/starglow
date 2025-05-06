/// app\invite\page.tsx

import { redirect } from "next/navigation";
import { requireAuthUser } from "../actions/auth";
import { invitePlayer } from "../actions/player";

export default async function InviteAuthPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { referrer, method } = await searchParams;

    if (!referrer) {
        redirect("/error?message=Invalid referral code&returnUrl=/");
    }

    if (!method) {
        redirect("/error?message=Invalid invitation method&returnUrl=/");
    }

    try {
        const user = await requireAuthUser(
            `/invite?ref=${referrer}&method=${method}`
        );

        try {
            const result = await invitePlayer({
                referredUser: user,
                referrerPlayerId: referrer as string,
                method: method as string,
            });

            if (!result) {
                throw new Error("Failed to invite player");
            }

            const { referredPlayer, referrerPlayer, referralLog } = result;

            console.log("Referred player:", referredPlayer);
            console.log("Referrer player:", referrerPlayer);
            console.log("Referral log:", referralLog);

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
                default:
                    errorMessage = "An error occurred during invitation";
                    break;
            }

            const returnUrl = `/invite?ref=${referrer}&method=${method}`;
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
