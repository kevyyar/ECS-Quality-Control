#!/usr/bin/env node

const requiredVariables = [
  // {
  //   name: "NEXT_PUBLIC_APP_URL",
  //   description: "Public app URL for this deployment target.",
  //   validate(value) {
  //     return isUrl(value);
  //   },
  //   hint: "Use the Vercel deployment URL or the configured custom domain.",
  // },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    description: "Supabase project URL for this environment.",
    validate(value) {
      return isUrl(value);
    },
    hint: "Use the Supabase project API URL.",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    description: "Supabase anon key safe for authenticated browser clients.",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Server-only Supabase service role key for private storage/server operations.",
  },
  {
    name: "DATABASE_URL",
    description: "Server/tooling Postgres connection string for Drizzle migrations and runtime DB access.",
    validate(value) {
      return /^postgres(ql)?:\/\//.test(value);
    },
    hint: "Use a postgres:// or postgresql:// connection string.",
  },
];

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isMissingOrPlaceholder(value) {
  const normalized = value?.trim();
  return !normalized || normalized.includes("replace-with");
}

function checkDeploymentEnv(envName, env) {
  const failures = [];

  for (const variable of requiredVariables) {
    const value = env[variable.name];

    if (isMissingOrPlaceholder(value)) {
      failures.push({ variable, reason: "missing or placeholder value" });
      continue;
    }

    if (variable.validate && !variable.validate(value)) {
      failures.push({ variable, reason: "invalid value format" });
    }
  }

  return { envName, failures };
}

function printResult(result) {
  if (result.failures.length === 0) {
    console.log(`Deployment environment check passed for ${result.envName}.`);
    return 0;
  }

  console.error(`Deployment environment check failed for ${result.envName}.`);
  console.error("Missing or invalid variables:");
  for (const failure of result.failures) {
    const hint = failure.variable.hint ? ` ${failure.variable.hint}` : "";
    console.error(
      `- ${failure.variable.name}: ${failure.reason}. ${failure.variable.description}${hint}`,
    );
  }
  console.error("Configure these in Vercel Project Settings or via `vercel env add`. Do not commit secrets.");

  return 1;
}

const envName = process.argv[2] ?? process.env.VERCEL_ENV ?? "production";
const result = checkDeploymentEnv(envName, process.env);
process.exitCode = printResult(result);
