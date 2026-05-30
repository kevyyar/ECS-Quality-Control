# ECS QC — Janitorial Quality Control

Internal janitorial quality-control MVP foundation.

This repository uses the stack approved in GitHub issue #2:

- Next.js 16 App Router on Node.js
- React 19 and TypeScript
- Tailwind CSS v4
- Supabase Postgres, Auth, and Storage
- Drizzle ORM and Drizzle Kit
- Vitest and Playwright
- Vercel deployment target
- pnpm package manager

Product scope and vocabulary live in [`CONTEXT.md`](./CONTEXT.md), [`MVP-SPEC.md`](./MVP-SPEC.md), and [`docs/adr/`](./docs/adr/).

## Prerequisites

- Node.js 22 or newer
- pnpm 11.x via Corepack or a local pnpm install
- Supabase CLI and Docker for local database-backed work

Enable pnpm with Corepack if needed:

```bash
corepack enable
corepack use pnpm@11.1.2
```

## Fresh clone setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create local environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Start the local Supabase stack:

   ```bash
   pnpm supabase:start
   ```

   The local Supabase stack uses project-specific `563xx` ports so it can run alongside other Supabase projects.

4. Replace the placeholder Supabase keys in `.env.local` with values from:

   ```bash
   pnpm supabase:status
   ```

   Use the local `Publishable` value for `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Keep the local `Secret` value server-only.

5. Apply database migrations to the local Supabase database:

   ```bash
   pnpm db:migrate
   ```

6. Ensure the private Supabase Storage bucket from `supabase/config.toml`
   exists (`inspection-evidence`) before using Draft Inspection photo evidence.

7. Start the development server:

   ```bash
   pnpm dev
   ```

8. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Scope | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Browser/server | Local app URL used by tooling and future absolute links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | Supabase project URL. Safe to expose to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | Supabase anon key. Safe to expose to authenticated browser clients. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key. Never expose to client code. |
| `DATABASE_URL` | Server/tooling only | Postgres connection string used by Drizzle Kit migrations. |

Only variables prefixed with `NEXT_PUBLIC_` may be read by browser code.

## Developer commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server. |
| `pnpm build` | Build the app for production. |
| `pnpm start` | Start the production server after `pnpm build`. |
| `pnpm typecheck` | Run TypeScript without emitting files. |
| `pnpm lint` | Run ESLint. |
| `pnpm test` | Run Vitest unit tests. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm test:e2e` | Run Playwright end-to-end tests. |
| `pnpm supabase:start` | Start the local Supabase stack. |
| `pnpm supabase:status` | Print local Supabase URLs and keys. |
| `pnpm supabase:stop` | Stop the local Supabase stack. |
| `pnpm db:generate` | Generate Drizzle migrations from schema changes. |
| `pnpm db:migrate` | Apply Drizzle migrations using `DATABASE_URL`. |
| `pnpm db:studio` | Open Drizzle Studio for the configured database. |


## Deployment

Staging and production deployment instructions live in [`docs/deployment.md`](./docs/deployment.md). The Vercel build path runs `pnpm deploy:check && pnpm build`, so deployments fail fast when required environment variables are missing and always run typecheck, lint, and unit tests before the production build. The same document covers production migration safety, backups, photo/object storage boundaries, Supervisor bootstrap, restore notes, and seed/starter-data safety.

## Database and migrations

Drizzle Kit reads configuration from [`drizzle.config.ts`](./drizzle.config.ts). The schema entrypoint is [`src/db/schema.ts`](./src/db/schema.ts), and generated migrations are written to `drizzle/`.

This scaffold intentionally does not create domain tables. Add migration-backed tables only in the issue that introduces the corresponding product workflow.

## Verification checklist

Run these before opening a pull request:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Run Playwright when browser dependencies are installed:

```bash
pnpm test:e2e
```
