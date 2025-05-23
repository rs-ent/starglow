/// components/templates/Navigation.tsx

import { auth } from "@/app/auth/authSettings";
import NavigationBar from "@/components/navigation/Navigation.Bar";

export const dynamic = "force-dynamic";

export default async function Navigation() {
    const session = await auth();

    return (
        <NavigationBar
            user={session?.user ?? null}
            player={session?.player ?? null}
        />
    );
}
