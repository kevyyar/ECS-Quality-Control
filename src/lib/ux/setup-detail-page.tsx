import type { ReactNode } from "react";

import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageSection,
} from "@/lib/ux/app-page";
import { Glyph } from "@/lib/ux/glyph";

type SetupDetailPageProps = {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

export function SetupDetailPage({
  backHref,
  backLabel,
  eyebrow,
  title,
  description,
  children,
}: SetupDetailPageProps) {
  return (
    <AppPage>
      <AppPageHero
        backHref={backHref}
        backLabel={backLabel}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      <AppPageBody overlap="detail">{children}</AppPageBody>
    </AppPage>
  );
}

type SetupDetailSectionProps = {
  heading: string;
  headingId: string;
  icon?: Parameters<typeof PageSection>[0]["icon"];
  description?: ReactNode;
  children?: ReactNode;
  headerAside?: ReactNode;
};

export function SetupDetailSection({
  heading,
  headingId,
  icon = "settings",
  description,
  children,
  headerAside,
}: SetupDetailSectionProps) {
  return (
    <PageSection
      description={description}
      headerAside={headerAside}
      heading={heading}
      headingId={headingId}
      icon={icon}
    >
      {children}
    </PageSection>
  );
}

export function SetupStatusBadge({ label }: { label: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-brand-emerald-400/25 bg-brand-emerald-500/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-emerald-200 backdrop-blur-sm">
      <Glyph className="size-3.5 text-brand-emerald-300" name="check" />
      {label}
    </p>
  );
}
