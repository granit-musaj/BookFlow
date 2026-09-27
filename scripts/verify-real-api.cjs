const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const API = 'http://localhost:3000/api';
const ORIGIN = 'http://localhost:5173';
const envPath = path.resolve(__dirname, '..', 'backend', '.env');
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

function curl(args) {
  const result = spawnSync('curl.exe', ['-sS', ...args], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`curl failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function curlAsync(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('curl.exe', ['-sS', ...args]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout));
        return;
      }
      resolve(stdout);
    });
  });
}

function parseHeaders(raw) {
  const [head, ...rest] = raw.split(/\r?\n\r?\n/);
  const body = rest.join('\n\n');
  const status = Number((head.match(/^HTTP\/[\d.]+ (\d+)/) || [])[1] || 0);
  const headers = {};
  for (const line of head.split(/\r?\n/).slice(1)) {
    const i = line.indexOf(':');
    if (i > 0) {
      const key = line.slice(0, i).toLowerCase();
      const value = line.slice(i + 1).trim();
      headers[key] = headers[key] ? `${headers[key]}\n${value}` : value;
    }
  }
  return { status, headers, body, raw: head };
}

function json(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

const jar = path.resolve(__dirname, '..', '.local-infra', 'verify-cookies.txt');
const clientJar = path.resolve(__dirname, '..', '.local-infra', 'verify-client-cookies.txt');

function login(jarFile, email, password) {
  const raw = curl([
    '-D',
    '-',
    '-o',
    '-',
    '-c',
    jarFile,
    '-H',
    'Content-Type: application/json',
    '-X',
    'POST',
    `${API}/auth/login`,
    '-d',
    JSON.stringify({ email, password }),
  ]);
  return parseHeaders(raw);
}

const evidence = [];

function record(name, ok, detail) {
  evidence.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${detail}`);
}

async function main() {
  const ownerLogin = login(jar, env.SEED_OWNER_EMAIL, env.SEED_OWNER_PASSWORD);
  const ownerBody = json(ownerLogin.body);
  const setCookie = ownerLogin.headers['set-cookie'] || '';
  const cookieOk =
    ownerLogin.status === 200 &&
    /refreshToken=/i.test(setCookie) &&
    /httponly/i.test(setCookie) &&
    /path=\/api\/auth/i.test(setCookie) &&
    /samesite=lax/i.test(setCookie);
  record(
    '6a owner login cookie',
    cookieOk,
    `status=${ownerLogin.status} set-cookie=${setCookie.replace(/refreshToken=[^;]+/i, 'refreshToken=<redacted>')}`,
  );

  const access = ownerBody?.tokens?.accessToken;
  const refresh = curl([
    '-D',
    '-',
    '-o',
    '-',
    '-b',
    jar,
    '-c',
    jar,
    '-H',
    'Content-Type: application/json',
    '-X',
    'POST',
    `${API}/auth/refresh`,
    '-d',
    '{}',
  ]);
  const refreshParsed = parseHeaders(refresh);
  record('6b refresh with cookie', refreshParsed.status === 200, `status=${refreshParsed.status}`);

  const refreshAccess = json(refreshParsed.body)?.tokens?.accessToken || access;
  const me = curl([
    '-D',
    '-',
    '-o',
    '-',
    '-H',
    `Authorization: Bearer ${refreshAccess}`,
    `${API}/auth/me`,
  ]);
  const meParsed = parseHeaders(me);
  const meBody = json(meParsed.body);
  record(
    '6c GET /auth/me',
    meParsed.status === 200 && meBody.role === 'OWNER',
    `status=${meParsed.status} role=${meBody.role} email=${meBody.email}`,
  );

  const preflight = curl([
    '-D',
    '-',
    '-o',
    '-',
    '-X',
    'OPTIONS',
    `${API}/auth/refresh`,
    '-H',
    `Origin: ${ORIGIN}`,
    '-H',
    'Access-Control-Request-Method: POST',
    '-H',
    'Access-Control-Request-Headers: content-type',
  ]);
  const pf = parseHeaders(preflight);
  const corsOk =
    pf.status >= 200 &&
    pf.status < 400 &&
    pf.headers['access-control-allow-origin'] === ORIGIN &&
    /true/i.test(pf.headers['access-control-allow-credentials'] || '');
  record(
    '6d CORS preflight',
    corsOk,
    `status=${pf.status} acao=${pf.headers['access-control-allow-origin']} acac=${pf.headers['access-control-allow-credentials']}`,
  );

  const catalog = json(curl([`${API}/public/businesses/${env.SEED_BUSINESS_SLUG}`]));
  const serviceId = catalog.services?.[0]?.id;
  const staffId = catalog.staff?.find((row) => row.serviceIds.includes(serviceId))?.id;
  let slots = [];
  let date = '';
  const today = new Date();
  for (let i = 0; i < 10; i += 1) {
    const next = new Date(today);
    next.setDate(today.getDate() + i);
    const key = next.toISOString().slice(0, 10);
    const result = json(
      curl([`${API}/public/businesses/${env.SEED_BUSINESS_SLUG}/slots?serviceId=${serviceId}&staffId=${staffId}&date=${key}`]),
    );
    if (result.slots?.length >= 2) {
      slots = result.slots;
      date = key;
      break;
    }
  }
  record(
    '7a public slots',
    slots.length >= 2,
    `date=${date} count=${slots.length} first=${slots[0]?.startAt || 'none'}`,
  );

  const clientLogin = login(clientJar, env.SEED_CLIENT_EMAIL, env.SEED_CLIENT_PASSWORD);
  const clientAccess = json(clientLogin.body)?.tokens?.accessToken;
  record('7b client login', clientLogin.status === 200 && Boolean(clientAccess), `status=${clientLogin.status}`);

  function book(startAt) {
    const raw = curl([
      '-D',
      '-',
      '-o',
      '-',
      '-H',
      'Content-Type: application/json',
      '-H',
      `Authorization: Bearer ${clientAccess}`,
      '-X',
      'POST',
      `${API}/public/businesses/${env.SEED_BUSINESS_SLUG}/bookings`,
      '-d',
      JSON.stringify({ staffId, serviceId, startAt }),
    ]);
    return parseHeaders(raw);
  }

  const first = book(slots[0].startAt);
  const firstBody = json(first.body);
  record(
    '7c book first slot as CLIENT',
    first.status === 201 || first.status === 200,
    `status=${first.status} id=${firstBody.id || firstBody.message}`,
  );

  const confirm = parseHeaders(
    curl([
      '-D',
      '-',
      '-o',
      '-',
      '-H',
      `Authorization: Bearer ${refreshAccess}`,
      '-X',
      'POST',
      `${API}/bookings/${firstBody.id}/confirm`,
    ]),
  );
  const confirmBody = json(confirm.body);
  record(
    '7d owner confirm',
    confirm.status === 200 || confirm.status === 201,
    `status=${confirm.status} statusField=${confirmBody.status}`,
  );

  const again = book(slots[0].startAt);
  record(
    '7e same slot rejected',
    again.status >= 400 && again.status < 500,
    `status=${again.status} body=${JSON.stringify(json(again.body))}`,
  );

  const remaining = json(
    curl([`${API}/public/businesses/${env.SEED_BUSINESS_SLUG}/slots?serviceId=${serviceId}&staffId=${staffId}&date=${date}`]),
  );
  const second = remaining.slots?.[0]?.startAt;
  if (!second) {
    record('7f parallel race only one wins', false, 'no remaining free slot for race');
    const failedEarly = evidence.filter((row) => !row.ok);
    if (failedEarly.length) {
      process.exitCode = 1;
    }
    return;
  }
  const raceArgs = [
    '-D',
    '-',
    '-o',
    '-',
    '-H',
    'Content-Type: application/json',
    '-H',
    `Authorization: Bearer ${clientAccess}`,
    '-X',
    'POST',
    `${API}/public/businesses/${env.SEED_BUSINESS_SLUG}/bookings`,
    '-d',
    JSON.stringify({ staffId, serviceId, startAt: second }),
  ];
  const raced = (await Promise.all([curlAsync(raceArgs), curlAsync(raceArgs)])).map(parseHeaders);
  const successes = raced.filter((row) => row.status === 200 || row.status === 201);
  const failures = raced.filter((row) => row.status >= 400);
  record(
    '7f parallel race only one wins',
    successes.length === 1 && failures.length === 1,
    `statuses=${raced.map((row) => row.status).join(',')} bodies=${raced.map((row) => JSON.stringify(json(row.body))).join(' | ')}`,
  );

  const failed = evidence.filter((row) => !row.ok);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
