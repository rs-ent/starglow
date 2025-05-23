/// components/atoms/ProfileImage.tsx

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useMemo } from "react";

interface ProfileImageProps {
    image?: string | null;
    className?: string;
    size?: number;
}

export default function ProfileImage({
    image,
    className,
    size = 60,
}: ProfileImageProps) {
    const responsiveClass = getResponsiveClass(size);

    return (
        <div
            className={cn(
                "rounded-full overflow-hidden border-2 border-[rgba(255,255,255,0.6)]",
                responsiveClass.frameClass,
                className
            )}
        >
            {image ? (
                <img
                    src={image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                />
            ) : (
                <DefaultProfileImageSvg opacity={0.8} scale={1.15} />
            )}
        </div>
    );
}

function DefaultProfileImageSvg({
    opacity = 1.0,
    scale = 1.0,
}: {
    opacity?: number;
    scale?: number;
}) {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 40 40"
            fill="none"
            opacity={opacity}
            style={{ transform: `scale(${scale})` }}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M26.092 13C26.092 16.3137 23.4058 19 20.092 19C16.7783 19 14.092 16.3137 14.092 13C14.092 9.68629 16.7783 7 20.092 7C23.4058 7 26.092 9.68629 26.092 13ZM24.092 13C24.092 15.2091 22.3012 17 20.092 17C17.8829 17 16.092 15.2091 16.092 13C16.092 10.7909 17.8829 9 20.092 9C22.3012 9 24.092 10.7909 24.092 13Z"
                fill="#E0E7FF"
            />
            <path
                d="M20.092 22C13.6177 22 8.10132 25.8284 6 31.192C6.5119 31.7004 7.05114 32.1812 7.61533 32.6321C9.18007 27.7077 14.0888 24 20.092 24C26.0953 24 31.004 27.7077 32.5688 32.6321C33.133 32.1812 33.6722 31.7004 34.1841 31.1921C32.0828 25.8284 26.5664 22 20.092 22Z"
                fill="#E0E7FF"
            />
        </svg>
    );
}
