import { requireProtectedAction } from "@/lib/auth/session";

export default async function CompanyBrandingPage() {
  await requireProtectedAction("configureBranding");

  return <h1>Company Branding</h1>;
}
