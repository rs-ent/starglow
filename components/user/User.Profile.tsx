/// components/user/User.Profile.tsx

import { User } from "next-auth";
import ProfileImage from "@/components/atoms/ProfileImage";
import ProfileName from "@/components/atoms/ProfileName";

interface UserProfileProps {
    user: User;
}

export default function UserProfile({ user }: UserProfileProps) {
    return (
        <div className="flex flex-col gap-[15px] items-center justify-center">
            <ProfileImage image={user.image} size={65} />
            <ProfileName user={user} size={20} />
        </div>
    );
}
