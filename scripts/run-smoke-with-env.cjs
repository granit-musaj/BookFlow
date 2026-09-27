const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const env = { ...process.env };
for (const file of [
  path.resolve(__dirname, '..', 'backend', '.env'),
  path.resolve(__dirname, '..', 'frontend', '.env'),
]) {
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }
    const i = line.indexOf('=');
    env[line.slice(0, i)] = line.slice(i + 1);
  }
}

delete env.VITE_DEMO;
if (!env.SMOKE_API_URL && env.VITE_API_URL) {
  env.SMOKE_API_URL = env.VITE_API_URL;
}

const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', process.argv.slice(2), {
  cwd: path.resolve(__dirname, '..', 'frontend'),
  env,
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 1));
