import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI, Modality, type LiveServerMessage } from "@google/genai";
import {
  clearStudentLogsInSqlite,
  getAllStudentLogsFromSqlite,
  getCustomScenariosFromSqlite,
  loadVoiceCacheFromSqlite,
  resetCustomScenariosInSqlite,
  saveCustomScenariosToSqlite,
  upsertStudentLogToSqlite,
  upsertVoiceEntriesToSqlite,
} from "./serverSqlite.ts";

const STANDALONE_HTML_FILE = path.join(process.cwd(), "dist-standalone", "index.html");
let standaloneBuildPromise: Promise<void> | null = null;

// Persistent (SQLite) + in-memory LRU cache for generated NPC & Teacher voice audio
const npcVoiceAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();
const MAX_VOICE_CACHE_ENTRIES = 320;

// Load persisted voice cache from SQLite on startup so restarts never re-spend TTS quota
try {
  const entries = loadVoiceCacheFromSqlite(MAX_VOICE_CACHE_ENTRIES);
  for (const [key, val] of entries) {
    if (typeof key === "string" && val?.audioBase64) {
      npcVoiceAudioCache.set(key, val);
    }
  }
} catch {
  // Ignore startup cache read errors
}

let persistCacheTimer: NodeJS.Timeout | null = null;
function schedulePersistVoiceCache(): void {
  if (persistCacheTimer) clearTimeout(persistCacheTimer);
  persistCacheTimer = setTimeout(() => {
    persistCacheTimer = null;
    try {
      const entries = Array.from(npcVoiceAudioCache.entries()).slice(-MAX_VOICE_CACHE_ENTRIES);
      upsertVoiceEntriesToSqlite(entries);
    } catch {
      // Ignore write failures
    }
  }, 1500);
}

// Per-model cooldown tracker when Free Tier RPM/RPD quota is exhausted (prevents log spam & retries cleanly)
const modelCooldownUntil = new Map<string, number>();
const modelIsDailyExhausted = new Map<string, boolean>();
const inFlightServerTts = new Map<string, Promise<{ audioBase64: string; mimeType: string }>>();

// Background preload queue with gentle spacing so background pre-fetches never burst RPM,
// while live ("high" priority) voice playback bypasses the queue immediately for real-time response!
let preloadSerialQueue: Promise<void> = Promise.resolve();
const MIN_PRELOAD_INTERVAL_MS = 1250;
let lastPreloadCompletedAt = 0;

function enqueuePreloadTts<T>(task: () => Promise<T>): Promise<T> {
  const run = preloadSerialQueue.then(async () => {
    const elapsed = Date.now() - lastPreloadCompletedAt;
    if (elapsed < MIN_PRELOAD_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_PRELOAD_INTERVAL_MS - elapsed));
    }
    try {
      return await task();
    } finally {
      lastPreloadCompletedAt = Date.now();
    }
  });
  preloadSerialQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/**
 * Wraps raw 16-bit little-endian mono PCM bytes into a standard 44-byte RIFF WAVE buffer
 * so streamed PCM audio can also be persisted into `npcVoiceAudioCache` for instant (<2ms) replays.
 */
function buildWavFromPcm(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // PCM fmt chunk size
  header.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

type StreamServerEvent =
  | { type: "pcm"; pcmBase64: string; sampleRate: number }
  | { type: "done" }
  | {
      type: "fallback";
      reason: string;
      retryAfterMs?: number;
    };

interface ServerStreamSession {
  chunks: Array<{ pcmBase64: string; sampleRate: number }>;
  done: boolean;
  started: boolean;
  launchNow?: () => void;
  fallbackEvent: Extract<StreamServerEvent, { type: "fallback" }> | null;
  listeners: Set<(evt: StreamServerEvent) => void>;
}

const activeServerStreams = new Map<string, ServerStreamSession>();

function parseQuotaCooldownMs(errMessage: string): { cooldownMs: number; isDailyQuota: boolean } {
  const isDaily = /per\s*day|PerDay|RequestsPerDay/i.test(errMessage);
  const secMatch =
    errMessage.match(/retry in\s+([\d.]+)s/i) ||
    errMessage.match(/"retryDelay"\s*:\s*"(\d+)s"/i);

  if (isDaily) {
    return { cooldownMs: 15 * 60 * 1000, isDailyQuota: true };
  }
  if (secMatch) {
    const secs = Math.min(60, Math.max(4, Math.ceil(parseFloat(secMatch[1]))));
    return { cooldownMs: secs * 1000, isDailyQuota: false };
  }
  return { cooldownMs: 15_000, isDailyQuota: false };
}

function isQuotaExhaustedError(error: unknown): {
  is429: boolean;
  rawMessage: string;
} {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number })?.status;
  const is429 =
    status === 429 ||
    rawMessage.includes('"code":429') ||
    rawMessage.includes("RESOURCE_EXHAUSTED") ||
    rawMessage.includes("Quota exceeded");
  return { is429, rawMessage };
}

interface NpcVoicePersona {
  voiceName: "Charon" | "Fenrir" | "Puck" | "Kore" | "Zephyr";
  stylePrompt: string;
}

export type TeacherPersonaId = "ibu-zephyr" | "pak-puck" | "ibu-kore" | "pak-charon";

function resolveTeacherFeedbackPersona(
  teacherId: string,
  isCorrect: boolean
): NpcVoicePersona {
  switch (teacherId) {
    case "pak-puck":
      return {
        voiceName: "Puck",
        stylePrompt: isCorrect
          ? "Natural Indonesian elementary school male teacher (suara Pak Guru SD Indonesia yang ramah, muda, sangat ceria, penuh semangat, dan ekspresif), tersenyum bangga memberikan apresiasi antusias seperti guru favorit anak SD saat memuji jawaban hebat murid di kelas, intonasi hidup dan hangat, sama sekali bukan suara robot asisten"
          : "Natural Indonesian elementary school male teacher (suara Pak Guru SD Indonesia yang ramah, ceria, hangat, dan penuh perhatian), menyemangati dan membimbing murid SD dengan lembut serta positif tanpa nada memarahi sedikit pun, ekspresif dan menenangkan seperti guru pengayom anak-anak",
      };
    case "ibu-kore":
      return {
        voiceName: "Kore",
        stylePrompt: isCorrect
          ? "Natural Indonesian elementary school female teacher (suara Ibu Guru SD Indonesia yang sangat ramah, hangat, ceria, dan penuh semangat), memberikan pujian antusias dengan senyum lebar dan nada gembira yang tulus kepada siswa SD yang berhasil menjawab dengan tepat, luwes manusiawi dan bukan suara AI formal"
          : "Natural Indonesian elementary school female teacher (suara Ibu Guru SD Indonesia yang ramah, keibuan, ceria, lembut, dan suportif), memberikan semangat hangat sambil mengingatkan keselamatan diri dengan penuh kasih sayang kepada murid SD agar tetap percaya diri, bukan suara robot",
      };
    case "pak-charon":
      return {
        voiceName: "Charon",
        stylePrompt: isCorrect
          ? "Natural Indonesian elementary school male teacher (suara Bapak Guru wali kelas SD Indonesia yang ramah, ceria, hangat kebapakan, dan bersemangat), memuji keberanian dan kecerdasan murid SD dengan gembira, akrab, serta penuh kebanggaan, intonasi manusia nyata bukan pembaca berita"
          : "Natural Indonesian elementary school male teacher (suara Bapak Guru wali kelas SD Indonesia yang ramah, sabar, ceria, dan hangat kebapakan), membesarkan hati murid SD dengan penuh semangat positif dan membimbing dengan lembut tanpa menghakimi, terdengar sangat manusiawi",
      };
    case "ibu-zephyr":
    default:
      return {
        voiceName: "Zephyr",
        stylePrompt: isCorrect
          ? "Natural Indonesian elementary school female teacher (suara Ibu Guru SD Indonesia yang super ceria, lincah, ramah, dan penuh energi positif), memberikan apresiasi yang sangat semangat dan gembira seperti guru kelas rendah yang merayakan keberhasilan muridnya menjawab benar, intonasi hidup dan menyenangkan"
          : "Natural Indonesian elementary school female teacher (suara Ibu Guru SD Indonesia yang ceria, ramah, bersahabat, dan penuh semangat), menyemangati murid SD dengan nada hangat dan gembira sambil memberi pengingat keselamatan yang mudah dipahami anak-anak, sama sekali tidak memarahi dan bukan suara robot",
      };
  }
}

function resolveOptionNarratorPersona(teacherId: string): NpcVoicePersona {
  const voiceName = resolveTeacherFeedbackPersona(teacherId, true).voiceName;
  return {
    voiceName,
    stylePrompt:
      "Natural, warm, and clear Indonesian elementary school teacher voice (suara guru SD Indonesia yang ramah, jelas, bertempo nyaman, dan bersahabat). Bacakan teks pilihan jawaban ini secara persis kata demi kata dengan intonasi netral dan tenang tanpa memberi petunjuk benar atau salah.",
  };
}

function resolveNpcVoicePersona(npcId: string, mode: "callout" | "dialog"): NpcVoicePersona {
  // Adult male Indonesian stranger / "bapak-bapak yang menawarkan hadiah / membujuk anak"
  // Default across stranger & adult male NPCs per user design direction: natural human Bapak-bapak voice, ZERO robotic/Google-assistant tone
  const deepPersuasiveBapak: NpcVoicePersona = {
    voiceName: "Charon",
    stylePrompt:
      mode === "callout"
        ? "Natural Indonesian middle-aged man (suara bapak-bapak / om-om orang asing usia 40-an), akrab, hangat dibuat-buat, ramah merayu seperti bapak-bapak yang sedang memanggil anak kecil dan menawarkan hadiah atau tumpangan di jalan, intonasi manusia sehari-hari yang luwes, santai, sama sekali bukan suara pembaca berita atau robot asisten"
        : "Natural Indonesian middle-aged man (suara bapak-bapak / om-om orang asing usia 40-an), berbicara kasual meyakinkan dan merayu lembut seperti orang dewasa asing yang sedang membujuk anak kecil dengan hadiah atau ajakan rahasia, logat Indonesia sehari-hari yang sangat hidup dan manusiawi, bukan suara AI formal",
  };

  const gruffOlderBapak: NpcVoicePersona = {
    voiceName: "Fenrir",
    stylePrompt:
      mode === "callout"
        ? "Natural Indonesian older man (suara bapak-bapak usia 45-an agak berat), terdengar sok akrab menyapa anak sekolah dari pinggir jalan atau dekat gerbang, intonasi percakapan sehari-hari Indonesia yang nyata dan natural, bukan suara robot"
        : "Natural Indonesian older man (suara bapak-bapak usia 45-an agak berat), membujuk dengan nada akrab namun sedikit mendesak secara halus ala orang asing di dunia nyata, ekspresif dan manusiawi",
  };

  switch (npcId) {
    case "school-npc-1": // Tamu di Gerbang (mengaku suruhan ayah)
    case "street-npc-3": // Pejalan Kaki asing mengajak lewat gang
    case "class-npc-5": // Orang asing di luar jendela kelas
    case "home-npc-5": // Penelepon asing mengaku teman orang tua
      return gruffOlderBapak;

    case "school-npc-4": // Pengunjung Halaman menawarkan bingkisan hadiah
    case "street-npc-1": // Pengendara Mobil mengajak naik mobil
    case "street-npc-4": // Penjual Warung menawarkan es krim gratis
    case "home-npc-1": // Tamu dewasa di rumah
    case "home-npc-4": // Om Kerabat menawarkan hadiah
    case "school-npc-2": // Petugas Sekolah mengajak ke gudang
    case "class-npc-1": // Pak Guru Pengganti
    case "class-npc-3": // Pria asing menyamar di chat laptop
    case "street-npc-2": // Orang asing menyamar jadi kakak kelas menawarkan hadiah di HP
    case "home-npc-2": // Orang asing menyamar di tablet
    default:
      return deepPersuasiveBapak;
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Real-time native audio synthesis via Gemini Live API (`gemini-3.8-live`).
 * Uses a dedicated WebSocket native audio session (independent from `generateContent` TTS quota)
 * with prebuilt voice persona (`Charon`, `Fenrir`, `Zephyr`, `Puck`, `Kore`) and streams 24kHz 16-bit PCM chunks.
 */
async function streamSpeechViaGeminiLive(
  ai: GoogleGenAI,
  spokenText: string,
  persona: NpcVoicePersona,
  onPcmChunk?: (pcmBytes: Buffer, sampleRate: number) => void
): Promise<{ fullPcm: Buffer; sampleRate: number }> {
  const collectedBuffers: Buffer[] = [];
  let oddByte: Buffer | null = null;
  let detectedSampleRate = 24000;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let liveSession: {
      sendClientContent: (params: unknown) => void;
      close: () => void;
    } | null = null;

    let firstChunkTimer: NodeJS.Timeout | null = null;
    const finish = (err?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      if (firstChunkTimer) clearTimeout(firstChunkTimer);
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // Ignore close error
        }
      }
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    };

    const safetyTimer = setTimeout(() => {
      if (collectedBuffers.length > 0) {
        finish();
      } else {
        finish(new Error("Gemini Live audio synthesis timed out"));
      }
    }, 10_000);

    firstChunkTimer = setTimeout(() => {
      if (collectedBuffers.length === 0) {
        finish(new Error("Gemini Live audio first-chunk timed out"));
      }
    }, 3_500);

    ai.live
      .connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: persona.voiceName,
              },
            },
          },
          systemInstruction:
            "Kamu adalah pengisi suara karakter profesional Bahasa Indonesia untuk game edukasi keselamatan anak SD. " +
            "ATURAN MUTLAK: " +
            "1) Ucapkan HANYA kalimat Bahasa Indonesia yang tertulis di dalam tanda <<< dan >>> secara PERSIS kata demi kata. " +
            "2) DILARANG menambahkan kata pembuka, komentar, jawaban tambahan, atau suara di luar teks tersebut. " +
            `3) Perankan karakter dan emosi suara ini secara hidup, luwes, dan manusiawi: ${persona.stylePrompt}.`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (settled) return;
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              const inlineData = part.inlineData;
              if (!inlineData?.data) continue;

              const rateMatch = inlineData.mimeType?.match(/rate=(\d+)/i);
              if (rateMatch) {
                const parsedRate = Number.parseInt(rateMatch[1], 10);
                if (parsedRate >= 8000 && parsedRate <= 96000) {
                  detectedSampleRate = parsedRate;
                }
              }

              let rawBytes = Buffer.from(inlineData.data, "base64");
              if (
                collectedBuffers.length === 0 &&
                rawBytes.length >= 44 &&
                rawBytes.subarray(0, 4).toString("ascii") === "RIFF"
              ) {
                rawBytes = rawBytes.subarray(44);
              }

              if (oddByte) {
                rawBytes = Buffer.concat([oddByte, rawBytes]);
                oddByte = null;
              }
              if (rawBytes.length % 2 === 1) {
                oddByte = rawBytes.subarray(rawBytes.length - 1);
                rawBytes = rawBytes.subarray(0, rawBytes.length - 1);
              }

              if (rawBytes.length > 0) {
                collectedBuffers.push(rawBytes);
                onPcmChunk?.(rawBytes, detectedSampleRate);
              }
            }

            if (message.serverContent?.turnComplete) {
              finish();
            }
          },
          onerror: (err: unknown) => {
            if (collectedBuffers.length > 0) {
              finish();
            } else {
              finish(err);
            }
          },
          onclose: () => {
            if (collectedBuffers.length > 0) {
              finish();
            } else if (!settled) {
              finish(new Error("Gemini Live WebSocket closed before audio arrived"));
            }
          },
        },
      })
      .then((session) => {
        if (settled) {
          try {
            session.close();
          } catch {
            // Ignore
          }
          return;
        }
        liveSession = session as unknown as {
          sendClientContent: (params: unknown) => void;
          close: () => void;
        };
        session.sendClientContent({
          turns: [
            {
              role: "user",
              parts: [{ text: `<<<${spokenText}>>>` }],
            },
          ],
          turnComplete: true,
        });
      })
      .catch((err) => {
        finish(err);
      });
  });

  return {
    fullPcm: Buffer.concat(collectedBuffers),
    sampleRate: detectedSampleRate,
  };
}

type VoiceEngineId =
  | "gemini-3.8-flash-lite-tts"
  | "gemini-3.8-live"
  | "gemini-3.8-flash-tts";

async function synthesizeSpeechWithFallback(
  ai: GoogleGenAI,
  spokenText: string,
  persona: NpcVoicePersona
): Promise<{ audioBase64: string; mimeType: string } | { quotaCooldownMs: number; isDailyQuota: boolean }> {
  const candidateModels: VoiceEngineId[] = [
    "gemini-3.8-flash-lite-tts",
    "gemini-3.8-live",
    "gemini-3.8-flash-tts",
  ];

  let shortestCooldownMs = 15_000;
  let sawNonDailyModel = false;

  for (const modelName of candidateModels) {
    const cooldownUntil = modelCooldownUntil.get(modelName) || 0;
    const now = Date.now();
    if (cooldownUntil > now) {
      shortestCooldownMs = Math.min(shortestCooldownMs, cooldownUntil - now);
      if (!modelIsDailyExhausted.get(modelName)) {
        sawNonDailyModel = true;
      }
      continue;
    }

    try {
      if (modelName === "gemini-3.8-live") {
        const { fullPcm, sampleRate } = await streamSpeechViaGeminiLive(ai, spokenText, persona);
        if (fullPcm.length > 0) {
          const wavBuffer = buildWavFromPcm(fullPcm, sampleRate);
          return {
            audioBase64: wavBuffer.toString("base64"),
            mimeType: "audio/wav",
          };
        }
        continue;
      }

      const textPayload =
        modelName === "gemini-3.8-flash-tts" ? `<breath> ${spokenText}` : spokenText;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: textPayload,
                speechMetadata: {
                  style: persona.stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: persona.voiceName,
              },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const audioBase64 = inlineData?.data;
      const mimeType = inlineData?.mimeType || "audio/wav";

      if (audioBase64) {
        return { audioBase64, mimeType };
      }
    } catch (err: unknown) {
      const { is429, rawMessage } = isQuotaExhaustedError(err);
      if (is429) {
        const { cooldownMs, isDailyQuota } = parseQuotaCooldownMs(rawMessage);
        modelCooldownUntil.set(modelName, Date.now() + cooldownMs);
        modelIsDailyExhausted.set(modelName, isDailyQuota);
        shortestCooldownMs = Math.min(shortestCooldownMs, cooldownMs);
        if (!isDailyQuota) {
          sawNonDailyModel = true;
        }
        continue;
      }
      // Non-quota error on one engine: try next engine in cascade!
      modelCooldownUntil.set(modelName, Date.now() + 8_000);
      modelIsDailyExhausted.set(modelName, false);
      sawNonDailyModel = true;
      continue;
    }
  }

  return {
    quotaCooldownMs: Math.max(3000, shortestCooldownMs),
    isDailyQuota: !sawNonDailyModel,
  };
}

/**
 * Streams low-latency 16-bit PCM audio chunks across our 3-engine Gemini voice cascade:
 * 1) `gemini-3.8-flash-lite-tts` (`generateContentStream`)
 * 2) `gemini-3.8-live` (`ai.live.connect` real-time native audio WebSocket)
 * 3) `gemini-3.8-flash-tts` (`generateContentStream`)
 * Emits each PCM chunk immediately (~250-350ms time-to-first-audio) and persists the assembled WAV to `npcVoiceAudioCache`.
 */
async function runStreamingSynthesisIntoSession(
  ai: GoogleGenAI,
  cacheKey: string,
  spokenText: string,
  persona: NpcVoicePersona,
  session: ServerStreamSession
): Promise<void> {
  const broadcast = (evt: StreamServerEvent) => {
    for (const listener of session.listeners) {
      try {
        listener(evt);
      } catch {
        // Ignore disconnected client stream
      }
    }
  };

  // Re-check cache in case a parallel path just populated it
  const alreadyCached = npcVoiceAudioCache.get(cacheKey);
  if (alreadyCached && alreadyCached.audioBase64) {
    const rawBuf = Buffer.from(alreadyCached.audioBase64, "base64");
    const pcmSlice =
      rawBuf.length > 44 && rawBuf.subarray(0, 4).toString("ascii") === "RIFF"
        ? rawBuf.subarray(44)
        : rawBuf;
    if (pcmSlice.length > 0) {
      const chunkObj = { pcmBase64: pcmSlice.toString("base64"), sampleRate: 24000 };
      session.chunks.push(chunkObj);
      broadcast({ type: "pcm", ...chunkObj });
    }
    session.done = true;
    broadcast({ type: "done" });
    return;
  }

  const candidateModels: VoiceEngineId[] = [
    "gemini-3.8-flash-lite-tts",
    "gemini-3.8-live",
    "gemini-3.8-flash-tts",
  ];

  let shortestCooldownMs = 15_000;
  let sawNonDailyModel = false;

  const persistCompletedWav = (fullPcm: Buffer, sampleRate: number) => {
    const wavBuffer = buildWavFromPcm(fullPcm, sampleRate);
    if (npcVoiceAudioCache.size >= MAX_VOICE_CACHE_ENTRIES) {
      const oldestKey = npcVoiceAudioCache.keys().next().value;
      if (oldestKey) npcVoiceAudioCache.delete(oldestKey);
    }
    npcVoiceAudioCache.set(cacheKey, {
      audioBase64: wavBuffer.toString("base64"),
      mimeType: "audio/wav",
    });
    schedulePersistVoiceCache();
  };

  for (const modelName of candidateModels) {
    const cooldownUntil = modelCooldownUntil.get(modelName) || 0;
    const now = Date.now();
    if (cooldownUntil > now) {
      shortestCooldownMs = Math.min(shortestCooldownMs, cooldownUntil - now);
      if (!modelIsDailyExhausted.get(modelName)) {
        sawNonDailyModel = true;
      }
      continue;
    }

    if (modelName === "gemini-3.8-live") {
      try {
        const { fullPcm, sampleRate } = await streamSpeechViaGeminiLive(
          ai,
          spokenText,
          persona,
          (pcmBytes, sr) => {
            const chunkObj = {
              pcmBase64: pcmBytes.toString("base64"),
              sampleRate: sr,
            };
            session.chunks.push(chunkObj);
            broadcast({ type: "pcm", ...chunkObj });
          }
        );

        if (fullPcm.length > 0) {
          persistCompletedWav(fullPcm, sampleRate);
          session.done = true;
          broadcast({ type: "done" });
          return;
        }
      } catch (err: unknown) {
        const { is429, rawMessage } = isQuotaExhaustedError(err);
        if (is429 && session.chunks.length === 0) {
          const { cooldownMs, isDailyQuota } = parseQuotaCooldownMs(rawMessage);
          modelCooldownUntil.set(modelName, Date.now() + cooldownMs);
          modelIsDailyExhausted.set(modelName, isDailyQuota);
          shortestCooldownMs = Math.min(shortestCooldownMs, cooldownMs);
          if (!isDailyQuota) {
            sawNonDailyModel = true;
          }
          continue;
        }
        if (session.chunks.length > 0) {
          session.done = true;
          broadcast({ type: "done" });
          return;
        }
        modelCooldownUntil.set(modelName, Date.now() + 8_000);
        modelIsDailyExhausted.set(modelName, false);
        sawNonDailyModel = true;
        continue;
      }
      continue;
    }

    const allPcmBuffers: Buffer[] = [];
    let isFirstChunk = true;
    let oddByte: Buffer | null = null;
    let detectedSampleRate = 24000;

    try {
      const textPayload =
        modelName === "gemini-3.8-flash-tts" ? `<breath> ${spokenText}` : spokenText;

      const stream = await ai.models.generateContentStream({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: textPayload,
                speechMetadata: {
                  style: persona.stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: persona.voiceName,
              },
            },
          },
        },
      });

      for await (const chunk of stream) {
        const inlineData = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inlineData?.data) continue;

        const rateMatch = inlineData.mimeType?.match(/rate=(\d+)/i);
        if (rateMatch) {
          const parsedRate = Number.parseInt(rateMatch[1], 10);
          if (parsedRate >= 8000 && parsedRate <= 96000) {
            detectedSampleRate = parsedRate;
          }
        }

        let rawBytes = Buffer.from(inlineData.data, "base64");
        if (isFirstChunk) {
          isFirstChunk = false;
          if (rawBytes.length >= 44 && rawBytes.subarray(0, 4).toString("ascii") === "RIFF") {
            rawBytes = rawBytes.subarray(44);
          }
        }

        if (oddByte) {
          rawBytes = Buffer.concat([oddByte, rawBytes]);
          oddByte = null;
        }

        if (rawBytes.length % 2 === 1) {
          oddByte = rawBytes.subarray(rawBytes.length - 1);
          rawBytes = rawBytes.subarray(0, rawBytes.length - 1);
        }

        if (rawBytes.length > 0) {
          allPcmBuffers.push(rawBytes);
          const chunkObj = {
            pcmBase64: rawBytes.toString("base64"),
            sampleRate: detectedSampleRate,
          };
          session.chunks.push(chunkObj);
          broadcast({ type: "pcm", ...chunkObj });
        }
      }

      if (allPcmBuffers.length > 0) {
        persistCompletedWav(Buffer.concat(allPcmBuffers), detectedSampleRate);
        session.done = true;
        broadcast({ type: "done" });
        return;
      }
    } catch (err: unknown) {
      const { is429, rawMessage } = isQuotaExhaustedError(err);
      if (is429 && session.chunks.length === 0) {
        const { cooldownMs, isDailyQuota } = parseQuotaCooldownMs(rawMessage);
        modelCooldownUntil.set(modelName, Date.now() + cooldownMs);
        modelIsDailyExhausted.set(modelName, isDailyQuota);
        shortestCooldownMs = Math.min(shortestCooldownMs, cooldownMs);
        if (!isDailyQuota) {
          sawNonDailyModel = true;
        }
        continue;
      }

      if (session.chunks.length > 0) {
        session.done = true;
        broadcast({ type: "done" });
        return;
      }

      // Transient error on this engine before any chunk streamed: try next engine in cascade!
      modelCooldownUntil.set(modelName, Date.now() + 8_000);
      modelIsDailyExhausted.set(modelName, false);
      sawNonDailyModel = true;
      continue;
    }
  }

  const retryMs = Math.max(3000, Math.min(15_000, shortestCooldownMs));
  const quotaFallbackEvt: Extract<StreamServerEvent, { type: "fallback" }> = {
    type: "fallback",
    reason: sawNonDailyModel ? "rate_limited" : "daily_quota_exhausted",
    retryAfterMs: retryMs,
  };
  session.fallbackEvent = quotaFallbackEvt;
  session.done = true;
  broadcast(quotaFallbackEvt);
}

// Safe file reader
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  return defaultValue;
}

// Safe file writer
function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

function parseVoiceRequestParams(body: Record<string, unknown> | undefined) {
  const rawText = typeof body?.text === "string" ? body.text.trim() : "";
  const role: "npc" | "teacher" | "option" =
    body?.role === "teacher"
      ? "teacher"
      : body?.role === "option"
        ? "option"
        : "npc";
  const npcId = typeof body?.npcId === "string" ? body.npcId.trim() : "stranger";
  const mode: "callout" | "dialog" = body?.mode === "dialog" ? "dialog" : "callout";
  const teacherId =
    typeof body?.teacherId === "string" ? body.teacherId.trim() : "ibu-zephyr";
  const isCorrect = Boolean(body?.isCorrect);
  const priority: "high" | "preload" = body?.priority === "preload" ? "preload" : "high";

  const spokenText = rawText
    .replace(/^(Ting!|Kring!)\s*/i, "")
    .slice(0, 480)
    .trim();

  const persona =
    role === "teacher"
      ? resolveTeacherFeedbackPersona(teacherId, isCorrect)
      : role === "option"
        ? resolveOptionNarratorPersona(teacherId)
        : resolveNpcVoicePersona(npcId, mode);

  const cacheDiscriminator =
    role === "teacher"
      ? `teacher|${teacherId}|${isCorrect ? "correct" : "retry"}|${persona.voiceName}`
      : role === "option"
        ? `option|${teacherId}|${persona.voiceName}`
        : `npc|${npcId}|${mode}|${persona.voiceName}`;

  const cacheKey = crypto
    .createHash("sha256")
    .update(`${cacheDiscriminator}|${spokenText}`)
    .digest("hex");

  return { rawText, spokenText, persona, cacheKey, priority };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support large JSON payloads
  app.use(express.json({ limit: "20mb" }));

  // Allow extracted standalone HTML files (opened via file:// or separate host) to reconnect
  // to this Node voice server when internet returns to upgrade custom scenario voices
  app.use(["/api/health", "/api/npc-voice-cache-batch", "/api/npc-voice-stream"], (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  });

  // API Route: Batch Buffer-Pool Cache Hydration on Map Load (returns all server-cached NPC & Teacher WAVs in 1 round-trip)
  app.post("/api/npc-voice-cache-batch", (req, res) => {
    try {
      const rawItems = Array.isArray(req.body?.items) ? req.body.items.slice(0, 48) : [];
      const hits: Record<string, { audioBase64: string; mimeType: string }> = {};

      for (const rawItem of rawItems) {
        if (!rawItem || typeof rawItem !== "object") continue;
        const clientKey =
          typeof (rawItem as { clientKey?: unknown }).clientKey === "string"
            ? ((rawItem as { clientKey: string }).clientKey)
            : "";
        if (!clientKey) continue;

        const { rawText, spokenText, cacheKey } = parseVoiceRequestParams(
          rawItem as Record<string, unknown>
        );
        if (!rawText || !spokenText) continue;

        const cached = npcVoiceAudioCache.get(cacheKey);
        if (cached && cached.audioBase64) {
          hits[clientKey] = {
            audioBase64: cached.audioBase64,
            mimeType: cached.mimeType || "audio/wav",
          };
        }
      }

      return res.json({ hits });
    } catch {
      return res.json({ hits: {} });
    }
  });

  // API Route: Real-Time Streaming PCM Voice Generation (NDJSON chunks for ~350ms first-syllable latency)
  app.post("/api/npc-voice-stream", async (req, res) => {
    const { rawText, spokenText, persona, cacheKey, priority } = parseVoiceRequestParams(req.body);

    if (!rawText || !spokenText) {
      return res.status(400).json({ error: "Teks suara tidak valid." });
    }

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const writeLine = (payload: Record<string, unknown>) => {
      if (!res.writableEnded) {
        res.write(`${JSON.stringify(payload)}\n`);
      }
    };

    // 1. Instant cache hit (< 2ms)
    const cached = npcVoiceAudioCache.get(cacheKey);
    if (cached && cached.audioBase64) {
      writeLine({
        type: "wav",
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType || "audio/wav",
        cached: true,
      });
      writeLine({ type: "done" });
      return res.end();
    }

    const ai = getGeminiClient();
    if (!ai) {
      writeLine({
        type: "fallback",
        reason: "missing_api_key",
      });
      return res.end();
    }

    // 2. Attach to existing active stream (or escalate queued preload stream immediately when priority === "high")
    let session = activeServerStreams.get(cacheKey);
    if (!session) {
      session = {
        chunks: [],
        done: false,
        started: false,
        fallbackEvent: null,
        listeners: new Set(),
      };
      activeServerStreams.set(cacheKey, session);

      const activeSession = session;
      const launchStream = () => {
        if (activeSession.started) return Promise.resolve();
        activeSession.started = true;
        return runStreamingSynthesisIntoSession(
          ai,
          cacheKey,
          spokenText,
          persona,
          activeSession
        ).finally(() => {
          activeServerStreams.delete(cacheKey);
        });
      };
      session.launchNow = () => {
        void launchStream();
      };

      if (priority === "high") {
        // Live user action: run IMMEDIATELY with zero queue wait!
        void launchStream();
      } else {
        // Background preload: gentle serial spacing
        void enqueuePreloadTts(launchStream);
      }
    } else if (priority === "high" && !session.started && session.launchNow) {
      session.launchNow();
    }

    // Replay any chunks that have already arrived on this in-flight session
    for (const existingChunk of session.chunks) {
      writeLine({
        type: "pcm",
        pcmBase64: existingChunk.pcmBase64,
        sampleRate: existingChunk.sampleRate,
      });
    }

    if (session.done) {
      if (session.fallbackEvent) {
        writeLine(session.fallbackEvent);
      } else {
        writeLine({ type: "done" });
      }
      return res.end();
    }

    await new Promise<void>((resolve) => {
      const onEvent = (evt: StreamServerEvent) => {
        if (evt.type === "pcm") {
          writeLine(evt);
        } else if (evt.type === "fallback") {
          writeLine(evt);
          cleanup();
        } else if (evt.type === "done") {
          writeLine({ type: "done" });
          cleanup();
        }
      };

      const cleanup = () => {
        session?.listeners.delete(onEvent);
        resolve();
      };

      res.on("close", cleanup);
      session!.listeners.add(onEvent);
    });

    if (!res.writableEnded) {
      res.end();
    }
  });

  // API Route: Unary JSON NPC & Teacher Voice Generation (kept for backward compatibility)
  app.post("/api/npc-voice", async (req, res) => {
    try {
      const { rawText, spokenText, persona, cacheKey, priority } = parseVoiceRequestParams(
        req.body
      );

      if (!rawText || !spokenText) {
        return res.status(400).json({ error: "Teks dialog suara kosong." });
      }

      const cached = npcVoiceAudioCache.get(cacheKey);
      if (cached) {
        return res.json({
          audioBase64: cached.audioBase64,
          mimeType: cached.mimeType,
          cached: true,
        });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          audioBase64: null,
          fallback: true,
          reason: "missing_api_key",
        });
      }

      const existingFlight = inFlightServerTts.get(cacheKey);
      if (existingFlight) {
        const shared = await existingFlight;
        return res.json({
          audioBase64: shared.audioBase64,
          mimeType: shared.mimeType,
          cached: true,
        });
      }

      const runTask = async () => {
        const recheckCache = npcVoiceAudioCache.get(cacheKey);
        if (recheckCache) {
          return recheckCache;
        }

        const result = await synthesizeSpeechWithFallback(ai, spokenText, persona);
        if ("quotaCooldownMs" in result) {
          const quotaErr = new Error("QUOTA_COOLDOWN") as Error & {
            quotaCooldownMs?: number;
            isDailyQuota?: boolean;
          };
          quotaErr.quotaCooldownMs = result.quotaCooldownMs;
          quotaErr.isDailyQuota = result.isDailyQuota;
          throw quotaErr;
        }

        if (npcVoiceAudioCache.size >= MAX_VOICE_CACHE_ENTRIES) {
          const oldestKey = npcVoiceAudioCache.keys().next().value;
          if (oldestKey) npcVoiceAudioCache.delete(oldestKey);
        }
        npcVoiceAudioCache.set(cacheKey, result);
        schedulePersistVoiceCache();
        return result;
      };

      const synthesisPromise =
        priority === "high" ? runTask() : enqueuePreloadTts(runTask);

      inFlightServerTts.set(cacheKey, synthesisPromise);
      try {
        const generated = await synthesisPromise;
        return res.json({
          audioBase64: generated.audioBase64,
          mimeType: generated.mimeType,
          cached: false,
        });
      } finally {
        inFlightServerTts.delete(cacheKey);
      }
    } catch (error: unknown) {
      const quotaCooldownMs = (error as { quotaCooldownMs?: number })?.quotaCooldownMs;
      if (quotaCooldownMs) {
        const isDailyQuota = Boolean((error as { isDailyQuota?: boolean })?.isDailyQuota);
        return res.json({
          audioBase64: null,
          fallback: true,
          reason: isDailyQuota ? "daily_quota_exhausted" : "rate_limited",
          retryAfterMs: quotaCooldownMs,
        });
      }

      const message =
        error instanceof Error ? error.message : "Gagal menghasilkan suara karakter.";
      console.warn("TTS synthesis fallback triggered:", message.slice(0, 180));
      return res.json({
        audioBase64: null,
        fallback: true,
        reason: "transient_error",
      });
    }
  });

  // API Route: Get student logs from SQLite
  app.get("/api/student_logs", (_req, res) => {
    try {
      res.json(getAllStudentLogsFromSqlite());
    } catch (error) {
      console.error("Failed reading SQLite student logs:", error);
      res.json([]);
    }
  });

  // API Route: Save student log to SQLite (upserts by student name)
  app.post("/api/student_logs", (req, res) => {
    const newLog = req.body;
    if (!newLog || typeof newLog.studentName !== "string" || !newLog.studentName.trim()) {
      return res.status(400).json({ error: "Invalid student log payload" });
    }

    const sanitizedName = newLog.studentName.trim().slice(0, 80);
    const rawId = typeof newLog.id === "string" && newLog.id ? newLog.id : `log-${Date.now()}`;
    const logId = rawId.replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 128) || `log-${Date.now()}`;

    const normalizedLog = {
      id: logId,
      studentName: sanitizedName,
      totalPoints: Math.max(0, Math.min(1000, Number(newLog.totalPoints) || 0)),
      completedScenariosCount: Math.max(0, Math.min(30, Number(newLog.completedScenariosCount) || 0)),
      completedAt:
        typeof newLog.completedAt === "string" && newLog.completedAt
          ? newLog.completedAt.slice(0, 64)
          : new Date().toISOString(),
      history: Array.isArray(newLog.history) ? newLog.history.slice(0, 50) : [],
    };

    const saved = upsertStudentLogToSqlite(normalizedLog);
    res.json({ success: true, log: saved });
  });

  // API Route: Clear all student logs in SQLite
  app.post("/api/student_logs/clear", (_req, res) => {
    clearStudentLogsInSqlite();
    res.json({ success: true });
  });

  // API Route: Get custom designed scenarios from SQLite
  app.get("/api/custom_scenarios", (_req, res) => {
    try {
      res.json(getCustomScenariosFromSqlite());
    } catch (error) {
      console.error("Failed reading SQLite custom scenarios:", error);
      res.json([]);
    }
  });

  // API Route: Save custom designed scenarios to SQLite
  app.post("/api/custom_scenarios", (req, res) => {
    const scenarios = req.body;
    if (!Array.isArray(scenarios)) {
      return res.status(400).json({ error: "Payload must be an array of scenarios" });
    }

    const savedCount = saveCustomScenariosToSqlite(scenarios);
    res.json({ success: true, count: savedCount });
  });

  // API Route: Reset custom scenarios in SQLite
  app.post("/api/custom_scenarios/reset", (_req, res) => {
    resetCustomScenariosInSqlite();
    res.json({ success: true });
  });

  // API Route: Lightweight backend capability check (used to disable /api calls cleanly on static hosts like Netlify)
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, hasBackend: true, storage: "sqlite" });
  });

  const escapeJsonForInlineScript = (value: unknown): string =>
    JSON.stringify(value)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

  const ensureAndBuildStandaloneHtml = async (
    scenariosOverride?: unknown[],
    apiBaseUrl?: string
  ): Promise<string> => {
    if (!fs.existsSync(STANDALONE_HTML_FILE)) {
      if (!standaloneBuildPromise) {
        const { build: buildViteBundle } = await import("vite");
        standaloneBuildPromise = buildViteBundle({
          configFile: path.join(process.cwd(), "vite.standalone.config.ts"),
          logLevel: "warn",
        })
          .then(() => undefined)
          .finally(() => {
            standaloneBuildPromise = null;
          });
      }
      await standaloneBuildPromise;
    }

    if (!fs.existsSync(STANDALONE_HTML_FILE)) {
      throw new Error("Standalone HTML file could not be generated.");
    }

    let htmlContent = fs.readFileSync(STANDALONE_HTML_FILE, "utf-8");

    let scenariosToBake: unknown[] = [];
    if (Array.isArray(scenariosOverride) && scenariosOverride.length > 0) {
      scenariosToBake = scenariosOverride.slice(0, 30);
    } else {
      const savedScenarios = getCustomScenariosFromSqlite();
      if (Array.isArray(savedScenarios) && savedScenarios.length > 0) {
        scenariosToBake = savedScenarios.slice(0, 30);
      }
    }

    const headScripts: string[] = [];
    if (
      typeof apiBaseUrl === "string" &&
      (apiBaseUrl.startsWith("http://") || apiBaseUrl.startsWith("https://"))
    ) {
      htmlContent = htmlContent.replace(
        /<script>window\.__SAFESTEP_API_BASE_URL__\s*=[\s\S]*?<\/script>\s*/i,
        ""
      );
      headScripts.push(
        `<script>window.__SAFESTEP_API_BASE_URL__ = ${escapeJsonForInlineScript(
          apiBaseUrl.replace(/\/+$/, "")
        )};</script>`
      );
    }

    if (scenariosToBake.length > 0) {
      htmlContent = htmlContent.replace(
        /<script>window\.__SAFESTEP_INITIAL_SCENARIOS__\s*=[\s\S]*?<\/script>\s*/i,
        ""
      );
      headScripts.push(
        `<script>window.__SAFESTEP_INITIAL_SCENARIOS__ = ${escapeJsonForInlineScript(
          scenariosToBake
        )};</script>`
      );
    }

    if (headScripts.length > 0) {
      const combinedScripts = headScripts.join("\n    ");
      htmlContent = htmlContent.includes("<head>")
        ? htmlContent.replace("<head>", `<head>\n    ${combinedScripts}`)
        : `${combinedScripts}\n${htmlContent}`;
    }

    return htmlContent;
  };

  // API Route: Download 100% standalone single-file HTML version of the entire app (supports GET and POST with custom scenarios)
  app.get("/api/download-standalone-html", async (req, res) => {
    try {
      const host = req.get("host");
      const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const derivedOrigin = host ? `${String(proto).split(",")[0].trim()}://${host}` : undefined;
      const htmlContent = await ensureAndBuildStandaloneHtml(undefined, derivedOrigin);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="SafeStep-Petualangan-Keselamatan.html"'
      );
      res.setHeader("Cache-Control", "no-store");
      return res.send(htmlContent);
    } catch (error) {
      console.error("Error serving standalone HTML:", error);
      return res.status(500).json({ error: "Failed to build standalone HTML bundle." });
    }
  });

  app.post("/api/download-standalone-html", async (req, res) => {
    try {
      const scenariosOverride = Array.isArray(req.body?.scenarios)
        ? req.body.scenarios
        : undefined;
      const apiBaseUrl =
        typeof req.body?.apiBaseUrl === "string" ? req.body.apiBaseUrl : undefined;
      const htmlContent = await ensureAndBuildStandaloneHtml(scenariosOverride, apiBaseUrl);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="SafeStep-Petualangan-Keselamatan.html"'
      );
      res.setHeader("Cache-Control", "no-store");
      return res.send(htmlContent);
    } catch (error) {
      console.error("Error serving standalone HTML (POST):", error);
      return res.status(500).json({ error: "Failed to build standalone HTML bundle." });
    }
  });

  // API Route: Download lightweight/concise single-file HTML version (~11 KB)
  app.get("/api/download-short-html", (_req, res) => {
    const shortHtmlPath = path.join(process.cwd(), "public", "safestep-singkat.html");
    const distShortHtmlPath = path.join(process.cwd(), "dist", "safestep-singkat.html");
    const targetPath = fs.existsSync(shortHtmlPath) ? shortHtmlPath : distShortHtmlPath;

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "File HTML singkat tidak ditemukan." });
    }

    const htmlContent = fs.readFileSync(targetPath, "utf-8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="SafeStep-Singkat.html"'
    );
    res.setHeader("Cache-Control", "no-store");
    return res.send(htmlContent);
  });

  // Serve static assets in production or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    process.env.DISABLE_HMR ??= "true";
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: "spa",
    });

    // When HMR is disabled, substitute /@vite/client's WebSocket transport with a no-op transport
    // so neither WebSocket connection errors nor "send was called before connect" (e.g. vite-plugin-pwa) occur.
    if (process.env.DISABLE_HMR === "true") {
      app.get("/@vite/client", async (_req, res, next) => {
        try {
          const result = await vite.transformRequest("/@vite/client");
          if (!result?.code) return next();
          const patchedCode = result.code.replace(
            /const transport = normalizeModuleRunnerTransport\([\s\S]*?(?=let willUnload = false;)/,
            `const transport = normalizeModuleRunnerTransport({\n  connect() {},\n  disconnect() {},\n  send() {},\n});\n`
          );
          res.setHeader("Content-Type", "application/javascript; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache");
          return res.send(patchedCode);
        } catch {
          return next();
        }
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
