/// app/page.tsx

import Main from "@/components/templates/Main";
import PartialLoading from "@/components/atoms/PartialLoading";
import { Suspense } from "react";
export default async function Home() {
    return (
        <div>
            <main>
                <Suspense fallback={<PartialLoading text="Loading..." />}>
                    <Main />
                </Suspense>
            </main>
        </div>
    );
}
