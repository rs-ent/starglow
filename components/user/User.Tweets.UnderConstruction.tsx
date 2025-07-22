"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/tailwind";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { Button } from "@/components/ui/button";
import UserTweetsTutorialModal from "./User.Tweets.Tutorial.Modal";

interface UserTweetsUnderConstructionProps {
    className?: string;
}

export default function UserTweetsUnderConstruction({
    className,
}: UserTweetsUnderConstructionProps) {
    const [showTutorial, setShowTutorial] = useState(false);

    return (
        <>
            <div
                className={cn(
                    "flex flex-col w-full max-w-[800px] mx-auto",
                    "px-4 sm:px-6 lg:px-8",
                    "py-8",
                    className
                )}
            >
                <div
                    className={cn(
                        "bg-gray-900/50 border border-gray-700/50",
                        "rounded-xl p-8",
                        "backdrop-blur-sm"
                    )}
                >
                    <div className="text-center mb-8">
                        <div
                            className={cn(
                                "mb-4",
                                getResponsiveClass(60).textClass
                            )}
                        >
                            🚧
                        </div>
                        <h1
                            className={cn(
                                "font-bold text-white mb-3",
                                getResponsiveClass(35).textClass
                            )}
                        >
                            Under Construction
                        </h1>
                        <p
                            className={cn(
                                "text-gray-400",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            Feature currently under development for better
                            experience
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/30">
                            <h2
                                className={cn(
                                    "font-semibold text-purple-300 mb-4",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                X Glows System
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            "w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"
                                        )}
                                    />
                                    <p
                                        className={cn(
                                            "text-gray-300",
                                            getResponsiveClass(12).textClass
                                        )}
                                    >
                                        <strong>Post tweets</strong> about
                                        STARGLOW or your favorite K-pop artists
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            "w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"
                                        )}
                                    />
                                    <p
                                        className={cn(
                                            "text-gray-300",
                                            getResponsiveClass(12).textClass
                                        )}
                                    >
                                        <strong>Tag @Starglow_world</strong> in
                                        every qualifying tweet
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            "w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"
                                        )}
                                    />
                                    <p
                                        className={cn(
                                            "text-gray-300",
                                            getResponsiveClass(12).textClass
                                        )}
                                    >
                                        <strong>Earn rewards</strong> based on
                                        engagement quality and AI analysis
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            "w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"
                                        )}
                                    />
                                    <p
                                        className={cn(
                                            "text-gray-300",
                                            getResponsiveClass(12).textClass
                                        )}
                                    >
                                        <strong>Bonus rewards</strong> for
                                        mentioning Starglow artists
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <Button
                                onClick={() => setShowTutorial(true)}
                                className={cn(
                                    "bg-purple-600 hover:bg-purple-700 text-white",
                                    "px-6 py-3 rounded-lg transition-colors",
                                    getResponsiveClass(14).textClass
                                )}
                            >
                                Learn More About X Glows
                            </Button>
                            <p
                                className={cn(
                                    "text-gray-500 mt-3",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                Detailed information and earning strategies
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <UserTweetsTutorialModal
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />
        </>
    );
}
