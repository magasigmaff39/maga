// Lazy, single Firebase Admin app. Credentials come from (in order):
//   1. FIREBASE_SERVICE_ACCOUNT — inline JSON or a path to the service-account file (local development);
//   2. GOOGLE_APPLICATION_CREDENTIALS / the runtime's default credentials (Cloud Functions, Cloud Run).
import fs from 'node:fs';
import { config } from '../config.js';

let appPromise = null;

export async function getAdminApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const admin = await import('firebase-admin/app');
      if (admin.getApps().length) return admin.getApps()[0];
      const options = { projectId: config.firebase.projectId || undefined };
      if (config.firebase.storageBucket) options.storageBucket = config.firebase.storageBucket;
      const raw = config.firebase.serviceAccount;
      if (raw) {
        const json = raw.trim().startsWith('{') ? JSON.parse(raw) : JSON.parse(fs.readFileSync(raw, 'utf8'));
        options.credential = admin.cert(json);
        options.projectId = options.projectId || json.project_id;
      } else {
        options.credential = admin.applicationDefault();
      }
      return admin.initializeApp(options);
    })();
  }
  return appPromise;
}

export async function getFirestore() {
  const app = await getAdminApp();
  const { getFirestore: gf } = await import('firebase-admin/firestore');
  const db = gf(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    /* settings() may only be called once — fine */
  }
  return db;
}

export async function getAdminAuth() {
  const app = await getAdminApp();
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(app);
}

export async function getStorageBucket() {
  const app = await getAdminApp();
  const { getStorage } = await import('firebase-admin/storage');
  return getStorage(app).bucket();
}
