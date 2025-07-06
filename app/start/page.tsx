/// app/start/page.tsx

import { redirect } from "next/navigation";

export default function MiniappPage() {
    const botName =
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
        "starglow_redslippers_bot";

    redirect(`https://t.me/${botName}?startapp`);
}
