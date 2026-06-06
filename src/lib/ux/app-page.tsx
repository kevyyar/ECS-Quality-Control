import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Glyph, type GlyphName } from "@/lib/ux/glyph";

type AppPageProps = {
  children: ReactNode;
  ambient?: "default" | "detail" | undefined;
};

export function AppPage({ children, ambient = "default" }: AppPageProps) {
  const ambientOpacity = ambient === "detail" ? "opacity-[0.4]" : "opacity-[0.35]";
  const ambientBackground =
    ambient === "detail"
      ? "radial-gradient(ellipse 70% 45% at 50% -10%, color-mix(in oklch, var(--color-brand-emerald-400) 22%, transparent), transparent 65%), radial-gradient(ellipse 50% 35% at 100% 0%, color-mix(in oklch, var(--color-brand-forest-300) 10%, transparent), transparent 55%)"
      : "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklch, var(--color-brand-emerald-300) 18%, transparent), transparent 60%), radial-gradient(ellipse 60% 40% at 0% 0%, color-mix(in oklch, var(--color-brand-forest-300) 12%, transparent), transparent 50%)";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-ink">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${ambientOpacity}`}
        style={{ backgroundImage: ambientBackground }}
      />
      {children}
    </main>
  );
}

type AppPageHeroProps = {
  backHref?: string | undefined;
  backLabel?: string | undefined;
  eyebrow?: string | undefined;
  title: string;
  titleAccent?: string | undefined;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  leading?: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "detail" | undefined;
  layout?: "default" | "dashboard" | undefined;
};

export function AppBrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center rounded-2xl bg-brand-emerald-400 p-2 shadow-lg shadow-brand-emerald-500/30 ring-1 ring-white/10">
        <Image
          alt="ECS Quality Control"
          className="h-7 w-auto"
          height={28}
          src="/assets/logo.png"
          width={76}
        />
      </div>
      <span className="font-display text-xl font-bold tracking-tight text-white">
        ECS Quality Control
      </span>
    </div>
  );
}

export function AppPageHero({
  backHref,
  backLabel,
  eyebrow,
  title,
  titleAccent,
  description,
  actions,
  badge,
  leading,
  footer,
  variant = "default",
  layout = "default",
}: AppPageHeroProps) {
  const isDetail = variant === "detail";
  const heroPadding = isDetail
    ? "pb-20 pt-10 lg:pb-24 lg:pt-14"
    : "pb-12 pt-10 lg:pb-16 lg:pt-14";
  const rowGap = layout === "dashboard" ? "gap-8" : "gap-6";
  const columnGap = layout === "dashboard" ? "space-y-6" : "space-y-4";

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className={
          isDetail
            ? "absolute inset-0 bg-gradient-to-br from-brand-forest-950 via-brand-forest-800 to-brand-emerald-900"
            : "absolute inset-0 bg-gradient-to-br from-brand-forest-950 via-brand-forest-800 to-brand-forest-700"
        }
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDetail
            ? "radial-gradient(circle at 12% 18%, color-mix(in oklch, var(--color-brand-emerald-400) 32%, transparent) 0%, transparent 42%), radial-gradient(circle at 88% 82%, color-mix(in oklch, var(--color-brand-emerald-500) 18%, transparent) 0%, transparent 48%)"
            : "radial-gradient(circle at 18% 22%, color-mix(in oklch, var(--color-brand-emerald-500) 28%, transparent) 0%, transparent 45%), radial-gradient(circle at 82% 78%, color-mix(in oklch, var(--color-brand-emerald-400) 22%, transparent) 0%, transparent 50%)",
        }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${isDetail ? "opacity-[0.06]" : "opacity-[0.07]"}`}
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: isDetail ? "48px 48px" : "56px 56px",
          maskImage: isDetail
            ? "radial-gradient(ellipse at center, black 25%, transparent 72%)"
            : "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: isDetail
            ? "radial-gradient(ellipse at center, black 25%, transparent 72%)"
            : "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className={`relative mx-auto max-w-6xl px-6 sm:px-10 ${heroPadding}`}>
        <div className={`flex flex-col ${rowGap} lg:flex-row lg:items-end lg:justify-between`}>
          <div className={columnGap}>
            {leading}

            {backHref && backLabel ? (
              <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-emerald-300 transition hover:text-brand-emerald-200" href={backHref}>
                <Glyph className="size-4" name="arrowLeft" />
                {backLabel}
              </Link>
            ) : null}

            <div className="space-y-3">
              {eyebrow || badge ? (
                <div className="flex flex-wrap items-center gap-2">
                  {eyebrow ? (
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-emerald-200 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-emerald-400 shadow-[0_0_8px_var(--color-brand-emerald-400)]" />
                      {eyebrow}
                    </p>
                  ) : null}
                  {badge}
                </div>
              ) : null}
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
                {title}
                {titleAccent ? (
                  <>
                    {" "}
                    <span className="text-brand-emerald-300">{titleAccent}</span>
                  </>
                ) : null}
              </h1>
              {description ? (
                <div className="max-w-xl text-sm leading-relaxed text-white/70">
                  {description}
                </div>
              ) : null}
            </div>

            {footer}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

type AppPageBodyProps = {
  children: ReactNode;
  className?: string | undefined;
  overlap?: "default" | "detail" | "dashboard" | "flush" | undefined;
};

export function AppPageBody({
  children,
  className,
  overlap = "default",
}: AppPageBodyProps) {
  const overlapClass =
    overlap === "detail"
      ? "-mt-12 space-y-8"
      : overlap === "dashboard"
        ? "-mt-6 space-y-8"
        : overlap === "flush"
          ? "space-y-6"
          : "-mt-8 space-y-6";

  return (
    <div className="relative mx-auto max-w-6xl px-6 pb-16 sm:px-10">
      <div className={[overlapClass, className].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
}

type PageSectionProps = {
  children?: ReactNode;
  heading?: string | undefined;
  headingId?: string | undefined;
  icon?: GlyphName | undefined;
  description?: ReactNode;
  badge?: ReactNode;
  headerAside?: ReactNode;
};

export function PageSection({
  children,
  heading,
  headingId,
  icon,
  description,
  badge,
  headerAside,
}: PageSectionProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6"
    >
      {heading ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-forest-800 text-brand-emerald-300 shadow-sm">
                <Glyph className="size-4.5" name={icon} />
              </div>
            ) : null}
            <div>
              <h2
                className="font-display text-base font-bold text-slate-900"
                id={headingId}
              >
                {heading}
              </h2>
              {description ? (
                <p className="mt-0.5 text-sm text-muted-ink">{description}</p>
              ) : null}
            </div>
            {badge}
          </div>
          {headerAside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type PageEmptyStateProps = {
  icon: GlyphName;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageEmptyState({
  icon,
  title,
  description,
  action,
}: PageEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/85 px-6 py-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100">
        <Glyph className="size-6" name={icon} />
      </div>
      <div>
        <p className="font-display text-base font-semibold text-slate-900">
          {title}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-ink">{description}</p>
      </div>
      {action}
    </div>
  );
}

type RecordListProps = {
  children: ReactNode;
  label: string;
};

export function RecordList({ children, label }: RecordListProps) {
  return (
    <ul aria-label={label} className="grid gap-4">
      {children}
    </ul>
  );
}

type RecordListItemProps = {
  href: string;
  title: string;
  subtitle?: string | undefined;
  meta?: string | undefined;
  actionLabel?: string | undefined;
};

export function RecordListItem({
  href,
  title,
  subtitle,
  meta,
  actionLabel = "View",
}: RecordListItemProps) {
  return (
    <li>
      <Link className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-brand-forest-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-400" href={href}>
        <span className="min-w-0">
          <span className="block font-display text-base font-bold text-slate-950">
            {title}
          </span>
          {subtitle ? (
            <span className="mt-1 block text-sm text-muted-ink">{subtitle}</span>
          ) : null}
          {meta ? (
            <span className="mt-2 inline-block rounded-md bg-brand-forest-50 px-2 py-0.5 text-xs font-medium text-brand-forest-700">
              {meta}
            </span>
          ) : null}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-forest-800 transition group-hover:text-brand-forest-700">
          {actionLabel}
          <Glyph className="size-3.5" name="arrow" />
        </span>
      </Link>
    </li>
  );
}

type SetupNavCardProps = {
  href: string;
  title: string;
  description: string;
};

type PageBandHeadingProps = {
  count?: number | undefined;
  heading: string;
  headingId: string;
  icon: GlyphName;
};

export function PageBandHeading({
  count,
  heading,
  headingId,
  icon,
}: PageBandHeadingProps) {
  return (
    <div className="mb-4 flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-forest-800 text-brand-emerald-300 shadow-sm">
        <Glyph className="size-4.5" name={icon} />
      </div>
      <h2 className="font-display text-lg font-bold text-slate-900" id={headingId}>
        {heading}
      </h2>
      {count !== undefined ? (
        <span className="inline-flex items-center justify-center rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
          {count}
        </span>
      ) : null}
    </div>
  );
}

export function SetupNavCard({ href, title, description }: SetupNavCardProps) {
  return (
    <Link className="block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-brand-forest-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-400" href={href}>
      <span className="block font-display text-lg font-bold text-slate-950">
        {title}
      </span>
      <span className="mt-2 block text-sm leading-relaxed text-muted-ink">
        {description}
      </span>
    </Link>
  );
}
