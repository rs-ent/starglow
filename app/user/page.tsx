/// app\user\page.tsx

import { requireAuthUserAndPlayer } from "@/app/auth/authUtils";
import User from "@/components/user/User";

export default async function UserEntryPage() {
    const { user, player } = await requireAuthUserAndPlayer("/user");

    return <User user={user} player={player} />;
}
