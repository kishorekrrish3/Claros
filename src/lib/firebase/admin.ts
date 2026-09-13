import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function initializeAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  let serviceAccount: any = null;
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountEnv) {
    try {
      serviceAccount = JSON.parse(serviceAccountEnv);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", e);
    }
  }

  if (!serviceAccount) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON is missing. Firebase Admin may not work correctly.");
    return initializeApp();
  }

  try {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed. Invalid SERVICE_ACCOUNT_JSON:", error);
    // Fallback to default initialization so the module doesn't crash, 
    // it will just fail gracefully during verifyIdToken later.
    return initializeApp();
  }
}

const adminApp = initializeAdminApp();
const adminAuth = getAuth(adminApp);

export { adminAuth, adminApp };
