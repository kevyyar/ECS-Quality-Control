import { requireProtectedAction } from "@/lib/auth/session";

export default async function DraftInspectionsPage() {
  await requireProtectedAction("editDraftInspection");

  return <h1>Draft Inspections</h1>;
}
