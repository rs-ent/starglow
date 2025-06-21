/// app/page.tsx

import { Suspense } from "react";

import Main from "@/components/main/Main";
export default async function Home() {
    return (
        <div>
            <main>
                <Suspense fallback={<div> </div>}>
                    <Main />
                </Suspense>
            </main>
        </div>
    );
}
