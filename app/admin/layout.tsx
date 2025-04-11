import AdminNav from "@/components/admin/Admin.Nav";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <AdminNav />
            <main className="flex-1 p-8">{children}</main>
        </div>
    );
}
