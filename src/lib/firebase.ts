import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocFromServer,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Project, Keyword, Article, CrawlerLog } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore (use exact firestoreDatabaseId specified in setup output)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Firebase Authentication Providers
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google authentication error:", error);
    throw error;
  }
}

export async function logOutFromFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}

// -------------------------------------------------------------
// FIRESTORE ERROR HANDLING CONSTRAINTS (As Mandated by Skill.md)
// -------------------------------------------------------------
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation function as mandated by Skill.md
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// -------------------------------------------------------------
// MULTI-TENANT REAL-TIME SYNC UTILITIES
// -------------------------------------------------------------

// 1. Projects Realtime Listener
export function subscribeToUserProjects(
  userId: string, 
  onUpdate: (projects: Project[]) => void,
  onError: (error: Error) => void
) {
  const collectionPath = 'projects';
  const q = query(
    collection(db, collectionPath),
    where('ownerId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const projectsList: Project[] = [];
      snapshot.forEach((doc) => {
        projectsList.push(doc.data() as Project);
      });
      onUpdate(projectsList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      onError(error as Error);
    }
  );
}

// 2. Project Sub-data Realtime Listeners (Master Gate check enforced in Security Rules)
export function subscribeToKeywords(
  projectId: string,
  onUpdate: (keywords: Keyword[]) => void,
  onError: (error: Error) => void
) {
  const collectionPath = `projects/${projectId}/keywords`;
  const q = collection(db, collectionPath);

  return onSnapshot(
    q,
    (snapshot) => {
      const keywordsList: Keyword[] = [];
      snapshot.forEach((doc) => {
        keywordsList.push(doc.data() as Keyword);
      });
      onUpdate(keywordsList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      onError(error as Error);
    }
  );
}

export function subscribeToArticles(
  projectId: string,
  onUpdate: (articles: Article[]) => void,
  onError: (error: Error) => void
) {
  const collectionPath = `projects/${projectId}/articles`;
  const q = collection(db, collectionPath);

  return onSnapshot(
    q,
    (snapshot) => {
      const articlesList: Article[] = [];
      snapshot.forEach((doc) => {
        articlesList.push(doc.data() as Article);
      });
      onUpdate(articlesList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      onError(error as Error);
    }
  );
}

export function subscribeToLogs(
  projectId: string,
  onUpdate: (logs: CrawlerLog[]) => void,
  onError: (error: Error) => void
) {
  const collectionPath = `projects/${projectId}/logs`;
  const q = collection(db, collectionPath);

  return onSnapshot(
    q,
    (snapshot) => {
      const logsList: CrawlerLog[] = [];
      snapshot.forEach((doc) => {
        logsList.push(doc.data() as CrawlerLog);
      });
      onUpdate(logsList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
      onError(error as Error);
    }
  );
}

// -------------------------------------------------------------
// FIRESTORE WRITE OPERATIONS WITH HIGH LEVEL VALIDATORS
// -------------------------------------------------------------

export async function fsSaveProject(project: Project, userId: string) {
  const path = `projects/${project.id}`;
  try {
    const payload = { ...project, ownerId: userId };
    await setDoc(doc(db, 'projects', project.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsDeleteProject(projectId: string) {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fsSaveKeyword(keyword: Keyword, projectId: string, userId: string) {
  const path = `projects/${projectId}/keywords/${keyword.id}`;
  try {
    const payload = { ...keyword, ownerId: userId, projectId };
    await setDoc(doc(db, 'projects', projectId, 'keywords', keyword.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsDeleteKeyword(projectId: string, keywordId: string) {
  const path = `projects/${projectId}/keywords/${keywordId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'keywords', keywordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fsSaveArticle(article: Article, projectId: string, userId: string) {
  const path = `projects/${projectId}/articles/${article.id}`;
  try {
    const payload = { ...article, ownerId: userId, projectId };
    await setDoc(doc(db, 'projects', projectId, 'articles', article.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsDeleteArticle(projectId: string, articleId: string) {
  const path = `projects/${projectId}/articles/${articleId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'articles', articleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fsSaveLog(log: CrawlerLog, projectId: string, userId: string) {
  const path = `projects/${projectId}/logs/${log.id}`;
  try {
    const payload = { ...log, ownerId: userId, projectId };
    await setDoc(doc(db, 'projects', projectId, 'logs', log.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsDeleteLog(projectId: string, logId: string) {
  const path = `projects/${projectId}/logs/${logId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'logs', logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
