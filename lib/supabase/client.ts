import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

export const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!
);
