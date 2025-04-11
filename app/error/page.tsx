/// app\error\page.tsx

import { AlertCircle } from "lucide-react";
import Link from "next/link";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ErrorPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const { message, returnUrl } = await searchParams;
    const errorMessage =
        typeof message === "string" ? message : "An error occurred";
    const backUrl = typeof returnUrl === "string" ? returnUrl : "/";

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950">
            <div className="w-full max-w-md rounded-2xl bg-neutral-800/50 p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <h1 className="text-xl font-semibold text-red-500">
                        Error
                    </h1>
                </div>
                <p className="mt-4 text-neutral-200">{errorMessage}</p>
                <Link
                    href={backUrl}
                    className="mt-6 block w-full rounded-lg bg-neutral-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
                >
                    Go Back
                </Link>
            </div>
        </div>
    );
}
