/// components\atoms\Typography.tsx

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
interface TypographyProps {
    children: React.ReactNode;
    size?: number;
    className?: string;
}

export const H1 = ({ children, size, className }: TypographyProps) => (
    <h1 className={cn("text-4xl font-superbold", size ? getResponsiveClass(size).textClass : "" ,className)}>
        {children}
    </h1>
);

export const H2 = ({ children, size, className }: TypographyProps) => (
    <h2 className={cn("text-3xl font-main", size ? getResponsiveClass(size).textClass : "", className)}>
        {children}
    </h2>
);

export const H3 = ({ children, size, className }: TypographyProps) => (
    <h3 className={cn("text-2xl font-main", size ? getResponsiveClass(size).textClass : "", className)}>
        {children}
    </h3>
);

export const Paragraph = ({ children, size, className }: TypographyProps) => (
    <p className={cn("text-base font-body font-light", size ? getResponsiveClass(size).textClass : "", className)}>
        {children}
    </p>
);