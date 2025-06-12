/// components/templates/Navigation.tsx

import { auth } from "@/app/auth/authSettings";
import NavigationBar from "@/components/navigation/Navigation.Bar";
import { memo } from "react";

export const dynamic = "auto";

async function Navigation() {
    const session = await auth();

    return (
        <NavigationBar
            user={session?.user ?? null}
            player={session?.player ?? null}
        />
    );
}

export default memo(Navigation);
