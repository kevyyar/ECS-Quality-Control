import Link from "next/link";

import { PageSection } from "@/lib/ux/app-page";
import { Glyph, type GlyphName } from "@/lib/ux/glyph";
import {
  adminNavItems,
  setupCoreNavItems,
  setupExtraNavItems,
  workspaceNavItems,
  type NavItem,
} from "@/lib/ux/setup-nav-items";
import { ux } from "@/lib/ux/tokens";

type DashboardWorkspaceNavProps = {
  canManageSetup: boolean;
  canManageUsers: boolean;
  canViewActiveDraftMetadata: boolean;
};

const touchLink =
  "touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-400 active:scale-[0.99]";

function NavActionRow({ href, title, description, icon }: NavItem) {
  return (
    <Link
      className={`group flex min-h-14 items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:border-brand-forest-300 hover:shadow-md active:border-brand-forest-400 active:bg-brand-forest-50/60 ${touchLink}`}
      href={href}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-forest-50 text-brand-forest-800 ring-1 ring-brand-forest-100 transition group-hover:bg-brand-forest-800 group-hover:text-brand-emerald-300 group-hover:ring-brand-forest-700">
        <Glyph className="size-5" name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-bold text-slate-950">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-ink">{description}</span>
      </span>
      <Glyph
        aria-hidden="true"
        className="size-4 shrink-0 text-brand-forest-700 transition group-hover:translate-x-0.5"
        name="arrow"
      />
    </Link>
  );
}

function SetupFlowStepCard({
  href,
  step,
  title,
  icon,
}: {
  href: string;
  step?: number;
  title: string;
  icon: GlyphName;
}) {
  return (
    <Link
      className={`group flex min-w-[7.5rem] flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-center shadow-sm transition hover:border-brand-forest-300 hover:shadow-md active:border-brand-forest-400 active:bg-brand-forest-50/60 ${touchLink}`}
      href={href}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-brand-forest-800 text-xs font-bold text-white shadow-sm">
        {step}
      </span>
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-forest-50 text-brand-forest-800 ring-1 ring-brand-forest-100 transition group-hover:bg-brand-emerald-50 group-hover:text-brand-forest-900">
        <Glyph className="size-4.5" name={icon} />
      </span>
      <span className="font-display text-sm font-bold leading-tight text-slate-950">{title}</span>
    </Link>
  );
}

function SetupFlowStepRow({ href, step, title, hint, icon }: NavItem) {
  return (
    <Link
      className={`group flex min-h-14 items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:border-brand-forest-300 hover:shadow-md active:border-brand-forest-400 active:bg-brand-forest-50/60 ${touchLink}`}
      href={href}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-forest-800 text-xs font-bold text-white shadow-sm">
        {step}
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-forest-50 text-brand-forest-800 ring-1 ring-brand-forest-100">
        <Glyph className="size-4.5" name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-bold text-slate-950">{title}</span>
        {hint ? (
          <span className="mt-0.5 block text-sm leading-snug text-muted-ink">{hint}</span>
        ) : null}
      </span>
      <Glyph
        aria-hidden="true"
        className="size-4 shrink-0 text-brand-forest-700 transition group-hover:translate-x-0.5"
        name="arrow"
      />
    </Link>
  );
}

function FlowArrow() {
  return (
    <span aria-hidden="true" className="hidden shrink-0 text-slate-300 lg:flex">
      <Glyph className="size-4" name="arrow" />
    </span>
  );
}

function flowStepTitle(item: NavItem): string {
  if (item.href === "/setup/inspection-templates") return "Templates";
  if (item.href === "/setup/building-inspection-plans") return "Plans";
  return item.title;
}

function SecondaryNavLink({ href, title, icon }: { href: string; title: string; icon: GlyphName }) {
  return (
    <Link
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-brand-forest-800 shadow-sm transition hover:border-brand-forest-300 hover:bg-brand-forest-50 active:bg-brand-forest-50/80 sm:w-auto sm:justify-start sm:border-transparent sm:bg-transparent sm:px-2 sm:py-1 sm:shadow-none ${touchLink}`}
      href={href}
    >
      <Glyph className="size-4" name={icon} />
      {title}
    </Link>
  );
}

export function DashboardWorkspaceNav({
  canManageSetup,
  canManageUsers,
  canViewActiveDraftMetadata,
}: DashboardWorkspaceNavProps) {
  const visibleOperateItems = workspaceNavItems.filter(
    (item) => item.href !== "/inspections/drafts" || canViewActiveDraftMetadata,
  );
  const secondaryLinks = [
    ...(canManageSetup ? setupExtraNavItems : []),
    ...(canManageUsers ? adminNavItems : []),
  ];

  return (
    <PageSection
      description={
        <>
          <span className="sm:hidden">Run inspections and tickets from your phone. Configure setup when you are ready.</span>
          <span className="hidden sm:inline">
            Configure locations and checklists first, then run inspections and track corrective
            actions.
          </span>
        </>
      }
      heading="Navigate the workspace"
      headingId="dashboard-nav-heading"
      icon="info"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="border-b border-slate-200/80 px-4 py-4 sm:px-6 sm:py-5">
          <p className={ux.fieldLabel}>Day-to-day work</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {visibleOperateItems.map((item) => (
              <NavActionRow key={item.href} {...item} />
            ))}
          </div>
        </div>

        {canManageSetup ? (
          <div className="border-b border-slate-200/80 bg-gradient-to-br from-brand-forest-50/80 to-white px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={ux.fieldLabel}>Setup path</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700 sm:max-w-2xl">
                  <span className="sm:hidden">
                    Work top to bottom: Client → Building → Area → Template → Plan.
                  </span>
                  <span className="hidden sm:inline">
                    Follow these steps in order: each{" "}
                    <span className="font-semibold text-slate-900">Client</span> gets{" "}
                    <span className="font-semibold text-slate-900">Buildings</span>, each Building
                    gets <span className="font-semibold text-slate-900">Areas</span>, then assign{" "}
                    <span className="font-semibold text-slate-900">Templates</span> in an{" "}
                    <span className="font-semibold text-slate-900">Inspection Plan</span>.
                  </span>
                </p>
              </div>
              <Link
                className={`${ux.secondaryButton} min-h-11 w-full shrink-0 justify-center sm:w-auto ${touchLink}`}
                href="/setup"
              >
                Search setup records
              </Link>
            </div>

            <ol
              aria-label="Recommended setup order"
              className="mt-4 flex flex-col gap-2.5 lg:hidden"
            >
              {setupCoreNavItems.map((item) => (
                <li key={item.href}>
                  <SetupFlowStepRow {...item} title={flowStepTitle(item)} />
                </li>
              ))}
            </ol>

            <div className="mt-5 hidden overflow-x-auto pb-1 lg:block">
              <ol
                aria-label="Recommended setup order"
                className="flex min-w-max items-center gap-2.5 px-1"
              >
                {setupCoreNavItems.map((item, index) => (
                  <li className="flex items-center gap-2.5" key={item.href}>
                    <SetupFlowStepCard {...item} title={flowStepTitle(item)} />
                    {index < setupCoreNavItems.length - 1 ? <FlowArrow /> : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <div className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:px-6">
            <p className="text-sm leading-relaxed text-slate-700">
              Setup records are managed by Supervisors.
            </p>
          </div>
        )}

        {secondaryLinks.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2 sm:px-6">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-ink">
              Also
            </span>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              {secondaryLinks.map((item) => (
                <SecondaryNavLink
                  href={item.href}
                  icon={item.icon}
                  key={item.href}
                  title={item.title}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PageSection>
  );
}
