import Link from "next/link";
import type { ReactNode } from "react";

import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageEmptyState,
  PageSection,
  RecordList,
  RecordListItem,
} from "@/lib/ux/app-page";
import { ux } from "@/lib/ux/tokens";

type SetupListPageProps = {
  backHref?: string | undefined;
  backLabel?: string | undefined;
  eyebrow?: string | undefined;
  title: string;
  titleAccent?: string | undefined;
  description: string;
  createForm?: ReactNode;
  searchForm?: ReactNode;
  listHeading: string;
  listHeadingId: string;
  toggleHref: string;
  toggleLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  records: Array<{
    id: string;
    href: string;
    title: string;
    subtitle?: string | undefined;
    meta?: string | undefined;
    actionLabel?: string | undefined;
  }>;
};

export function SetupListPage({
  backHref = "/setup",
  backLabel = "Setup",
  eyebrow = "Setup",
  title,
  titleAccent,
  description,
  createForm,
  searchForm,
  listHeading,
  listHeadingId,
  toggleHref,
  toggleLabel,
  emptyTitle,
  emptyDescription,
  records,
}: SetupListPageProps) {
  return (
    <AppPage>
      <AppPageHero
        backHref={backHref}
        backLabel={backLabel}
        description={description}
        eyebrow={eyebrow}
        title={title}
        titleAccent={titleAccent}
      />

      <AppPageBody>
        {createForm ? (
          <PageSection heading="Create" headingId={`${listHeadingId}-create`} icon="plus">
            {createForm}
          </PageSection>
        ) : null}

        {searchForm ? (
          <PageSection heading="Search" headingId={`${listHeadingId}-search`} icon="search">
            {searchForm}
          </PageSection>
        ) : null}

        <PageSection
          headerAside={
            <Link className={ux.textLink} href={toggleHref}>
              {toggleLabel}
            </Link>
          }
          heading={listHeading}
          headingId={listHeadingId}
          icon="list"
        >
          {records.length === 0 ? (
            <PageEmptyState
              description={emptyDescription}
              icon="list"
              title={emptyTitle}
            />
          ) : (
            <RecordList label={listHeading}>
              {records.map((record) => (
                <RecordListItem
                  actionLabel={record.actionLabel}
                  href={record.href}
                  key={record.id}
                  meta={record.meta}
                  subtitle={record.subtitle}
                  title={record.title}
                />
              ))}
            </RecordList>
          )}
        </PageSection>
      </AppPageBody>
    </AppPage>
  );
}
