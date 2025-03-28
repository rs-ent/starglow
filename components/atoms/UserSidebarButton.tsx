/// components\atoms\SectionButton.tsx

import { Button } from "@/components/ui/button";

interface UserSidebarButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

export default function UserSidebarButton({ label, onClick, disabled = false }: UserSidebarButtonProps) {
    return (
        <Button
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            className="w-full items-center justify-start gap-2"
        >
            {label}
        </Button>
    )
}