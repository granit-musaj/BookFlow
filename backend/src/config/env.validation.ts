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

  return {
    DATABASE_URL: String(raw.DATABASE_URL),
    REDIS_URL: String(raw.REDIS_URL ?? 'redis://localhost:6379'),
    JWT_ACCESS_SECRET: String(raw.JWT_ACCESS_SECRET),
    JWT_REFRESH_SECRET: String(raw.JWT_REFRESH_SECRET),
    JWT_ACCESS_EXPIRES_IN: String(raw.JWT_ACCESS_EXPIRES_IN ?? '15m'),
    JWT_REFRESH_EXPIRES_IN: String(raw.JWT_REFRESH_EXPIRES_IN ?? '7d'),
    PORT: Number(raw.PORT ?? 3000),
    FRONTEND_URL: String(raw.FRONTEND_URL ?? 'http://localhost:5173'),
    NODE_ENV: String(raw.NODE_ENV ?? 'development'),
  };
}
