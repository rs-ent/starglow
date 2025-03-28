/// app\user\[userId]\page.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/prisma/user";
import type { User } from "@prisma/client";
import UserTemplate from "@/templates/UserTemplate";

export default async function UserProfile({ params }: { params: { userId: string } }) {
  const session = await auth();

  if (!session?.user) redirect("/auth/signin");

  const userData = await getUserById(params.userId) as User;
  const owner = session.user.id === params.userId;

  return <UserTemplate userData={userData} owner={owner} />;
}