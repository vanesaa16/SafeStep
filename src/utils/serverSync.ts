/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentLog } from "../types";
import { isStandaloneHtmlMode } from "../firebase";

const PENDING_STUDENT_LOGS_KEY = "safestep_pending_student_logs";

function getConfiguredApiBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const raw = (window as unknown as { __SAFESTEP_API_BASE_URL__?: string })
    .__SAFESTEP_API_BASE_URL__;
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return "";
}

export function hasVoiceServerOrigin(): boolean {
  if (!isStandaloneHtmlMode) return true;
  return Boolean(getConfiguredApiBaseUrl());
}

export function resolveApiUrl(apiPath: string): string {
  if (!apiPath.startsWith("/")) return apiPath;
  if (!isStandaloneHtmlMode) return apiPath;
  const base = getConfiguredApiBaseUrl();
  return base ? `${base}${apiPath}` : apiPath;
}

let cachedBackendAvailable: boolean | null =
  isStandaloneHtmlMode && !getConfiguredApiBaseUrl() ? false : null;
let backendProbePromise: Promise<boolean> | null = null;

export function isBackendKnownUnavailable(): boolean {
  if (isStandaloneHtmlMode && !getConfiguredApiBaseUrl()) return true;
  return cachedBackendAvailable === false;
}

export function resetBackendAvailabilityCache(): void {
  if (isStandaloneHtmlMode && !getConfiguredApiBaseUrl()) {
    cachedBackendAvailable = false;
    return;
  }
  cachedBackendAvailable = null;
}

export async function checkApiBackendAvailable(): Promise<boolean> {
  if (typeof window === "undefined") {
    cachedBackendAvailable = false;
    return false;
  }
  if (isStandaloneHtmlMode && !getConfiguredApiBaseUrl()) {
    cachedBackendAvailable = false;
    return false;
  }
  if (cachedBackendAvailable !== null) {
    return cachedBackendAvailable;
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }
  if (backendProbePromise) {
    return backendProbePromise;
  }

  backendProbePromise = (async () => {
    try {
      const response = await fetch(resolveApiUrl("/api/health"), {
        method: "GET",
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        cachedBackendAvailable = false;
        return false;
      }
      const data = (await response.json()) as { ok?: boolean; hasBackend?: boolean };
      const available = Boolean(data?.ok && data?.hasBackend);
      cachedBackendAvailable = available;
      return available;
    } catch {
      // Do not permanently lock false if offline/transient; allow retry on next online event
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        cachedBackendAvailable = null;
      } else {
        cachedBackendAvailable = false;
      }
      return false;
    } finally {
      backendProbePromise = null;
    }
  })();

  return backendProbePromise;
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isTransientHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

export async function fetchApiJsonWithRetry<T>(
  url: string,
  options: RequestInit = {},
  maxRetries = 2
): Promise<{ ok: boolean; data: T | null; networkError: boolean }> {
  if (typeof window === "undefined" || isStandaloneHtmlMode || cachedBackendAvailable === false) {
    return { ok: false, data: null, networkError: false };
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, data: null, networkError: true };
  }

  if (cachedBackendAvailable === null) {
    const hasBackend = await checkApiBackendAvailable();
    if (!hasBackend) {
      return { ok: false, data: null, networkError: false };
    }
  }

  const bodyStr = typeof options.body === "string" ? options.body : "";
  const canKeepAlive =
    Boolean(options.method && options.method.toUpperCase() !== "GET") &&
    bodyStr.length > 0 &&
    bodyStr.length < 60_000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        keepalive: options.keepalive ?? canKeepAlive,
      });

      if (!response.ok) {
        if (isTransientHttpStatus(response.status) && attempt < maxRetries) {
          await waitMs(600 * (attempt + 1));
          continue;
        }
        return { ok: false, data: null, networkError: false };
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const parsed = (await response.json()) as T;
        return { ok: true, data: parsed, networkError: false };
      }

      // Non-JSON response (e.g. static host SPA fallback returning index.html) means no API backend
      cachedBackendAvailable = false;
      return { ok: false, data: null, networkError: false };
    } catch {
      if (attempt < maxRetries) {
        await waitMs(600 * (attempt + 1));
        continue;
      }
      return { ok: false, data: null, networkError: true };
    }
  }

  return { ok: false, data: null, networkError: true };
}

function readPendingStudentLogs(): StudentLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_STUDENT_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingStudentLogs(logs: StudentLog[]): void {
  if (typeof window === "undefined") return;
  try {
    if (logs.length === 0) {
      localStorage.removeItem(PENDING_STUDENT_LOGS_KEY);
    } else {
      localStorage.setItem(PENDING_STUDENT_LOGS_KEY, JSON.stringify(logs.slice(-30)));
    }
  } catch {
    // Ignore storage quota issues
  }
}

function queuePendingStudentLog(log: StudentLog): void {
  const pending = readPendingStudentLogs();
  const idx = pending.findIndex(
    (item) => item.studentName.toLowerCase() === log.studentName.toLowerCase()
  );
  if (idx >= 0) {
    pending[idx] = log;
  } else {
    pending.push(log);
  }
  writePendingStudentLogs(pending);
}

let flushInFlight: Promise<void> | null = null;

export async function flushPendingStudentLogs(): Promise<void> {
  if (typeof window === "undefined" || isStandaloneHtmlMode) return;
  if (flushInFlight) return flushInFlight;

  flushInFlight = (async () => {
    const pending = readPendingStudentLogs();
    if (pending.length === 0) return;

    const remaining: StudentLog[] = [];
    for (const log of pending) {
      const res = await fetchApiJsonWithRetry<{ success?: boolean }>(
        "/api/student_logs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(log),
        },
        1
      );
      if (!res.ok) {
        remaining.push(log);
      }
    }
    writePendingStudentLogs(remaining);
  })().finally(() => {
    flushInFlight = null;
  });

  return flushInFlight;
}

export async function syncStudentLogToServer(log: StudentLog): Promise<boolean> {
  if (typeof window === "undefined" || isStandaloneHtmlMode) return false;

  const res = await fetchApiJsonWithRetry<{ success?: boolean }>(
    "/api/student_logs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    },
    2
  );

  if (!res.ok) {
    queuePendingStudentLog(log);
    console.warn("Server log sync deferred; student progress preserved locally.");
    return false;
  }

  // If this sync succeeded, also flush any older deferred logs
  void flushPendingStudentLogs();
  return true;
}

if (typeof window !== "undefined" && !isStandaloneHtmlMode) {
  window.addEventListener("online", () => {
    void flushPendingStudentLogs();
  });
}
