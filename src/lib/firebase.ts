import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase not configured. Add VITE_FIREBASE_* environment variables to .env');
}

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const signUpWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase not configured. Please add Firebase credentials to .env');
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(userCredential.user);
  return userCredential.user;
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase not configured. Please add Firebase credentials to .env');
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase not configured. Please add Firebase credentials to .env');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signInWithGithub = async () => {
  if (!auth) throw new Error('Firebase not configured. Please add Firebase credentials to .env');
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
};

export const logOut = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const resetPassword = async (email: string) => {
  if (!auth) throw new Error('Firebase not configured. Please add Firebase credentials to .env');
  await sendPasswordResetEmail(auth, email);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    // No Firebase - immediately call with null and return no-op unsubscribe
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export { auth };
export type { User };
