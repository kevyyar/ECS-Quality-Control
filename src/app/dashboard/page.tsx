import { Suspense } from "react";

import { signOutInternalUser } from "@/lib/auth/actions";
import { canPerformProtectedAction } from "@/lib/auth/capabilities";
import { requireInternalUser } from "@/lib/auth/session";
import { dashboardRangeSearchKey } from "@/lib/dashboard/range-url";
import { resolveDateRange } from "@/lib/date-ranges";
import {
  AppBrandMark,
  AppPage,
  AppPageBody,
  AppPageHero,
  PageSection,
} from "@/lib/ux/app-page";
import { Glyph } from "@/lib/ux/glyph";
import { ux } from "@/lib/ux/tokens";

import { DashboardMetrics } from "./dashboard-metrics";
import { DashboardMetricsSkeleton } from "./dashboard-metrics-skeleton";
import { DashboardRangeFilter } from "./dashboard-range-filter";
import { DashboardRangeSubtitle } from "./dashboard-range-subtitle";
import { DashboardWorkspaceNav } from "./dashboard-workspace-nav";

type DashboardPageProps = {
  searchParams?: Promise<{
    range?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const range = resolveDateRange({
    preset: params?.range,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });
  const rangeKey = dashboardRangeSearchKey({
    range: params?.range,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });

  const user = await requireInternalUser();
  const canViewActiveDraftMetadata = canPerformProtectedAction(
    user.capabilities,
    "viewActiveDraftMetadata",
  );
  const canEditDrafts = canPerformProtectedAction(
    user.capabilities,
    "editDraftInspection",
  );
  const canManageSetup = canPerformProtectedAction(user.capabilities, "manageSetup");
  const canManageUsers = canPerformProtectedAction(user.capabilities, "manageUsers");

  return (
    <AppPage>
      <AppPageHero
        actions={
          <form action={signOutInternalUser}>
            <button className={ux.heroLogoutButton} type="submit">
              <Glyph className="size-4" name="logout" />
              Log out
            </button>
          </form>
        }
        description={
          <Suspense
            fallback={
              <p>
                {user.email} · {range.label}
              </p>
            }
          >
            <DashboardRangeSubtitle
              email={user.email}
              initialEndBefore={range.endBefore.toISOString()}
              initialLabel={range.label}
              initialStartAt={range.startAt.toISOString()}
            />
          </Suspense>
        }
        eyebrow="Internal workspace"
        footer={
          user.capabilities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.capabilities.map((capability) => (
                <span className={ux.capabilityBadge} key={capability}>
                  <Glyph className="size-3 text-brand-emerald-300" name="shield" />
                  {capability}
                </span>
              ))}
            </div>
          ) : null
        }
        layout="dashboard"
        leading={<AppBrandMark />}
        title="Quality control,"
        titleAccent="at a glance."
      />

      <AppPageBody overlap="dashboard">
        <DashboardWorkspaceNav
          canManageSetup={canManageSetup}
          canManageUsers={canManageUsers}
          canViewActiveDraftMetadata={canViewActiveDraftMetadata}
        />

        <PageSection
          description="Metrics use Submitted Inspections and their Tickets only. Draft Inspection data is excluded."
          heading="Reporting window"
          headingId="dashboard-range-heading"
          icon="clock"
        >
          <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-slate-100" />}>
            <DashboardRangeFilter
              initialEndDateInput={range.endDateInput}
              initialIsCustomValid={range.isCustomValid}
              initialPreset={range.preset}
              initialStartDateInput={range.startDateInput}
            />
          </Suspense>
        </PageSection>

        <Suspense fallback={<DashboardMetricsSkeleton />} key={rangeKey}>
          <DashboardMetrics
            canEditDrafts={canEditDrafts}
            canViewActiveDraftMetadata={canViewActiveDraftMetadata}
            endDate={params?.endDate}
            range={params?.range}
            startDate={params?.startDate}
          />
        </Suspense>

        <footer className="pt-2 text-center text-xs text-muted-ink">
          ECS Quality Control · Internal supervisor &amp; manager workspace
        </footer>
      </AppPageBody>
    </AppPage>
  );
}
