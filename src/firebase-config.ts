// src/firebase-config.ts (or wherever your frontend's firebase config is)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Make sure this matches what you got from Firebase (luxe-muse.appspot.com)
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // If you have a measurementId, add it:
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// IMPORTANT: Since you're not deploying Firebase Functions, ensure your frontend
// doesn't try to import or use `getFunctions` if it's not needed.
// If your code uses `functions` from this file, it might need to be
// conditionally set or removed. For now, let's ensure it's null if not initialized.
let functions = null; // Default to null

// If your frontend code *does* call Firebase Cloud Functions from the client,
// you would uncomment the next lines, but be aware it won't work unless you
// later upgrade Firebase to Blaze and deploy the functions.
// import { getFunctions } from 'firebase/functions';
// try {
//   functions = getFunctions(app);
// } catch (error) {
//   console.warn("Firebase Functions SDK not initialized for frontend.", error);
// }

export { app, auth, db, storage, functions };