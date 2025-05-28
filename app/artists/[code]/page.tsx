/// app/artists/manage/[id]/page.tsx

import AdminArtistsManageDashboard from "@/components/admin/artists/manage/Admin.Artists.Manage.Dashboard";
import { prisma } from "@/lib/prisma/client";

interface ArtistPageProps {
    params: {
        code: string;
    };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
    const { code } = await params;
    const artist = await prisma.artist.findUnique({
        where: {
            code,
        },
    });

    if (!artist) {
        return <div>Artist not found</div>;
    }

    return (
        <div>
            <AdminArtistsManageDashboard artist={artist} />
        </div>
    );
}
