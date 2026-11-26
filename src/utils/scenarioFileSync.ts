/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Option, Scenario } from "../types";
import { DEFAULT_SCENARIOS, NEUTRAL_NPC_LABELS } from "../data/scenarios";

export const SCENARIO_CSV_HEADERS = [
  "id_skenario",
  "peta",
  "npc_id",
  "kategori",
  "nama_karakter",
  "tipe_npc",
  "sapaan_dekat",
  "dialog_utama",
  "pertanyaan",
  "opsi_a_teks",
  "opsi_a_benar",
  "opsi_a_feedback",
  "opsi_b_teks",
  "opsi_b_benar",
  "opsi_b_feedback",
  "opsi_c_teks",
  "opsi_c_benar",
  "opsi_c_feedback",
] as const;

export interface ScenarioSyncResult {
  scenarios: Scenario[];
  updatedCount: number;
  addedCount: number;
  unchangedCount: number;
  updatedTitles: string[];
}

const VALID_MAPS = new Set(["school", "class", "street", "home"]);
const VALID_NPC_TYPES = new Set(["stranger", "authority", "peer"]);

function escapeCsvCell(value: unknown, delimiter = ";"): string {
  const str = String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (str.includes('"') || str.includes("\n") || str.includes(delimiter) || str.includes(",")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildScenariosCsvContent(scenarios: Scenario[]): string {
  const rows: string[] = [SCENARIO_CSV_HEADERS.join(";")];

  for (const sc of scenarios) {
    const optA = sc.options[0];
    const optB = sc.options[1];
    const optC = sc.options[2];

    const cells = [
      sc.id,
      sc.mapId,
      sc.npcId,
      sc.category,
      sc.npcName,
      sc.npcType,
      sc.calloutText || "",
      sc.dialogueText,
      sc.question,
      optA?.text || "",
      optA ? (optA.isCorrect ? "BENAR" : "SALAH") : "",
      optA?.feedback || "",
      optB?.text || "",
      optB ? (optB.isCorrect ? "BENAR" : "SALAH") : "",
      optB?.feedback || "",
      optC?.text || "",
      optC ? (optC.isCorrect ? "BENAR" : "SALAH") : "",
      optC?.feedback || "",
    ];

    rows.push(cells.map((cell) => escapeCsvCell(cell, ";")).join(";"));
  }

  return `\uFEFF${rows.join("\r\n")}\r\n`;
}

export function buildScenariosJsonContent(scenarios: Scenario[]): string {
  return JSON.stringify(scenarios, null, 2);
}

function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadScenariosAsCsv(scenarios: Scenario[]): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `Bank_Soal_SafeStep_${dateStamp}.csv`;
  const csv = buildScenariosCsvContent(scenarios);
  triggerFileDownload(csv, filename, "text/csv;charset=utf-8;");
  return filename;
}

export function downloadScenariosAsJson(scenarios: Scenario[]): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `Bank_Soal_SafeStep_${dateStamp}.json`;
  const json = buildScenariosJsonContent(scenarios);
  triggerFileDownload(json, filename, "application/json;charset=utf-8;");
  return filename;
}

function detectCsvDelimiter(firstLine: string): ";" | "," | "\t" {
  let semicolons = 0;
  let commas = 0;
  let tabs = 0;
  let inQuotes = false;

  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (ch === '"') {
      if (inQuotes && firstLine[i + 1] === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes) {
      if (ch === ";") semicolons += 1;
      else if (ch === ",") commas += 1;
      else if (ch === "\t") tabs += 1;
    }
  }

  if (tabs > semicolons && tabs > commas) return "\t";
  if (commas > semicolons) return ",";
  return ";";
}

function parseCsvRows(rawText: string): string[][] {
  const cleanText = rawText.replace(/^\uFEFF/, "");
  const firstLineBreak = cleanText.search(/\r?\n/);
  const firstLine = firstLineBreak >= 0 ? cleanText.slice(0, firstLineBreak) : cleanText;
  const delimiter = detectCsvDelimiter(firstLine);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];

    if (inQuotes) {
      if (ch === '"') {
        if (cleanText[i + 1] === '"') {
          currentCell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      currentRow.push(currentCell);
      currentCell = "";
    } else if (ch === "\r") {
      if (cleanText[i + 1] === "\n") {
        i += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else if (ch === "\n") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += ch;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
}

function normalizeHeaderKey(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_");
}

function parseBooleanFlag(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  const val = String(raw ?? "").trim().toLowerCase();
  if (!val) return null;
  if (
    val === "benar" ||
    val === "ya" ||
    val === "yes" ||
    val === "true" ||
    val === "1" ||
    val === "tepat" ||
    val === "aman" ||
    val === "v" ||
    val === "✓"
  ) {
    return true;
  }
  if (
    val === "salah" ||
    val === "tidak" ||
    val === "no" ||
    val === "false" ||
    val === "0" ||
    val === "bahaya" ||
    val === "x"
  ) {
    return false;
  }
  return null;
}

function buildSanitizedScenario(
  candidate: {
    id?: string;
    mapId?: string;
    npcId?: string;
    category?: string;
    npcName?: string;
    npcType?: string;
    calloutText?: string;
    dialogueText?: string;
    question?: string;
    options: Array<{ id?: string; text: string; isCorrect: boolean; feedback: string }>;
  },
  existing: Scenario | undefined,
  rowLabel: string
): Scenario {
  const defaultRef =
    DEFAULT_SCENARIOS.find((d) => d.id === (candidate.id || existing?.id)) ||
    DEFAULT_SCENARIOS.find((d) => d.npcId === (candidate.npcId || existing?.npcId));

  const id = (candidate.id || existing?.id || "").trim().slice(0, 80);
  if (!id) {
    throw new Error(`${rowLabel}: Kolom id_skenario tidak boleh kosong.`);
  }

  const rawMapId = (candidate.mapId || existing?.mapId || defaultRef?.mapId || "").trim().toLowerCase();
  const mapId = VALID_MAPS.has(rawMapId) ? rawMapId : existing?.mapId || defaultRef?.mapId || "school";

  const npcId = (candidate.npcId || existing?.npcId || defaultRef?.npcId || "").trim().slice(0, 80);
  if (!npcId) {
    throw new Error(`${rowLabel}: Kolom npc_id tidak boleh kosong.`);
  }

  const rawNpcType = (candidate.npcType || existing?.npcType || defaultRef?.npcType || "stranger")
    .trim()
    .toLowerCase();
  const npcType = VALID_NPC_TYPES.has(rawNpcType)
    ? rawNpcType
    : existing?.npcType || defaultRef?.npcType || "stranger";

  const category =
    (candidate.category ?? existing?.category ?? defaultRef?.category ?? "Keselamatan Diri")
      .trim()
      .slice(0, 120) || "Keselamatan Diri";

  const npcName =
    (candidate.npcName ??
      existing?.npcName ??
      NEUTRAL_NPC_LABELS[npcId] ??
      defaultRef?.npcName ??
      "Karakter")
      .trim()
      .slice(0, 80) || "Karakter";

  const dialogueText = (candidate.dialogueText ?? existing?.dialogueText ?? "").trim().slice(0, 1000);
  if (!dialogueText) {
    throw new Error(`${rowLabel} (${id}): Kolom dialog_utama tidak boleh kosong.`);
  }

  const question = (candidate.question ?? existing?.question ?? "").trim().slice(0, 500);
  if (!question) {
    throw new Error(`${rowLabel} (${id}): Kolom pertanyaan tidak boleh kosong.`);
  }

  const calloutTextRaw =
    candidate.calloutText !== undefined
      ? candidate.calloutText.trim().slice(0, 220)
      : (existing?.calloutText || "").trim().slice(0, 220);

  const letters = ["a", "b", "c", "d"];
  const cleanedOptions: Option[] = [];
  for (let i = 0; i < candidate.options.length; i++) {
    const rawOpt = candidate.options[i];
    const optText = (rawOpt.text || "").trim().slice(0, 300);
    if (!optText) continue;

    const existingOpt = existing?.options[i];
    const optFeedback =
      (rawOpt.feedback ?? existingOpt?.feedback ?? "").trim().slice(0, 500) ||
      (rawOpt.isCorrect
        ? "Hebat sekali, [Nama Anak]! Pilihanmu sudah aman dan tepat."
        : "Waspada! Ayo pilih tindakan yang lebih aman dan laporkan ke orang tua atau guru.");

    const optObj: Option = {
      id: (rawOpt.id || existingOpt?.id || letters[i] || `opt${i + 1}`).trim().slice(0, 16),
      text: optText,
      isCorrect: Boolean(rawOpt.isCorrect),
      feedback: optFeedback,
    };

    if (
      existingOpt?.feedbackAudioUrl &&
      existingOpt.feedback.trim() === optFeedback
    ) {
      optObj.feedbackAudioUrl = existingOpt.feedbackAudioUrl;
    }

    cleanedOptions.push(optObj);
  }

  if (cleanedOptions.length < 2) {
    throw new Error(`${rowLabel} (${id}): Minimal harus memiliki 2 pilihan jawaban yang terisi.`);
  }

  if (!cleanedOptions.some((opt) => opt.isCorrect)) {
    throw new Error(
      `${rowLabel} (${id}): Minimal 1 pilihan jawaban harus ditandai BENAR (kolom opsi_*_benar = BENAR).`
    );
  }

  const result: Scenario = {
    id,
    npcId,
    npcName,
    npcType,
    mapId,
    dialogueText,
    question,
    options: cleanedOptions,
    category,
  };

  if (calloutTextRaw) {
    result.calloutText = calloutTextRaw;
  }

  if (
    existing?.questionAudioUrl &&
    existing.dialogueText.trim() === dialogueText
  ) {
    result.questionAudioUrl = existing.questionAudioUrl;
  }

  return result;
}

function areScenariosEqual(a: Scenario, b: Scenario): boolean {
  if (
    a.id !== b.id ||
    a.npcId !== b.npcId ||
    a.npcName !== b.npcName ||
    a.npcType !== b.npcType ||
    a.mapId !== b.mapId ||
    a.category !== b.category ||
    (a.calloutText || "") !== (b.calloutText || "") ||
    a.dialogueText !== b.dialogueText ||
    a.question !== b.question ||
    a.options.length !== b.options.length
  ) {
    return false;
  }
  for (let i = 0; i < a.options.length; i++) {
    const oa = a.options[i];
    const ob = b.options[i];
    if (
      oa.id !== ob.id ||
      oa.text !== ob.text ||
      oa.isCorrect !== ob.isCorrect ||
      oa.feedback !== ob.feedback
    ) {
      return false;
    }
  }
  return true;
}

function parseIncomingCsvScenarios(
  rawText: string,
  currentScenarios: Scenario[]
): Scenario[] {
  const rows = parseCsvRows(rawText);
  if (rows.length < 2) {
    throw new Error("File CSV kosong atau tidak memiliki baris data soal.");
  }

  const headers = rows[0].map(normalizeHeaderKey);
  const colIndex = new Map<string, number>();
  headers.forEach((h, idx) => {
    if (h) colIndex.set(h, idx);
  });

  const getCell = (row: string[], ...aliases: string[]): string | undefined => {
    for (const key of aliases) {
      const idx = colIndex.get(key);
      if (idx !== undefined) {
        return row[idx] ?? "";
      }
    }
    return undefined;
  };

  const hasIdCol = colIndex.has("id_skenario") || colIndex.has("id") || colIndex.has("scenario_id");
  const hasDialogueCol =
    colIndex.has("dialog_utama") || colIndex.has("dialog") || colIndex.has("dialoguetext");
  const hasQuestionCol = colIndex.has("pertanyaan") || colIndex.has("question");

  if (!hasIdCol || (!hasDialogueCol && !hasQuestionCol)) {
    throw new Error(
      "Format kolom CSV tidak dikenali. Gunakan file hasil 'Unduh Excel (.CSV)' dari Dashboard Guru."
    );
  }

  const parsedScenarios: Scenario[] = [];
  for (let rIdx = 1; rIdx < rows.length; rIdx++) {
    const row = rows[rIdx];
    const rowLabel = `Baris ${rIdx + 1}`;
    const rawId = (getCell(row, "id_skenario", "id", "scenario_id") || "").trim();
    const rawMap = (getCell(row, "peta", "map", "map_id", "mapid") || "").trim().toLowerCase();
    const rawNpcId = (getCell(row, "npc_id", "npcid") || "").trim();

    if (!rawId && !rawNpcId) continue;

    const existing =
      currentScenarios.find((s) => s.id.toLowerCase() === rawId.toLowerCase()) ||
      currentScenarios.find(
        (s) =>
          rawMap &&
          rawNpcId &&
          s.mapId.toLowerCase() === rawMap &&
          s.npcId.toLowerCase() === rawNpcId.toLowerCase()
      );

    const optSpecs: Array<{
      id: string;
      textKeys: string[];
      correctKeys: string[];
      feedbackKeys: string[];
    }> = [
      {
        id: "a",
        textKeys: ["opsi_a_teks", "pilihan_a", "opsi_a"],
        correctKeys: ["opsi_a_benar", "a_benar"],
        feedbackKeys: ["opsi_a_feedback", "feedback_a"],
      },
      {
        id: "b",
        textKeys: ["opsi_b_teks", "pilihan_b", "opsi_b"],
        correctKeys: ["opsi_b_benar", "b_benar"],
        feedbackKeys: ["opsi_b_feedback", "feedback_b"],
      },
      {
        id: "c",
        textKeys: ["opsi_c_teks", "pilihan_c", "opsi_c"],
        correctKeys: ["opsi_c_benar", "c_benar"],
        feedbackKeys: ["opsi_c_feedback", "feedback_c"],
      },
    ];

    const options = optSpecs.map((spec, idx) => {
      const textVal = getCell(row, ...spec.textKeys);
      const correctRaw = getCell(row, ...spec.correctKeys);
      const feedbackVal = getCell(row, ...spec.feedbackKeys);
      const existingOpt = existing?.options[idx];

      const parsedBool = parseBooleanFlag(correctRaw);
      if (correctRaw !== undefined && correctRaw.trim() !== "" && parsedBool === null) {
        throw new Error(
          `${rowLabel} (${rawId || rawNpcId}): Nilai kolom ${spec.correctKeys[0]} harus BENAR atau SALAH (ditemukan "${correctRaw.trim()}").`
        );
      }

      return {
        id: spec.id,
        text: textVal !== undefined ? textVal : existingOpt?.text || "",
        isCorrect: parsedBool !== null ? parsedBool : Boolean(existingOpt?.isCorrect),
        feedback: feedbackVal !== undefined ? feedbackVal : existingOpt?.feedback || "",
      };
    });

    const scenarioObj = buildSanitizedScenario(
      {
        id: rawId || existing?.id,
        mapId: rawMap || existing?.mapId,
        npcId: rawNpcId || existing?.npcId,
        category: getCell(row, "kategori", "category"),
        npcName: getCell(row, "nama_karakter", "npc_name", "npcname"),
        npcType: getCell(row, "tipe_npc", "npc_type", "npctype"),
        calloutText: getCell(row, "sapaan_dekat", "callout_text", "callouttext"),
        dialogueText: getCell(row, "dialog_utama", "dialog", "dialoguetext", "dialogue_text"),
        question: getCell(row, "pertanyaan", "question"),
        options,
      },
      existing,
      rowLabel
    );

    parsedScenarios.push(scenarioObj);
  }

  if (parsedScenarios.length === 0) {
    throw new Error("Tidak ada data pertanyaan valid yang ditemukan di file CSV.");
  }

  return parsedScenarios;
}

function parseIncomingJsonScenarios(
  rawText: string,
  currentScenarios: Scenario[]
): Scenario[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("File JSON tidak valid atau formatnya rusak.");
  }

  const rawList: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { scenarios?: unknown[] }).scenarios)
      ? (parsed as { scenarios: unknown[] }).scenarios
      : [];

  if (rawList.length === 0) {
    throw new Error("File JSON harus berisi daftar skenario pertanyaan (array).");
  }

  const parsedScenarios: Scenario[] = [];
  rawList.forEach((item, idx) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Item ke-${idx + 1} dalam JSON bukan objek skenario yang valid.`);
    }
    const obj = item as Record<string, unknown>;
    const rawId = typeof obj.id === "string" ? obj.id.trim() : "";
    const rawNpcId = typeof obj.npcId === "string" ? obj.npcId.trim() : "";
    const rawMapId = typeof obj.mapId === "string" ? obj.mapId.trim().toLowerCase() : "";

    const existing =
      currentScenarios.find((s) => s.id.toLowerCase() === rawId.toLowerCase()) ||
      currentScenarios.find(
        (s) =>
          rawMapId &&
          rawNpcId &&
          s.mapId.toLowerCase() === rawMapId &&
          s.npcId.toLowerCase() === rawNpcId.toLowerCase()
      );

    const rawOptions = Array.isArray(obj.options) ? obj.options : [];
    const options = rawOptions.map((o, oIdx) => {
      const optRec = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
      const existingOpt = existing?.options[oIdx];
      return {
        id: typeof optRec.id === "string" ? optRec.id : existingOpt?.id,
        text: typeof optRec.text === "string" ? optRec.text : existingOpt?.text || "",
        isCorrect:
          typeof optRec.isCorrect === "boolean"
            ? optRec.isCorrect
            : Boolean(existingOpt?.isCorrect),
        feedback:
          typeof optRec.feedback === "string"
            ? optRec.feedback
            : typeof optRec.feedbackText === "string"
              ? optRec.feedbackText
              : existingOpt?.feedback || "",
      };
    });

    const sanitized = buildSanitizedScenario(
      {
        id: rawId || existing?.id,
        mapId: rawMapId || existing?.mapId,
        npcId: rawNpcId || existing?.npcId,
        category: typeof obj.category === "string" ? obj.category : undefined,
        npcName: typeof obj.npcName === "string" ? obj.npcName : undefined,
        npcType: typeof obj.npcType === "string" ? obj.npcType : undefined,
        calloutText: typeof obj.calloutText === "string" ? obj.calloutText : undefined,
        dialogueText:
          typeof obj.dialogueText === "string"
            ? obj.dialogueText
            : typeof obj.questionText === "string"
              ? obj.questionText
              : undefined,
        question: typeof obj.question === "string" ? obj.question : undefined,
        options,
      },
      existing,
      `Data ke-${idx + 1}`
    );

    parsedScenarios.push(sanitized);
  });

  return parsedScenarios;
}

export function parseAndMergeUploadedScenarioFile(
  filename: string,
  rawText: string,
  currentScenarios: Scenario[]
): ScenarioSyncResult {
  const lowerName = filename.toLowerCase();
  const trimmed = rawText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    throw new Error("File yang diunggah kosong.");
  }

  const isJson =
    lowerName.endsWith(".json") ||
    (!lowerName.endsWith(".csv") && (trimmed.startsWith("[") || trimmed.startsWith("{")));

  const incomingList = isJson
    ? parseIncomingJsonScenarios(trimmed, currentScenarios)
    : parseIncomingCsvScenarios(trimmed, currentScenarios);

  const incomingById = new Map<string, Scenario>();
  for (const sc of incomingList) {
    incomingById.set(sc.id.toLowerCase(), sc);
  }

  let updatedCount = 0;
  let unchangedCount = 0;
  let addedCount = 0;
  const updatedTitles: string[] = [];

  const merged: Scenario[] = currentScenarios.map((existing) => {
    const incoming = incomingById.get(existing.id.toLowerCase());
    if (!incoming) {
      return existing;
    }
    incomingById.delete(existing.id.toLowerCase());
    if (areScenariosEqual(existing, incoming)) {
      unchangedCount += 1;
      return existing;
    }
    updatedCount += 1;
    updatedTitles.push(incoming.npcName);
    return incoming;
  });

  // Append any brand-new scenario entries if file added extra scenarios (bounded to 30 total)
  for (const extra of incomingById.values()) {
    if (merged.length >= 30) break;
    merged.push(extra);
    addedCount += 1;
    updatedTitles.push(extra.npcName);
  }

  return {
    scenarios: merged.slice(0, 30),
    updatedCount,
    addedCount,
    unchangedCount,
    updatedTitles,
  };
}
