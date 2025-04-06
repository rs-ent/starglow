/// components/organisms/UserIntegration.jsx

import TelegramLoginButton from "../atoms/TelegramLoginButton";
import { useTelegramIntegration } from "@/app/hooks/useTelegramIntegration";
import Button from "../atoms/Button";
import Icon from "../atoms/Icon";

export default function UserIntegration() {
    const { player, unlinkTelegram } = useTelegramIntegration();

    return (
        <div className="flex flex-col p-6 gap-4">
            <h1 className="text-2xl font-bold">Integration</h1>
            <p className="text-muted-foreground">
                Connect your account with other services
            </p>

            <div className="border-t my-4" />

            <section className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                    <Icon
                        svg="/icons/telegram-colored.svg"
                        className="brightness-0 invert"
                        size={24}
                    />
                    <h2 className="text-lg font-semibold">Telegram</h2>
                </div>

                {player ? (
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            {player.name || "No name"} (ID: {player.telegramId})
                        </p>
                        <Button
                            variant="destructive"
                            onClick={unlinkTelegram}
                            img="/ui/unlink.svg"
                            frameSize={15}
                            textSize={10}
                            paddingSize={5}
                            gapSize={5}
                        >
                            Unlink
                        </Button>
                    </div>
                ) : (
                    <TelegramLoginButton />
                )}
            </section>
        </div>
    );
}
