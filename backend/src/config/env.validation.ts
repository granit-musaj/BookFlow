class EnvError extends Error {
  constructor(missing: string[]) {
    super(`Missing or invalid environment variables: ${missing.join(', ')}`);
  }
}

export type AppEnv = {
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  PORT: number;
  FRONTEND_URL: string;
  NODE_ENV: string;
  COOKIE_SAMESITE: 'lax' | 'strict' | 'none';
  COOKIE_SECURE: boolean;
  COOKIE_DOMAIN?: string;
  COOKIE_PATH: string;
  ANTHROPIC_API_KEY?: string;
};

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const missing: string[] = [];

  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ] as const;

  for (const key of required) {
    if (!raw[key] || String(raw[key]).trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new EnvError(missing);
  }

  const sameSiteRaw = String(raw.COOKIE_SAMESITE ?? 'lax').toLowerCase();
  const sameSite =
    sameSiteRaw === 'strict' || sameSiteRaw === 'none' || sameSiteRaw === 'lax'
      ? sameSiteRaw
      : 'lax';
  const nodeEnv = String(raw.NODE_ENV ?? 'development');
  const secureRaw = raw.COOKIE_SECURE;
  const secure =
    secureRaw === 'true' || secureRaw === '1'
      ? true
      : secureRaw === 'false' || secureRaw === '0'
        ? false
        : nodeEnv === 'production';
  const domain = raw.COOKIE_DOMAIN ? String(raw.COOKIE_DOMAIN).trim() : '';

  return {
    DATABASE_URL: String(raw.DATABASE_URL),
    REDIS_URL: String(raw.REDIS_URL ?? 'redis://localhost:6379'),
    JWT_ACCESS_SECRET: String(raw.JWT_ACCESS_SECRET),
    JWT_REFRESH_SECRET: String(raw.JWT_REFRESH_SECRET),
    JWT_ACCESS_EXPIRES_IN: String(raw.JWT_ACCESS_EXPIRES_IN ?? '15m'),
    JWT_REFRESH_EXPIRES_IN: String(raw.JWT_REFRESH_EXPIRES_IN ?? '7d'),
    PORT: Number(raw.PORT ?? 3000),
    FRONTEND_URL: String(raw.FRONTEND_URL ?? 'http://localhost:5173'),
    NODE_ENV: nodeEnv,
    COOKIE_SAMESITE: sameSite,
    COOKIE_SECURE: secure,
    COOKIE_DOMAIN: domain || undefined,
    COOKIE_PATH: String(raw.COOKIE_PATH ?? '/api/auth'),
    ANTHROPIC_API_KEY: raw.ANTHROPIC_API_KEY
      ? String(raw.ANTHROPIC_API_KEY)
      : undefined,
  };
}
