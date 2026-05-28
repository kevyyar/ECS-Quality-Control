import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 px-6 py-12 text-ink sm:px-10">
      <section className="mx-auto max-w-md rounded-card border border-slate-200 bg-white/95 p-8 shadow-sm">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            ECS QC
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Internal login
          </h1>
          <p className="text-sm leading-6 text-muted-ink">
            Sign in with your internal Manager or Supervisor account.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
