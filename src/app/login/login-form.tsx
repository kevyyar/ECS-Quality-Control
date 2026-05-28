"use client";

import { useActionState } from "react";

import { signInInternalUser } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    signInInternalUser,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="password"
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        className="w-full rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
