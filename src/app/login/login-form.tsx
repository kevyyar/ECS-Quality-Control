"use client";

import { useActionState } from "react";

import { signInInternalUser } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    signInInternalUser,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Email Input Field */}
      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="email"
        >
          Email address
        </label>
        <div className="group relative">
          <input
            autoComplete="email"
            className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-2.5 text-base text-slate-950 shadow-none transition-colors duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-forest-800 focus:outline-none focus:ring-0 disabled:opacity-50 font-sans"
            id="email"
            name="email"
            placeholder="you@company.com"
            required
            type="email"
            disabled={isPending}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-left scale-x-0 bg-brand-emerald-400 transition-transform duration-300 ease-out group-focus-within:scale-x-100"
          />
        </div>
      </div>

      {/* Password Input Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="password"
          >
            Password
          </label>
          <button
            className="text-sm font-medium text-brand-emerald-600 transition-colors hover:text-brand-emerald-500 hover:underline focus:outline-none focus-visible:underline disabled:opacity-50 bg-transparent border-0 p-0 cursor-pointer"
            disabled={isPending}
            onClick={() => {
              alert(
                "Please contact your ECS QC System Administrator to reset your password.",
              );
            }}
            type="button"
          >
            Forgot?
          </button>
        </div>
        <div className="group relative">
          <input
            autoComplete="current-password"
            className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-2.5 text-base text-slate-950 shadow-none transition-colors duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-forest-800 focus:outline-none focus:ring-0 disabled:opacity-50 font-sans"
            id="password"
            name="password"
            placeholder="••••••••"
            required
            type="password"
            disabled={isPending}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-left scale-x-0 bg-brand-emerald-400 transition-transform duration-300 ease-out group-focus-within:scale-x-100"
          />
        </div>
      </div>

      {/* Error Message Alert */}
      {state.error ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <svg
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="12"
              x2="12"
              y1="8"
              y2="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="12"
              x2="12.01"
              y1="16"
              y2="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-medium">{state.error}</span>
        </div>
      ) : null}

      {/* Action Buttons Group */}
      <div className="space-y-4 pt-3">
        {/* Submit button */}
        <button
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-forest-700 to-brand-forest-800 px-4 py-3.5 text-base font-semibold text-white shadow-md shadow-brand-forest-900/20 transition-all duration-200 hover:from-brand-forest-600 hover:to-brand-forest-800 hover:shadow-lg hover:shadow-brand-forest-900/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-300 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <>
              <svg
                aria-hidden="true"
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <svg
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </button>

        {/* Divider with lines */}
        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            or
          </span>
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        </div>

        {/* Google sign-in placeholder button */}
        <button
          className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald-300 focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-50"
          disabled={isPending}
          onClick={() => {
            alert(
              "Google Sign-In is only enabled for authorized external client portals. Please log in using your internal Supervisor or Manager email and password.",
            );
          }}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="mr-2.5 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </form>
  );
}
