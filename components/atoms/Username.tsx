/// components\atoms\Username.tsx

interface UsernameProps {
    name: string;
    className?: string;
}

export default function Username({ name = "", className }: UsernameProps) {
    return (
        <h2
            className={`text-lg font-semibold ${className}`}
        >
            {name}
        </h2>
    );
}