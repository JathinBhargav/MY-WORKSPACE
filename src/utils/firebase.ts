import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { initializeFirestore, doc, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Monkeypatch console functions to silence Firestore connection/backend unreachable noise entirely
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = function (...args: any[]) {
    const msg = args.map(arg => String(arg)).join(' ');
    if (
      msg.includes('@firebase/firestore') || 
      msg.includes('Firestore backend') || 
      msg.includes('Could not reach') ||
      msg.includes('Backend didn\'t respond')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = function (...args: any[]) {
    const msg = args.map(arg => String(arg)).join(' ');
    if (
      msg.includes('@firebase/firestore') || 
      msg.includes('Firestore backend') || 
      msg.includes('Could not reach') ||
      msg.includes('Backend didn\'t respond')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Silence internal Firestore connection logs and handle offline fallbacks gracefully
setLogLevel('error');

// Initialize Firestore with robust offline caching & experimentalForceLongPolling to handle proxy bottlenecks
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, (firebaseConfig as any).firestoreDatabaseId || "ai-studio-dd9c6d4b-090c-4a3f-a362-1dec48a530fd"); /* CRITICAL: The app will break without this line */


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';
  
  // Detect if the error is a connection loss/unreachable network issue
  const isNetworkOrOffline = 
    errMsg.toLowerCase().includes('unavailable') ||
    errMsg.toLowerCase().includes('network') ||
    errMsg.toLowerCase().includes('could not reach') ||
    errMsg.toLowerCase().includes('backend didn\'t respond') ||
    errMsg.toLowerCase().includes('offline') ||
    errCode === 'unavailable' ||
    errCode === 'deadline-exceeded';

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isNetworkOrOffline) {
    console.warn(`[Firestore Offline Cache Mode] ${operationType} at path "${path || 'unknown'}": ${errMsg}`);
    
    // Dispatch offline event so UI alerts of the network state gracefully rather than crashing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-network-status', { 
        detail: { offline: true, error: errMsg, operationType, path } 
      }));
    }
    return; // Block throwing exception to keep the local caching system perfectly active
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


// Google Auth Provider setup with registered Workspace scopes
export const googleAuthProvider = new GoogleAuthProvider();

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.profile'
];

SCOPES.forEach(scope => {
  googleAuthProvider.addScope(scope);
});

// Configure Google OAuth Sign In Popup Flow
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (!accessToken) {
      throw new Error('Access token not found in Google Sign-In response context.');
    }
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Firebase Web-Auth Error: ', error);
    throw error;
  }
};

// Log out Helper
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
};
