// Firebase client SDK — used only for "Sign in with Google". The popup returns a Google ID token which the
// backend verifies and exchanges for its own session. The web config below is public by design
// (it identifies the project; access is controlled by Firebase Auth and our API).
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, type Auth } from 'firebase/auth';

const env = import.meta.env;

export const firebaseWebConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string | undefined) || '',
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || '',
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '',
  appId: (env.VITE_FIREBASE_APP_ID as string | undefined) || '',
};

export const isFirebaseConfigured = () => Boolean(firebaseWebConfig.apiKey && firebaseWebConfig.authDomain && firebaseWebConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) throw new Error('Firebase не настроен: заполните VITE_FIREBASE_* в .env');
  if (!app) app = getApps()[0] || initializeApp(firebaseWebConfig);
  if (!auth) auth = getAuth(app);
  return auth;
}

const provider = () => {
  const p = new GoogleAuthProvider();
  p.addScope('email');
  p.addScope('profile');
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
};

/** Opens the Google account chooser and returns a fresh ID token. Falls back to redirect when popups are blocked. */
export async function googleIdToken(): Promise<string> {
  const a = getFirebaseAuth();
  try {
    const cred = await signInWithPopup(a, provider());
    return cred.user.getIdToken(true);
  } catch (err: any) {
    const code = String(err?.code || '');
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(a, provider());
      return new Promise(() => undefined); // navigation away; resolved after redirect by consumeRedirect()
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') throw new Error('Окно входа закрыто');
    if (code === 'auth/unauthorized-domain') throw new Error('Домен не добавлен в Firebase Console → Authentication → Authorized domains');
    if (code === 'auth/operation-not-allowed') throw new Error('Вход через Google не включён в Firebase Console → Authentication → Sign-in method');
    if (code === 'auth/configuration-not-found') throw new Error('Authentication ещё не включена в проекте Firebase: Console → Authentication → Get started → Google');
    if (code === 'auth/network-request-failed') throw new Error('Нет соединения с Google — проверьте интернет');
    throw new Error(err?.message || 'Не удалось войти через Google');
  }
}

/** Call once at startup: completes a redirect-based sign-in if one is pending. */
export async function consumeRedirect(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const res = await getRedirectResult(getFirebaseAuth());
    return res ? await res.user.getIdToken(true) : null;
  } catch {
    return null;
  }
}

export async function firebaseSignOut() {
  if (!isFirebaseConfigured() || !auth) return;
  try {
    await signOut(auth);
  } catch {
    /* ignore */
  }
}
