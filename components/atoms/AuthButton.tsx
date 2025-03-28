/// components\atoms\SignInButton.tsx

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut, LoaderCircle } from "lucide-react";
import Button from "./Button";

export default function AuthButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <Button disabled={true} className="w-full" icon={LoaderCircle}>
                Loading...
            </Button>
        );
    }

    return session ? (
        <Button onClick={() => signOut()} className="w-full" icon={LogOut}>
            Sign Out
        </Button>
    ) : (
        <Button onClick={() => signIn()} className="w-full" icon={LogIn}>
            Sign In
        </Button>
    );
}