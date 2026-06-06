import { requireProtectedAction } from "@/lib/auth/session";
import { getCompanyBranding } from "@/lib/company-branding/repository";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageSection,
} from "@/lib/ux/app-page";

import { CompanyBrandingForm } from "./company-branding-form";

export default async function CompanyBrandingPage() {
  await requireProtectedAction("configureBranding");
  const branding = await getCompanyBranding();

  return (
    <AppPage>
      <AppPageHero
        backHref="/setup"
        backLabel="Setup"
        description="Manage the shared Janitorial Company identity used by the app and future PDF reports."
        eyebrow="Setup"
        title="Company"
        titleAccent="Branding"
      />

      <AppPageBody>
        <PageSection heading="Branding settings" headingId="company-branding-form" icon="settings">
          <CompanyBrandingForm branding={branding} />
        </PageSection>
      </AppPageBody>
    </AppPage>
  );
}
