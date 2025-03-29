import { H3 } from "./Typography";

export default function InviteFriends() {
    return (
        <div className="relative flex w-full items-center justify-center px-4 max-w-[840px] min-w-[270px]">
            <div className="relative w-full bg-gradient-to-br from-[#A5D7FB] to-[#8E76FA] rounded-2xl">
                <H3 size={25} className="text-start p-4">
                    Invite Friends!
                </H3>
                <img
                    src="/ui/letter.svg"
                    alt="Invite Friends Letter"
                    className="absolute -top-5 right-2"
                    style={{ width: '110px', height: 'auto' }}
                />
            </div>

        </div>
    )
}