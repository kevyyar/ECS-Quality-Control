import { requireProtectedAction } from "@/lib/auth/session";

export default async function SetupPage() {
  await requireProtectedAction("manageSetup");

  return <h1>Setup management</h1>;
}
