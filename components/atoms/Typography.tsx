/// components\atoms\Typography.tsx

import { cn } from "@/lib/utils/tailwind";

interface TypographyProps {
    children: React.ReactNode;
    className?: string;
}

export const H1 = ({ children, className }: TypographyProps) => (
    <h1 className={cn("text-4xl font-superbold", className)}>
        {children}
    </h1>
);

export const H2 = ({ children, className }: TypographyProps) => (
    <h2 className={cn("text-3xl font-main", className)}>
        {children}
    </h2>
);

export const H3 = ({ children, className }: TypographyProps) => (
    <h3 className={cn("text-2xl font-main", className)}>
        {children}
    </h3>
);

export const Paragraph = ({ children, className }: TypographyProps) => (
    <p className={cn("text-base font-body", className)}>
        {children}
    </p>
);