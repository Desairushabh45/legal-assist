import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

const hasAuth = Boolean(auth);

/**
 * Signs the user in anonymously using Firebase Auth.
 * Simplest path for a hackathon demo — no signup form required.
 *
 * @returns {Promise<import('firebase/auth').User | {uid: string, isAnonymous: boolean}>}
 */
export async function signInAnon() {
  if (!hasAuth) {
    return { uid: 'demo-local-user', isAnonymous: true };
  }

  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase anonymous sign-in failed:', error);
    throw error;
  }
}

/**
 * Wraps onAuthStateChanged to track the current user.
 *
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {import('firebase/auth').Unsubscribe}
 */
export function onAuthChange(callback) {
  if (!hasAuth) {
    const timer = setTimeout(() => {
      callback({ uid: 'demo-local-user', isAnonymous: true });
    }, 0);
    return () => clearTimeout(timer);
  }

  return onAuthStateChanged(auth, callback);
}

export default {
  signInAnon,
  onAuthChange,
};
