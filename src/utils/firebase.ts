/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { BackupData } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

// Check if firebase configuration is provided and valid
export const isFirebaseConfigured = !!(
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

let firebaseApp: any = null;
let firebaseAuth: any = null;
let firestoreDb: any = null;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firebaseAuth = getAuth(firebaseApp);
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
}

export const auth = firebaseAuth;
export const db = firestoreDb;

// Standardised Firebase Error Handling from skill guidelines
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const cloudService = {
  // Check if active and online
  isEnabled(): boolean {
    return isFirebaseConfigured && !!auth && !!db;
  },

  // Google Sign-In with Popup
  async signInWithGoogle(): Promise<User | null> {
    if (!this.isEnabled()) return null;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Google Auth Sign-In Error:', error);
      throw error;
    }
  },

  // Sign out
  async logOut(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Auth Sign-Out Error:', error);
      throw error;
    }
  },

  // Push local data to Firestore backup
  async backupToCloud(data: BackupData): Promise<boolean> {
    if (!this.isEnabled() || !auth.currentUser) {
      return false;
    }

    const userId = auth.currentUser.uid;
    const path = `backups/${userId}`;

    try {
      const backupRef = doc(db, 'user_backups', userId);
      await setDoc(backupRef, {
        ...data,
        userId,
        email: auth.currentUser.email,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  },

  // Pull backup data from Firestore
  async restoreFromCloud(): Promise<BackupData | null> {
    if (!this.isEnabled() || !auth.currentUser) {
      return null;
    }

    const userId = auth.currentUser.uid;
    const path = `backups/${userId}`;

    try {
      const backupRef = doc(db, 'user_backups', userId);
      const docSnap = await getDoc(backupRef);
      
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as BackupData;
        return cloudData;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }
};
