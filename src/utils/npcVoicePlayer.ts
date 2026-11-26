/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getDecodingAudioContext,
  getSoundEnabled,
  getVoicePlaybackBus,
  setMusicDucked,
  warmUpVoiceGraph,
} from "./soundEffects";
import {
  playVoice,
  preloadAudio,
  registerExternalVoiceStopper,
  stopLocalVoiceAudio,
} from "./audioManager";
import { isStandaloneHtmlMode } from "../firebase";
import { DEFAULT_SCENARIOS } from "../data/scenarios";
import type { Scenario } from "../types";
import {
  checkApiBackendAvailable,
  hasVoiceServerOrigin,
  isBackendKnownUnavailable,
  isServerGeminiTtsAvailable,
  markServerGeminiTtsUnavailable,
  resetBackendAvailabilityCache,
  resolveApiUrl,
} from "./serverSync";
import {
  getOfflineNpcDialogAudioUrl,
  getOfflineTeacherAudioUrl,
} from "./offlineVoicePack";

function isOfflineOrStandaloneEnvironment(): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (isStandaloneHtmlMode && !hasVoiceServerOrigin()) return true;
  if (isBackendKnownUnavailable()) return true;
  return false;
}

function matchesTemplateWithPlayerName(templateText: string, spokenText: string): boolean {
  const cleanSpoken = spokenText.trim().toLowerCase();
  const rawDefault = (templateText || "").trim().toLowerCase();
  if (!cleanSpoken || !rawDefault) return false;

  const staticSegments = rawDefault
    .split("[nama anak]")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (staticSegments.length === 0) return false;

  let cursor = 0;
  for (const segment of staticSegments) {
    const idx = cleanSpoken.indexOf(segment, cursor);
    if (idx === -1) return false;
    cursor = idx + segment.length;
  }
  return true;
}

function matchesDefaultScenarioDialogue(
  scenarioId: string | undefined,
  npcId: string,
  spokenText: string
): boolean {
  const matchedDefault =
    (scenarioId && DEFAULT_SCENARIOS.find((s) => s.id === scenarioId)) ||
    DEFAULT_SCENARIOS.find((s) => s.npcId === npcId);
  if (!matchedDefault) return false;
  return matchesTemplateWithPlayerName(matchedDefault.dialogueText, spokenText);
}

function matchesDefaultScenarioFeedback(
  scenarioId: string | undefined,
  spokenText: string
): boolean {
  const matchedDefault = scenarioId
    ? DEFAULT_SCENARIOS.find((s) => s.id === scenarioId)
    : undefined;
  if (!matchedDefault) return false;
  return (matchedDefault.options || []).some((opt) =>
    matchesTemplateWithPlayerName(opt.feedback, spokenText)
  );
}

// Persistent IndexedDB voice cache so generated Gemini TTS teacher & NPC voices
// survive page reloads, offline sessions, and standalone HTML reopens.
const VOICE_IDB_NAME = "safestep_voice_cache_v1";
const VOICE_IDB_STORE = "voices";
let voiceIdbPromise: Promise<IDBDatabase | null> | null = null;

function openVoiceCacheDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  if (voiceIdbPromise) return voiceIdbPromise;

  voiceIdbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(VOICE_IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(VOICE_IDB_STORE)) {
          db.createObjectStore(VOICE_IDB_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return voiceIdbPromise;
}

async function readVoiceFromIdb(
  key: string
): Promise<{ samples: Float32Array; sampleRate: number } | null> {
  const db = await openVoiceCacheDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VOICE_IDB_STORE, "readonly");
      const store = tx.objectStore(VOICE_IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const rec = req.result as
          | { key: string; pcmBuffer?: ArrayBuffer; sampleRate?: number }
          | undefined;
        if (rec?.pcmBuffer && rec.pcmBuffer.byteLength > 0) {
          resolve({
            samples: new Float32Array(rec.pcmBuffer),
            sampleRate: rec.sampleRate || 24000,
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function hasVoiceInIdb(key: string): Promise<boolean> {
  const db = await openVoiceCacheDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(VOICE_IDB_STORE, "readonly");
      const store = tx.objectStore(VOICE_IDB_STORE);
      const req = store.count(key);
      req.onsuccess = () => resolve((req.result || 0) > 0);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function writeVoiceToIdb(
  key: string,
  samples: Float32Array,
  sampleRate: number
): Promise<void> {
  const db = await openVoiceCacheDb();
  if (!db || samples.length === 0) return;
  try {
    const pcmCopy = samples.slice().buffer;
    const tx = db.transaction(VOICE_IDB_STORE, "readwrite");
    const store = tx.objectStore(VOICE_IDB_STORE);
    store.put({
      key,
      pcmBuffer: pcmCopy,
      sampleRate,
      savedAt: Date.now(),
    });
  } catch {
    // Ignore storage quota or private-browsing IndexedDB errors
  }
}

interface PlayNpcVoiceOptions {
  npcId: string;
  scenarioId?: string;
  text: string;
  mode: "callout" | "dialog";
  initialDelaySec?: number;
  keepMusicDuckedOnEnd?: boolean;
  forceRestart?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
}

export type TeacherPersonaId = "ibu-zephyr" | "pak-puck" | "ibu-kore" | "pak-charon";

export interface TeacherPersonaInfo {
  teacherId: TeacherPersonaId;
  label: "Ibu Guru" | "Pak Guru";
  gender: "female" | "male";
}

interface PlayTeacherFeedbackVoiceOptions {
  scenarioId: string;
  text: string;
  isCorrect: boolean;
  initialDelaySec?: number;
  keepMusicDuckedOnEnd?: boolean;
  forceRestart?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
}

interface PlayOptionVoiceOptions {
  scenarioId: string;
  text: string;
  initialDelaySec?: number;
  keepMusicDuckedOnEnd?: boolean;
  forceRestart?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
}

interface VoiceRequestPayload {
  role: "npc" | "teacher" | "option";
  npcId?: string;
  mode?: "callout" | "dialog";
  teacherId?: TeacherPersonaId;
  isCorrect?: boolean;
  text: string;
  priority?: "high" | "preload";
}

export interface MapVoiceBufferPoolOptions {
  mapId: string;
  npcs: Array<{ id: string; position: { x: number; y: number } }>;
  scenarios: Array<{
    id: string;
    npcId: string;
    mapId: string;
    dialogueText: string;
    options: Array<{ feedback: string; isCorrect: boolean }>;
  }>;
  completedScenarioIds: string[];
  playerName?: string;
  spawnPosition: { x: number; y: number };
  resolveCalloutText: (npcId: string) => string;
}

interface DecodedVoiceChunk {
  samples: Float32Array;
  sampleRate: number;
}

type ClientStreamEvent =
  | { type: "chunk"; chunk: DecodedVoiceChunk }
  | { type: "done" }
  | { type: "fallback" };

interface ClientVoiceStream {
  priority: "high" | "preload";
  chunks: DecodedVoiceChunk[];
  done: boolean;
  failed: boolean;
  completionPromise: Promise<boolean>;
  subscribers: Set<(evt: ClientStreamEvent) => void>;
}

const TEACHER_PERSONA_ROTATION: TeacherPersonaInfo[] = [
  { teacherId: "ibu-zephyr", label: "Ibu Guru", gender: "female" },
  { teacherId: "pak-puck", label: "Pak Guru", gender: "male" },
  { teacherId: "ibu-kore", label: "Ibu Guru", gender: "female" },
  { teacherId: "pak-charon", label: "Pak Guru", gender: "male" },
];

/**
 * Deterministically assigns a varied friendly elementary school teacher (alternating Ibu Guru & Pak Guru)
 * per scenario so students experience both cheerful female and male teachers across missions.
 */
export function getTeacherPersonaForScenario(scenarioId: string): TeacherPersonaInfo {
  const trailingNumMatch = scenarioId.match(/(\d+)$/);
  let hash = 0;
  for (let i = 0; i < scenarioId.length; i++) {
    hash = (hash * 31 + scenarioId.charCodeAt(i)) >>> 0;
  }

  if (trailingNumMatch) {
    const num = parseInt(trailingNumMatch[1], 10);
    const mapOffset = scenarioId.includes("class")
      ? 1
      : scenarioId.includes("street")
        ? 2
        : scenarioId.includes("home")
          ? 3
          : 0;
    const idx = (num - 1 + mapOffset) % TEACHER_PERSONA_ROTATION.length;
    return TEACHER_PERSONA_ROTATION[Math.abs(idx)];
  }

  return TEACHER_PERSONA_ROTATION[hash % TEACHER_PERSONA_ROTATION.length];
}

function buildVoiceCacheKey(payload: VoiceRequestPayload): string {
  const cleanText = payload.text.trim();
  if (payload.role === "teacher") {
    return `teacher|${payload.teacherId || "ibu-zephyr"}|${payload.isCorrect ? "correct" : "retry"}|${cleanText}`;
  }
  if (payload.role === "option") {
    return `option|${payload.teacherId || "ibu-zephyr"}|${cleanText}`;
  }
  return `npc|${payload.npcId || "stranger"}|${payload.mode || "callout"}|${cleanText}`;
}

function cleanFormattedDialogue(rawText: string, playerName: string): string {
  if (!rawText) return "";
  const formatted = rawText.replaceAll("[Nama Anak]", playerName).trim();
  if (
    (formatted.startsWith("'") && formatted.endsWith("'")) ||
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("“") && formatted.endsWith("”"))
  ) {
    return formatted.slice(1, -1).trim();
  }
  return formatted;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function pcm16BytesToFloat32(bytes: Uint8Array, byteOffset = 0, byteLength?: number): Float32Array {
  const availableBytes =
    byteLength !== undefined
      ? Math.min(byteLength, bytes.byteLength - byteOffset)
      : bytes.byteLength - byteOffset;
  const sampleCount = Math.floor(Math.max(0, availableBytes) / 2);
  const floatSamples = new Float32Array(sampleCount);
  const view = new DataView(bytes.buffer, bytes.byteOffset + byteOffset, sampleCount * 2);

  for (let i = 0; i < sampleCount; i++) {
    floatSamples[i] = view.getInt16(i * 2, true) / 32768;
  }
  return floatSamples;
}

function decodeWavBytesToPcm(bytes: Uint8Array): DecodedVoiceChunk | null {
  if (bytes.byteLength < 44) return null;
  const headerStr = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (headerStr !== "RIFF") {
    return {
      samples: pcm16BytesToFloat32(bytes),
      sampleRate: 24000,
    };
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let sampleRate = 24000;
  let audioFormat = 1;
  let bitsPerSample = 16;
  let offset = 12;

  while (offset + 8 <= bytes.byteLength) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataStart = offset + 8;

    if (chunkId === "fmt " && chunkDataStart + 16 <= bytes.byteLength) {
      audioFormat = view.getUint16(chunkDataStart, true);
      const parsedRate = view.getUint32(chunkDataStart + 4, true);
      bitsPerSample = view.getUint16(chunkDataStart + 14, true);
      if (parsedRate >= 8000 && parsedRate <= 96000) {
        sampleRate = parsedRate;
      }
    } else if (chunkId === "data") {
      if (audioFormat !== 1 || bitsPerSample !== 16) {
        return null; // Let native decodeAudioData handle non-16-bit-PCM formats
      }
      const safeSize = Math.min(chunkSize, bytes.byteLength - chunkDataStart);
      return {
        samples: pcm16BytesToFloat32(bytes, chunkDataStart, safeSize),
        sampleRate,
      };
    }

    offset = chunkDataStart + chunkSize + (chunkSize % 2);
  }

  return {
    samples: pcm16BytesToFloat32(bytes, 44),
    sampleRate,
  };
}

function applyMicroFade(samples: Float32Array): void {
  const totalSamples = samples.length;
  const fadeSamples = Math.min(48, Math.floor(totalSamples * 0.05));
  for (let i = 0; i < fadeSamples; i++) {
    const gain = i / fadeSamples;
    samples[i] *= gain;
    samples[totalSamples - 1 - i] *= gain;
  }
}

/**
 * Dedicated In-Memory Web Audio `AudioBuffer` Pool.
 * Pre-fetches and pre-decodes NPC & Teacher voice assets into native `AudioBuffer` instances
 * as soon as a game map loads so triggering audio for the first time has 0ms decode/allocation latency.
 */
class VoiceAudioBufferPool {
  private readonly maxBuffers = 220;
  private readonly decodedBuffers = new Map<string, AudioBuffer>();
  private readonly fallbackRawPcm = new Map<string, DecodedVoiceChunk>();
  private preloadQueue: VoiceRequestPayload[] = [];
  private queuedKeys = new Set<string>();
  private isDraining = false;
  private mapEpoch = 0;

  public has(key: string): boolean {
    return this.decodedBuffers.has(key) || this.fallbackRawPcm.has(key);
  }

  public getAudioBuffer(key: string, ctx: AudioContext): AudioBuffer | null {
    const existing = this.decodedBuffers.get(key);
    if (existing) {
      // Refresh LRU position
      this.decodedBuffers.delete(key);
      this.decodedBuffers.set(key, existing);
      return existing;
    }

    const raw = this.fallbackRawPcm.get(key);
    if (raw && raw.samples.length > 0) {
      try {
        const audioBuf = ctx.createBuffer(1, raw.samples.length, raw.sampleRate);
        audioBuf.getChannelData(0).set(raw.samples);
        this.fallbackRawPcm.delete(key);
        this.insertDecodedBuffer(key, audioBuf);
        return audioBuf;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Acquires a ready-to-start `AudioBufferSourceNode` bound to a pre-decoded `AudioBuffer` in the pool.
   * Zero decoding, zero Float32 copying, and zero allocation spikes at playback time.
   */
  public acquireSource(
    key: string,
    ctx: AudioContext,
    destination: AudioNode
  ): AudioBufferSourceNode | null {
    const audioBuf = this.getAudioBuffer(key, ctx);
    if (!audioBuf) return null;

    try {
      const src = ctx.createBufferSource();
      src.buffer = audioBuf;
      src.connect(destination);
      return src;
    } catch {
      return null;
    }
  }

  private insertDecodedBuffer(key: string, buffer: AudioBuffer): void {
    if (this.decodedBuffers.has(key)) {
      this.decodedBuffers.delete(key);
    } else if (this.decodedBuffers.size >= this.maxBuffers) {
      const oldestKey = this.decodedBuffers.keys().next().value;
      if (oldestKey) this.decodedBuffers.delete(oldestKey);
    }
    this.decodedBuffers.set(key, buffer);
    this.queuedKeys.delete(key);
  }

  public storeFromChunks(key: string, chunks: DecodedVoiceChunk[]): AudioBuffer | null {
    if (chunks.length === 0) return null;
    const sampleRate = chunks[0].sampleRate || 24000;
    let totalSamples = 0;
    for (const c of chunks) {
      totalSamples += c.samples.length;
    }
    if (totalSamples === 0) return null;

    const merged = new Float32Array(totalSamples);
    let writeOffset = 0;
    for (const c of chunks) {
      merged.set(c.samples, writeOffset);
      writeOffset += c.samples.length;
    }
    applyMicroFade(merged);

    const ctx = getDecodingAudioContext();
    void writeVoiceToIdb(key, merged, sampleRate);
    if (ctx) {
      try {
        const audioBuf = ctx.createBuffer(1, totalSamples, sampleRate);
        audioBuf.getChannelData(0).set(merged);
        this.insertDecodedBuffer(key, audioBuf);
        return audioBuf;
      } catch {
        // Fall through to raw PCM backup
      }
    }

    this.fallbackRawPcm.set(key, { samples: merged, sampleRate });
    return null;
  }

  public async hydrateFromIndexedDb(key: string): Promise<boolean> {
    if (this.has(key)) return true;
    const cached = await readVoiceFromIdb(key);
    if (!cached || cached.samples.length === 0) return false;

    const ctx = getDecodingAudioContext();
    if (ctx) {
      try {
        const audioBuf = ctx.createBuffer(1, cached.samples.length, cached.sampleRate);
        audioBuf.getChannelData(0).set(cached.samples);
        this.insertDecodedBuffer(key, audioBuf);
        return true;
      } catch {
        // Fall through to raw PCM backup
      }
    }
    this.fallbackRawPcm.set(key, { samples: cached.samples, sampleRate: cached.sampleRate });
    return true;
  }

  public async storeFromWavBase64(key: string, audioBase64: string): Promise<AudioBuffer | null> {
    if (this.has(key)) {
      const ctx = getDecodingAudioContext();
      return ctx ? this.getAudioBuffer(key, ctx) : null;
    }

    try {
      const bytes = base64ToUint8Array(audioBase64);
      const ctx = getDecodingAudioContext();

      // Fast path for standard 16-bit PCM WAVs: decode directly into AudioBuffer without main-thread stalls
      const parsedPcm = decodeWavBytesToPcm(bytes);
      if (parsedPcm && parsedPcm.samples.length > 0) {
        const copy = new Float32Array(parsedPcm.samples);
        applyMicroFade(copy);
        void writeVoiceToIdb(key, copy, parsedPcm.sampleRate);
        if (ctx) {
          const audioBuf = ctx.createBuffer(1, copy.length, parsedPcm.sampleRate);
          audioBuf.getChannelData(0).set(copy);
          this.insertDecodedBuffer(key, audioBuf);
          return audioBuf;
        }
        this.fallbackRawPcm.set(key, { samples: copy, sampleRate: parsedPcm.sampleRate });
        return null;
      }

      // Native Web Audio async decoder fallback for any compressed/non-standard WAV
      if (ctx) {
        const arrayBufCopy = bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer;
        const decoded = await ctx.decodeAudioData(arrayBufCopy);
        if (decoded.numberOfChannels > 0) {
          void writeVoiceToIdb(key, decoded.getChannelData(0), decoded.sampleRate);
        }
        this.insertDecodedBuffer(key, decoded);
        return decoded;
      }
    } catch {
      // Ignore malformed audio entry
    }
    return null;
  }

  /**
   * Promotes high-relevance payloads (e.g. approached NPC or hovered option) to the very front
   * of the buffer pool's background preload queue if not already pooled or streaming.
   */
  public promoteOrEnqueue(items: VoiceRequestPayload[], frontPriority = true): void {
    if (typeof window === "undefined" || items.length === 0) return;

    const toInsert: VoiceRequestPayload[] = [];
    for (const raw of items) {
      const cleanText = raw.text.trim();
      if (!cleanText) continue;
      const normalized: VoiceRequestPayload = { ...raw, text: cleanText, priority: "preload" };
      const key = buildVoiceCacheKey(normalized);

      if (this.has(key) || activeClientStreams.has(key)) continue;

      if (this.queuedKeys.has(key)) {
        if (frontPriority) {
          this.preloadQueue = this.preloadQueue.filter(
            (existing) => buildVoiceCacheKey(existing) !== key
          );
          toInsert.push(normalized);
        }
        continue;
      }

      this.queuedKeys.add(key);
      toInsert.push(normalized);
    }

    if (toInsert.length > 0) {
      if (frontPriority) {
        this.preloadQueue.unshift(...toInsert);
      } else {
        this.preloadQueue.push(...toInsert);
      }
      void this.drainPreloadQueue();
    }
  }

  /**
   * Hydrates the entire active map's NPC (`callout` + `dialog`) and Teacher (`correct` + `encourage`)
   * audio assets into pre-decoded `AudioBuffer`s in memory as soon as the map loads:
   * 1. Warms up the Web Audio output bus (`warmUpVoiceGraph`) so first playback has 0ms OS spin-up lag.
   * 2. Batch-fetches & decodes all server-cached WAVs for the map in a single HTTP round-trip (< 30ms).
   * 3. Sequentially streams & decodes any remaining uncached lines in proximity order.
   */
  public async preloadMapAssets(options: MapVoiceBufferPoolOptions): Promise<void> {
    if (typeof window === "undefined") return;

    const currentEpoch = ++this.mapEpoch;
    warmUpVoiceGraph();

    // Always pre-decode bundled offline MP3s for this map's NPCs & teachers into Web Audio RAM
    // so playback inside published cross-origin iframes or offline mode has 0ms latency.
    for (const sc of options.scenarios) {
      if (sc.mapId !== options.mapId) continue;
      const npcUrl = getOfflineNpcDialogAudioUrl(sc.npcId, sc.id);
      if (npcUrl) preloadAudio(npcUrl);
      const teacher = getTeacherPersonaForScenario(sc.id);
      const correctUrl = getOfflineTeacherAudioUrl(teacher.teacherId, true);
      const retryUrl = getOfflineTeacherAudioUrl(teacher.teacherId, false);
      if (correctUrl) preloadAudio(correctUrl);
      if (retryUrl) preloadAudio(retryUrl);
    }

    const playerName = (options.playerName || "Ananda").trim() || "Ananda";
    const sx = options.spawnPosition.x;
    const sy = options.spawnPosition.y;

    const sortedNpcs = [...options.npcs].sort(
      (a, b) =>
        Math.hypot(a.position.x - sx, a.position.y - sy) -
        Math.hypot(b.position.x - sx, b.position.y - sy)
    );

    const tier1Primary: VoiceRequestPayload[] = [];
    const tier2Secondary: VoiceRequestPayload[] = [];

    for (const npc of sortedNpcs) {
      const sc = options.scenarios.find(
        (s) => s.npcId === npc.id && s.mapId === options.mapId
      );
      if (!sc) continue;
      if (options.completedScenarioIds.includes(sc.id)) continue;

      const calloutText = options.resolveCalloutText(npc.id).trim();
      if (calloutText) {
        tier1Primary.push({
          role: "npc",
          npcId: npc.id,
          mode: "callout",
          text: calloutText,
          priority: "preload",
        });
      }

      const dialogText = cleanFormattedDialogue(sc.dialogueText, playerName);
      if (dialogText) {
        tier1Primary.push({
          role: "npc",
          npcId: npc.id,
          mode: "dialog",
          text: dialogText,
          priority: "preload",
        });
      }

      const teacher = getTeacherPersonaForScenario(sc.id);
      for (const opt of sc.options || []) {
        const feedbackText = (opt.feedback || "").replaceAll("[Nama Anak]", playerName).trim();
        if (!feedbackText) continue;

        const teacherPayload: VoiceRequestPayload = {
          role: "teacher",
          teacherId: teacher.teacherId,
          isCorrect: opt.isCorrect,
          text: feedbackText,
          priority: "preload",
        };

        if (opt.isCorrect) {
          tier1Primary.push(teacherPayload);
        } else {
          tier2Secondary.push(teacherPayload);
        }
      }
    }

    // Deduplicate manifest while preserving proximity priority order
    const seenKeys = new Set<string>();
    const missingManifest: Array<{ key: string; payload: VoiceRequestPayload }> = [];

    for (const item of [...tier1Primary, ...tier2Secondary]) {
      const key = buildVoiceCacheKey(item);
      if (seenKeys.has(key) || this.has(key)) continue;
      seenKeys.add(key);
      missingManifest.push({ key, payload: item });
    }

    if (missingManifest.length === 0) return;

    // Hydrate any locally saved IndexedDB voices first (works 100% offline too)
    await Promise.all(
      missingManifest.map(({ key }) => this.hydrateFromIndexedDb(key))
    );
    const afterIdbMissing = missingManifest.filter(({ key }) => !this.has(key));
    if (afterIdbMissing.length === 0 || currentEpoch !== this.mapEpoch) return;

    if (isOfflineOrStandaloneEnvironment() || !(await checkApiBackendAvailable())) {
      return;
    }

    // Step 1: Single round-trip batch hydration of all server-cached WAVs directly into decoded AudioBuffers!
    try {
      const response = await fetch(resolveApiUrl("/api/npc-voice-cache-batch"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: afterIdbMissing.map(({ key, payload }) => ({
            clientKey: key,
            ...payload,
          })),
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("application/json")) {
        const data = (await response.json()) as {
          hits?: Record<string, { audioBase64?: string; mimeType?: string }>;
        };
        const hits = data?.hits || {};
        const decodePromises: Promise<AudioBuffer | null>[] = [];

        for (const [hitKey, val] of Object.entries(hits)) {
          if (val?.audioBase64 && !this.has(hitKey)) {
            decodePromises.push(this.storeFromWavBase64(hitKey, val.audioBase64));
          }
        }

        if (decodePromises.length > 0) {
          await Promise.all(decodePromises);
        }
      }
    } catch {
      // Offline / standalone mode: gracefully skip server batch cache check
    }

    if (currentEpoch !== this.mapEpoch) return;

    // If the server has no Gemini API key (e.g. published app without live TTS secret),
    // skip spawning uncached synthesis requests and rely on cached WAVs + Web Audio offline MP3s.
    if (isServerGeminiTtsAvailable() === false) {
      return;
    }

    // Step 2: Queue any remaining uncached map lines for sequential background synthesis & AudioBuffer decoding
    this.preloadQueue = [];
    this.queuedKeys.clear();

    for (const { key, payload } of missingManifest) {
      if (this.has(key) || activeClientStreams.has(key)) continue;
      this.queuedKeys.add(key);
      this.preloadQueue.push(payload);
    }

    void this.drainPreloadQueue();
  }

  private async drainPreloadQueue(): Promise<void> {
    if (this.isDraining) return;
    this.isDraining = true;

    try {
      while (this.preloadQueue.length > 0) {
        if (Date.now() < clientRateLimitedUntil) {
          const waitMs = Math.min(8000, Math.max(400, clientRateLimitedUntil - Date.now()));
          await new Promise((r) => window.setTimeout(r, waitMs));
          if (Date.now() < clientRateLimitedUntil) {
            break;
          }
        }

        const nextPayload = this.preloadQueue.shift();
        if (!nextPayload) continue;

        const key = buildVoiceCacheKey(nextPayload);
        this.queuedKeys.delete(key);

        if (this.has(key)) continue;

        const stream = getOrStartVoiceStream(nextPayload, "preload");
        if (stream) {
          await stream.completionPromise;
        }

        // Gentle breath between background preloads so live actions always have instant headroom
        await new Promise((r) => window.setTimeout(r, 90));
      }
    } finally {
      this.isDraining = false;
    }
  }
}

const activeClientStreams = new Map<string, ClientVoiceStream>();
let clientRateLimitedUntil = 0;
const voiceBufferPool = new VoiceAudioBufferPool();

let currentVoiceToken = 0;
let activePlayingKey: string | null = null;
let activeStreamInProgress = false;
let activeSpeakingCallback: ((speaking: boolean) => void) | null = null;
let pendingVoiceFallbackTimer: number | null = null;
const activeScheduledSources = new Set<AudioScheduledSourceNode>();

function clearPendingVoiceFallbackTimer(): void {
  if (pendingVoiceFallbackTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(pendingVoiceFallbackTimer);
    pendingVoiceFallbackTimer = null;
  }
}

/**
 * Starts or joins a real-time NDJSON PCM voice stream for `payload`, automatically decoding
 * the completed audio directly into `voiceBufferPool` when finished.
 */
function getOrStartVoiceStream(
  payload: VoiceRequestPayload,
  priority: "high" | "preload"
): ClientVoiceStream | null {
  const cleanText = payload.text.trim();
  if (!cleanText || typeof window === "undefined") return null;

  const normalizedPayload: VoiceRequestPayload = {
    ...payload,
    text: cleanText,
    priority,
  };
  const key = buildVoiceCacheKey(normalizedPayload);

  if (priority === "preload" && Date.now() < clientRateLimitedUntil) {
    return null;
  }

  const existingStream = activeClientStreams.get(key);
  if (existingStream) {
    // If a live user action arrives while an earlier background preload hasn't yielded audio yet,
    // don't wait behind the preload queue—launch an immediate "high" priority stream!
    if (
      priority === "high" &&
      existingStream.priority === "preload" &&
      existingStream.chunks.length === 0 &&
      !existingStream.done
    ) {
      activeClientStreams.delete(key);
    } else {
      return existingStream;
    }
  }

  let resolveCompletion!: (ok: boolean) => void;
  const completionPromise = new Promise<boolean>((resolve) => {
    resolveCompletion = resolve;
  });

  const streamSession: ClientVoiceStream = {
    priority,
    chunks: [],
    done: false,
    failed: false,
    completionPromise,
    subscribers: new Set(),
  };
  activeClientStreams.set(key, streamSession);

  const notify = (evt: ClientStreamEvent) => {
    for (const sub of streamSession.subscribers) {
      try {
        sub(evt);
      } catch {
        // Ignore subscriber error
      }
    }
  };

  void (async () => {
    try {
      if (isOfflineOrStandaloneEnvironment() || !(await checkApiBackendAvailable())) {
        streamSession.failed = true;
        streamSession.done = true;
        notify({ type: "fallback" });
        resolveCompletion(false);
        return;
      }

      const response = await fetch(resolveApiUrl("/api/npc-voice-stream"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedPayload),
      });

      const contentType = response.headers.get("content-type") || "";
      if (
        !response.ok ||
        !response.body ||
        contentType.includes("text/html")
      ) {
        streamSession.failed = true;
        streamSession.done = true;
        notify({ type: "fallback" });
        resolveCompletion(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";
      let wavBase64ForDirectDecode: string | null = null;

      const processLine = (rawLine: string) => {
        const trimmed = rawLine.trim();
        if (!trimmed) return;
        let msg: {
          type?: string;
          pcmBase64?: string;
          audioBase64?: string;
          sampleRate?: number;
          retryAfterMs?: number;
        };
        try {
          msg = JSON.parse(trimmed);
        } catch {
          return;
        }

        if (msg.type === "pcm" && msg.pcmBase64) {
          const bytes = base64ToUint8Array(msg.pcmBase64);
          const samples = pcm16BytesToFloat32(bytes);
          if (samples.length > 0) {
            const decodedChunk: DecodedVoiceChunk = {
              samples,
              sampleRate: msg.sampleRate || 24000,
            };
            streamSession.chunks.push(decodedChunk);
            notify({ type: "chunk", chunk: decodedChunk });
          }
        } else if (msg.type === "wav" && msg.audioBase64) {
          wavBase64ForDirectDecode = msg.audioBase64;
          const bytes = base64ToUint8Array(msg.audioBase64);
          const decodedWav = decodeWavBytesToPcm(bytes);
          if (decodedWav && decodedWav.samples.length > 0) {
            streamSession.chunks.push(decodedWav);
            notify({ type: "chunk", chunk: decodedWav });
          }
        } else if (msg.type === "fallback") {
          const reason = (msg as { reason?: string }).reason;
          if (reason === "missing_api_key") {
            markServerGeminiTtsUnavailable();
            clientRateLimitedUntil = Date.now() + 120_000;
          } else if (typeof msg.retryAfterMs === "number" && msg.retryAfterMs > 0) {
            clientRateLimitedUntil = Date.now() + msg.retryAfterMs;
          } else {
            clientRateLimitedUntil = Date.now() + 12_000;
          }
          streamSession.failed = true;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        lineBuffer += decoder.decode(value, { stream: true });
        let newlineIdx = lineBuffer.indexOf("\n");
        while (newlineIdx !== -1) {
          const line = lineBuffer.slice(0, newlineIdx);
          lineBuffer = lineBuffer.slice(newlineIdx + 1);
          processLine(line);
          newlineIdx = lineBuffer.indexOf("\n");
        }
      }

      lineBuffer += decoder.decode();
      if (lineBuffer.trim()) {
        processLine(lineBuffer);
      }

      if (streamSession.chunks.length > 0) {
        voiceBufferPool.storeFromChunks(key, streamSession.chunks);
        streamSession.done = true;
        notify({ type: "done" });
        resolveCompletion(true);
      } else if (wavBase64ForDirectDecode) {
        const decodedBuf = await voiceBufferPool.storeFromWavBase64(
          key,
          wavBase64ForDirectDecode
        );
        if (decodedBuf) {
          const channelCopy = new Float32Array(decodedBuf.length);
          decodedBuf.copyFromChannel(channelCopy, 0);
          const chunk: DecodedVoiceChunk = {
            samples: channelCopy,
            sampleRate: decodedBuf.sampleRate,
          };
          streamSession.chunks.push(chunk);
          notify({ type: "chunk", chunk });
          streamSession.done = true;
          notify({ type: "done" });
          resolveCompletion(true);
        } else {
          streamSession.failed = true;
          streamSession.done = true;
          notify({ type: "fallback" });
          resolveCompletion(false);
        }
      } else {
        streamSession.failed = true;
        streamSession.done = true;
        notify({ type: "fallback" });
        resolveCompletion(false);
      }
    } catch {
      streamSession.failed = true;
      streamSession.done = true;
      notify({ type: "fallback" });
      resolveCompletion(false);
    } finally {
      activeClientStreams.delete(key);
    }
  })();

  return streamSession;
}

/**
 * Preloads and decodes all NPC & Teacher voice assets for the active map into `voiceBufferPool`
 * as soon as the map mounts so first-time triggers have zero fetch/decode latency.
 */
export function preloadMapVoiceBufferPool(options: MapVoiceBufferPoolOptions): void {
  void voiceBufferPool.preloadMapAssets(options);
}

function hydratePayloadsFromIdbInBackground(items: VoiceRequestPayload[]): void {
  for (const item of items) {
    const cleanText = item.text.trim();
    if (!cleanText) continue;
    const key = buildVoiceCacheKey({ ...item, text: cleanText });
    if (!voiceBufferPool.has(key)) {
      void voiceBufferPool.hydrateFromIndexedDb(key);
    }
  }
}

/**
 * Promotes up to `maxCount` NPC voice lines to the front of the `voiceBufferPool` preload queue.
 */
export function preloadNpcVoices(
  items: Array<{ npcId: string; text: string; mode: "callout" | "dialog" }>,
  maxCount = 2
): void {
  if (typeof window === "undefined" || items.length === 0) return;

  const payloads: VoiceRequestPayload[] = items.slice(0, maxCount).map((item) => ({
    role: "npc",
    npcId: item.npcId,
    mode: item.mode,
    text: item.text,
  }));
  hydratePayloadsFromIdbInBackground(payloads);

  if (
    isOfflineOrStandaloneEnvironment() ||
    isServerGeminiTtsAvailable() === false ||
    Date.now() < clientRateLimitedUntil
  ) {
    return;
  }

  voiceBufferPool.promoteOrEnqueue(payloads, true);
}

/**
 * Promotes up to `maxCount` cheerful SD teacher feedback voice lines to the front of `voiceBufferPool`.
 */
export function preloadTeacherFeedbackVoices(
  scenarioId: string,
  items: Array<{ text: string; isCorrect: boolean }>,
  maxCount = 3
): void {
  if (typeof window === "undefined" || items.length === 0) return;

  const teacher = getTeacherPersonaForScenario(scenarioId);
  const payloads: VoiceRequestPayload[] = items.slice(0, maxCount).map((item) => ({
    role: "teacher",
    teacherId: teacher.teacherId,
    isCorrect: item.isCorrect,
    text: item.text,
  }));
  hydratePayloadsFromIdbInBackground(payloads);

  if (
    isOfflineOrStandaloneEnvironment() ||
    isServerGeminiTtsAvailable() === false ||
    Date.now() < clientRateLimitedUntil
  ) {
    return;
  }

  voiceBufferPool.promoteOrEnqueue(payloads, true);
}

/**
 * Promotes up to `maxCount` answer option voice lines (A / B / C) to the `voiceBufferPool` preload queue.
 */
export function preloadOptionVoices(
  scenarioId: string,
  items: Array<{ text: string }>,
  maxCount = 3
): void {
  if (typeof window === "undefined" || items.length === 0) return;

  const teacher = getTeacherPersonaForScenario(scenarioId);
  const payloads: VoiceRequestPayload[] = items.slice(0, maxCount).map((item) => ({
    role: "option",
    teacherId: teacher.teacherId,
    text: item.text,
  }));
  hydratePayloadsFromIdbInBackground(payloads);

  if (
    isOfflineOrStandaloneEnvironment() ||
    isServerGeminiTtsAvailable() === false ||
    Date.now() < clientRateLimitedUntil
  ) {
    return;
  }

  voiceBufferPool.promoteOrEnqueue(payloads, false);
}

let activeSpeechFallbackToken = 0;
let activeSpeechWatchdogId: number | null = null;

function cancelBrowserSpeechFallback(): void {
  activeSpeechFallbackToken += 1;
  if (activeSpeechWatchdogId !== null && typeof window !== "undefined") {
    window.clearTimeout(activeSpeechWatchdogId);
    activeSpeechWatchdogId = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore synthesis cancel errors
    }
  }
}

function playBrowserSpeechOptionFallback(
  text: string,
  keepMusicDuckedOnEnd: boolean,
  onSpeakingChange?: (speaking: boolean) => void,
  onErrorFallback?: () => void
): void {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !getSoundEnabled()
  ) {
    onSpeakingChange?.(false);
    if (!keepMusicDuckedOnEnd) setMusicDucked(false);
    onErrorFallback?.();
    return;
  }

  const cleanText = text.trim();
  if (!cleanText) {
    onSpeakingChange?.(false);
    return;
  }

  try {
    const synth = window.speechSynthesis;
    const neededCancel = synth.speaking || synth.pending;
    if (neededCancel) {
      synth.cancel();
    }
    if (synth.paused) {
      synth.resume();
    }

    const speechToken = ++activeSpeechFallbackToken;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "id-ID";
    utterance.rate = 0.94;
    utterance.pitch = 1.03;

    const voices = synth.getVoices();
    const idVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith("id")) ||
      voices.find((v) => v.lang.toLowerCase().includes("id"));
    if (idVoice) {
      utterance.voice = idVoice;
    }

    setMusicDucked(true);
    onSpeakingChange?.(true);

    const finish = (hadError = false) => {
      if (activeSpeechWatchdogId !== null) {
        window.clearTimeout(activeSpeechWatchdogId);
        activeSpeechWatchdogId = null;
      }
      if (speechToken !== activeSpeechFallbackToken) return;
      onSpeakingChange?.(false);
      if (!keepMusicDuckedOnEnd) {
        setMusicDucked(false);
      }
      if (hadError) {
        onErrorFallback?.();
      }
    };

    utterance.onend = () => finish(false);
    utterance.onerror = () => finish(true);
    activeSpeechWatchdogId = window.setTimeout(
      () => finish(false),
      Math.max(4500, cleanText.length * 140)
    );

    const doSpeak = () => {
      if (speechToken !== activeSpeechFallbackToken) return;
      try {
        if (synth.paused) synth.resume();
        synth.speak(utterance);
      } catch {
        finish(true);
      }
    };

    if (neededCancel) {
      window.setTimeout(doSpeak, 45);
    } else {
      doSpeak();
    }
  } catch {
    onSpeakingChange?.(false);
    if (!keepMusicDuckedOnEnd) setMusicDucked(false);
    onErrorFallback?.();
  }
}

function stopNpcVoiceNodesOnly(keepMusicDucked = false): void {
  clearPendingVoiceFallbackTimer();
  cancelBrowserSpeechFallback();
  currentVoiceToken += 1;
  activePlayingKey = null;
  activeStreamInProgress = false;

  for (const src of activeScheduledSources) {
    try {
      src.onended = null;
      src.stop();
      src.disconnect();
    } catch {
      // Ignore already stopped source
    }
  }
  activeScheduledSources.clear();

  if (activeSpeakingCallback) {
    activeSpeakingCallback(false);
    activeSpeakingCallback = null;
  }
  if (!keepMusicDucked) {
    setMusicDucked(false);
  }
}

registerExternalVoiceStopper(() => {
  stopNpcVoiceNodesOnly(true);
});

/**
 * Stops any currently speaking NPC or Teacher voice line immediately across all scheduled Web Audio nodes AND HTMLAudioElement.
 */
export function stopNpcVoice(keepMusicDucked = false): void {
  stopLocalVoiceAudio();
  stopNpcVoiceNodesOnly(keepMusicDucked);
}

/**
 * Synthesizes an expressive low-pitched human vocal murmur ("bapak-bapak" throat/formant contour,
 * NEVER browser SpeechSynthesis / robotic Google TTS) only if network/API audio is unreachable.
 */
function playFallbackBapakVocalFormant(initialDelaySec = 0): void {
  const bus = getVoicePlaybackBus();
  if (!bus) return;
  try {
    const { ctx, voiceGain } = bus;
    const now = ctx.currentTime + Math.max(0, initialDelaySec);

    const syllables = [
      { f0: 118, fEnd: 136, start: 0, dur: 0.16, f1: 520, f2: 1180 },
      { f0: 134, fEnd: 148, start: 0.19, dur: 0.22, f1: 660, f2: 1280 },
      { f0: 126, fEnd: 108, start: 0.44, dur: 0.24, f1: 480, f2: 1040 },
    ];

    syllables.forEach((s) => {
      const osc = ctx.createOscillator();
      const formant1 = ctx.createBiquadFilter();
      const formant2 = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(s.f0, now + s.start);
      osc.frequency.linearRampToValueAtTime(s.fEnd, now + s.start + s.dur);

      formant1.type = "bandpass";
      formant1.frequency.setValueAtTime(s.f1, now + s.start);
      formant1.Q.setValueAtTime(4.5, now + s.start);

      formant2.type = "lowpass";
      formant2.frequency.setValueAtTime(s.f2, now + s.start);

      gain.gain.setValueAtTime(0.0001, now + s.start);
      gain.gain.linearRampToValueAtTime(0.14, now + s.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + s.start + s.dur);

      osc.connect(formant1);
      formant1.connect(formant2);
      formant2.connect(gain);
      gain.connect(voiceGain);

      activeScheduledSources.add(osc);
      osc.onended = () => {
        activeScheduledSources.delete(osc);
        try {
          osc.disconnect();
          formant1.disconnect();
          formant2.disconnect();
          gain.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      };

      osc.start(now + s.start);
      osc.stop(now + s.start + s.dur + 0.03);
    });
  } catch {
    // Ignore fallback audio errors
  }
}



/**
 * Plays a voice line from the pre-decoded `VoiceAudioBufferPool` in < 0.1ms (zero allocation/decode spike),
 * or seamlessly streams progressive PCM chunks while populating the pool if triggered mid-preload.
 */
async function playVoicePayload(
  payload: VoiceRequestPayload,
  initialDelaySec: number,
  keepMusicDuckedOnEnd: boolean,
  forceRestart: boolean,
  onSpeakingChange: ((speaking: boolean) => void) | undefined,
  onFallback: () => void
): Promise<void> {
  if (!getSoundEnabled()) return;
  const cleanText = payload.text.trim();
  if (!cleanText) return;

  const bus = getVoicePlaybackBus();
  if (!bus) return;

  const normalizedPayload: VoiceRequestPayload = {
    ...payload,
    text: cleanText,
    priority: "high",
  };
  const cacheKey = buildVoiceCacheKey(normalizedPayload);

  // Seamless handoff if already started synchronously inside GameWorld's collider loop
  if (
    !forceRestart &&
    activePlayingKey === cacheKey &&
    (activeScheduledSources.size > 0 || activeStreamInProgress)
  ) {
    if (activeSpeakingCallback && activeSpeakingCallback !== onSpeakingChange) {
      activeSpeakingCallback(false);
    }
    activeSpeakingCallback = onSpeakingChange || null;
    onSpeakingChange?.(true);
    setMusicDucked(true);
    return;
  }

  stopNpcVoice(true);
  const myToken = ++currentVoiceToken;
  activePlayingKey = cacheKey;
  const { ctx, voiceGain } = bus;

  activeSpeakingCallback = onSpeakingChange || null;
  onSpeakingChange?.(true);
  setMusicDucked(true);

  const finishVoiceSession = () => {
    if (myToken !== currentVoiceToken) return;
    activePlayingKey = null;
    activeStreamInProgress = false;
    if (activeSpeakingCallback) {
      const cb = activeSpeakingCallback;
      activeSpeakingCallback = null;
      cb(false);
    }
    if (!keepMusicDuckedOnEnd) {
      setMusicDucked(false);
    }
  };

  // Path A: Direct 0ms playback from pre-decoded `VoiceAudioBufferPool` in memory!
  const pooledSource = voiceBufferPool.acquireSource(cacheKey, ctx, voiceGain);
  if (pooledSource) {
    try {
      if (ctx.state === "suspended") {
        await Promise.race([
          ctx.resume().catch(() => {}),
          new Promise<void>((r) => window.setTimeout(r, 150)),
        ]);
        if (myToken !== currentVoiceToken) return;
      }
      const durationMs = pooledSource.buffer
        ? Math.max(2500, Math.ceil(pooledSource.buffer.duration * 1000) + 1200)
        : 10000;
      const safetyTimer = window.setTimeout(() => {
        activeScheduledSources.delete(pooledSource);
        finishVoiceSession();
      }, durationMs);

      activeScheduledSources.add(pooledSource);
      pooledSource.onended = () => {
        window.clearTimeout(safetyTimer);
        activeScheduledSources.delete(pooledSource);
        finishVoiceSession();
      };

      const startAt = ctx.currentTime + Math.max(0.005, initialDelaySec);
      pooledSource.start(startAt);
      return;
    } catch {
      activeScheduledSources.delete(pooledSource);
      finishVoiceSession();
      return;
    }
  }

  // If this is a synchronous button click to read an option and live TTS is unavailable,
  // fire fallback synchronously BEFORE any await so iframe user-gesture activation stays intact.
  const noLiveTtsAvailable =
    isOfflineOrStandaloneEnvironment() ||
    isServerGeminiTtsAvailable() === false ||
    Date.now() < clientRateLimitedUntil;

  if (normalizedPayload.role === "option" && noLiveTtsAvailable) {
    finishVoiceSession();
    if (myToken === currentVoiceToken) {
      onFallback();
    }
    return;
  }

  // Path A2: Restore previously generated Gemini teacher/NPC voice from persistent IndexedDB cache (works offline!)
  const restoredFromIdb = await voiceBufferPool.hydrateFromIndexedDb(cacheKey);
  if (myToken !== currentVoiceToken) return;
  if (restoredFromIdb) {
    const idbSource = voiceBufferPool.acquireSource(cacheKey, ctx, voiceGain);
    if (idbSource) {
      try {
        if (ctx.state === "suspended") {
          await Promise.race([
            ctx.resume().catch(() => {}),
            new Promise<void>((r) => window.setTimeout(r, 150)),
          ]);
          if (myToken !== currentVoiceToken) return;
        }
        const durationMs = idbSource.buffer
          ? Math.max(2500, Math.ceil(idbSource.buffer.duration * 1000) + 1200)
          : 10000;
        const safetyTimer = window.setTimeout(() => {
          activeScheduledSources.delete(idbSource);
          finishVoiceSession();
        }, durationMs);

        activeScheduledSources.add(idbSource);
        idbSource.onended = () => {
          window.clearTimeout(safetyTimer);
          activeScheduledSources.delete(idbSource);
          finishVoiceSession();
        };

        const startAt = ctx.currentTime + Math.max(0.005, initialDelaySec);
        idbSource.start(startAt);
        return;
      } catch {
        activeScheduledSources.delete(idbSource);
        finishVoiceSession();
        return;
      }
    }
  }

  // Path B: Immediate offline fallback when offline/standalone, missing server API key, or rate-limited; otherwise stream real-time PCM
  if (noLiveTtsAvailable) {
    finishVoiceSession();
    if (myToken === currentVoiceToken) {
      onFallback();
    }
    return;
  }

  const streamSession = getOrStartVoiceStream(normalizedPayload, "high");
  if (!streamSession) {
    finishVoiceSession();
    if (myToken === currentVoiceToken) {
      onFallback();
    }
    return;
  }

  activeStreamInProgress = true;
  let nextPlayTime = ctx.currentTime + Math.max(0.015, initialDelaySec);
  let activeChunksInFlight = 0;
  let totalChunksScheduled = 0;
  let streamCompleted = false;
  let watchdogTimerId: number | null = null;
  let handedOffToFallback = false;

  const clearWatchdog = () => {
    if (watchdogTimerId !== null) {
      window.clearTimeout(watchdogTimerId);
      watchdogTimerId = null;
    }
  };

  const checkStreamAndAudioComplete = () => {
    if (myToken !== currentVoiceToken || handedOffToFallback) return;
    if (streamCompleted && activeChunksInFlight === 0) {
      clearWatchdog();
      finishVoiceSession();
    }
  };

  const scheduleDecodedChunk = (chunk: DecodedVoiceChunk) => {
    if (myToken !== currentVoiceToken || handedOffToFallback || !getSoundEnabled()) return;
    if (chunk.samples.length === 0) return;

    clearWatchdog();

    try {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const audioBuf = ctx.createBuffer(1, chunk.samples.length, chunk.sampleRate);
      audioBuf.getChannelData(0).set(chunk.samples);

      const src = ctx.createBufferSource();
      src.buffer = audioBuf;
      src.connect(voiceGain);
      activeScheduledSources.add(src);
      activeChunksInFlight += 1;
      totalChunksScheduled += 1;

      const startAt = Math.max(ctx.currentTime + 0.015, nextPlayTime);
      nextPlayTime = startAt + audioBuf.duration;

      src.onended = () => {
        activeScheduledSources.delete(src);
        activeChunksInFlight = Math.max(0, activeChunksInFlight - 1);
        checkStreamAndAudioComplete();
      };

      src.start(startAt);
    } catch {
      // Ignore individual buffer scheduling errors
    }
  };

  for (const existingChunk of streamSession.chunks) {
    scheduleDecodedChunk(existingChunk);
  }

  if (streamSession.done) {
    streamCompleted = true;
    activeStreamInProgress = false;
    clearWatchdog();
    if (totalChunksScheduled === 0) {
      finishVoiceSession();
      if (myToken === currentVoiceToken) {
        onFallback();
      }
    } else {
      checkStreamAndAudioComplete();
    }
    return;
  }

  const onStreamEvent = (evt: ClientStreamEvent) => {
    if (myToken !== currentVoiceToken || handedOffToFallback || !getSoundEnabled()) {
      clearWatchdog();
      streamSession.subscribers.delete(onStreamEvent);
      return;
    }

    if (evt.type === "chunk") {
      scheduleDecodedChunk(evt.chunk);
    } else if (evt.type === "done") {
      clearWatchdog();
      streamSession.subscribers.delete(onStreamEvent);
      streamCompleted = true;
      activeStreamInProgress = false;
      checkStreamAndAudioComplete();
    } else if (evt.type === "fallback") {
      clearWatchdog();
      streamSession.subscribers.delete(onStreamEvent);
      streamCompleted = true;
      activeStreamInProgress = false;
      if (totalChunksScheduled === 0) {
        finishVoiceSession();
        if (myToken === currentVoiceToken) {
          onFallback();
        }
      } else {
        checkStreamAndAudioComplete();
      }
    }
  };

  streamSession.subscribers.add(onStreamEvent);

  if (totalChunksScheduled === 0) {
    watchdogTimerId = window.setTimeout(() => {
      watchdogTimerId = null;
      if (
        myToken !== currentVoiceToken ||
        handedOffToFallback ||
        totalChunksScheduled > 0 ||
        streamCompleted
      ) {
        return;
      }
      handedOffToFallback = true;
      streamSession.subscribers.delete(onStreamEvent);
      activePlayingKey = null;
      activeStreamInProgress = false;
      onFallback();
    }, 1400);
  }
}

/**
 * Plays natural acted Indonesian adult stranger ("bapak-bapak yang menawarkan hadiah") speech
 * from the in-memory `VoiceAudioBufferPool` (or real-time PCM stream). Never uses browser SpeechSynthesis
 * and NEVER triggers teacher feedback audio.
 */
export async function playNpcVoice({
  npcId,
  scenarioId,
  text,
  mode,
  initialDelaySec = 0,
  keepMusicDuckedOnEnd = false,
  forceRestart = false,
  onSpeakingChange,
}: PlayNpcVoiceOptions): Promise<void> {
  return playVoicePayload(
    {
      role: "npc",
      npcId,
      mode,
      text,
    },
    initialDelaySec,
    keepMusicDuckedOnEnd,
    forceRestart,
    onSpeakingChange,
    () => {
      if (mode === "dialog") {
        const useDefaultMp3 = matchesDefaultScenarioDialogue(scenarioId, npcId, text);
        const offlineDialogUrl = useDefaultMp3
          ? getOfflineNpcDialogAudioUrl(npcId, scenarioId)
          : undefined;
        if (offlineDialogUrl) {
          setMusicDucked(true);
          void playVoice(
            text,
            offlineDialogUrl,
            (speaking) => {
              onSpeakingChange?.(speaking);
              if (!speaking && !keepMusicDuckedOnEnd) {
                setMusicDucked(false);
              }
            },
            { role: "npc" }
          );
          return;
        }
        // Custom scenario text offline/standalone: read the teacher's custom question aloud cleanly
        if (!useDefaultMp3) {
          playBrowserSpeechOptionFallback(text, keepMusicDuckedOnEnd, onSpeakingChange, () =>
            playFallbackBapakVocalFormant(initialDelaySec)
          );
          return;
        }
      }
      if (mode === "callout") {
        // Offline callout: speak Indonesian callout cleanly with AI speech until online Gemini voice is cached
        playBrowserSpeechOptionFallback(text, keepMusicDuckedOnEnd, onSpeakingChange, () =>
          playFallbackBapakVocalFormant(initialDelaySec)
        );
        return;
      }
      playFallbackBapakVocalFormant(initialDelaySec);
    }
  );
}

/**
 * Plays cheerful, friendly Indonesian elementary school teacher (Pak Guru / Ibu Guru) feedback
 * from the in-memory `VoiceAudioBufferPool` automatically right after a student chooses their answer.
 */
export async function playTeacherFeedbackVoice({
  scenarioId,
  text,
  isCorrect,
  initialDelaySec = 0,
  keepMusicDuckedOnEnd = true,
  forceRestart = false,
  onSpeakingChange,
}: PlayTeacherFeedbackVoiceOptions): Promise<void> {
  const teacher = getTeacherPersonaForScenario(scenarioId);
  return playVoicePayload(
    {
      role: "teacher",
      teacherId: teacher.teacherId,
      isCorrect,
      text,
    },
    initialDelaySec,
    keepMusicDuckedOnEnd,
    forceRestart,
    onSpeakingChange,
    () => {
      const fallbackToken = currentVoiceToken;
      const delayMs = Math.max(0, Math.round(initialDelaySec * 1000));
      const isDefaultFeedback = matchesDefaultScenarioFeedback(scenarioId, text);

      const runFallback = () => {
        if (fallbackToken !== currentVoiceToken || !getSoundEnabled()) return;
        // If the teacher wrote brand-new custom feedback offline, use AI SpeechSynthesis cleanly
        // until internet reconnects and upgrades it to the warm Gemini teacher voice
        if (!isDefaultFeedback) {
          playBrowserSpeechOptionFallback(text, keepMusicDuckedOnEnd, onSpeakingChange);
          return;
        }

        const offlineTeacherUrl = getOfflineTeacherAudioUrl(teacher.teacherId, isCorrect);
        setMusicDucked(true);
        void playVoice(
          text,
          offlineTeacherUrl,
          (speaking) => {
            onSpeakingChange?.(speaking);
            if (!speaking && !keepMusicDuckedOnEnd) {
              setMusicDucked(false);
            }
          },
          {
            role: "teacher",
            isCorrect,
          }
        );
      };

      if (delayMs > 0 && typeof window !== "undefined") {
        clearPendingVoiceFallbackTimer();
        pendingVoiceFallbackTimer = window.setTimeout(() => {
          pendingVoiceFallbackTimer = null;
          runFallback();
        }, delayMs);
      } else {
        runFallback();
      }
    }
  );
}

/**
 * Reads an answer option (Pilihan A / B / C) aloud using a clear, neutral Indonesian elementary school
 * teacher voice from `VoiceAudioBufferPool` / streaming Gemini TTS, with Indonesian SpeechSynthesis
 * fallback when offline or rate-limited.
 */
export async function playOptionVoice({
  scenarioId,
  text,
  initialDelaySec = 0,
  keepMusicDuckedOnEnd = true,
  forceRestart = false,
  onSpeakingChange,
}: PlayOptionVoiceOptions): Promise<void> {
  const teacher = getTeacherPersonaForScenario(scenarioId);
  return playVoicePayload(
    {
      role: "option",
      teacherId: teacher.teacherId,
      text,
    },
    initialDelaySec,
    keepMusicDuckedOnEnd,
    forceRestart,
    onSpeakingChange,
    () => {
      playBrowserSpeechOptionFallback(text, keepMusicDuckedOnEnd, onSpeakingChange);
    }
  );
}

/**
 * Automatically regenerates & caches warm Gemini TTS teacher/NPC voices in IndexedDB
 * for any custom or uncached scenario questions once internet & server access return.
 */
export async function upgradeCustomScenarioVoicesOnReconnect(
  scenarios: Scenario[],
  playerName?: string
): Promise<void> {
  if (typeof window === "undefined" || scenarios.length === 0) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  resetBackendAvailabilityCache();
  if (isOfflineOrStandaloneEnvironment()) return;

  const hasBackend = await checkApiBackendAvailable();
  if (!hasBackend) return;

  const normalizedName = (playerName || "").trim() || "Ananda";
  const payloadsToUpgrade: VoiceRequestPayload[] = [];

  for (const sc of scenarios) {
    const dialogText = cleanFormattedDialogue(
      sc.questionText || sc.dialogueText || sc.question,
      normalizedName
    );
    const calloutText = cleanFormattedDialogue(sc.calloutText || "", normalizedName);
    const isCustomDialog = !matchesDefaultScenarioDialogue(sc.id, sc.npcId, dialogText);

    if (isCustomDialog && dialogText) {
      payloadsToUpgrade.push({
        role: "npc",
        npcId: sc.npcId,
        mode: "dialog",
        text: dialogText,
      });
    }
    if (isCustomDialog && calloutText) {
      payloadsToUpgrade.push({
        role: "npc",
        npcId: sc.npcId,
        mode: "callout",
        text: calloutText,
      });
    }

    const teacher = getTeacherPersonaForScenario(sc.id);
    for (let idx = 0; idx < (sc.options || []).length; idx++) {
      const opt = sc.options[idx];
      const fbText = (opt.feedbackText || opt.feedback || "")
        .replaceAll("[Nama Anak]", normalizedName)
        .trim();
      const isCustomFb = fbText.length > 0 && !matchesDefaultScenarioFeedback(sc.id, fbText);

      if (isCustomFb) {
        payloadsToUpgrade.push({
          role: "teacher",
          teacherId: teacher.teacherId,
          isCorrect: opt.isCorrect,
          text: fbText,
        });
      }

      if (isCustomDialog || isCustomFb) {
        const optionLetter = opt.id ? opt.id.toUpperCase() : String.fromCharCode(65 + idx);
        const optText = `Pilihan ${optionLetter}. ${(opt.text || "")
          .replaceAll("[Nama Anak]", normalizedName)
          .trim()}`;
        if (optText) {
          payloadsToUpgrade.push({
            role: "option",
            teacherId: teacher.teacherId,
            text: optText,
          });
        }
      }
    }
  }

  if (payloadsToUpgrade.length === 0) return;

  const missingPayloads: VoiceRequestPayload[] = [];
  for (const payload of payloadsToUpgrade) {
    const key = buildVoiceCacheKey(payload);
    if (voiceBufferPool.has(key) || activeClientStreams.has(key)) continue;
    const alreadyInIdb = await hasVoiceInIdb(key);
    if (!alreadyInIdb) {
      missingPayloads.push(payload);
    } else {
      void voiceBufferPool.hydrateFromIndexedDb(key);
    }
  }

  if (missingPayloads.length > 0) {
    voiceBufferPool.promoteOrEnqueue(missingPayloads, false);
  }
}
