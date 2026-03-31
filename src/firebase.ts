/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import firebaseConfigRaw from "../firebase-applet-config.json";

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigRaw.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigRaw.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigRaw.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigRaw.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigRaw.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigRaw.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigRaw.measurementId,
};

console.log("Firebase Config initialized with Project ID:", firebaseConfig.projectId);
if (!firebaseConfig.apiKey) console.error("Firebase API Key is missing!");

const firestoreDatabaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID || firebaseConfigRaw.firestoreDatabaseId;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { serverTimestamp };

export const signInWithGoogle = async () => {
  console.log("Initiating Google Sign-In...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google Sign-In successful:", result.user.email);
    return result;
  } catch (error) {
    console.error("Google Sign-In error details:", error);
    throw error;
  }
};

export const handleFirestoreError = (error: any, operation: string, path: string | null) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operation,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    }
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};
