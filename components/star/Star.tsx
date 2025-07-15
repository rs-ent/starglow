/// components/star/Star.tsx

import type { ArtistsForStarList } from "@/app/actions/artists";

import StarList from "./Star.List";

interface StarProps {
    artists: ArtistsForStarList[] | null;
}

export default async function Star({ artists }: StarProps) {
    return (
        <div className="relative min-h-screen w-full">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0a2e] to-[#16213e] -z-10" />

            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-3/4 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <StarList artists={artists} />
            </div>
        </div>
    );
}
