/// components/admin/artists/Admin.Artists.Dashboard.tsx

"use client";

import AdminArtistsList from "./Admin.Artists.List";

export default function AdminArtistsDashboard() {
    return (
        <div className="flex flex-col gap-4">
            <AdminArtistsList />
        </div>
    );
}
