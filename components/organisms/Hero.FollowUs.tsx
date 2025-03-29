/// components/organisms/Hero.FollowUs.tsx

import FollowUs from "../molecules/FollowUs";

export default function HeroFollowUs() {
    return (
        <div className="
            flex items-center justify-center w-full px-4 text-center bg-gradient-to-b from-[rgba(0,0,0,0)] to-[rgba(0,0,0,1)]
            py-24
            sm:py-32
            md:py-40
            lg:py-48
            xl:py-56
        ">
            <FollowUs frameSize={65} textSize={25} gapSize={10} />
        </div>
    );
}