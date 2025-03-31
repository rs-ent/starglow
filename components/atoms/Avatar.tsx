/// components\atoms\Avatar.tsx

interface AvatarProps {
    src?: string;
    alt: string;
    size?: number;
}

export default function Avatar({
    src = "/default-avatar.jpg",
    alt = "Avatar",
    size = 40,
}: AvatarProps) {
    return (
        <div className="relative w-[40px] h-[40px]">
            <img
                src={src}
                alt={alt}
                width={size}
                height={size}
                className="rounded-full object-cover"
            />
        </div>
    );
}
