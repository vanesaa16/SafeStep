/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Scenario, StudentLog } from "./types";

export const isStandaloneHtmlMode =
  typeof window !== "undefined" &&
  (window.location.protocol === "file:" ||
    (window.location.protocol !== "http:" && window.location.protocol !== "https:") ||
    Boolean((window as unknown as { __SAFESTEP_STANDALONE__?: boolean }).__SAFESTEP_STANDALONE__));

const app = initializeApp(firebaseConfig);

function createFirestoreDb() {
  try {
    return initializeFirestore(
      app,
      { experimentalForceLongPolling: true },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreDb();
export const auth = isStandaloneHtmlMode ? (null as unknown as ReturnType<typeof getAuth>) : getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function isOfflineFirestoreError(error: unknown): boolean {
  if (isBrowserOffline()) return true;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code || "").toLowerCase()
      : "";
  return (
    code === "unavailable" ||
    code.endsWith("/unavailable") ||
    msg.includes("client is offline") ||
    msg.includes("could not reach cloud firestore") ||
    msg.includes("failed to get document because the client is offline")
  );
}

// Validate connection to Firestore on boot
let connectionTested = false;
export async function testFirestoreConnection(): Promise<void> {
  if (isStandaloneHtmlMode || connectionTested || isBrowserOffline()) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (isOfflineFirestoreError(error)) {
      console.warn("Cloud Firestore unreachable right now; continuing with local offline storage.");
    }
  }
}

// Sanitize IDs strictly matching ^[a-zA-Z0-9_\-]+$ and maxLength bounds from firebase-blueprint.json
function sanitizeDocId(rawId: string, maxLen = 128): string {
  const cleaned = String(rawId || "")
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .slice(0, maxLen);
  return cleaned || `doc-${Date.now()}`;
}

export function isVerifiedAuthenticatedUser(user: User | null = auth?.currentUser ?? null): user is User {
  if (isStandaloneHtmlMode) return false;
  return Boolean(user && user.emailVerified);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (isStandaloneHtmlMode || !auth) return false;
  const user = auth.currentUser;
  if (!isVerifiedAuthenticatedUser(user)) return false;
  if (user.email === "vnesa7880@gmail.com") return true;

  const adminPath = `admins/${sanitizeDocId(user.uid, 128)}`;
  try {
    const snap = await getDoc(doc(db, "admins", sanitizeDocId(user.uid, 128)));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, adminPath);
  }
}

export async function signInTeacherWithGoogle(): Promise<User> {
  if (isStandaloneHtmlMode || !auth) {
    throw new Error("Mode file HTML mandiri menyimpan data secara lokal di perangkat.");
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutTeacher(): Promise<void> {
  if (isStandaloneHtmlMode || !auth) return;
  await signOut(auth);
}

export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (isStandaloneHtmlMode || !auth) {
    queueMicrotask(() => callback(null));
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ================= PUBLISHED CUSTOM SCENARIOS (/custom_scenarios/published_config) =================
const PUBLISHED_SCENARIOS_DOC_ID = "published_config";
const PUBLISHED_SCENARIOS_PATH = `custom_scenarios/${PUBLISHED_SCENARIOS_DOC_ID}`;

export interface FirestoreScenarioSyncResult {
  synced: boolean;
  reason: "synced" | "standalone" | "unauthenticated" | "not_verified" | "not_admin" | "empty";
  email?: string | null;
}

function sanitizeScenarioForFirestore(sc: Scenario): Scenario {
  const cleanOptions = (Array.isArray(sc.options) ? sc.options : []).slice(0, 6).map((opt, idx) => {
    const cleanOpt: {
      id: string;
      text: string;
      isCorrect: boolean;
      feedback: string;
      feedbackText?: string;
      feedbackAudioUrl?: string;
    } = {
      id: String(opt.id || String.fromCharCode(97 + idx)).slice(0, 20),
      text: String(opt.text || "").slice(0, 300),
      isCorrect: Boolean(opt.isCorrect),
      feedback: String(opt.feedback || "").slice(0, 500),
    };
    if (typeof opt.feedbackText === "string" && opt.feedbackText.trim()) {
      cleanOpt.feedbackText = opt.feedbackText.trim().slice(0, 500);
    }
    if (typeof opt.feedbackAudioUrl === "string" && opt.feedbackAudioUrl.trim()) {
      cleanOpt.feedbackAudioUrl = opt.feedbackAudioUrl.trim().slice(0, 300);
    }
    return cleanOpt;
  });

  const cleanScenario: Scenario = {
    id: sanitizeDocId(String(sc.id || `sc-custom-${Date.now()}`), 80),
    npcId: String(sc.npcId || "school-npc-1").slice(0, 80),
    npcName: String(sc.npcName || "Karakter").slice(0, 80),
    npcType: String(sc.npcType || "stranger").slice(0, 40),
    mapId: String(sc.mapId || "school").slice(0, 40),
    dialogueText: String(sc.dialogueText || "").slice(0, 1000),
    question: String(sc.question || "").slice(0, 500),
    options: cleanOptions,
    category: String(sc.category || "Keselamatan Anak").slice(0, 120),
  };

  if (typeof sc.calloutText === "string" && sc.calloutText.trim()) {
    cleanScenario.calloutText = sc.calloutText.trim().slice(0, 220);
  }
  if (typeof sc.questionText === "string" && sc.questionText.trim()) {
    cleanScenario.questionText = sc.questionText.trim().slice(0, 1000);
  }
  if (typeof sc.questionAudioUrl === "string" && sc.questionAudioUrl.trim()) {
    cleanScenario.questionAudioUrl = sc.questionAudioUrl.trim().slice(0, 300);
  }

  return cleanScenario;
}

export async function fetchPublishedScenariosFromFirestore(): Promise<Scenario[] | null> {
  if (isStandaloneHtmlMode || isBrowserOffline()) return null;
  try {
    const snap = await getDoc(doc(db, "custom_scenarios", PUBLISHED_SCENARIOS_DOC_ID));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data && Array.isArray(data.scenarios) && data.scenarios.length > 0) {
      return data.scenarios as Scenario[];
    }
    return null;
  } catch (error) {
    if (isOfflineFirestoreError(error)) {
      console.warn("Firestore offline; using cached/local scenarios.");
      return null;
    }
    handleFirestoreError(error, OperationType.GET, PUBLISHED_SCENARIOS_PATH);
  }
}

export async function savePublishedScenariosWithStatus(
  scenarios: Scenario[]
): Promise<FirestoreScenarioSyncResult> {
  if (isStandaloneHtmlMode || !auth) {
    return { synced: false, reason: "standalone" };
  }
  const user = auth.currentUser;
  if (!user) {
    return { synced: false, reason: "unauthenticated" };
  }
  if (!user.emailVerified) {
    return { synced: false, reason: "not_verified", email: user.email };
  }
  const adminOk = await isCurrentUserAdmin();
  if (!adminOk) {
    return { synced: false, reason: "not_admin", email: user.email };
  }

  const boundedScenarios = scenarios.slice(0, 30).map(sanitizeScenarioForFirestore);
  if (boundedScenarios.length === 0) {
    return { synced: false, reason: "empty", email: user.email };
  }

  const docRef = doc(db, "custom_scenarios", PUBLISHED_SCENARIOS_DOC_ID);
  let existsAlready = false;
  try {
    const existingSnap = await getDoc(docRef);
    existsAlready = existingSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PUBLISHED_SCENARIOS_PATH);
  }

  try {
    if (existsAlready) {
      await updateDoc(docRef, {
        scenarios: boundedScenarios,
        authorUid: sanitizeDocId(user.uid, 128),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        id: PUBLISHED_SCENARIOS_DOC_ID,
        authorUid: sanitizeDocId(user.uid, 128),
        scenarios: boundedScenarios,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return { synced: true, reason: "synced", email: user.email };
  } catch (error) {
    handleFirestoreError(
      error,
      existsAlready ? OperationType.UPDATE : OperationType.CREATE,
      PUBLISHED_SCENARIOS_PATH
    );
  }
}

export async function savePublishedScenariosToFirestore(scenarios: Scenario[]): Promise<boolean> {
  const result = await savePublishedScenariosWithStatus(scenarios);
  return result.synced;
}

export async function resetPublishedScenariosInFirestore(): Promise<boolean> {
  if (isStandaloneHtmlMode || !auth) return false;
  const user = auth.currentUser;
  if (!isVerifiedAuthenticatedUser(user)) return false;
  const adminOk = await isCurrentUserAdmin();
  if (!adminOk) return false;

  const docRef = doc(db, "custom_scenarios", PUBLISHED_SCENARIOS_DOC_ID);
  let existsAlready = false;
  try {
    const existingSnap = await getDoc(docRef);
    existsAlready = existingSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PUBLISHED_SCENARIOS_PATH);
  }

  if (!existsAlready) return true;

  try {
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, PUBLISHED_SCENARIOS_PATH);
  }
}

// ================= STUDENT LOGS (/student_logs/{logId}) =================
export async function syncStudentLogToFirestore(log: StudentLog): Promise<boolean> {
  if (isStandaloneHtmlMode || !auth || isBrowserOffline()) return false;
  const user = auth.currentUser;
  if (!isVerifiedAuthenticatedUser(user)) return false;

  const ownerUid = sanitizeDocId(user.uid, 128);
  const safeBaseId = sanitizeDocId(log.id, 90);
  const scopedDocId = sanitizeDocId(`${ownerUid.slice(0, 24)}_${safeBaseId}`, 128);
  const docPath = `student_logs/${scopedDocId}`;
  const docRef = doc(db, "student_logs", scopedDocId);

  const sanitizedName = String(log.studentName || "Siswa").trim().slice(0, 80) || "Siswa";
  const totalPoints = Math.max(0, Math.min(1000, Math.round(Number(log.totalPoints) || 0)));
  const completedScenariosCount = Math.max(
    0,
    Math.min(30, Math.round(Number(log.completedScenariosCount) || 0))
  );
  const completedAt = String(log.completedAt || new Date().toISOString()).slice(0, 64);
  const history = Array.isArray(log.history) ? log.history.slice(0, 50) : [];

  let existsAlready = false;
  try {
    const snap = await getDoc(docRef);
    existsAlready = snap.exists();
  } catch (error) {
    if (isOfflineFirestoreError(error)) return false;
    handleFirestoreError(error, OperationType.GET, docPath);
  }

  try {
    if (existsAlready) {
      await updateDoc(docRef, {
        studentName: sanitizedName,
        totalPoints,
        completedScenariosCount,
        completedAt,
        history,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        id: scopedDocId,
        ownerUid,
        studentName: sanitizedName,
        totalPoints,
        completedScenariosCount,
        completedAt,
        history,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    if (isOfflineFirestoreError(error)) return false;
    handleFirestoreError(
      error,
      existsAlready ? OperationType.UPDATE : OperationType.CREATE,
      docPath
    );
  }
}

export function subscribeOwnedStudentLogs(
  user: User,
  onUpdate: (logs: StudentLog[]) => void
): Unsubscribe | null {
  if (!isVerifiedAuthenticatedUser(user)) return null;

  const ownerUid = sanitizeDocId(user.uid, 128);
  const logsQuery = query(collection(db, "student_logs"), where("ownerUid", "==", ownerUid));

  return onSnapshot(
    logsQuery,
    (snapshot) => {
      const records: StudentLog[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        records.push({
          id: String(d.id || docSnap.id),
          studentName: String(d.studentName || "Siswa"),
          totalPoints: Number(d.totalPoints) || 0,
          completedScenariosCount: Number(d.completedScenariosCount) || 0,
          completedAt: typeof d.completedAt === "string" ? d.completedAt : undefined,
          history: Array.isArray(d.history) ? d.history : [],
        });
      });
      onUpdate(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, "student_logs");
    }
  );
}

export async function clearOwnedStudentLogsInFirestore(): Promise<void> {
  if (isStandaloneHtmlMode || !auth) return;
  const user = auth.currentUser;
  if (!isVerifiedAuthenticatedUser(user)) return;

  const ownerUid = sanitizeDocId(user.uid, 128);
  const logsQuery = query(collection(db, "student_logs"), where("ownerUid", "==", ownerUid));

  let idsToDelete: string[] = [];
  try {
    const snap = await getDocs(logsQuery);
    idsToDelete = snap.docs.map((d) => d.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "student_logs");
  }

  for (const docId of idsToDelete) {
    try {
      await deleteDoc(doc(db, "student_logs", docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `student_logs/${docId}`);
    }
  }
}
