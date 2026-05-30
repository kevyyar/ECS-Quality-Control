# Deployment environments

ECS QC deploys to Vercel with separate Supabase projects/databases for staging and production.

## Targets

| Environment | Vercel environment | Supabase target | Purpose |
| --- | --- | --- | --- |
| Staging | Preview deployment for the staging branch or protected preview alias | Staging Supabase project | Validate migrations, auth, storage, and PDF flows before launch. |
| Production | Production deployment on the production domain | Production Supabase project | Live internal ECS quality-control app. |

Use Vercel Project Settings for secrets. Do not place real credentials in `vercel.json`, example env files, or documentation.

## Required environment variables

Set these in both staging and production:

| Variable | Vercel scope | Secret? | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Preview/Production | No | Absolute URL for the deployment target. |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview/Production | No | Supabase project API URL. Safe for browser use. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview/Production | No | Supabase anon key. Safe for authenticated browser clients. |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview/Production | Yes | Server-only key for private storage and service operations. Never expose to client code. |
| `DATABASE_URL` | Preview/Production | Yes | Postgres connection string used by Drizzle migrations and runtime database access. |

Safe templates live in `.env.staging.example` and `.env.production.example`.

## Vercel configuration

`vercel.json` pins the deployment path:

1. `corepack enable && pnpm install --frozen-lockfile`
2. `pnpm deploy:check && pnpm build`

`pnpm deploy:check` runs:

1. `node scripts/check-deployment-env.mjs`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`

The env check fails fast when required variables are missing, still contain `replace-with...` placeholders, or have obviously invalid URL/database formats.

## Clean checkout deployment runbook

From a fresh checkout:

```bash
corepack enable
corepack use pnpm@11.1.2
pnpm install --frozen-lockfile
```

Configure Vercel environment variables for the target environment using Project Settings or the Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
```

Repeat with the staging/preview environment values for staging.

```bash
vercel env add NEXT_PUBLIC_APP_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add DATABASE_URL preview
```

Before promoting a deployment, follow the [Production migration process](#production-migration-process). Do not bypass that checklist with a direct migration command.

Then deploy through Vercel. Production can be triggered by merging to the configured production branch or manually with:

```bash
vercel deploy --prod
```

Staging is a Vercel Preview deployment from the staging branch or protected preview alias:

```bash
vercel deploy
```

The configured build command runs the env check, typecheck, lint, tests, and production build.


## Production data and file safety

### Production migration process

Run production migrations as an explicit operator step, not as ad hoc SQL during deployment:

1. Confirm the target environment and Supabase project before touching data.
2. Confirm the migration files and `drizzle/meta/_journal.json` are committed and match the release being deployed.
3. Do not run `pnpm db:generate` or hand-edited SQL against production; production uses reviewed migration files only.
4. Pull the target Vercel env into an ignored local file and validate it before connecting to the database:

   ```bash
   vercel env pull .env.production.local --environment=production
   node -r dotenv/config scripts/check-deployment-env.mjs production dotenv_config_path=.env.production.local
   ```

5. Take a fresh database backup before `pnpm db:migrate`.
6. Pass `DATABASE_URL` explicitly when running migrations so `drizzle.config.ts` cannot fall back to the local development database:

   ```bash
   DATABASE_URL="$(node -r dotenv/config -e 'process.stdout.write(process.env.DATABASE_URL ?? "")' dotenv_config_path=.env.production.local)" pnpm db:migrate
   ```

7. Verify the migration journal on the expected Supabase project, then deploy through Vercel.

### Backup strategy

Backups must cover the application database, Supabase Auth users, and evidence objects together. The database contains business records from `src/db/schema.ts`, Auth references such as `internal_users.auth_user_id`, and evidence references such as `inspection_item_evidence.storage_path` and `ticket_after_photo_evidence.storage_path`.

Minimum operator expectations:

- Take a manual database backup before every production migration.
- Enable Supabase scheduled backups or point-in-time recovery where the project plan supports it.
- Export Supabase Auth users, or document the Supabase backup capability that covers Auth users for the selected plan.
- Copy/export the private `inspection-evidence` storage bucket before every production migration and on the same cadence as database backups.
- Keep database, Auth, and storage backup artifacts associated with the same timestamp or release so restore operators can recover a consistent point in time.
- Keep backup artifacts outside this repository and restrict access to production operators.
- Treat database, Auth, and storage backups as sensitive because they can contain client/building data and inspection evidence.
- Confirm the selected Supabase backup/export process includes Auth users or separately export Auth users so `internal_users` rows can still resolve after restore.

### Photo/object storage safety

Production photo evidence belongs in the private `inspection-evidence` bucket. Browser code must never receive `SUPABASE_SERVICE_ROLE_KEY`; object access goes through server-only helpers in `src/lib/evidence/storage.ts` and temporary signed URL generation. Signed URL access is currently limited to 3600 seconds.

Production bucket expectations mirror local Supabase config: private access, JPEG evidence, and a 10MiB object size expectation. Storage paths are database references, not authorization tokens.

Retention expectations:

- Retain Submitted Inspection before photos and Closed Ticket after photos for at least as long as their database records exist.
- Do not apply bucket lifecycle deletion unless it is coordinated with database retention rules.
- Any future Draft/orphan cleanup must be database-aware and documented before enabling it in production.

### Initial Supervisor bootstrap

Auth signups are disabled, and Supervisor is the highest internal role. Create the first production Supervisor without committing credentials:

1. Create the Supabase Auth user through the Supabase Dashboard or another secure operator-controlled path.
2. Capture the Auth user UUID and email from Supabase.
3. Insert or upsert the matching `internal_users` row with `supervisor = true`. `manager` is optional because Supervisor grants the current admin capabilities.

Example shape with placeholders only:

```sql
insert into public.internal_users (auth_user_id, email, manager, supervisor)
values ('replace-with-auth-user-uuid', 'replace-with-admin-email@example.com', false, true)
on conflict (auth_user_id) do update
set email = excluded.email,
    supervisor = true;
```

Do not commit passwords, invite links, service role keys, or real Auth UUIDs.

### Restore notes

For database failure:

1. Pause writes or stop deployment promotion where practical.
2. Restore the Supabase database backup to the intended point in time.
3. Confirm Supabase Auth users still align with `internal_users.auth_user_id`.
4. If the restore point predates committed migrations, rerun pending Drizzle migrations with `pnpm db:migrate` against the restored target.
5. Smoke-test login, dashboard, inspection read, ticket read, and report generation.

For storage failure:

1. Recreate `inspection-evidence` as a private bucket if it is missing.
2. Restore objects while preserving exact `storage_path` values referenced by the database.
3. Use `inspection_item_evidence.storage_path` and `ticket_after_photo_evidence.storage_path` rows as the source of required objects.
4. Verify before-photo and after-photo access through the app and PDF report flows.
5. Restore missing objects from backup before editing immutable Submitted Inspection or Closed Ticket records.

### Seed/starter data safety

`supabase/seed.sql` is for local development only and currently contains no starter inserts. Production and staging starter data should come from reviewed Drizzle migrations and explicit operator actions, not database reset seeds.

Starter Area Types and Inspection Templates are migration-backed. Run migrations with `pnpm db:migrate` so the Drizzle migration journal prevents starter inserts from re-running unexpectedly.

Any future seed/starter records must be idempotent, use stable natural keys, and include conflict handling so repeated local resets do not duplicate records. Never commit production data, credentials, Auth UUIDs, or storage object paths to seed files.

## Failure modes

| Symptom | Likely cause | Operator action |
| --- | --- | --- |
| `Deployment environment check failed` | Missing, placeholder, or malformed env var | Set the named variable in Vercel and redeploy. |
| `DATABASE_URL: missing or placeholder value` or `invalid value format` | Runtime database URL missing, placeholder, or not a Postgres URL | Verify Vercel env var and Supabase connection string. |
| `SUPABASE_SERVICE_ROLE_KEY: missing or placeholder value` | Server-only Supabase key missing/placeholder | Add service role key to Vercel server env; never expose it as `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_SUPABASE_URL: missing or placeholder value` or `invalid value format` | Public Supabase URL missing, placeholder, or not HTTP(S) | Add the Supabase project URL to Vercel. |
| Build passes but app cannot read/write photos | Storage bucket missing or wrong service role key | Verify the private `inspection-evidence` bucket and service role permissions. |
| Migrations fail | Wrong `DATABASE_URL` or unavailable Supabase database | Confirm target project, connection string, network availability, and rerun `pnpm db:migrate`. |

## Production error visibility

Use the Vercel project dashboard Logs view as the first production error visibility path. Runtime logs include server/action/API `console.error` output from application workflows and can be filtered by environment, status code, log level, and request.

Useful Vercel CLI checks:

```bash
vercel logs --environment production --status-code 5xx --since 1h
vercel logs --environment production --level error --since 30m --expand
```

The app emits sanitized operational diagnostics for login, Draft start/submission, Ticket closure, photo upload, PDF generation, and `/health`. These logs are for support troubleshooting only and are not a product audit log. Do not add photo bytes, storage paths, passwords, service-role keys, or full evidence payloads to log context.
