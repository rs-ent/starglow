/// components\atoms\SignInButton.tsx

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, LoaderCircle } from "lucide-react";

export default function SignInButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <Button disabled className="w-full">
            <LoaderCircle className="mr-2 h-4 w-4" />
            Loading...
        </Button>;
    }

    if (session) {
        return (
            <Button
                onClick={() => signOut()}
                className="w-full"
            >
                <LogOut className="mr-2 h-4 w-4" />
                SignOut
            </Button>
        )
    }

    return (
        <Button
            onClick={() => signIn()}
            className="w-full"
        >
            <LogIn className="mr-2 h-4 w-4" />
            SignIn
        </Button>
    )
}