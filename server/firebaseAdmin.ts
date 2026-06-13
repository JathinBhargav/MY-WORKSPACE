// server/firebaseAdmin.ts
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error('Failed to read firebase-applet-config.json:', err);
}

const firebaseAdmin = admin as any;

if (!firebaseAdmin.apps?.length) {
  try {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId
    });
    console.log('Firebase Admin initialized with applicationDefault credentials.');
  } catch (err) {
    console.warn('Could not initialize Firebase Admin with default credentials, trying basic initialization with projectId:', err);
    // Standard fallback initialization
    firebaseAdmin.initializeApp({
      projectId: firebaseConfig.projectId || 'natural-nimbus-478312-h9'
    });
  }
}

export const messagingAdmin = firebaseAdmin.messaging();
