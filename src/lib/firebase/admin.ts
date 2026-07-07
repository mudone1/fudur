import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

// Server-only. Never import this file from a Client Component.
// Following the same pattern used on Superior Minds Academy: Next.js
// API routes + Admin SDK, bypassing Cloud Functions (Blaze plan constraint).
//
// Initialization is lazy (first call, not module load) so `next build`
// doesn't fail just because env vars aren't set in the build environment.
let cachedApp: App | null = null;

function buildAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0];
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Private key is stored with literal \n in env vars; unescape it.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return cachedApp;
}

let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(buildAdminApp());
  return _adminDb;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) _adminAuth = getAuth(buildAdminApp());
  return _adminAuth;
}

// Proxies so existing call sites (`adminDb.collection(...)`) keep working
// without eagerly initializing at import time.
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const real = getAdminDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const real = getAdminAuth() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/**
 * Verifies the Firebase ID token sent from the client (Authorization: Bearer <token>)
 * and returns the decoded token, or null if invalid/missing.
 */
export async function verifyRequestToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}
