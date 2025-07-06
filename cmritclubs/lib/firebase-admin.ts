import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This file sets up the Firebase Admin SDK for use on the server-side,
// for example, in your API routes. It uses environment variables
// for security, which you'll need to set up.

// Retrieve the service account details from environment variables.
// It's recommended to store the private key with escaped newlines
// or as a Base64 encoded string.
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_SDK_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_SDK_CLIENT_EMAIL,
  // Replace the escaped newlines with actual newlines.
  privateKey: (process.env.FIREBASE_ADMIN_SDK_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Initialize the Firebase Admin app if it hasn't been already.
// This check prevents re-initialization on hot reloads during development.
if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Export the initialized admin SDK and specifically the firestore instance.
const db = admin.firestore();
export { admin, db };