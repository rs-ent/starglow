/// app\invite\page.tsx

import { redirect } from "next/navigation";
import { requireAuthUser } from "@/app/auth/authUtils";
import { invitePlayer } from "../actions/player";

export default async function InviteAuthPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { ref, method, tgId } = await searchParams;

    if (!ref) {
        redirect("/");
    }

    if (!isValidParam(ref)) {
        redirect(
            `/error?message=${encodeURIComponent(
                "Invalid referral code"
            )}&returnUrl=/`
        );
    }

    if (!isValidParam(method)) {
        redirect(
            `/error?message=${encodeURIComponent(
                "Invalid invitation method"
            )}&returnUrl=/`
        );
    }

    const user = await requireAuthUser(`/invite?ref=${ref}&method=${method}`);

    try {
        const result = await invitePlayer({
            referredUser: user,
            referrerCode: ref as string,
            method: method as string,
            telegramId: tgId as string,
        });

        if (!result) {
            redirect(
                `/error?message=${encodeURIComponent(
                    "An unexpected error occurred"
                )}&returnUrl=/`
            );
        }

        redirect("/quests");
    } catch (error: any) {
        if (error?.message === "NEXT_REDIRECT") throw error;

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
            case "TELEGRAM_ID_ALREADY_USED":
                errorMessage = "This Telegram ID is already used";
                break;
            default:
                errorMessage = "An error occurred during invitation";
                break;
        }
        const returnUrl = `/invite?ref=${ref}&method=${method}`;
        redirect(
            `/error?message=${encodeURIComponent(
                errorMessage
            )}&returnUrl=${encodeURIComponent(returnUrl)}`
        );
    }
}

function isValidParam(param: unknown): param is string {
    return typeof param === "string" && param.trim().length > 0;
}
