import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const LOCAL_STORAGE_KEY = 'legal_assist_analyses';

function getLocalAnalyses() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAnalysis(userId, clauseText, results) {
  const current = getLocalAnalyses();
  const newDoc = {
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId,
    clauseText,
    results,
    createdAt: new Date().toISOString(),
  };
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newDoc, ...current]));
    }
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
  return newDoc.id;
}

/**
 * Saves a new contract/clause analysis document to the "analyses" Firestore collection.
 * Falls back to local storage if Firestore is unconfigured or unavailable.
 *
 * @param {string} userId - The UID of the authenticated user.
 * @param {string} clauseText - The original contract or clause text.
 * @param {Array<object>} results - The structured analysis array from Gemini.
 * @returns {Promise<string>} The created document ID.
 */
export async function saveAnalysis(userId, clauseText, results) {
  if (!userId) {
    throw new Error('User ID is required to save analysis.');
  }

  const hasDb = Boolean(db);

  if (hasDb) {
    try {
      const docRef = await addDoc(collection(db, 'analyses'), {
        userId,
        clauseText,
        results,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.warn('Firestore save failed, falling back to local storage:', error?.message || error);
      return saveLocalAnalysis(userId, clauseText, results);
    }
  }

  return saveLocalAnalysis(userId, clauseText, results);
}

/**
 * Fetches all analyses associated with a specific userId, ordered by creation date descending.
 * Falls back to local storage if Firestore is unconfigured or unavailable.
 *
 * @param {string} userId - The UID of the user.
 * @returns {Promise<Array<object>>} An array of analysis documents.
 */
export async function getUserAnalyses(userId) {
  if (!userId) return [];

  const hasDb = Boolean(db);

  if (hasDb) {
    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const analyses = [];
      querySnapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return analyses;
    } catch (error) {
      // Graceful fallback if Firestore composite index is missing or building
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index not ready, querying with client-side sort:', error.message);
        const fallbackQuery = query(
          collection(db, 'analyses'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(fallbackQuery);
        const analyses = [];
        snapshot.forEach((doc) => {
          analyses.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort client-side by createdAt descending
        analyses.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        return analyses;
      }

      console.warn('Firestore query failed, falling back to local storage:', error?.message || error);
      return getLocalAnalyses();
    }
  }

  return getLocalAnalyses();
}

export default {
  saveAnalysis,
  getUserAnalyses,
};
