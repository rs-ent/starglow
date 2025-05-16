/// app/user/[userId]/[collection]/page.tsx

import UserCollection from "@/components/user/User.Contents.MyAssets.NFT";

interface UserCollectionPageProps {
    params: Promise<{ userId: string; collection: string }>;
}

export default async function UserCollectionPage(
    props: UserCollectionPageProps
) {
    const params = await props.params;
    const userId = params.userId;
    const collection = params.collection;

    return <UserCollection userId={userId} collectionAddress={collection} />;
}
