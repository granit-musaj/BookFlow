/**
 * Fallback when Docker Desktop is not installed.
 * Starts real PostgreSQL (embedded official binaries) and Redis on the
 * compose ports: 5432 and 6379.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const vendor = path.resolve(__dirname, '..', '.local-infra', 'node_modules');
module.paths.unshift(vendor);
Module.globalPaths.unshift(vendor);

const dataRoot = path.resolve(__dirname, '..', '.local-infra');
fs.mkdirSync(dataRoot, { recursive: true });

async function startPostgres() {
  const EmbeddedPostgres = require('embedded-postgres');
  const Ctor = EmbeddedPostgres.default || EmbeddedPostgres;
  const pg = new Ctor({
    databaseDir: path.join(dataRoot, 'pg'),
    user: 'bookflow',
    password: 'bookflow',
    port: 5432,
    persistent: true,
  });
  try {
    await pg.initialise();
  } catch (error) {
    const message = String(error && error.message);
    if (!/already initialised|already exists/i.test(message)) {
      throw error;
    }
  }
  await pg.start();
  try {
    await pg.createDatabase('bookflow');
  } catch {
    // already created on a previous run
  }
  return pg;
}

async function startRedis() {
  const { RedisMemoryServer } = require('redis-memory-server');
  const redis = new RedisMemoryServer({
    instance: { port: 6379 },
    autoStart: false,
  });
  await redis.start();
  return redis;
}

async function main() {
  const pg = await startPostgres();
  const redis = await startRedis();
  fs.writeFileSync(
    path.join(dataRoot, 'ready.json'),
    JSON.stringify({ postgres: 5432, redis: 6379, startedAt: new Date().toISOString() }),
  );
  console.log('INFRA_READY postgres=5432 redis=6379');
  const stop = async () => {
    try {
      await redis.stop();
    } catch {
      /* ignore */
    }
    try {
      await pg.stop();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
