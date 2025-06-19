/// app\user\page.tsx

import { redirect } from "next/navigation";

export default function UserEntryPage() {
    redirect("/user/mystar");
    return null;
}
