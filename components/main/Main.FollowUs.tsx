/// components/main/Main.FollowUs.tsx

import {memo} from "react";
import FollowUs from "./FollowUs";

// 메모이제이션된 MainFollowUs 컴포넌트
const MainFollowUs = memo(function MainFollowUs() {
    return (
        <section
            className="
                flex items-center justify-center w-full px-4 text-center
                bg-gradient-to-b from-transparent to-black
                py-24 sm:py-32 md:py-40 lg:py-48 xl:py-56
            "
            aria-label="Follow us on social media"
        >
            <FollowUs 
                frameSize={40} 
                textSize={20} 
                gapSize={10}
                className="max-w-md mx-auto" 
            />
        </section>
    );
});

export default MainFollowUs;