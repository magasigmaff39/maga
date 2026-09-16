import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { EducationGrade } from '../types';

// Firebase configuration from environment or fallback public project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForOfflineDevFallback123",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "admitroute-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "admitroute-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "admitroute-portal.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  gmail: string;
  age: number;
  grade: EducationGrade;
  createdAt: string;
  isEmailVerified?: boolean;
}

// Storage key for resilient offline/demo fallback
const LOCAL_USERS_KEY = 'admitroute_users';
const ACTIVE_USER_KEY = 'admitroute_active_user';

export async function registerUserInFirebase(userData: {
  firstName: string;
  lastName: string;
  gmail: string;
  age: number;
  grade: EducationGrade;
  password?: string;
  isEmailVerified?: boolean;
}): Promise<UserAccount> {
  const cleanEmail = userData.gmail.trim().toLowerCase();
  let account: UserAccount = {
    id: 'usr_' + Date.now(),
    firstName: userData.firstName.trim(),
    lastName: userData.lastName.trim(),
    gmail: cleanEmail,
    age: userData.age,
    grade: userData.grade,
    createdAt: new Date().toISOString(),
    isEmailVerified: userData.isEmailVerified ?? true,
  };

  // 1. PRIMARY: Store account permanently on the backend database (users.json)
  try {
    const resp = await fetch('http://127.0.0.1:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: account.firstName,
        lastName: account.lastName,
        gmail: account.gmail,
        age: account.age,
        grade: account.grade,
        password: userData.password,
        isEmailVerified: account.isEmailVerified,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.user) {
        account = data.user;
      }
    } else {
      const errData = await resp.json().catch(() => ({}));
      console.warn('Backend registration warning:', errData.error);
    }
  } catch (backendErr) {
    console.warn('Backend server unavailable, proceeding with client store:', backendErr);
  }

  // 2. OPTIONAL: Firebase Auth & Firestore
  try {
    if (userData.password && userData.password.length >= 6 && !firebaseConfig.apiKey.includes('Dummy')) {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, userData.password);
      account.id = userCredential.user.uid;
      await setDoc(doc(db, 'users', account.id), account);
    }
  } catch (err: any) {
    // Silent fallback
  }

  // 3. Persist active session locally
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    existing.push(account);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(existing));
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(account));
  } catch (e) {
    console.warn('LocalStorage save error', e);
  }

  return account;
}

export async function loginUserInFirebase(gmail: string, password?: string): Promise<UserAccount | null> {
  const cleanEmail = gmail.trim().toLowerCase();

  // 1. PRIMARY: Authenticate against backend accounts database
  try {
    const resp = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.user) {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(data.user));
        return data.user as UserAccount;
      }
    }
  } catch (backendErr) {
    console.warn('Backend login unavailable, checking fallbacks:', backendErr);
  }

  // 2. Try online Firebase Auth
  try {
    if (password && !firebaseConfig.apiKey.includes('Dummy')) {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        const acc = snap.data() as UserAccount;
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(acc));
        return acc;
      }
    }
  } catch (err) {
    // Firebase offline fallback
  }

  // 3. Local lookup fallback
  try {
    const existing: UserAccount[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    const found = existing.find(u => u.gmail === cleanEmail);
    if (found) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(found));
      return found;
    }
  } catch (e) {
    console.warn('Local storage lookup failed', e);
  }

  return null;
}

export function getActiveUser(): UserAccount | null {
  try {
    const saved = localStorage.getItem(ACTIVE_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  try {
    signOut(auth).catch(() => {});
    localStorage.removeItem(ACTIVE_USER_KEY);
  } catch (e) {
    console.warn(e);
  }
}
