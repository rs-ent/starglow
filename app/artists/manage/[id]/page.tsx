/// app/artists/manage/[id]/page.tsx

import { getArtist } from "@/app/actions/artists";
import AdminArtistsManageDashboard from "@/components/admin/artists/Admin.Artists.Manage.Dashboard";

interface ArtistPageProps {
    params: {
        id: string;
    };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
    const { id } = await params;
    const artist = await getArtist({ id });

    if (!artist) {
        return <div>Artist not found</div>;
    }

    return (
        <div>
            <AdminArtistsManageDashboard artist={artist} />
        </div>
    );
}
