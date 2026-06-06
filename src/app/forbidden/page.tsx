import Link from "next/link";

import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageSection,
} from "@/lib/ux/app-page";
import { ux } from "@/lib/ux/tokens";

export default function ForbiddenPage() {
  return (
    <AppPage>
      <AppPageHero
        backHref="/dashboard"
        backLabel="Dashboard"
        description="Manager-only users can view allowed records and add Correction Notes, but this action requires Supervisor capability."
        eyebrow="Access denied"
        title="Supervisor capability"
        titleAccent="required"
      />

      <AppPageBody>
        <PageSection heading="What you can do" headingId="forbidden-next-steps" icon="shield">
          <p className="text-sm leading-relaxed text-muted-ink">
            Return to the dashboard or contact a Supervisor if you need access to
            this action.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className={ux.primaryButton} href="/dashboard">
              Back to Dashboard
            </Link>
            <Link className={ux.secondaryButton} href="/inspections">
              View Inspections
            </Link>
          </div>
        </PageSection>
      </AppPageBody>
    </AppPage>
  );
}
