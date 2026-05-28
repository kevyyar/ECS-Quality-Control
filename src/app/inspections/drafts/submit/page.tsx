import { requireProtectedAction } from "@/lib/auth/session";

export default async function SubmitDraftInspectionPage() {
  await requireProtectedAction("submitDraftInspection");

  return <h1>Submit Draft Inspection</h1>;
}
