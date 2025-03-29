/// components\atoms\SignInButton.tsx

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut, LoaderCircle } from "lucide-react";
import Button from "./Button";
import { useLoading } from "@/hooks/useLoading";
interface AuthButtonProps {
    frameSize?: number;
    textSize?: number;
    paddingSize?: number;
    gapSize?: number;
    className?: string;
    variant?: "default" | "space" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function AuthButton({ 
    frameSize = 20, 
    textSize = 20,
    paddingSize = 20,
    gapSize = 20,
    className = "",
    variant = "default" 
}: AuthButtonProps) {
    const { data: session, status } = useSession();
    const { startLoading } = useLoading();

    const handleSignIn = async () => {
        startLoading();
        await signIn();
    };

    if (status === "loading") {
        return (
            <Button disabled={true} variant={variant} className={className} frameSize={frameSize} textSize={textSize} paddingSize={paddingSize} gapSize={gapSize} icon={LoaderCircle} iconSpinning={true}>
                Loading
            </Button>
        );
    }

    return session ? (
        <Button onClick={() => signOut()} variant={variant} className={className} frameSize={frameSize} textSize={textSize} paddingSize={paddingSize} gapSize={gapSize} icon={LogOut}>
            Sign Out
        </Button>
    ) : (
        <Button onClick={handleSignIn} variant={variant} className={className} frameSize={frameSize} textSize={textSize} paddingSize={paddingSize} gapSize={gapSize} icon={LogIn}>
            Sign In
        </Button>
    );
}