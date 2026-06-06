import Link from "next/link";
import type { ReactNode } from "react";

import { getDashboardMetrics } from "@/lib/dashboard/repository";
import { resolveDateRange } from "@/lib/date-ranges";
import { listActiveDraftInspections } from "@/lib/inspections/drafts/repository";

type DashboardMetricsProps = {
  range?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  canViewActiveDraftMetadata: boolean;
  canEditDrafts: boolean;
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function passRate(pass: number, fail: number): number | null {
  const denom = pass + fail;
  if (denom === 0) return null;
  return Math.round((pass / denom) * 100);
}

function clampPercent(value: number, min: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(min, Math.min(100, value));
}

function Icon({ d, className }: { d: string; className?: string | undefined }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  ticket: "M3 8.25A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25v7.5A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-7.5Zm9 4.5h.008v.008H12v-.008Z",
  check: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  shield: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  draft: "M16.862 4.487 18.549 2.799a2.121 2.121 0 1 1 3 3L19.862 7.487m-3-3L6.375 17.963a4.5 4.5 0 0 1-1.682 1.182L2.5 20.25l1.104-2.193a4.5 4.5 0 0 1 1.182-1.682l10.5-10.5m-2.424 2.424 2.424 2.424",
  building: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
  arrow: "M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3",
  spark: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
} as const;

type IconKey = keyof typeof ICONS;

function Glyph({ name, className }: { name: IconKey; className?: string }) {
  return <Icon className={className} d={ICONS[name]} />;
}

function ResultDonut({
  pass,
  fail,
  notApplicable,
}: {
  pass: number;
  fail: number;
  notApplicable: number;
}) {
  const total = pass + fail + notApplicable;
  const rate = passRate(pass, fail);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex size-32 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400">
          <Glyph className="size-10" name="draft" />
        </div>
        <div>
          <p className="font-display text-base font-semibold text-slate-900">
            No inspection results yet
          </p>
          <p className="mt-1 text-sm text-muted-ink">
            Submitted Inspections will appear here once Supervisors close them.
          </p>
        </div>
      </div>
    );
  }

  const passPct = (pass / total) * 100;
  const failPct = (fail / total) * 100;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
      <div className="relative mx-auto">
        <div
          aria-label={`Pass ${pass}, Fail ${fail}, N/A ${notApplicable}`}
          className="relative size-44 rounded-full"
          role="img"
          style={{
            background: `conic-gradient(
              var(--color-brand-emerald-500) 0% ${passPct}%,
              oklch(0.62 0.21 25) ${passPct}% ${passPct + failPct}%,
              oklch(0.78 0.02 250) ${passPct + failPct}% 100%
            )`,
          }}
        >
          <div className="absolute inset-2 rounded-full bg-white shadow-[inset_0_1px_0_rgba(15,23,42,0.04)]" />
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-slate-950">
            {rate === null ? "—" : `${rate}%`}
          </span>
          <span className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-ink">
            Pass rate
          </span>
        </div>
      </div>

      <ul className="space-y-2.5">
        <LegendDot color="var(--color-brand-emerald-500)" label="Pass" value={pass} />
        <LegendDot color="oklch(0.62 0.21 25)" label="Fail" value={fail} />
        <LegendDot color="oklch(0.78 0.02 250)" label="N/A" value={notApplicable} />
        <li className="pt-2 text-xs text-muted-ink">
          Of {pass + fail} applicable items across {total} total.
        </li>
      </ul>
    </div>
  );
}

function LegendDot({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2">
      <span className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full ring-2 ring-white"
          style={{ background: color, boxShadow: `0 0 0 1px ${color}22` }}
        />
        {label}
      </span>
      <span className="font-display text-base font-semibold tabular-nums text-slate-950">
        {value}
      </span>
    </li>
  );
}

function StatTile({
  label,
  value,
  delta,
  tone,
  icon,
  href,
  linkLabel,
}: {
  label: string;
  value: string | number;
  delta?: { text: string; tone: "up" | "down" | "neutral" } | undefined;
  tone: "emerald" | "forest" | "amber" | "slate";
  icon: ReactNode;
  href?: string | undefined;
  linkLabel?: string | undefined;
}) {
  const toneStyles: Record<typeof tone, string> = {
    emerald:
      "from-brand-emerald-500/15 via-brand-emerald-400/5 to-transparent text-brand-emerald-700 ring-brand-emerald-500/20",
    forest:
      "from-brand-forest-500/15 via-brand-forest-400/5 to-transparent text-brand-forest-700 ring-brand-forest-500/20",
    amber:
      "from-amber-500/15 via-amber-400/5 to-transparent text-amber-700 ring-amber-500/20",
    slate: "from-slate-500/10 via-slate-400/5 to-transparent text-slate-700 ring-slate-400/20",
  };

  const content = (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${toneStyles[tone].split(" ")[0]} ${toneStyles[tone].split(" ")[1]} ${toneStyles[tone].split(" ")[2]}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-ink">
            {label}
          </p>
          <p className="mt-3 font-display text-4xl font-bold leading-none tracking-tight text-slate-950 tabular-nums">
            {value}
          </p>
          {delta ? (
            <p
              className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
                delta.tone === "up"
                  ? "text-brand-emerald-700"
                  : delta.tone === "down"
                  ? "text-rose-600"
                  : "text-muted-ink"
              }`}
            >
              <span aria-hidden="true">{delta.tone === "up" ? "↑" : delta.tone === "down" ? "↓" : "·"}</span>
              {delta.text}
            </p>
          ) : null}
        </div>
        <div
          className={`flex size-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 ${toneStyles[tone].split(" ").pop()}`}
        >
          {icon}
        </div>
      </div>
    </>
  );

  const className = `relative block overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 ring-1 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition ${toneStyles[tone]} ${
    href ? "hover:border-brand-forest-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-400" : "hover:shadow-md"
  }`;

  if (href) {
    return (
      <Link aria-label={linkLabel ?? `View ${label}`} className={className} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function BuildingRank({
  rank,
  name,
  count,
  max,
}: {
  rank: number;
  name: string;
  count: number;
  max: number;
}) {
  const pct = clampPercent((count / Math.max(max, 1)) * 100, 8);
  const isTop3 = rank < 3;

  return (
    <li className="group flex items-center gap-4 rounded-xl px-1 py-1.5 transition hover:bg-slate-50">
      <span
        aria-hidden="true"
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
          isTop3
            ? "bg-brand-forest-800 text-brand-emerald-300"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {rank + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
          <p className="font-display text-base font-bold tabular-nums text-slate-950">
            {count}
          </p>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-forest-700 to-brand-emerald-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </li>
  );
}

function DraftRow({
  building,
  client,
  startedByEmail,
  startedAt,
  areaCount,
  itemCount,
  canEdit,
  draftId,
}: {
  building: string;
  client: string;
  startedByEmail: string;
  startedAt: Date;
  areaCount: number;
  itemCount: number;
  canEdit: boolean;
  draftId: string;
}) {
  return (
    <li className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-brand-forest-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-forest-100 to-brand-emerald-100 text-brand-forest-800 ring-1 ring-brand-forest-200/60">
          <Glyph className="size-5" name="draft" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="truncate font-display text-base font-semibold text-slate-950">
            {building}
          </p>
          <p className="truncate text-sm text-muted-ink">
            {client} · Started {formatDateTime(startedAt)} by{" "}
            <span className="font-medium text-slate-700">{startedByEmail}</span>
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-700">
              {areaCount} areas
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-700">
              {itemCount} items
            </span>
          </div>
        </div>
      </div>
      {canEdit ? (
        <Link
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-forest-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-forest-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-400"
          href={`/inspections/drafts/${draftId}`}
        >
          Continue
          <Glyph className="size-3.5" name="arrow" />
        </Link>
      ) : (
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Read-only metadata
        </span>
      )}
    </li>
  );
}

export async function DashboardMetrics({
  range: rangePreset,
  startDate,
  endDate,
  canViewActiveDraftMetadata,
  canEditDrafts,
}: DashboardMetricsProps) {
  const range = resolveDateRange({
    preset: rangePreset,
    startDate,
    endDate,
  });

  const [metrics, activeDrafts] = await Promise.all([
    getDashboardMetrics({ startAt: range.startAt, endBefore: range.endBefore }),
    canViewActiveDraftMetadata ? listActiveDraftInspections() : Promise.resolve([]),
  ]);

  const resultTotal =
    metrics.inspectionResultCounts.pass +
    metrics.inspectionResultCounts.fail +
    metrics.inspectionResultCounts.notApplicable;

  const rate = passRate(metrics.inspectionResultCounts.pass, metrics.inspectionResultCounts.fail);

  const closedDelta =
    metrics.ticketStatusCounts.closed > 0 && metrics.ticketStatusCounts.open > 0
      ? Math.round(
          (metrics.ticketStatusCounts.closed /
            (metrics.ticketStatusCounts.closed + metrics.ticketStatusCounts.open)) *
            100,
        )
      : null;

  const buildingMax = Math.max(
    0,
    ...metrics.openTicketsByBuilding.map((building) => building.openTicketCount),
  );

  return (
    <div className="space-y-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-forest-700">
        {resultTotal} inspection items · {metrics.ticketStatusCounts.open +
          metrics.ticketStatusCounts.closed}{" "}
        tickets
      </p>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          delta={
            closedDelta === null
              ? undefined
              : { text: `${closedDelta}% closed`, tone: closedDelta >= 70 ? "up" : "neutral" }
          }
          href="/tickets"
          icon={<Glyph className="size-5" name="ticket" />}
          label="Open Tickets"
          linkLabel="View open tickets"
          tone="forest"
          value={metrics.ticketStatusCounts.open}
        />
        <StatTile
          href="/inspections?status=submitted"
          icon={<Glyph className="size-5" name="check" />}
          label="Closed Tickets"
          linkLabel="View submitted inspections"
          tone="emerald"
          value={metrics.ticketStatusCounts.closed}
        />
        <StatTile
          delta={
            rate === null
              ? { text: "No applicable items", tone: "neutral" }
              : { text: `${rate}% pass rate`, tone: rate >= 80 ? "up" : rate >= 60 ? "neutral" : "down" }
          }
          icon={<Glyph className="size-5" name="shield" />}
          label="Pass Rate"
          tone={rate === null ? "slate" : rate >= 80 ? "emerald" : rate >= 60 ? "amber" : "amber"}
          value={rate === null ? "—" : `${rate}%`}
        />
        <StatTile
          href="/inspections/drafts"
          icon={<Glyph className="size-5" name="draft" />}
          label="Active Drafts"
          linkLabel="View active draft inspections"
          tone="slate"
          value={activeDrafts.length}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-3">
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-950">
                Inspection Result breakdown
              </h2>
              <p className="mt-0.5 text-sm text-muted-ink">
                Pass · Fail · N/A across all Submitted Inspections in this range.
              </p>
            </div>
            <span className="hidden items-center gap-1 rounded-full bg-brand-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-emerald-700 sm:inline-flex">
              <Glyph className="size-3" name="spark" />
              Live
            </span>
          </header>
          <ResultDonut
            fail={metrics.inspectionResultCounts.fail}
            notApplicable={metrics.inspectionResultCounts.notApplicable}
            pass={metrics.inspectionResultCounts.pass}
          />
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-2">
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-950">
                Open Tickets by Building
              </h2>
              <p className="mt-0.5 text-sm text-muted-ink">
                Where to focus your next walk-through.
              </p>
            </div>
            <Glyph className="size-5 shrink-0 text-brand-forest-700" name="building" />
          </header>
          {metrics.openTicketsByBuilding.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-emerald-50 text-brand-emerald-700">
                <Glyph className="size-6" name="check" />
              </div>
              <p className="font-display text-base font-semibold text-slate-900">
                No open tickets
              </p>
              <p className="text-sm text-muted-ink">Every Building is fully resolved.</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {metrics.openTicketsByBuilding.map((building, index) => (
                <BuildingRank
                  count={building.openTicketCount}
                  key={building.buildingId}
                  max={buildingMax}
                  name={building.buildingName}
                  rank={index}
                />
              ))}
            </ul>
          )}
        </article>
      </section>

      {canViewActiveDraftMetadata ? (
        <section
          aria-labelledby="active-draft-inspections-heading"
          className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-7"
        >
          <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-forest-700">
                In progress
              </p>
              <h2
                className="mt-1 font-display text-lg font-semibold text-slate-950"
                id="active-draft-inspections-heading"
              >
                Active Draft Inspections
              </h2>
              <p className="mt-0.5 text-sm text-muted-ink">
                Drafts are kept separate from completed and reportable inspection data.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-forest-700 transition hover:text-brand-forest-900"
              href="/inspections/drafts"
            >
              View all Drafts
              <Glyph className="size-3.5" name="arrow" />
            </Link>
          </header>

          {activeDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                <Glyph className="size-6" name="draft" />
              </div>
              <p className="font-display text-base font-semibold text-slate-900">
                No active drafts
              </p>
              <p className="text-sm text-muted-ink">
                Started Drafts will appear here while Supervisors are in the field.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeDrafts.map((draft) => (
                <DraftRow
                  areaCount={draft.areaInspectionCount}
                  building={draft.buildingNameSnapshot}
                  canEdit={canEditDrafts}
                  client={draft.clientNameSnapshot}
                  draftId={draft.id}
                  itemCount={draft.itemCount}
                  key={draft.id}
                  startedAt={draft.startedAt}
                  startedByEmail={draft.startedByEmail}
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
