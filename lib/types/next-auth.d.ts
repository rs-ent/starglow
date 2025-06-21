/// lib/types/next-auth.d.ts

import type { Player } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session extends DefaultSession {
        player?: Player | null;
    }
}
