import { requireAdmin } from "@/app/auth/authUtils";
import AdminNav from "@/components/admin/Admin.Nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { success, error } = await requireAdmin();

    if (!success) {
        return <div>{error}</div>;
    }

    return (
        <div className="flex min-h-screen">
            <AdminNav />
            <main className="flex-1 p-8">{children}</main>
        </div>
    );
}
