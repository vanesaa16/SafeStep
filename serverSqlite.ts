/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export interface StoredStudentLog {
  id: string;
  studentName: string;
  totalPoints: number;
  completedScenariosCount: number;
  completedAt: string;
  history: unknown[];
}

export interface StoredVoiceEntry {
  audioBase64: string;
  mimeType: string;
}

const DATA_DIR =
  typeof process.env.DATA_DIR === "string" && process.env.DATA_DIR.trim()
    ? path.resolve(process.env.DATA_DIR.trim())
    : process.cwd();

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "safestep.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS student_logs (
    id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_name_lower TEXT NOT NULL UNIQUE,
    total_points INTEGER NOT NULL DEFAULT 0,
    completed_scenarios_count INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT NOT NULL,
    history_json TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_scenarios (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    scenarios_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS voice_audio_cache (
    cache_key TEXT PRIMARY KEY,
    audio_base64 TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'audio/wav',
    updated_at INTEGER NOT NULL
  );
`);

// Prepared statements (strictly parameterized)
const stmtGetAllLogs = db.prepare(`
  SELECT id, student_name, total_points, completed_scenarios_count, completed_at, history_json
  FROM student_logs
  ORDER BY updated_at DESC
`);

const stmtFindLogByNameLower = db.prepare(`
  SELECT id FROM student_logs WHERE student_name_lower = ?
`);

const stmtUpsertLog = db.prepare(`
  INSERT INTO student_logs (
    id, student_name, student_name_lower, total_points,
    completed_scenarios_count, completed_at, history_json, updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(student_name_lower) DO UPDATE SET
    student_name = excluded.student_name,
    total_points = excluded.total_points,
    completed_scenarios_count = excluded.completed_scenarios_count,
    completed_at = excluded.completed_at,
    history_json = excluded.history_json,
    updated_at = excluded.updated_at
`);

const stmtClearLogs = db.prepare(`DELETE FROM student_logs`);

const stmtGetScenarios = db.prepare(`
  SELECT scenarios_json FROM custom_scenarios WHERE id = 1
`);

const stmtSaveScenarios = db.prepare(`
  INSERT INTO custom_scenarios (id, scenarios_json, updated_at)
  VALUES (1, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    scenarios_json = excluded.scenarios_json,
    updated_at = excluded.updated_at
`);

const stmtResetScenarios = db.prepare(`DELETE FROM custom_scenarios WHERE id = 1`);

const stmtLoadVoiceCache = db.prepare(`
  SELECT cache_key, audio_base64, mime_type
  FROM voice_audio_cache
  ORDER BY updated_at DESC
  LIMIT ?
`);

const stmtUpsertVoiceEntry = db.prepare(`
  INSERT INTO voice_audio_cache (cache_key, audio_base64, mime_type, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(cache_key) DO UPDATE SET
    audio_base64 = excluded.audio_base64,
    mime_type = excluded.mime_type,
    updated_at = excluded.updated_at
`);

const stmtCountLogs = db.prepare(`SELECT COUNT(*) AS cnt FROM student_logs`);
const stmtCountScenarios = db.prepare(`SELECT COUNT(*) AS cnt FROM custom_scenarios`);
const stmtCountVoices = db.prepare(`SELECT COUNT(*) AS cnt FROM voice_audio_cache`);

// One-time migration from legacy JSON files if SQLite tables are empty
function migrateLegacyJsonToSqlite(): void {
  try {
    const legacyLogsFile = path.join(process.cwd(), "student_logs_db.json");
    const logCount = (stmtCountLogs.get() as { cnt: number }).cnt;
    if (logCount === 0 && fs.existsSync(legacyLogsFile)) {
      const parsed = JSON.parse(fs.readFileSync(legacyLogsFile, "utf-8"));
      if (Array.isArray(parsed)) {
        const insertMany = db.transaction((items: Record<string, unknown>[]) => {
          for (const item of items) {
            if (!item || typeof item.studentName !== "string" || !item.studentName.trim()) continue;
            const cleanName = item.studentName.trim().slice(0, 80);
            const logId =
              typeof item.id === "string" && item.id
                ? item.id.slice(0, 128)
                : `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            stmtUpsertLog.run(
              logId,
              cleanName,
              cleanName.toLowerCase(),
              Math.max(0, Math.min(1000, Number(item.totalPoints) || 0)),
              Math.max(0, Math.min(30, Number(item.completedScenariosCount) || 0)),
              typeof item.completedAt === "string" && item.completedAt
                ? item.completedAt.slice(0, 64)
                : new Date().toISOString(),
              JSON.stringify(Array.isArray(item.history) ? item.history.slice(0, 50) : []),
              Date.now()
            );
          }
        });
        insertMany(parsed as Record<string, unknown>[]);
      }
    }
  } catch {
    // Ignore legacy log migration error
  }

  try {
    const legacyScenariosFile = path.join(process.cwd(), "custom_scenarios_db.json");
    const scCount = (stmtCountScenarios.get() as { cnt: number }).cnt;
    if (scCount === 0 && fs.existsSync(legacyScenariosFile)) {
      const parsed = JSON.parse(fs.readFileSync(legacyScenariosFile, "utf-8"));
      if (Array.isArray(parsed) && parsed.length > 0) {
        stmtSaveScenarios.run(JSON.stringify(parsed.slice(0, 30)), Date.now());
      }
    }
  } catch {
    // Ignore legacy scenario migration error
  }

  try {
    const legacyVoiceFile = path.join(process.cwd(), "voice_audio_cache_db.json");
    const voiceCount = (stmtCountVoices.get() as { cnt: number }).cnt;
    if (voiceCount === 0 && fs.existsSync(legacyVoiceFile)) {
      const parsed = JSON.parse(fs.readFileSync(legacyVoiceFile, "utf-8"));
      if (Array.isArray(parsed)) {
        const insertVoices = db.transaction(
          (entries: Array<[string, { audioBase64?: string; mimeType?: string }]>) => {
            const now = Date.now();
            for (const entry of entries.slice(-320)) {
              if (!Array.isArray(entry) || typeof entry[0] !== "string") continue;
              const val = entry[1];
              if (!val?.audioBase64) continue;
              stmtUpsertVoiceEntry.run(
                entry[0],
                val.audioBase64,
                val.mimeType || "audio/wav",
                now
              );
            }
          }
        );
        insertVoices(parsed as Array<[string, { audioBase64?: string; mimeType?: string }]>);
      }
    }
  } catch {
    // Ignore legacy voice cache migration error
  }
}

migrateLegacyJsonToSqlite();

export function getAllStudentLogsFromSqlite(): StoredStudentLog[] {
  const rows = stmtGetAllLogs.all() as Array<{
    id: string;
    student_name: string;
    total_points: number;
    completed_scenarios_count: number;
    completed_at: string;
    history_json: string;
  }>;

  return rows.map((row) => {
    let history: unknown[] = [];
    try {
      const parsed = JSON.parse(row.history_json);
      if (Array.isArray(parsed)) history = parsed;
    } catch {
      history = [];
    }
    return {
      id: row.id,
      studentName: row.student_name,
      totalPoints: row.total_points,
      completedScenariosCount: row.completed_scenarios_count,
      completedAt: row.completed_at,
      history,
    };
  });
}

export function upsertStudentLogToSqlite(log: StoredStudentLog): StoredStudentLog {
  const cleanName = log.studentName.trim().slice(0, 80);
  const nameLower = cleanName.toLowerCase();
  const existing = stmtFindLogByNameLower.get(nameLower) as { id: string } | undefined;
  const resolvedId = existing?.id || log.id;
  const boundedHistory = Array.isArray(log.history) ? log.history.slice(0, 50) : [];

  stmtUpsertLog.run(
    resolvedId,
    cleanName,
    nameLower,
    Math.max(0, Math.min(1000, Number(log.totalPoints) || 0)),
    Math.max(0, Math.min(30, Number(log.completedScenariosCount) || 0)),
    log.completedAt,
    JSON.stringify(boundedHistory),
    Date.now()
  );

  return {
    ...log,
    id: resolvedId,
    studentName: cleanName,
    history: boundedHistory,
  };
}

export function clearStudentLogsInSqlite(): void {
  stmtClearLogs.run();
}

export function getCustomScenariosFromSqlite(): unknown[] {
  const row = stmtGetScenarios.get() as { scenarios_json: string } | undefined;
  if (!row?.scenarios_json) return [];
  try {
    const parsed = JSON.parse(row.scenarios_json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomScenariosToSqlite(scenarios: unknown[]): number {
  const bounded = scenarios.slice(0, 30);
  stmtSaveScenarios.run(JSON.stringify(bounded), Date.now());
  return bounded.length;
}

export function resetCustomScenariosInSqlite(): void {
  stmtResetScenarios.run();
}

export function loadVoiceCacheFromSqlite(
  maxEntries = 320
): Array<[string, StoredVoiceEntry]> {
  const rows = stmtLoadVoiceCache.all(maxEntries) as Array<{
    cache_key: string;
    audio_base64: string;
    mime_type: string;
  }>;
  return rows.map((row) => [
    row.cache_key,
    { audioBase64: row.audio_base64, mimeType: row.mime_type || "audio/wav" },
  ]);
}

export function upsertVoiceEntriesToSqlite(
  entries: Array<[string, StoredVoiceEntry]>
): void {
  if (entries.length === 0) return;
  const writeMany = db.transaction((items: Array<[string, StoredVoiceEntry]>) => {
    const now = Date.now();
    for (const [key, val] of items) {
      if (!key || !val?.audioBase64) continue;
      stmtUpsertVoiceEntry.run(key, val.audioBase64, val.mimeType || "audio/wav", now);
    }
  });
  writeMany(entries);
}
