// Several modules fall back to a hard-coded JWT secret when the variable is missing. That
// is convenient locally and fatal in production, where anyone who has read the source could
// sign their own tokens. So production refuses to boot until every value below is real.

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'COOKIE_SECRET',
  'FRONTEND_URL',
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  // Without it, presigned URLs handed to users carry the internal storage host.
  'S3_PUBLIC_URL',
] as const;

const SIGNING_SECRETS = ['JWT_ACCESS_SECRET', 'COOKIE_SECRET'] as const;
const MIN_SECRET_LENGTH = 32;

// Values copied from .env.example or the code's own fallbacks.
const PLACEHOLDER_PATTERN = /change-me|dev-secret|minioadmin/i;

export function findProductionEnvProblems(env: NodeJS.ProcessEnv): string[] {
  if (env.NODE_ENV !== 'production') return [];

  const problems: string[] = [];
  for (const name of REQUIRED_IN_PRODUCTION) {
    const value = env[name]?.trim();
    if (!value) {
      problems.push(`${name} is not set`);
    } else if (PLACEHOLDER_PATTERN.test(value)) {
      problems.push(`${name} still holds a placeholder value`);
    }
  }
  for (const name of SIGNING_SECRETS) {
    const value = env[name]?.trim();
    if (value && value.length < MIN_SECRET_LENGTH) {
      problems.push(`${name} must be at least ${MIN_SECRET_LENGTH} characters`);
    }
  }
  return problems;
}

export function assertProductionEnv(env: NodeJS.ProcessEnv = process.env): void {
  const problems = findProductionEnvProblems(env);
  if (problems.length > 0) {
    // Names only, never values: this message ends up in the platform's logs.
    throw new Error(`Refusing to start in production:\n- ${problems.join('\n- ')}`);
  }
}
