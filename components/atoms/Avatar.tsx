/// components\atoms\Avatar.tsx

import Image from "next/image";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface AvatarProps {
    src?: string;
    alt: string;
    size?: number;
}

export default function Avatar({
    src = "/default-avatar.jpg",
    alt = "Avatar",
    size = 20,
}: AvatarProps) {
    const responsiveClass = getResponsiveClass(size);
    const frameSize = responsiveClass.frameClass;
    return (
        <div className={cn("relative w-[40px] h-[40px]", frameSize)}>
            <Image
                src={src}
                alt={alt}
                width={size * 5}
                height={size * 5}
                className={cn("rounded-full object-cover", frameSize)}
                priority={true}
                unoptimized={false}
            />
        </div>
    );
}
