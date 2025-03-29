/// templates/Main.tsx

import NavBar from "@/components/organisms/NavBar";
import HeroGitbook from "@/components/organisms/Hero.Gitbook";
import HeroFollowUs from "@/components/organisms/Hero.FollowUs";
import Footer from "@/components/organisms/Footer";
import Image from "next/image";

export default function Main() {
    return (
        <div className="relative flex flex-col w-full">
            <Image
                src="/bg/gradient-galaxy.svg"
                alt="Background"
                fill
                priority
                className="object-cover object-top -z-10"
            />
            <div className="sticky top-0 z-10 backdrop-blur-md">
                <NavBar />
            </div>
            <main className="flex flex-col flex-1">
                <HeroGitbook />
                <HeroFollowUs />
            </main>
            <Footer followUsMinimal={true} />
        </div>
    );
}