// Pushes the API keys from the local .env into Firebase Secret Manager so the deployed function receives
// them at runtime. Run once (and again whenever a key changes): `npm run secrets:set`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
const env = {};
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const projectId = process.env.FIREBASE_PROJECT_ID || JSON.parse(fs.readFileSync(path.join(root, '.firebaserc'), 'utf8')).projects.default;
const SECRETS = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'GMAIL_APP_PASSWORD'];

for (const name of SECRETS) {
  // An empty value still creates the secret (a single space) so `defineSecret` bindings resolve.
  const value = (env[name] || '').trim() || ' ';
  const tmp = path.join(os.tmpdir(), `admitroute-secret-${name}.txt`);
  fs.writeFileSync(tmp, value, { encoding: 'utf8' });
  console.log(`→ ${name} (${value.trim() ? `${value.length} chars` : 'empty placeholder'})`);
  const res = spawnSync('npx', ['-y', 'firebase-tools@latest', 'functions:secrets:set', name, '--data-file', tmp, '--project', projectId, '--force'], {
    stdio: 'inherit',
    shell: true,
    cwd: root,
  });
  fs.rmSync(tmp, { force: true });
  if (res.status !== 0) {
    console.error(`Failed to set ${name}`);
    process.exit(res.status || 1);
  }
}
console.log('Secrets are in Secret Manager. Redeploy functions to pick up new versions.');
