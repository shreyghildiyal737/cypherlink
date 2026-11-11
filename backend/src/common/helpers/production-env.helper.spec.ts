import { assertProductionEnv, findProductionEnvProblems } from './production-env.helper';

const strong = 'x'.repeat(40);

function productionEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://u:p@db.example.com/cypherlink',
    JWT_ACCESS_SECRET: strong,
    COOKIE_SECRET: strong,
    FRONTEND_URL: 'https://cypherlink.example.com',
    S3_ENDPOINT: 'https://storage.example.com',
    S3_BUCKET: 'uploads',
    S3_ACCESS_KEY_ID: 'key-id',
    S3_SECRET_ACCESS_KEY: 'secret-key',
    S3_PUBLIC_URL: 'https://storage.example.com/uploads',
    ...overrides,
  };
}

describe('production env guard', () => {
  it('ignores development, where the local fallbacks are wanted', () => {
    expect(findProductionEnvProblems({ NODE_ENV: 'development' })).toEqual([]);
  });

  it('accepts a complete production environment', () => {
    expect(() => assertProductionEnv(productionEnv())).not.toThrow();
  });

  it('refuses a missing JWT secret, which would fall back to a public value', () => {
    expect(findProductionEnvProblems(productionEnv({ JWT_ACCESS_SECRET: undefined }))).toContain(
      'JWT_ACCESS_SECRET is not set',
    );
  });

  it('refuses values copied from .env.example', () => {
    const problems = findProductionEnvProblems(
      productionEnv({ COOKIE_SECRET: 'change-me-cookie-secret-padded-to-length', S3_ACCESS_KEY_ID: 'minioadmin' }),
    );
    expect(problems).toEqual([
      'COOKIE_SECRET still holds a placeholder value',
      'S3_ACCESS_KEY_ID still holds a placeholder value',
    ]);
  });

  it('refuses a short signing secret', () => {
    expect(findProductionEnvProblems(productionEnv({ JWT_ACCESS_SECRET: 'short' }))).toContain(
      'JWT_ACCESS_SECRET must be at least 32 characters',
    );
  });

  it('names the variables but never prints their values', () => {
    const secret = 'dev-secret-' + 'y'.repeat(30);
    expect(() => assertProductionEnv(productionEnv({ JWT_ACCESS_SECRET: secret }))).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining(secret) }),
    );
  });
});
