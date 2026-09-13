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

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminApp = initializeAdminApp();
const adminAuth = getAuth(adminApp);

export { adminAuth, adminApp };
