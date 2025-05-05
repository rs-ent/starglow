/// components/admin/artists/Admin.Artists.Manage.Dashboard.tsx

import { Artist } from "@prisma/client";
import AdminArtistsManageMessages from "./Admin.Artists.Manage.Messages";

interface AdminArtistsManageDashboardProps {
    artist: Artist;
}

export default function AdminArtistsManageDashboard({
    artist,
}: AdminArtistsManageDashboardProps) {
    return (
        <div className="my-4 flex flex-col gap-4 w-full items-center justify-center">
            <h1 className="mb-4 text-7xl font-bold">{artist.name}</h1>
            <AdminArtistsManageMessages artist={artist} />
        </div>
    );
}
