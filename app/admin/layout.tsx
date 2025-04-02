import AdminNav from "@/components/admin/Admin.Nav";
import AuthGuard from "@/app/auth/authGuard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard callbackUrl="/admin">
            <div className="flex min-h-screen">
                <AdminNav />
                <main className="flex-1 p-8">{children}</main>
            </div>
        </AuthGuard>
    );
}
