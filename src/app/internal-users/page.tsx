import { requireProtectedAction } from "@/lib/auth/session";

export default async function InternalUsersPage() {
  await requireProtectedAction("manageUsers");

  return <h1>Internal users</h1>;
}
