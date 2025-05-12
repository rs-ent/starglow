/// components/atoms/Form.SignIn.Email.tsx

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/components/ui/button";
export default function FormSignInEmail() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        if (!isValidEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsLoading(true);

        try {
            await signIn("resend", {
                email,
                callbackUrl: "/",
                redirect: false,
            });
            toast.success("Verification email sent. Please check your email.");
        } catch (error) {
            console.error("Sign in error:", error);
            toast.error("Failed to sign in. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-2 w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
        >
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full p-2 border rounded-md"
            />
            <div className="w-full flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send"}
                </Button>
            </div>
        </form>
    );
}
