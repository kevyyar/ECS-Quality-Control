"use client";

import Image from "next/image";

import { LoginForm } from "./login-form";

const APP_BRAND_NAME = "ECS Quality Control";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-slate-50 lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-forest-950 via-brand-forest-800 to-brand-forest-700 lg:flex lg:flex-col lg:justify-between">
        {/* Decorative radial glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 18% 22%, color-mix(in oklch, var(--color-brand-emerald-500) 28%, transparent) 0%, transparent 45%), radial-gradient(circle at 82% 78%, color-mix(in oklch, var(--color-brand-emerald-400) 22%, transparent) 0%, transparent 50%)",
          }}
        />
        {/* Subtle grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />

        {/* Brand mark + wordmark */}
        <div className="relative z-10 flex items-center gap-3 px-12 pt-12 xl:px-16 xl:pt-16">
          <div className="flex items-center justify-center rounded-2xl bg-brand-emerald-400 p-2 shadow-lg shadow-brand-emerald-500/30 ring-1 ring-white/10">
            <Image
              alt="ECS Quality Control"
              className="h-7 w-auto"
              height={28}
              src="/assets/logo.png"
              width={76}
            />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            {APP_BRAND_NAME}
          </span>
        </div>

        {/* Centerpiece tagline */}
        <div className="relative z-10 max-w-xl space-y-6 px-12 xl:px-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-brand-emerald-200 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald-400 shadow-[0_0_8px_var(--color-brand-emerald-400)]" />
            ECS Quality Control
          </p>
          <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-white xl:text-[3.4rem]">
            Inspection&#8209;grade{" "}
            <span className="text-brand-emerald-300">cleanliness proof</span>,
            every shift.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-white/70">
            Standardize building inspections, capture corrective actions with
            photo evidence, and produce audit-ready reports for every Client.
          </p>
        </div>

        {/* Footer trust signal */}
        <div className="relative z-10 flex items-center gap-2 px-12 pb-12 text-xs text-white/55 xl:px-16 xl:pb-16">
          <svg
            className="h-4 w-4 text-brand-emerald-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2.5l8 3.5v6c0 5-3.5 8.5-8 9.5-4.5-1-8-4.5-8-9.5v-6l8-3.5z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 12.5l1.8 1.8L15 10.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Secure internal workspace · Supervisor &amp; Manager access only</span>
        </div>
      </aside>

      {/* Form panel */}
      <section className="relative flex items-center justify-center px-6 py-10 sm:px-10">
        {/* Mobile-only compact brand bar */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-3 border-b border-slate-200/70 bg-white px-6 py-5 lg:hidden">
          <div className="flex items-center justify-center rounded-xl bg-brand-emerald-400 p-1.5 shadow-sm shadow-brand-emerald-500/20">
            <Image
              alt="ECS Quality Control"
              className="h-6 w-auto"
              height={24}
              src="/assets/logo.png"
              width={65}
            />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-950">
            {APP_BRAND_NAME}
          </span>
        </div>

        <div className="w-full max-w-md pt-16 sm:pt-20 lg:pt-0">
          {/* Heading block */}
          <div className="mb-8 space-y-2.5 text-left sm:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-emerald-500">
              Welcome back
            </p>
            <h1 className="text-balance font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Internal login
            </h1>
            <p className="text-base leading-relaxed text-slate-600">
              Sign in with your Supervisor or Manager credentials to access the
              quality-control workspace.
            </p>
          </div>

          {/* Card */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/[0.04] sm:p-8">
            {/* Emerald accent bar */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-emerald-400 via-brand-emerald-500 to-brand-emerald-300"
            />
            <LoginForm />
          </div>

          {/* Footer link */}
          <p className="mt-8 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <button
              className="font-semibold text-brand-emerald-600 transition-colors hover:text-brand-emerald-500 hover:underline focus:outline-none focus-visible:underline"
              onClick={() => {
                alert(
                  "Please contact your ECS QC Administrator to request an internal manager or supervisor account.",
                );
              }}
              type="button"
            >
              Sign Up
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
