import { requireProtectedAction } from "@/lib/auth/session";
import {
  AppPage,
  AppPageBody,
  AppPageHero,
  PageEmptyState,
} from "@/lib/ux/app-page";

export default async function InternalUsersPage() {
  await requireProtectedAction("manageUsers");

  return (
    <AppPage>
      <AppPageHero
        backHref="/dashboard"
        backLabel="Dashboard"
        description="Manage internal supervisor and manager accounts for the Janitorial Company."
        eyebrow="Administration"
        title="Internal"
        titleAccent="users"
      />

      <AppPageBody>
        <PageEmptyState
          description="User management screens are not wired in this MVP slice yet. Supervisors will create and manage internal accounts here."
          icon="users"
          title="Coming soon"
        />
      </AppPageBody>
    </AppPage>
  );
}
