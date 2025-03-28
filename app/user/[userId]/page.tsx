/// app\user\[userId]\page.tsx

import { auth } from "@/app/auth/authSettings";
import { redirect, notFound } from "next/navigation";
import { getUserById } from "@/lib/prisma/user";
import UserTemplate from "@/templates/UserTemplate";

type Params = Promise<{ userId: string }>

export default async function UserProfile(props: { params: Params }) {
  const session = await auth();
  if (!session?.user) return redirect("/auth/signin");

  const params = await props.params;
  const userId = params.userId;
  const userData = await getUserById(userId);
  if (!userData) return notFound();

  const owner = session.user.id === userId;

  return <UserTemplate userData={userData} owner={owner} />;
}