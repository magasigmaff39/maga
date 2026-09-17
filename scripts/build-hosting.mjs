// Production build for Firebase Hosting. The API is called on the function's own URL (not through the
// Hosting rewrite) so long AI requests are not cut at Hosting's 60-second proxy limit and SSE streams
// are not buffered. The /api/** rewrite stays in firebase.json as a fallback.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectId = process.env.FIREBASE_PROJECT_ID || JSON.parse(fs.readFileSync(path.join(root, '.firebaserc'), 'utf8')).projects.default;
const region = process.env.FUNCTIONS_REGION || 'europe-west1';
const apiUrl = process.env.VITE_API_URL || `https://${region}-${projectId}.cloudfunctions.net/api`;
console.log(`[build-hosting] VITE_API_URL=${apiUrl}`);
const res = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true, cwd: root, env: { ...process.env, VITE_API_URL: apiUrl } });
process.exit(res.status ?? 1);
