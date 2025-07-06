/// components/templates/Navigation.tsx

import { auth } from "@/app/auth/authSettings";
import NavigationBar from "@/components/navigation/Navigation.Bar";

export default async function Navigation() {
    const session = await auth();

    const isUnderConstruction =
        process.env.NEXT_PUBLIC_UNDER_CONSTRUCTION === "true";

    if (isUnderConstruction) {
        return null;
    }

    return (
        <NavigationBar
            user={session?.user ?? null}
            player={session?.player ?? null}
        />
    );
}
