import {cert, getApps, initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {env} from './config.js';

function normalizePrivateKey(value?: string) {
  return value?.replace(/\\n/g, '\n');
}

function getCredentialFromEnv() {
  if (env.FIREBASE_SERVICE_ACCOUNT) {
    const parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    return cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: normalizePrivateKey(parsed.private_key),
    });
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY),
    });
  }

  return undefined;
}

export function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const credential = getCredentialFromEnv();
  if (credential) {
    initializeApp({credential});
    return;
  }

  initializeApp();
}

export const adminAuth = () => {
  initFirebaseAdmin();
  return getAuth();
};
