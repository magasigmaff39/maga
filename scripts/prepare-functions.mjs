// Copies the backend (server/ + shared/) into functions/ so Firebase uploads only what the API needs,
// and writes the non-secret runtime configuration. Secrets stay in Secret Manager (see README).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'functions');
const projectId = readProjectId();

function readProjectId() {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, '.firebaserc'), 'utf8')).projects.default;
  } catch {
    return process.env.FIREBASE_PROJECT_ID || '';
  }
}

function copyDir(src, dest, skip = () => false) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (skip(s)) continue;
    if (entry.isDirectory()) copyDir(s, d, skip);
    else fs.copyFileSync(s, d);
  }
}

for (const dir of ['server', 'shared']) {
  fs.rmSync(path.join(out, dir), { recursive: true, force: true });
  copyDir(path.join(root, dir), path.join(out, dir), (p) => {
    const posix = p.split(path.sep).join('/');
    return /\/server\/data(\/|$)/.test(posix) || posix.endsWith('.d.ts') || posix.endsWith('.log');
  });
}

// Non-secret configuration for the deployed function (secrets are injected by Firebase Secret Manager).
// Note: keys prefixed FIREBASE_ are reserved by the platform; the project id arrives via FIREBASE_CONFIG.
const env = [
  `PUBLIC_URL=https://${projectId}.web.app`,
  'DB_DRIVER=firestore',
  `FILE_STORAGE=${process.env.FILE_STORAGE || 'firestore'}`,
  'OTP_REQUIRED=false',
  'OTP_DEV_MODE=false',
  'GOOGLE_SIGN_IN=true',
  ...(process.env.GMAIL_USER ? [`GMAIL_USER=${process.env.GMAIL_USER}`] : []),
  'MAX_UPLOAD_MB=15',
  '',
].join('\n');
fs.writeFileSync(path.join(out, `.env.${projectId}`), env);
console.log(`[prepare-functions] copied server/ + shared/ → functions/, wrote .env.${projectId}`);
