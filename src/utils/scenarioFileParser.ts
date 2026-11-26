/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from "mammoth";
import { Option, Scenario } from "../types";
import { NEUTRAL_NPC_LABELS } from "../data/scenarios";

export const MAX_FIRESTORE_SCENARIOS = 30;

export interface ParsedScenarioUploadResult {
  scenarios: Scenario[];
  warnings: string[];
  sourceFormat: "csv" | "docx" | "doc";
  totalDetected: number;
  truncatedCount: number;
}

interface StandardSlot {
  mapId: "school" | "class" | "street" | "home";
  npcId: string;
  npcName: string;
  npcType: "stranger" | "authority" | "peer";
}

const STANDARD_SLOTS: StandardSlot[] = [
  { mapId: "school", npcId: "school-npc-1", npcName: NEUTRAL_NPC_LABELS["school-npc-1"], npcType: "stranger" },
  { mapId: "school", npcId: "school-npc-2", npcName: NEUTRAL_NPC_LABELS["school-npc-2"], npcType: "authority" },
  { mapId: "school", npcId: "school-npc-3", npcName: NEUTRAL_NPC_LABELS["school-npc-3"], npcType: "peer" },
  { mapId: "school", npcId: "school-npc-4", npcName: NEUTRAL_NPC_LABELS["school-npc-4"], npcType: "stranger" },
  { mapId: "school", npcId: "school-npc-5", npcName: NEUTRAL_NPC_LABELS["school-npc-5"], npcType: "peer" },
  { mapId: "class", npcId: "class-npc-1", npcName: NEUTRAL_NPC_LABELS["class-npc-1"], npcType: "authority" },
  { mapId: "class", npcId: "class-npc-2", npcName: NEUTRAL_NPC_LABELS["class-npc-2"], npcType: "peer" },
  { mapId: "class", npcId: "class-npc-3", npcName: NEUTRAL_NPC_LABELS["class-npc-3"], npcType: "stranger" },
  { mapId: "class", npcId: "class-npc-4", npcName: NEUTRAL_NPC_LABELS["class-npc-4"], npcType: "peer" },
  { mapId: "class", npcId: "class-npc-5", npcName: NEUTRAL_NPC_LABELS["class-npc-5"], npcType: "stranger" },
  { mapId: "street", npcId: "street-npc-1", npcName: NEUTRAL_NPC_LABELS["street-npc-1"], npcType: "stranger" },
  { mapId: "street", npcId: "street-npc-2", npcName: NEUTRAL_NPC_LABELS["street-npc-2"], npcType: "stranger" },
  { mapId: "street", npcId: "street-npc-3", npcName: NEUTRAL_NPC_LABELS["street-npc-3"], npcType: "stranger" },
  { mapId: "street", npcId: "street-npc-4", npcName: NEUTRAL_NPC_LABELS["street-npc-4"], npcType: "stranger" },
  { mapId: "street", npcId: "street-npc-5", npcName: NEUTRAL_NPC_LABELS["street-npc-5"], npcType: "peer" },
  { mapId: "home", npcId: "home-npc-1", npcName: NEUTRAL_NPC_LABELS["home-npc-1"], npcType: "stranger" },
  { mapId: "home", npcId: "home-npc-2", npcName: NEUTRAL_NPC_LABELS["home-npc-2"], npcType: "stranger" },
  { mapId: "home", npcId: "home-npc-3", npcName: NEUTRAL_NPC_LABELS["home-npc-3"], npcType: "peer" },
  { mapId: "home", npcId: "home-npc-4", npcName: NEUTRAL_NPC_LABELS["home-npc-4"], npcType: "authority" },
  { mapId: "home", npcId: "home-npc-5", npcName: NEUTRAL_NPC_LABELS["home-npc-5"], npcType: "stranger" },
];

interface RawDraftQuestion {
  mapId?: string;
  npcId?: string;
  npcName?: string;
  npcType?: string;
  category?: string;
  calloutText?: string;
  dialogueText?: string;
  question?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  correctAnswer?: string;
  feedbackA?: string;
  feedbackB?: string;
  feedbackC?: string;
  feedbackCorrect?: string;
  feedbackWrong?: string;
}

function normalizeHeaderKey(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeMapId(raw: string | undefined): "school" | "class" | "street" | "home" | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase().trim();
  if (!v) return undefined;
  if (v === "school" || v.includes("sekolah") || v.includes("halaman") || v.includes("gerbang")) return "school";
  if (v === "class" || v.includes("kelas") || v.includes("ruang kelas")) return "class";
  if (v === "street" || v.includes("jalan") || v.includes("pulang") || v.includes("trotoar")) return "street";
  if (v === "home" || v.includes("rumah") || v.includes("keluarga")) return "home";
  return undefined;
}

function normalizeNpcType(raw: string | undefined): "stranger" | "authority" | "peer" | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase().trim();
  if (!v) return undefined;
  if (v === "stranger" || v.includes("asing") || v.includes("tamu") || v.includes("pengunjung")) return "stranger";
  if (v === "authority" || v.includes("guru") || v.includes("petugas") || v.includes("satpam") || v.includes("orang dewasa") || v.includes("kerabat")) return "authority";
  if (v === "peer" || v.includes("teman") || v.includes("sebaya") || v.includes("kakak") || v.includes("sepupu")) return "peer";
  return undefined;
}

function normalizeCategory(raw: string | undefined): string {
  const clean = (raw || "").trim();
  if (!clean) return "Keselamatan Anak";
  return clean.slice(0, 120);
}

function detectCsvDelimiter(text: string): "," | ";" | "\t" {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) || "";
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;
  let tabs = 0;

  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (ch === ",") commas++;
      else if (ch === ";") semicolons++;
      else if (ch === "\t") tabs++;
    }
  }

  if (semicolons >= commas && semicolons >= tabs && semicolons > 0) return ";";
  if (tabs > commas && tabs > semicolons) return "\t";
  return ",";
}

function parseCsvRows(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, "");
  const delimiter = detectCsvDelimiter(cleanText);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (ch === "\r" && next === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += ch;
      }
    }
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

type ColumnField =
  | "ignore"
  | "mapId"
  | "npcId"
  | "npcName"
  | "npcType"
  | "category"
  | "calloutText"
  | "dialogueText"
  | "question"
  | "optionA"
  | "optionB"
  | "optionC"
  | "correctAnswer"
  | "feedbackA"
  | "feedbackB"
  | "feedbackC"
  | "feedbackCorrect"
  | "feedbackWrong";

function mapHeaderToField(header: string): ColumnField {
  const h = normalizeHeaderKey(header);
  if (!h || h === "no" || h === "nomor" || h === "number" || h === "id") return "ignore";
  if (h === "peta" || h === "map" || h === "mapid" || h === "map id" || h === "lokasi") return "mapId";
  if (h === "npcid" || h === "npc id" || h === "slot") return "npcId";
  if (h === "karakter" || h === "npc" || h === "npcname" || h === "npc name" || h === "nama karakter" || h === "tokoh") return "npcName";
  if (h === "tipe" || h === "npctype" || h === "npc type" || h === "peran") return "npcType";
  if (h === "kategori" || h === "category" || h === "tema" || h === "topik") return "category";
  if (h === "sapaan" || h === "callout" || h === "callouttext" || h === "callout text") return "calloutText";
  if (h === "dialog" || h === "dialoguetext" || h === "dialogue text" || h === "situasi" || h === "cerita" || h === "narasi" || h === "kasus") return "dialogueText";
  if (h === "pertanyaan" || h === "question" || h === "soal" || h === "tanya" || h === "rumusan soal") return "question";
  if (h === "opsi a" || h === "pilihan a" || h === "jawaban a" || h === "a" || h === "option a") return "optionA";
  if (h === "opsi b" || h === "pilihan b" || h === "jawaban b" || h === "b" || h === "option b") return "optionB";
  if (h === "opsi c" || h === "pilihan c" || h === "jawaban c" || h === "c" || h === "option c") return "optionC";
  if (
    h === "kunci" ||
    h === "kunci jawaban" ||
    h === "jawaban benar" ||
    h === "jawaban" ||
    h === "correct" ||
    h === "correct answer" ||
    h === "benar"
  ) {
    return "correctAnswer";
  }
  if (h === "feedback a" || h === "umpan balik a" || h === "penjelasan a") return "feedbackA";
  if (h === "feedback b" || h === "umpan balik b" || h === "penjelasan b") return "feedbackB";
  if (h === "feedback c" || h === "umpan balik c" || h === "penjelasan c") return "feedbackC";
  if (h === "feedback benar" || h === "umpan balik benar" || h === "apresiasi" || h === "pesan benar") return "feedbackCorrect";
  if (h === "feedback salah" || h === "umpan balik salah" || h === "koreksi" || h === "feedback" || h === "penjelasan" || h === "umpan balik") return "feedbackWrong";
  return "ignore";
}

function parseTabularRowsToDrafts(rows: string[][]): RawDraftQuestion[] {
  if (rows.length < 2) return [];
  const headerRow = rows[0];
  const columnFields = headerRow.map(mapHeaderToField);
  const hasRelevantHeader = columnFields.some(
    (f) => f === "question" || f === "dialogueText" || f === "optionA"
  );
  if (!hasRelevantHeader) return [];

  const drafts: RawDraftQuestion[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell) => !cell || !cell.trim())) continue;

    const draft: RawDraftQuestion = {};
    for (let c = 0; c < columnFields.length; c++) {
      const field = columnFields[c];
      if (field === "ignore") continue;
      const val = (row[c] || "").trim();
      if (!val) continue;
      draft[field] = val;
    }

    if (draft.question || draft.dialogueText) {
      drafts.push(draft);
    }
  }
  return drafts;
}

function stripInlineCorrectMarker(text: string): { cleanText: string; markedCorrect: boolean } {
  let clean = text.trim();
  let markedCorrect = false;

  if (/^\*\s*/.test(clean)) {
    markedCorrect = true;
    clean = clean.replace(/^\*\s*/, "").trim();
  }
  if (/\s*\*$/.test(clean)) {
    markedCorrect = true;
    clean = clean.replace(/\s*\*$/, "").trim();
  }
  if (/\((?:benar|kunci|tepat|correct)\)\s*$/i.test(clean)) {
    markedCorrect = true;
    clean = clean.replace(/\((?:benar|kunci|tepat|correct)\)\s*$/i, "").trim();
  }
  if (/\[(?:benar|kunci|tepat|correct)\]\s*$/i.test(clean)) {
    markedCorrect = true;
    clean = clean.replace(/\[(?:benar|kunci|tepat|correct)\]\s*$/i, "").trim();
  }

  return { cleanText: clean, markedCorrect };
}

function parseLinesToDrafts(lines: string[]): RawDraftQuestion[] {
  const drafts: RawDraftQuestion[] = [];
  let current: RawDraftQuestion | null = null;

  const commitCurrent = () => {
    if (!current) return;
    if ((current.question || current.dialogueText) && (current.optionA || current.optionB)) {
      drafts.push(current);
    }
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u00a0/g, " ").trim();
    if (!line) continue;

    // Ignore decorative dividers or template titles
    if (/^[-=_]{3,}$/.test(line)) continue;
    if (/^(daftar soal|template soal|panduan format)/i.test(line)) continue;

    // Labeled metadata or question start: e.g. "1. ..." or "Soal 1: ..."
    const numberedStart = line.match(/^(?:soal\s*)?(\d{1,3})\s*[.):\-]\s*(.+)$/i);
    if (numberedStart && !/^(opsi|pilihan|jawaban|kunci|feedback|umpan)/i.test(numberedStart[2])) {
      commitCurrent();
      current = {};
      let body = numberedStart[2].trim();

      // Extract optional inline bracket tags like [Peta: school] [Kategori: Cyber Safety]
      const tagMatches = [...body.matchAll(/\[(peta|map|kategori|category|karakter|npc)\s*:\s*([^\]]+)\]/gi)];
      for (const m of tagMatches) {
        const tagKey = m[1].toLowerCase();
        const tagVal = m[2].trim();
        if (tagKey === "peta" || tagKey === "map") current.mapId = tagVal;
        else if (tagKey === "kategori" || tagKey === "category") current.category = tagVal;
        else if (tagKey === "karakter" || tagKey === "npc") current.npcName = tagVal;
      }
      body = body.replace(/\[(peta|map|kategori|category|karakter|npc)\s*:\s*[^\]]+\]/gi, "").trim();

      if (/^pertanyaan\s*:/i.test(body)) {
        current.question = body.replace(/^pertanyaan\s*:\s*/i, "").trim();
      } else if (/^(?:dialog|situasi|cerita|narasi)\s*:/i.test(body)) {
        current.dialogueText = body.replace(/^(?:dialog|situasi|cerita|narasi)\s*:\s*/i, "").trim();
      } else if (body) {
        current.question = body;
      }
      continue;
    }

    // Labeled field prefixes
    const labelMatch = line.match(
      /^(peta|map|lokasi|kategori|category|tema|topik|karakter|npc|tokoh|tipe|peran|sapaan|callout|dialog|situasi|cerita|narasi|pertanyaan|soal|tanya|opsi\s*a|pilihan\s*a|opsi\s*b|pilihan\s*b|opsi\s*c|pilihan\s*c|kunci(?:\s*jawaban)?|jawaban\s*benar|jawaban|correct|feedback\s*a|umpan\s*balik\s*a|feedback\s*b|umpan\s*balik\s*b|feedback\s*c|umpan\s*balik\s*c|feedback\s*benar|umpan\s*balik\s*benar|feedback\s*salah|umpan\s*balik\s*salah|feedback|umpan\s*balik|penjelasan)\s*[:=]\s*(.+)$/i
    );
    if (labelMatch) {
      const key = normalizeHeaderKey(labelMatch[1]);
      const val = labelMatch[2].trim();

      // If a standalone "Pertanyaan:" or "Dialog:" starts a brand new block after options/kunci were already collected
      if (
        (key === "pertanyaan" || key === "soal" || key === "dialog" || key === "situasi") &&
        current &&
        (current.optionA || current.optionB)
      ) {
        commitCurrent();
      }
      if (!current) current = {};

      if (key === "peta" || key === "map" || key === "lokasi") current.mapId = val;
      else if (key === "kategori" || key === "category" || key === "tema" || key === "topik") current.category = val;
      else if (key === "karakter" || key === "npc" || key === "tokoh") current.npcName = val;
      else if (key === "tipe" || key === "peran") current.npcType = val;
      else if (key === "sapaan" || key === "callout") current.calloutText = val;
      else if (key === "dialog" || key === "situasi" || key === "cerita" || key === "narasi") current.dialogueText = val;
      else if (key === "pertanyaan" || key === "soal" || key === "tanya") current.question = val;
      else if (key === "opsi a" || key === "pilihan a") {
        const { cleanText, markedCorrect } = stripInlineCorrectMarker(val);
        current.optionA = cleanText;
        if (markedCorrect) current.correctAnswer = "A";
      } else if (key === "opsi b" || key === "pilihan b") {
        const { cleanText, markedCorrect } = stripInlineCorrectMarker(val);
        current.optionB = cleanText;
        if (markedCorrect) current.correctAnswer = "B";
      } else if (key === "opsi c" || key === "pilihan c") {
        const { cleanText, markedCorrect } = stripInlineCorrectMarker(val);
        current.optionC = cleanText;
        if (markedCorrect) current.correctAnswer = "C";
      } else if (key === "kunci" || key === "kunci jawaban" || key === "jawaban benar" || key === "jawaban" || key === "correct") {
        current.correctAnswer = val;
      } else if (key === "feedback a" || key === "umpan balik a") current.feedbackA = val;
      else if (key === "feedback b" || key === "umpan balik b") current.feedbackB = val;
      else if (key === "feedback c" || key === "umpan balik c") current.feedbackC = val;
      else if (key === "feedback benar" || key === "umpan balik benar") current.feedbackCorrect = val;
      else if (key === "feedback salah" || key === "umpan balik salah" || key === "feedback" || key === "umpan balik" || key === "penjelasan") {
        current.feedbackWrong = val;
      }
      continue;
    }

    // Multiple choice option lines: e.g. "*A. ...", "A. ...", "a) ...", "B) ..."
    const optMatch = line.match(/^(\*?\s*[ABCabc])\s*[.)\-:]\s*(.+)$/);
    if (optMatch && current) {
      const letterRaw = optMatch[1].replace("*", "").trim().toUpperCase();
      const hasLeadingStar = optMatch[1].includes("*");
      const { cleanText, markedCorrect } = stripInlineCorrectMarker(optMatch[2]);
      const isMarked = hasLeadingStar || markedCorrect;

      if (letterRaw === "A") {
        current.optionA = cleanText;
        if (isMarked) current.correctAnswer = "A";
      } else if (letterRaw === "B") {
        current.optionB = cleanText;
        if (isMarked) current.correctAnswer = "B";
      } else if (letterRaw === "C") {
        current.optionC = cleanText;
        if (isMarked) current.correctAnswer = "C";
      }
      continue;
    }

    // Continuation line for active question or dialogue
    if (current) {
      if (current.question && !current.optionA) {
        current.question = `${current.question} ${line}`.trim();
      } else if (current.dialogueText && !current.optionA) {
        current.dialogueText = `${current.dialogueText} ${line}`.trim();
      }
    }
  }

  commitCurrent();
  return drafts;
}

function resolveCorrectLetter(
  rawCorrect: string | undefined,
  optionsTexts: { id: "a" | "b" | "c"; text: string }[]
): { letter: "a" | "b" | "c"; wasDefaulted: boolean } {
  const val = (rawCorrect || "").trim();
  if (!val) return { letter: "a", wasDefaulted: true };

  const upper = val.toUpperCase();
  if (upper === "A" || upper === "OPSI A" || upper === "PILIHAN A" || upper === "1") {
    return { letter: "a", wasDefaulted: false };
  }
  if (upper === "B" || upper === "OPSI B" || upper === "PILIHAN B" || upper === "2") {
    return { letter: "b", wasDefaulted: false };
  }
  if (upper === "C" || upper === "OPSI C" || upper === "PILIHAN C" || upper === "3") {
    return { letter: "c", wasDefaulted: false };
  }

  const leadingLetter = upper.match(/^([ABC])(?:[.)\s:-]|$)/);
  if (leadingLetter) {
    return { letter: leadingLetter[1].toLowerCase() as "a" | "b" | "c", wasDefaulted: false };
  }

  const lowerVal = val.toLowerCase();
  const matchedText = optionsTexts.find(
    (o) => o.text.toLowerCase() === lowerVal || o.text.toLowerCase().includes(lowerVal)
  );
  if (matchedText) {
    return { letter: matchedText.id, wasDefaulted: false };
  }

  return { letter: "a", wasDefaulted: true };
}

function draftsToScenarios(drafts: RawDraftQuestion[]): {
  scenarios: Scenario[];
  warnings: string[];
  totalDetected: number;
  truncatedCount: number;
} {
  const warnings: string[] = [];
  const totalDetected = drafts.length;

  const limitedDrafts = drafts.slice(0, MAX_FIRESTORE_SCENARIOS);
  const truncatedCount = Math.max(0, totalDetected - limitedDrafts.length);
  if (truncatedCount > 0) {
    warnings.push(
      `File memuat ${totalDetected} soal. Sesuai batas Cloud Firestore (maks. ${MAX_FIRESTORE_SCENARIOS} skenario), ${MAX_FIRESTORE_SCENARIOS} soal pertama akan digunakan.`
    );
  }

  // Track which standard NPC slots are already taken so all scenarios cleanly occupy map slots without colliding
  const usedNpcKeys = new Set<string>();
  const mapCounts: Record<string, number> = { school: 0, class: 0, street: 0, home: 0 };

  const allocateSlot = (requestedMapId?: string, requestedNpcId?: string): StandardSlot => {
    if (requestedNpcId) {
      const exactSlot = STANDARD_SLOTS.find((s) => s.npcId === requestedNpcId.trim());
      if (exactSlot && !usedNpcKeys.has(exactSlot.npcId)) {
        usedNpcKeys.add(exactSlot.npcId);
        mapCounts[exactSlot.mapId] = (mapCounts[exactSlot.mapId] || 0) + 1;
        return exactSlot;
      }
    }

    const normalizedMap = normalizeMapId(requestedMapId);
    if (normalizedMap) {
      const candidate = STANDARD_SLOTS.find(
        (s) => s.mapId === normalizedMap && !usedNpcKeys.has(s.npcId)
      );
      if (candidate) {
        usedNpcKeys.add(candidate.npcId);
        mapCounts[candidate.mapId] = (mapCounts[candidate.mapId] || 0) + 1;
        return candidate;
      }

      // Overflow slot 6..N for requested map
      const idx = (mapCounts[normalizedMap] || 5) + 1;
      mapCounts[normalizedMap] = idx;
      const overflowId = `${normalizedMap}-npc-${idx}`;
      usedNpcKeys.add(overflowId);
      return {
        mapId: normalizedMap,
        npcId: overflowId,
        npcName: `Karakter ${normalizedMap.toUpperCase()} #${idx}`,
        npcType: "stranger",
      };
    }

    // Auto-assign to next free standard slot across the 4 maps
    const nextFree = STANDARD_SLOTS.find((s) => !usedNpcKeys.has(s.npcId));
    if (nextFree) {
      usedNpcKeys.add(nextFree.npcId);
      mapCounts[nextFree.mapId] = (mapCounts[nextFree.mapId] || 0) + 1;
      return nextFree;
    }

    // Overflow beyond 20 up to 30
    const mapOrder: ("school" | "class" | "street" | "home")[] = ["school", "class", "street", "home"];
    const targetMap = mapOrder[(usedNpcKeys.size - 20) % mapOrder.length];
    const idx = (mapCounts[targetMap] || 5) + 1;
    mapCounts[targetMap] = idx;
    const overflowId = `${targetMap}-npc-${idx}`;
    usedNpcKeys.add(overflowId);
    return {
      mapId: targetMap,
      npcId: overflowId,
      npcName: `Karakter Tambahan #${usedNpcKeys.size}`,
      npcType: "stranger",
    };
  };

  let missingOptionsCount = 0;
  let defaultedAnswerCount = 0;

  const scenarios: Scenario[] = limitedDrafts.map((draft, index) => {
    const slot = allocateSlot(draft.mapId, draft.npcId);

    const rawDialogue = (draft.dialogueText || "").trim();
    const rawQuestion = (draft.question || "").trim();
    const dialogueText = (rawDialogue || rawQuestion || `Situasi Keselamatan #${index + 1}`).slice(0, 1000);
    const question = (rawQuestion || "Apa langkah yang paling tepat dan aman?").slice(0, 500);

    const optAText = (draft.optionA || "").trim();
    const optBText = (draft.optionB || "").trim();
    const optCText = (draft.optionC || "").trim();

    const rawOpts: { id: "a" | "b" | "c"; text: string; customFeedback?: string }[] = [];
    if (optAText) rawOpts.push({ id: "a", text: optAText, customFeedback: draft.feedbackA });
    if (optBText) rawOpts.push({ id: "b", text: optBText, customFeedback: draft.feedbackB });
    if (optCText) rawOpts.push({ id: "c", text: optCText, customFeedback: draft.feedbackC });

    if (rawOpts.length < 2) {
      missingOptionsCount++;
      if (!optAText) {
        rawOpts.push({
          id: "a",
          text: "Menolak dengan tegas dan segera melapor kepada guru atau orang tua",
          customFeedback: draft.feedbackA,
        });
      }
      if (!optBText) {
        rawOpts.push({
          id: "b",
          text: "Diam saja dan mengikuti ajakan tersebut",
          customFeedback: draft.feedbackB,
        });
      }
    }

    const { letter: correctLetter, wasDefaulted } = resolveCorrectLetter(draft.correctAnswer, rawOpts);
    const hasExactLetter = rawOpts.some((o) => o.id === correctLetter);
    const effectiveCorrectId = hasExactLetter ? correctLetter : rawOpts[0].id;
    if (wasDefaulted || !hasExactLetter) defaultedAnswerCount++;

    const options: Option[] = rawOpts.map((item) => {
      const isCorrect = item.id === effectiveCorrectId;
      const fallbackFeedback = isCorrect
        ? (draft.feedbackCorrect || "").trim() ||
          "Hebat sekali, [Nama Anak]! Pilihanmu tepat dan menjaga dirimu tetap aman."
        : (draft.feedbackWrong || "").trim() ||
          "Hati-hati ya, pilihan itu kurang aman. Yuk selalu utamakan keselamatan dan lapor orang dewasa tepercaya!";
      const finalFeedback = (item.customFeedback || "").trim() || fallbackFeedback;

      return {
        id: item.id,
        text: item.text.slice(0, 300),
        isCorrect,
        feedback: finalFeedback.slice(0, 500),
      };
    });

    const npcName = (draft.npcName || "").trim().slice(0, 80) || slot.npcName;
    const npcType = normalizeNpcType(draft.npcType) || slot.npcType;
    const category = normalizeCategory(draft.category);
    const calloutText = (draft.calloutText || "").trim().slice(0, 220);

    const scenarioObj: Scenario = {
      id: `sc-upload-${index + 1}-${slot.npcId}`,
      npcId: slot.npcId,
      npcName,
      npcType,
      mapId: slot.mapId,
      dialogueText,
      question,
      options,
      category,
    };

    if (calloutText) {
      scenarioObj.calloutText = calloutText;
    } else {
      scenarioObj.calloutText = `Halo [Nama Anak]! Sini sebentar yuk, ada situasi di ${
        slot.mapId === "school"
          ? "halaman sekolah"
          : slot.mapId === "class"
          ? "ruang kelas"
          : slot.mapId === "street"
          ? "jalan pulang"
          : "rumah"
      }!`;
    }

    return scenarioObj;
  });

  if (missingOptionsCount > 0) {
    warnings.push(
      `${missingOptionsCount} soal tidak memiliki minimal 2 opsi lengkap sehingga dilengkapi dengan opsi aman bawaan.`
    );
  }
  if (defaultedAnswerCount > 0) {
    warnings.push(
      `${defaultedAnswerCount} soal belum mencantumkan kunci jawaban yang jelas sehingga sementara diatur ke Opsi A (dapat diubah di editor).`
    );
  }

  return { scenarios, warnings, totalDetected, truncatedCount };
}

function parseHtmlDocumentToDrafts(html: string): RawDraftQuestion[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 1. Prioritize structured tables (common in Word question banks)
  const tables = Array.from(doc.querySelectorAll("table"));
  const allTableDrafts: RawDraftQuestion[] = [];
  for (const table of tables) {
    const trList = Array.from(table.querySelectorAll("tr"));
    const rows = trList
      .map((tr) =>
        Array.from(tr.querySelectorAll("th, td")).map((cell) =>
          (cell.textContent || "").replace(/\s+/g, " ").trim()
        )
      )
      .filter((r) => r.some((cell) => cell.length > 0));
    const parsedFromTable = parseTabularRowsToDrafts(rows);
    allTableDrafts.push(...parsedFromTable);
  }

  if (allTableDrafts.length > 0) {
    return allTableDrafts;
  }

  // 2. Fall back to structured paragraphs / numbered lists in Word
  // Preserve ordered list numbering from <ol><li> elements produced by mammoth
  const lines: string[] = [];
  const walkBlocks = (root: Element) => {
    const children = Array.from(root.children);
    if (children.length === 0) {
      const txt = (root.textContent || "").trim();
      if (txt) lines.push(txt);
      return;
    }
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      if (tag === "ol") {
        const items = Array.from(child.children).filter((c) => c.tagName.toLowerCase() === "li");
        items.forEach((li, idx) => {
          const liText = (li.textContent || "").replace(/\s+/g, " ").trim();
          if (liText) {
            // Check if nested sub-list or plain question line
            if (/^\d+[.)]/.test(liText)) lines.push(liText);
            else lines.push(`${idx + 1}. ${liText}`);
          }
        });
      } else if (tag === "ul") {
        const items = Array.from(child.children).filter((c) => c.tagName.toLowerCase() === "li");
        items.forEach((li) => {
          const liText = (li.textContent || "").replace(/\s+/g, " ").trim();
          if (liText) lines.push(liText);
        });
      } else if (tag === "p" || tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "div") {
        if (child.querySelector("p, table, ol, ul")) {
          walkBlocks(child);
        } else {
          // Handle <br> splits inside a single paragraph
          const clone = child.cloneNode(true) as HTMLElement;
          clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
          const splitLines = (clone.textContent || "")
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          lines.push(...splitLines);
        }
      } else {
        walkBlocks(child);
      }
    }
  };

  walkBlocks(doc.body);
  return parseLinesToDrafts(lines);
}

function hasBinaryOle2Header(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false;
  const bytes = new Uint8Array(buffer.slice(0, 8));
  return (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1
  );
}

export async function parseScenarioUploadFile(file: File): Promise<ParsedScenarioUploadResult> {
  const fileName = file.name.toLowerCase();
  const isCsv = fileName.endsWith(".csv") || file.type === "text/csv";
  const isDocx =
    fileName.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isDoc = fileName.endsWith(".doc") || file.type === "application/msword";

  if (!isCsv && !isDocx && !isDoc) {
    throw new Error(
      "Format file belum didukung. Harap unggah file Word (.docx / .doc) atau file CSV (.csv)."
    );
  }

  let drafts: RawDraftQuestion[] = [];
  let sourceFormat: "csv" | "docx" | "doc" = isCsv ? "csv" : isDocx ? "docx" : "doc";

  if (isCsv) {
    const text = await file.text();
    const rows = parseCsvRows(text);
    drafts = parseTabularRowsToDrafts(rows);
    if (drafts.length === 0) {
      throw new Error(
        "Tidak ada soal yang dapat dibaca dari file CSV. Pastikan baris pertama berisi header seperti: Peta;Kategori;Dialog;Pertanyaan;Opsi A;Opsi B;Opsi C;Jawaban Benar"
      );
    }
  } else if (isDocx) {
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    drafts = parseHtmlDocumentToDrafts(html);

    if (drafts.length === 0) {
      const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });
      drafts = parseLinesToDrafts(rawText.split(/\r?\n/));
    }

    if (drafts.length === 0) {
      throw new Error(
        "Belum ditemukan daftar soal pada file Word (.docx). Gunakan format Tabel Soal atau daftar bernomor (1. Pertanyaan, A/B/C, Kunci: A)."
      );
    }
  } else {
    // .doc: supports HTML/Word-HTML/XML .doc (such as our Word template or Web-saved .doc); detects legacy binary OLE2 .doc
    const arrayBuffer = await file.arrayBuffer();
    if (hasBinaryOle2Header(arrayBuffer)) {
      throw new Error(
        "File .doc format biner lama (Word 97-2003) tidak dapat dibaca langsung di browser. Silakan buka di Microsoft Word lalu pilih Save As > Word Document (.docx) atau CSV (.csv)."
      );
    }
    const decodedText = new TextDecoder("utf-8").decode(arrayBuffer);
    if (/<(html|table|p|body|tr|w:document)/i.test(decodedText)) {
      drafts = parseHtmlDocumentToDrafts(decodedText);
    }
    if (drafts.length === 0) {
      drafts = parseLinesToDrafts(decodedText.split(/\r?\n/));
    }
    if (drafts.length === 0) {
      throw new Error(
        "Isi file .doc tidak dapat dikenali sebagai daftar soal. Gunakan Template Word yang tersedia atau simpan ulang sebagai .docx / .csv."
      );
    }
  }

  const converted = draftsToScenarios(drafts);
  if (converted.scenarios.length === 0) {
    throw new Error("Tidak ada skenario valid yang terbentuk dari file.");
  }

  return {
    scenarios: converted.scenarios,
    warnings: converted.warnings,
    sourceFormat,
    totalDetected: converted.totalDetected,
    truncatedCount: converted.truncatedCount,
  };
}

const SCENARIO_COLUMNS = [
  "Peta",
  "Kategori",
  "Karakter",
  "Tipe",
  "Sapaan",
  "Dialog",
  "Pertanyaan",
  "Opsi A",
  "Opsi B",
  "Opsi C",
  "Jawaban Benar",
  "Feedback A",
  "Feedback B",
  "Feedback C",
] as const;

const TEMPLATE_SAMPLE_ROWS: string[][] = [
  [
    "school",
    "Waspada Orang Asing (Stranger Danger)",
    "Tamu di Gerbang",
    "stranger",
    "Halo [Nama Anak]! Sini sebentar Nak, ada titipan dari ayahmu.",
    "Hei [Nama Anak], ayahmu minta aku menjemputmu sekarang. Jangan bilang guru atau satpam ya!",
    "Apa yang harus kamu lakukan?",
    "Menolak tegas, tetap di dalam sekolah, dan lapor guru atau satpam",
    "Langsung ikut keluar gerbang bersama orang tersebut",
    "Menunggu sendirian di luar gerbang sekolah",
    "A",
    "Hebat sekali, [Nama Anak]! Selalu konfirmasi ke guru atau satpam sebelum ikut siapapun.",
    "Waspada! Kalimat jangan bilang guru atau satpam adalah tanda bahaya.",
    "Menunggu sendirian di luar gerbang tetap berisiko. Tetaplah di area sekolah.",
  ],
  [
    "class",
    "Anti-Perundungan (Bullying)",
    "Teman Sebangku",
    "peer",
    "Hei [Nama Anak]! Sini lihat pesan lucu tentang teman kita!",
    "Ayo kita sebarkan foto memalukan teman sekelas ke grup chat biar seru!",
    "Bagaimana sikapmu?",
    "Ikut menyebarkan supaya dianggap kompak oleh teman",
    "Menolak dengan tegas dan mengingatkan bahwa menyebar foto memalukan itu menyakiti teman",
    "Tertawa saja dan diam saat teman lain mulai menyebarkannya",
    "B",
    "Menyebar foto tanpa izin termasuk perundungan digital yang menyakitkan.",
    "Bagus sekali, [Nama Anak]! Kamu berani menolak tindakan perundungan dan melindungi temanmu.",
    "Diam saja membiarkan perundungan terus terjadi. Beranilah menolak atau melapor ke guru.",
  ],
  [
    "home",
    "Keamanan Digital (Cyber Safety)",
    "Tablet di Meja",
    "stranger",
    "Ting! Ada pesan hadiah koin game gratis untuk [Nama Anak]!",
    "Selamat! Kirimkan alamat rumah dan foto kartu pelajarmu untuk klaim 5000 koin game gratis!",
    "Apa keputusan yang aman?",
    "Memasukkan alamat rumah supaya hadiah cepat datang",
    "Membalas pesan dan menanyakan syarat tambahan",
    "Menutup pesan, tidak membagikan data pribadi, dan melapor ke orang tua",
    "C",
    "Berbahaya! Jangan pernah membagikan alamat rumah atau foto identitas di internet.",
    "Akun penipu sering memakai iming-iming hadiah. Jangan lanjutkan percakapan.",
    "Tepat sekali, [Nama Anak]! Melindungi data pribadi dan melapor ke orang tua adalah langkah paling aman.",
  ],
];

function scenarioToExportRow(sc: Scenario): string[] {
  const opts = Array.isArray(sc.options) ? sc.options : [];
  const optA = opts.find((o) => o.id?.toLowerCase() === "a") || opts[0];
  const optB = opts.find((o) => o.id?.toLowerCase() === "b") || opts[1];
  const optC = opts.find((o) => o.id?.toLowerCase() === "c") || opts[2];

  const correctLetter = optB?.isCorrect ? "B" : optC?.isCorrect ? "C" : "A";

  return [
    sc.mapId || "school",
    sc.category || "Keselamatan Anak",
    sc.npcName || "",
    sc.npcType || "stranger",
    sc.calloutText || "",
    sc.dialogueText || "",
    sc.question || sc.questionText || "",
    optA?.text || "",
    optB?.text || "",
    optC?.text || "",
    correctLetter,
    optA?.feedback || optA?.feedbackText || "",
    optB?.feedback || optB?.feedbackText || "",
    optC?.feedback || optC?.feedbackText || "",
  ];
}

function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadCsvRows(rows: string[][], filename: string): void {
  const header = SCENARIO_COLUMNS.join(";");
  const formattedRows = rows.map((cols) =>
    cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")
  );
  const csvContent = `\uFEFF${header}\r\n${formattedRows.join("\r\n")}\r\n`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(blob, filename);
}

function escapeHtmlText(raw: string): string {
  return String(raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadWordRows(
  rows: string[][],
  filename: string,
  title: string,
  noteHtml: string
): void {
  const headerCells = ["No", ...SCENARIO_COLUMNS]
    .map((col) => `<th>${escapeHtmlText(col)}</th>`)
    .join("");

  const bodyRows = rows
    .map((cols, idx) => {
      const dataCells = cols.map((c) => `<td>${escapeHtmlText(c)}</td>`).join("");
      return `<tr><td>${idx + 1}</td>${dataCells}</tr>`;
    })
    .join("\n      ");

  const htmlDoc = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="id">
<head>
<meta charset="utf-8" />
<title>${escapeHtmlText(title)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1e293b; }
  h1 { color: #4338ca; font-size: 15pt; margin-bottom: 4pt; }
  p.note { font-size: 9.5pt; color: #475569; margin-bottom: 12pt; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #94a3b8; padding: 5px 7px; vertical-align: top; text-align: left; font-size: 9.5pt; }
  th { background-color: #e0e7ff; color: #1e1b4b; font-weight: bold; }
</style>
</head>
<body>
  <h1>${escapeHtmlText(title)}</h1>
  <p class="note">${noteHtml}</p>
  <table>
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob(["\uFEFF", htmlDoc], { type: "application/msword;charset=utf-8;" });
  triggerFileDownload(blob, filename);
}

export function downloadScenarioCsvTemplate(): void {
  downloadCsvRows(TEMPLATE_SAMPLE_ROWS, "Template_Upload_Soal_SafeStep.csv");
}

export function downloadScenarioWordTemplate(): void {
  downloadWordRows(
    TEMPLATE_SAMPLE_ROWS,
    "Template_Upload_Soal_SafeStep.doc",
    "Template Daftar Soal SafeStep (Format Tabel Word)",
    "Petunjuk Guru: Edit atau tambahkan baris soal pada tabel di bawah ini (maksimal 30 soal). Kolom <b>Peta</b> dapat diisi <i>school</i>, <i>class</i>, <i>street</i>, atau <i>home</i> (boleh dikosongkan untuk pembagian otomatis). Simpan sebagai <b>.docx</b> atau <b>.doc</b> lalu unggah lewat tombol <b>Upload Soal</b>."
  );
}

export function downloadExistingScenariosCsv(scenarios: Scenario[]): void {
  const rows = scenarios.map(scenarioToExportRow);
  const dateSuffix = new Date().toISOString().slice(0, 10);
  downloadCsvRows(rows, `Daftar_Soal_Lengkap_SafeStep_${dateSuffix}.csv`);
}

export function downloadExistingScenariosWord(scenarios: Scenario[]): void {
  const rows = scenarios.map(scenarioToExportRow);
  const dateSuffix = new Date().toISOString().slice(0, 10);
  downloadWordRows(
    rows,
    `Daftar_Soal_Lengkap_SafeStep_${dateSuffix}.doc`,
    `Daftar Lengkap ${scenarios.length} Soal Misi SafeStep`,
    "Daftar lengkap pertanyaan, dialog, sapaan, opsi jawaban (A/B/C), kunci jawaban, dan feedback yang sedang aktif di aplikasi SafeStep. Bapak/Ibu Guru dapat mengedit tabel ini lalu mengunggahnya kembali melalui tombol <b>Upload Soal (.docx/.csv)</b>."
  );
}
