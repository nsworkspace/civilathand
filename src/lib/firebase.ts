import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Firebase client SDK config is intentionally public — Google designed these
// values to be embedded in client-side code and they are visible in any
// browser's network tab. Security is enforced server-side via Firebase Rules
// and domain restrictions in the Firebase Console, not by hiding this config.
export const firebaseConfig = {
  apiKey: "AIzaSyAXMrcOD_tf63-yd1VKoaaY_q6-s_sluOE",
  authDomain: "civilathand-f9186.firebaseapp.com",
  projectId: "civilathand-f9186",
  storageBucket: "civilathand-f9186.firebasestorage.app",
  messagingSenderId: "943271255945",
  appId: "1:943271255945:web:95fde392c83b8814d80b58",
};

// initializeApp is safe in both browser and SSR
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// getAuth uses browser-specific APIs (IndexedDB, localStorage).
// Guard it so it NEVER runs during Next.js SSR pre-rendering —
// auth calls only happen in event handlers on the client anyway.
export const auth: Auth =
  typeof window !== "undefined"
    ? getAuth(app)
    : (null as unknown as Auth);
