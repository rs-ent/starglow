/// app/page.tsx

import Main from "@/components/templates/Main";
import { Suspense } from "react";
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
