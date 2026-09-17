// Cloud Functions for Firebase entry point: the whole Express API as one HTTPS function.
// Firebase Hosting rewrites /api/** to this function (see firebase.json). Secrets (Gemini/Groq keys,
// SMTP password) are injected from Secret Manager at runtime and never live in the repository.
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const GROQ_API_KEY = defineSecret('GROQ_API_KEY');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

let appPromise = null;
let maintenanceScheduled = false;

// The Express app (and the config that reads secrets from process.env) is loaded lazily so the CLI can
// analyse this module at deploy time without touching Firestore or the model providers.
async function loadApp() {
  appPromise ??= import('./app.js').then((m) => m.default);
  const app = await appPromise;
  if (!maintenanceScheduled) {
    // Opportunistic housekeeping once per warm instance, off the request path.
    maintenanceScheduled = true;
    setTimeout(() => import('./db/store.js').then((m) => m.runMaintenance()).catch(() => {}), 5_000).unref?.();
  }
  return app;
}

export const api = onRequest(
  {
    secrets: [GEMINI_API_KEY, GROQ_API_KEY, GMAIL_APP_PASSWORD],
    memory: '1GiB',
    timeoutSeconds: 180,
    concurrency: 40,
    cors: false, // Express handles CORS itself
  },
  async (req, res) => {
    const app = await loadApp();
    // Hosting forwards the full path (/api/...); direct calls to the function URL arrive without the prefix.
    if (!req.url.startsWith('/api/') && req.url !== '/api') req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    app(req, res);
  },
);
