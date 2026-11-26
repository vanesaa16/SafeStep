/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isStandaloneHtmlMode } from "../firebase";

export type AmbientLocationId = "school" | "class" | "street" | "home";

export interface AmbientProfileInfo {
  id: AmbientLocationId;
  shortLabel: string;
  title: string;
  description: string;
  layersLabel: string;
}

export const AMBIENT_PROFILES: Record<AmbientLocationId, AmbientProfileInfo> = {
  school: {
    id: "school",
    shortLabel: "Kicauan Burung & Angin Pagi",
    title: "Halaman Sekolah",
    description:
      "Kicauan burung pagi bersahutan di pepohonan, semilir angin dedaunan, bel sekolah jauh, dan pantulan bola di lapangan",
    layersLabel: "Burung Pagi · Semilir Daun · Lapangan SD",
  },
  class: {
    id: "class",
    shortLabel: "Jam Dinding & Suasana Kelas",
    title: "Ruang Kelas SD",
    description:
      "Detak jam dinding teratur, goresan kapur di papan tulis, lembaran buku, serta kicau burung redam dari jendela",
    layersLabel: "Detak Jam · Kapur & Buku · Jendela Kelas",
  },
  street: {
    id: "street",
    shortLabel: "Lalu Lintas & Jalan Raya",
    title: "Jalan Pulang Sekolah",
    description:
      "Deru lalu lintas jalan raya, mobil & motor melintas kiri-kanan (efek stereo Doppler), klakson jauh sopan, dan bel sepeda",
    layersLabel: "Mobil & Motor Stereo · Bel Sepeda · Angin Kota",
  },
  home: {
    id: "home",
    shortLabel: "Taman Rumah & Lonceng Angin",
    title: "Lingkungan Rumah",
    description:
      "Suasana rumah sore yang teduh, anggukan burung tekukur taman, lonceng angin teras lembut, dan jangkrik sore",
    layersLabel: "Lonceng Teras · Burung Taman · Angin Sore",
  },
};

const SOUND_ENABLED_KEY = "safekid_sound_enabled";
const MUSIC_ENABLED_KEY = "safekid_music_enabled";
const AMBIENCE_ENABLED_KEY = "safekid_ambience_enabled";
const AMBIENCE_VOLUME_KEY = "safekid_ambience_volume";

interface AmbientSession {
  locationId: AmbientLocationId;
  sessionGain: GainNode;
  disposed: boolean;
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  timers: number[];
}

// Gentle location-adapted melodies with breathing rests (24 steps: 16-step phrase + 8-step calm rest so ambient soundscape shines)
const LOCATION_MELODIES: Record<AmbientLocationId, number[]> = {
  school: [
    329.63, 0, 392.0, 523.25, 440.0, 523.25, 392.0, 0,
    349.23, 440.0, 392.0, 329.63, 293.66, 329.63, 261.63, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  class: [
    523.25, 0, 0, 392.0, 0, 440.0, 0, 329.63,
    0, 349.23, 0, 293.66, 0, 261.63, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  street: [
    293.66, 0, 349.23, 0, 392.0, 440.0, 392.0, 0,
    329.63, 0, 293.66, 0, 261.63, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  home: [
    392.0, 0, 0, 329.63, 0, 261.63, 0, 0,
    349.23, 0, 0, 329.63, 0, 293.66, 261.63, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
};

let sharedAudioContext: AudioContext | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentWebAudioVoiceSource: AudioBufferSourceNode | null = null;
let voicePlaybackToken = 0;
let activeSpeakingCallback: ((speaking: boolean) => void) | null = null;
const externalVoiceStoppers = new Set<() => void>();

export const registerExternalVoiceStopper = (stopper: () => void): (() => void) => {
  externalVoiceStoppers.add(stopper);
  return () => {
    externalVoiceStoppers.delete(stopper);
  };
};

// Studio human teacher audio pools (Ibu Guru & Bapak Guru) — name-neutral offline fallbacks ("Nak")
const TEACHER_CORRECT_AUDIO_POOL = [
  "/audio/ibu_guru_benar_netral_1.wav", // Ibu Guru Zephyr - Hebat sekali, Nak!
  "/audio/pak_guru_benar_netral_1.wav", // Pak Guru Puck - Luar biasa, Nak!
  "/audio/ibu_guru_benar_netral_2.wav", // Ibu Guru Kore - Pintar sekali, Nak!
  "/audio/bapak_guru_benar_netral_1.wav", // Bapak Guru Charon - Bagus sekali, Nak!
];

const TEACHER_RETRY_AUDIO_POOL = [
  "/audio/pak_guru_bimbingan_1.mp3", // Pak Guru Puck - Hati-hati!
  "/audio/ibu_guru_bimbingan_1.mp3", // Ibu Guru Zephyr - Waspada!
  "/audio/ibu_guru_bimbingan_2.mp3", // Ibu Guru Kore - Ingat!
  "/audio/bapak_guru_bimbingan_1.mp3", // Bapak Guru Charon - Bahaya!
];

let correctPoolIndex = 0;
let retryPoolIndex = 0;

// Pre-cached audio instances & decoded Web Audio buffers for zero-delay (0ms) instant playback
const preloadedAudioMap = new Map<string, HTMLAudioElement>();
const decodedFileAudioCache = new Map<string, AudioBuffer>();
const inFlightFileAudioDecode = new Map<string, Promise<AudioBuffer | null>>();

function decodeDataUriToArrayBuffer(dataUri: string): ArrayBuffer | null {
  try {
    const commaIdx = dataUri.indexOf(",");
    if (commaIdx === -1) return null;
    const meta = dataUri.slice(0, commaIdx);
    const body = dataUri.slice(commaIdx + 1);
    if (!meta.includes(";base64")) return null;
    const binary = window.atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    return null;
  }
}

async function decodeUrlToAudioBuffer(
  url: string,
  ctx: AudioContext
): Promise<AudioBuffer | null> {
  if (!url) return null;
  const cached = decodedFileAudioCache.get(url);
  if (cached) return cached;

  const existingFlight = inFlightFileAudioDecode.get(url);
  if (existingFlight) return existingFlight;

  const task = (async (): Promise<AudioBuffer | null> => {
    try {
      let rawBuffer: ArrayBuffer | null = null;
      if (url.startsWith("data:")) {
        rawBuffer = decodeDataUriToArrayBuffer(url);
      } else {
        const res = await fetch(url);
        if (!res.ok) return null;
        const ctype = res.headers.get("content-type") || "";
        if (ctype.includes("text/html")) return null;
        rawBuffer = await res.arrayBuffer();
      }
      if (!rawBuffer || rawBuffer.byteLength === 0) return null;

      const decoded = await ctx.decodeAudioData(rawBuffer.slice(0));
      if (decodedFileAudioCache.size >= 80) {
        const oldestKey = decodedFileAudioCache.keys().next().value;
        if (oldestKey) decodedFileAudioCache.delete(oldestKey);
      }
      decodedFileAudioCache.set(url, decoded);
      return decoded;
    } catch {
      return null;
    } finally {
      inFlightFileAudioDecode.delete(url);
    }
  })();

  inFlightFileAudioDecode.set(url, task);
  return task;
}

export const preloadAudio = (url: string) => {
  if (typeof window === "undefined" || !url) return;
  try {
    const ctx = audioManager?.getDecodingAudioContext?.();
    if (ctx && !decodedFileAudioCache.has(url) && !inFlightFileAudioDecode.has(url)) {
      void decodeUrlToAudioBuffer(url, ctx);
    }
    if (!url.startsWith("data:") && !preloadedAudioMap.has(url)) {
      const audio = new Audio(url);
      audio.preload = "auto";
      preloadedAudioMap.set(url, audio);
    }
  } catch {
    // Ignore preload error
  }
};

// Pre-warm common teacher voice clips (only when served via HTTP/HTTPS, not file:// standalone bundle)
if (typeof window !== "undefined" && !isStandaloneHtmlMode) {
  [...TEACHER_CORRECT_AUDIO_POOL, ...TEACHER_RETRY_AUDIO_POOL].forEach((url) => {
    preloadAudio(url);
  });
}

function playSilentUnlockPulse(ctx: AudioContext): void {
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // Ignore
  }
}

/**
 * Membuka kunci AudioContext browser/HP saat ada sentuhan atau klik pertama dari pemain
 */
export const unlockAudio = () => {
  if (typeof window === "undefined") return;

  if (!sharedAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioContext = new AudioContextClass();
    }
  }

  if (sharedAudioContext) {
    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext
        .resume()
        .then(() => {
          if (sharedAudioContext) {
            playSilentUnlockPulse(sharedAudioContext);
          }
        })
        .catch(() => {});
    } else if (sharedAudioContext.state === "running") {
      playSilentUnlockPulse(sharedAudioContext);
    }
  }
};

/**
 * Menghentikan HTMLAudioElement maupun Web Audio lokal yang sedang diputar tanpa recursion ke external stoppers
 */
export const stopLocalVoiceAudio = () => {
  voicePlaybackToken += 1;
  if (currentWebAudioVoiceSource) {
    try {
      currentWebAudioVoiceSource.onended = null;
      currentWebAudioVoiceSource.stop();
      currentWebAudioVoiceSource.disconnect();
    } catch {
      // Ignore already stopped source
    }
    currentWebAudioVoiceSource = null;
  }
  if (currentAudio) {
    try {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      if (currentAudio.readyState > 0) {
        currentAudio.currentTime = 0;
      }
    } catch {
      // Ignore
    }
    currentAudio = null;
  }
  if (activeSpeakingCallback) {
    const cb = activeSpeakingCallback;
    activeSpeakingCallback = null;
    try {
      cb(false);
    } catch {
      // Ignore
    }
  }
};

/**
 * Menghentikan semua audio suara (baik file MP3/WAV maupun Web Audio NPC/Guru) agar tidak pernah bertumpuk
 */
export const stopAllVoice = () => {
  stopLocalVoiceAudio();
  for (const stopper of externalVoiceStoppers) {
    try {
      stopper();
    } catch {
      // Ignore
    }
  }
};

export interface PlayVoiceOptions {
  role?: "npc" | "teacher";
  isCorrect?: boolean;
}

/**
 * Pemutar Audio Tunggal Non-Bertumpuk (Suara NPC atau Suara Ibu/Bapak Guru asli)
 * Menggunakan Web Audio `AudioBufferSourceNode` sebagai jalur utama agar kebal terhadap blokir autoplay iframe.
 */
export const playVoice = async (
  text: string,
  audioPath?: string,
  onSpeakingChange?: (speaking: boolean) => void,
  options?: PlayVoiceOptions
): Promise<void> => {
  if (typeof window !== "undefined" && localStorage.getItem(SOUND_ENABLED_KEY) === "false") {
    onSpeakingChange?.(false);
    return;
  }

  unlockAudio();
  stopAllVoice();

  const role = options?.role ?? "npc";
  let targetPath = audioPath;

  if (!targetPath) {
    // KRUSIAL: Suara feedback guru HANYA boleh diputar saat role === "teacher" (setelah anak menjawab)!
    if (role !== "teacher") {
      onSpeakingChange?.(false);
      return;
    }

    const isCorrect =
      typeof options?.isCorrect === "boolean"
        ? options.isCorrect
        : (() => {
            const lower = text.toLowerCase();
            return (
              lower.includes("hebat") ||
              lower.includes("pintar") ||
              lower.includes("luar biasa") ||
              lower.includes("berani") ||
              lower.includes("cerdas") ||
              lower.includes("tangguh") ||
              lower.includes("sahabat") ||
              lower.includes("benar") ||
              lower.includes("tepat") ||
              lower.includes("aman")
            );
          })();

    if (isCorrect) {
      targetPath = TEACHER_CORRECT_AUDIO_POOL[correctPoolIndex % TEACHER_CORRECT_AUDIO_POOL.length];
      correctPoolIndex += 1;
    } else {
      targetPath = TEACHER_RETRY_AUDIO_POOL[retryPoolIndex % TEACHER_RETRY_AUDIO_POOL.length];
      retryPoolIndex += 1;
    }
  }

  const myToken = ++voicePlaybackToken;
  activeSpeakingCallback = onSpeakingChange || null;
  onSpeakingChange?.(true);

  const finishPlayback = () => {
    if (myToken !== voicePlaybackToken) return;
    if (activeSpeakingCallback === onSpeakingChange) {
      activeSpeakingCallback = null;
    }
    onSpeakingChange?.(false);
  };

  // Primary Path: Unlocked Web Audio API (bypasses cross-origin iframe HTMLAudioElement autoplay blocks)
  const bus = audioManager.getVoicePlaybackBus();
  if (bus) {
    try {
      if (bus.ctx.state === "suspended") {
        await Promise.race([
          bus.ctx.resume().catch(() => {}),
          new Promise<void>((r) => window.setTimeout(r, 150)),
        ]);
      }
      if (myToken !== voicePlaybackToken) return;

      const audioBuffer = await decodeUrlToAudioBuffer(targetPath, bus.ctx);
      if (myToken !== voicePlaybackToken) return;

      if (audioBuffer) {
        await new Promise<void>((resolve) => {
          try {
            const src = bus.ctx.createBufferSource();
            src.buffer = audioBuffer;
            src.connect(bus.voiceGain);
            currentWebAudioVoiceSource = src;

            let settled = false;
            const cleanup = () => {
              if (settled) return;
              settled = true;
              window.clearTimeout(safetyTimer);
              if (currentWebAudioVoiceSource === src) {
                currentWebAudioVoiceSource = null;
              }
              try {
                src.onended = null;
                src.disconnect();
              } catch {
                // Ignore
              }
              finishPlayback();
              resolve();
            };

            const safetyTimer = window.setTimeout(
              cleanup,
              Math.max(2500, Math.ceil(audioBuffer.duration * 1000) + 1200)
            );
            src.onended = cleanup;
            src.start(bus.ctx.currentTime + 0.005);
          } catch {
            resolve();
          }
        });
        return;
      }
    } catch {
      // Fall through to HTMLAudioElement backup below
    }
  }

  // Secondary Path: HTMLAudioElement fallback
  try {
    preloadAudio(targetPath);
    const audio = new Audio(targetPath);
    if (myToken !== voicePlaybackToken) {
      return;
    }
    currentAudio = audio;

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        if (myToken !== voicePlaybackToken) {
          resolve();
          return;
        }
        if (currentAudio === audio) {
          currentAudio = null;
        }
        finishPlayback();
        resolve();
      };
      audio.onerror = (err) => {
        if (myToken !== voicePlaybackToken) {
          resolve();
          return;
        }
        if (currentAudio === audio) {
          currentAudio = null;
        }
        reject(err);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (myToken !== voicePlaybackToken) {
              try {
                audio.onended = null;
                audio.onerror = null;
                audio.pause();
                if (audio.readyState > 0) {
                  audio.currentTime = 0;
                }
              } catch {
                // Ignore
              }
            }
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  } catch (error) {
    if (myToken === voicePlaybackToken) {
      console.warn(`[Audio] Pemutaran audio (${targetPath}) memerlukan gesture atau gagal:`, error);
      finishPlayback();
    }
  }
};

class SafeStepAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;

  private pinkNoiseBuffer: AudioBuffer | null = null;
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private activeSession: AmbientSession | null = null;
  private desiredLocation: AmbientLocationId | null = null;
  private isDucked = false;

  private playerPos = { x: 50, y: 75 };
  private musicIntervalId: number | null = null;
  private melodyStep = 0;
  private lastFootstepMs = 0;
  private footstepAlt = false;
  private lastCalloutMs = 0;
  private clockTickToggle = false;
  private gestureListenersAttached = false;

  constructor() {
    this.attachUnlockListeners();
  }

  // --- Persistent Audio Preferences ---

  public getSoundEnabled(): boolean {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(SOUND_ENABLED_KEY) !== "false";
  }

  public setSoundEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));

    if (!enabled) {
      if (this.ctx && this.ctx.state === "running") {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      const ctx = this.ensureContext();
      if (ctx) {
        if (ctx.state === "suspended") {
          ctx
            .resume()
            .then(() => {
              this.syncBuses();
              this.ensureAmbientRunning();
            })
            .catch(() => {});
        } else {
          this.syncBuses();
          this.ensureAmbientRunning();
        }
      }
    }
  }

  public getMusicEnabled(): boolean {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(MUSIC_ENABLED_KEY) !== "false";
  }

  public setMusicEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled));
    this.syncBuses();
  }

  public getAmbienceEnabled(): boolean {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(AMBIENCE_ENABLED_KEY) !== "false";
  }

  public setAmbienceEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(AMBIENCE_ENABLED_KEY, String(enabled));
    this.syncBuses();
    if (enabled) {
      this.ensureAmbientRunning();
    } else if (this.activeSession) {
      this.fadeOutSession(this.activeSession);
      this.activeSession = null;
    }
  }

  public getAmbienceVolume(): number {
    if (typeof window === "undefined") return 0.85;
    const raw = localStorage.getItem(AMBIENCE_VOLUME_KEY);
    if (!raw) return 0.85;
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) return 0.85;
    return Math.min(Math.max(parsed, 0), 1);
  }

  public setAmbienceVolume(volume: number): void {
    if (typeof window === "undefined") return;
    const clamped = Math.min(Math.max(volume, 0), 1);
    localStorage.setItem(AMBIENCE_VOLUME_KEY, clamped.toFixed(2));
    this.syncBuses();
  }

  public normalizeLocationId(mapId: string): AmbientLocationId {
    if (mapId === "class" || mapId === "street" || mapId === "home") {
      return mapId;
    }
    return "school";
  }

  public getLocationProfile(mapId: string): AmbientProfileInfo {
    return AMBIENT_PROFILES[this.normalizeLocationId(mapId)];
  }

  public updateSpatialPosition(x: number, y: number): void {
    this.playerPos.x = Math.min(Math.max(x, 0), 100);
    this.playerPos.y = Math.min(Math.max(y, 0), 100);
  }

  public unlockAudioContext(): void {
    unlockAudio();
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          this.syncBuses();
          this.ensureAmbientRunning();
        })
        .catch(() => {});
    } else {
      this.syncBuses();
      this.ensureAmbientRunning();
    }
  }

  /**
   * Returns the shared, gesture-unlocked Web Audio context and dedicated voice mixer bus
   * so NPC & Teacher TTS audio plays instantaneously without HTMLAudioElement autoplay blocks.
   */
  public getVoicePlaybackBus(): { ctx: AudioContext; voiceGain: GainNode } | null {
    if (!this.getSoundEnabled()) return null;
    const ctx = this.ensureContext();
    if (!ctx || !this.voiceGain) return null;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return { ctx, voiceGain: this.voiceGain };
  }

  /**
   * Returns the singleton AudioContext specifically for ahead-of-time AudioBuffer allocation & decoding
   * inside the map-load Buffer Pool (works even while AudioContext is suspended prior to user gesture).
   */
  public getDecodingAudioContext(): AudioContext | null {
    return this.ensureContext();
  }

  /**
   * Plays an imperceptible 32-sample zero-amplitude buffer through `voiceGain` when a map loads
   * so the browser's OS audio output thread is already warm before the first NPC or Teacher speaks.
   */
  public warmUpVoiceGraph(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.voiceGain) return;
    try {
      const silentBuf = ctx.createBuffer(1, 32, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = silentBuf;
      src.connect(this.voiceGain);
      src.start(ctx.currentTime);
    } catch {
      // Ignore pre-gesture warmup errors
    }
  }

  // --- Core Web Audio Initialization & Mixer Buses ---

  private attachUnlockListeners(): void {
    if (this.gestureListenersAttached || typeof window === "undefined") return;
    this.gestureListenersAttached = true;

    const unlock = () => {
      if (!this.getSoundEnabled()) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx
          .resume()
          .then(() => {
            playSilentUnlockPulse(ctx);
            this.syncBuses(true);
            this.ensureAmbientRunning();
          })
          .catch(() => {});
      } else {
        this.syncBuses();
        this.ensureAmbientRunning();
      }
    };

    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("mousedown", unlock, opts);
    window.addEventListener("click", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
    window.addEventListener("touchend", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    this.attachUnlockListeners();

    if (!this.ctx) {
      if (sharedAudioContext) {
        this.ctx = sharedAudioContext;
      } else {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        sharedAudioContext = this.ctx;
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.68, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.92, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(1.38, this.ctx.currentTime);
      this.voiceGain.connect(this.masterGain);

      this.syncBuses(true);

      this.ctx.addEventListener("statechange", () => {
        if (this.ctx?.state === "running" && this.getSoundEnabled()) {
          this.syncBuses(true);
          this.ensureAmbientRunning();
        }
      });
    }

    if (this.ctx.state === "suspended" && this.getSoundEnabled()) {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private getPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.pinkNoiseBuffer) return this.pinkNoiseBuffer;

    const durationSec = 5;
    const length = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Paul Kellet pink-noise filter for warm organic wind, foliage, traffic & room tone
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;

      // Crossfade loop seam over the final 2048 samples so looping never clicks
      data[i] = pink * 0.125;
    }

    const fadeSamples = Math.min(2048, Math.floor(length * 0.05));
    for (let i = 0; i < fadeSamples; i++) {
      const alpha = i / fadeSamples;
      const endIdx = length - fadeSamples + i;
      data[endIdx] = data[endIdx] * (1 - alpha) + data[i] * alpha;
    }

    this.pinkNoiseBuffer = buffer;
    return buffer;
  }

  private getWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.whiteNoiseBuffer) return this.whiteNoiseBuffer;

    const durationSec = 3;
    const length = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.22;
    }
    this.whiteNoiseBuffer = buffer;
    return buffer;
  }

  private syncBuses(immediate = false): void {
    if (!this.ctx || !this.musicGain || !this.ambienceGain) return;
    const now = this.ctx.currentTime;

    // Keep melodic music gentle so the dynamic location soundscape sits clearly & immersively in front
    const musicBase = this.getMusicEnabled() ? (this.isDucked ? 0.07 : 0.24) : 0.0001;
    const ambVol = this.getAmbienceVolume();
    const ambBase =
      this.getAmbienceEnabled() && ambVol > 0.005
        ? ambVol * (this.isDucked ? 0.28 : 1.18)
        : 0.0001;

    if (immediate) {
      this.musicGain.gain.setValueAtTime(musicBase, now);
      this.ambienceGain.gain.setValueAtTime(ambBase, now);
    } else {
      this.musicGain.gain.setTargetAtTime(musicBase, now, 0.1);
      this.ambienceGain.gain.setTargetAtTime(ambBase, now, 0.14);
    }
  }

  public setDucked(ducked: boolean): void {
    this.isDucked = ducked;
    this.ensureContext();
    this.syncBuses();
  }

  // --- Location-Based Dynamic Ambient Soundscape Engine ---

  public setAmbientLocation(mapId: string): void {
    const nextLoc = this.normalizeLocationId(mapId);
    const locationChanged = this.desiredLocation !== nextLoc;
    this.desiredLocation = nextLoc;

    if (locationChanged) {
      this.melodyStep = 0;
    }

    if (
      this.activeSession &&
      this.activeSession.locationId === nextLoc &&
      !this.activeSession.disposed
    ) {
      return;
    }

    // Smooth crossfade out of previous map's soundscape (~1.1s)
    if (this.activeSession) {
      this.fadeOutSession(this.activeSession);
      this.activeSession = null;
    }

    if (!this.getSoundEnabled() || !this.getAmbienceEnabled()) {
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.ambienceGain) return;

    this.activeSession = this.buildSessionForLocation(ctx, this.ambienceGain, nextLoc);
  }

  public stopAmbientSoundscape(): void {
    this.desiredLocation = null;
    if (this.activeSession) {
      this.fadeOutSession(this.activeSession);
      this.activeSession = null;
    }
  }

  /**
   * Plays an immediate signature environmental highlight for the active (or specified) location,
   * useful when testing/previewing location audio in the HUD mixer.
   */
  public previewAmbientCue(mapId?: string): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.ambienceGain) return;

    const loc = mapId ? this.normalizeLocationId(mapId) : this.desiredLocation || "school";
    const target = this.activeSession && !this.activeSession.disposed
      ? this.activeSession.sessionGain
      : this.ambienceGain;

    if (loc === "school") {
      this.triggerMorningSongbirdPhrase(ctx, target, -0.35);
      window.setTimeout(() => {
        if (this.ctx && this.ctx.state === "running") {
          this.triggerMorningSongbirdPhrase(this.ctx, target, 0.45);
        }
      }, 420);
    } else if (loc === "class") {
      this.triggerClassroomFoleyDetail(ctx, target, true);
    } else if (loc === "street") {
      this.triggerPassingVehicle(ctx, target, true, "car");
      window.setTimeout(() => {
        if (this.ctx && this.ctx.state === "running") {
          this.triggerBicycleBell(this.ctx, target, 0.35);
        }
      }, 650);
    } else {
      this.triggerPorchWindChimes(ctx, target);
      window.setTimeout(() => {
        if (this.ctx && this.ctx.state === "running") {
          this.triggerGardenDoveCoo(this.ctx, target, -0.3);
        }
      }, 500);
    }
  }

  private ensureAmbientRunning(): void {
    if (!this.desiredLocation || !this.getSoundEnabled() || !this.getAmbienceEnabled()) return;
    if (
      this.activeSession &&
      this.activeSession.locationId === this.desiredLocation &&
      !this.activeSession.disposed
    ) {
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.ambienceGain) return;

    if (this.activeSession) {
      this.fadeOutSession(this.activeSession);
      this.activeSession = null;
    }
    this.activeSession = this.buildSessionForLocation(ctx, this.ambienceGain, this.desiredLocation);
  }

  private fadeOutSession(session: AmbientSession): void {
    if (session.disposed) return;
    session.disposed = true;

    for (const timerId of session.timers) {
      window.clearTimeout(timerId);
      window.clearInterval(timerId);
    }
    session.timers.length = 0;

    if (this.ctx) {
      const now = this.ctx.currentTime;
      try {
        session.sessionGain.gain.cancelScheduledValues(now);
        session.sessionGain.gain.setTargetAtTime(0.0001, now, 0.28);
      } catch {
        // Ignore
      }
    }

    window.setTimeout(() => {
      for (const src of session.sources) {
        try {
          src.stop();
        } catch {
          // Already stopped
        }
      }
      for (const node of session.nodes) {
        try {
          node.disconnect();
        } catch {
          // Ignore
        }
      }
      try {
        session.sessionGain.disconnect();
      } catch {
        // Ignore
      }
    }, 1250);
  }

  private scheduleRecurring(
    session: AmbientSession,
    minDelayMs: number,
    maxDelayMs: number,
    callback: () => void,
    initialDelayMs?: number
  ): void {
    const queueNext = (delay: number) => {
      if (session.disposed) return;
      const id = window.setTimeout(() => {
        if (session.disposed) return;
        if (
          this.ctx &&
          this.ctx.state === "running" &&
          this.getSoundEnabled() &&
          this.getAmbienceEnabled()
        ) {
          try {
            callback();
          } catch {
            // Ignore transient synth errors
          }
        }
        const nextWait = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
        queueNext(nextWait);
      }, delay);
      session.timers.push(id);
    };

    const firstWait =
      initialDelayMs ?? Math.round(minDelayMs * 0.25 + Math.random() * (maxDelayMs * 0.35));
    queueNext(firstWait);
  }

  private connectWithPan(
    ctx: AudioContext,
    sourceNode: AudioNode,
    destination: AudioNode,
    panValue: number
  ): void {
    // Apply subtle listener-relative stereo shift based on avatar X coordinate
    const listenerBias = ((this.playerPos.x - 50) / 50) * -0.18;
    const finalPan = Math.max(-0.95, Math.min(0.95, panValue + listenerBias));

    if (typeof ctx.createStereoPanner === "function") {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(finalPan, ctx.currentTime);
      sourceNode.connect(panner);
      panner.connect(destination);
    } else {
      sourceNode.connect(destination);
    }
  }

  private buildSessionForLocation(
    ctx: AudioContext,
    targetBus: GainNode,
    locationId: AmbientLocationId
  ): AmbientSession {
    const now = ctx.currentTime;
    const sessionGain = ctx.createGain();
    sessionGain.gain.setValueAtTime(0.0001, now);
    sessionGain.gain.setTargetAtTime(1.0, now, 0.3);
    sessionGain.connect(targetBus);

    const session: AmbientSession = {
      locationId,
      sessionGain,
      disposed: false,
      sources: [],
      nodes: [sessionGain],
      timers: [],
    };

    if (locationId === "school") {
      this.setupSchoolyardAmbience(ctx, session);
    } else if (locationId === "class") {
      this.setupClassroomAmbience(ctx, session);
    } else if (locationId === "street") {
      this.setupStreetAmbience(ctx, session);
    } else {
      this.setupHomeAmbience(ctx, session);
    }

    return session;
  }

  // =========================================================================
  // 1. SCHOOLYARD ("school"): Rich Tropical Songbirds, Rustling Leaves,
  //    Spatial Sports Court Bounce & Distant Morning School Bell
  // =========================================================================

  private triggerMorningSongbirdPhrase(
    ctx: AudioContext,
    destination: AudioNode,
    preferredPan?: number,
    muffledCutoffHz?: number
  ): void {
    const t0 = ctx.currentTime;
    const speciesRoll = Math.random();
    const pan = preferredPan ?? (Math.random() > 0.5 ? -0.58 - Math.random() * 0.25 : 0.48 + Math.random() * 0.32);

    // Spatial boost when player walks near the lush garden trees (bottom-right) or flagpole lawn
    const nearGardenBoost =
      !muffledCutoffHz && this.desiredLocation === "school" && this.playerPos.x > 52 && this.playerPos.y > 55
        ? 1.25
        : 1.0;

    const outBus = ctx.createGain();
    outBus.gain.setValueAtTime(nearGardenBoost, t0);

    if (muffledCutoffHz) {
      const muffle = ctx.createBiquadFilter();
      muffle.type = "lowpass";
      muffle.frequency.setValueAtTime(muffledCutoffHz, t0);
      outBus.connect(muffle);
      this.connectWithPan(ctx, muffle, destination, pan);
    } else {
      this.connectWithPan(ctx, outBus, destination, pan);
    }

    if (speciesRoll < 0.45) {
      // Archetype A: Melodic Kutilang / Bulbul 3-5 note warble ("cuit-ciwit-wiit!")
      const notes = 3 + Math.floor(Math.random() * 3);
      const baseFreq = 2150 + Math.random() * 550;
      let cursor = t0;

      for (let i = 0; i < notes; i++) {
        const dur = 0.085 + Math.random() * 0.055;
        const osc = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        const g = ctx.createGain();

        osc.type = "sine";
        const fStart = baseFreq * (0.95 + (i % 3) * 0.11);
        const fPeak = fStart * (1.24 + Math.random() * 0.16);
        const fEnd = i === notes - 1 ? fPeak * 1.06 : fStart * 0.92;

        osc.frequency.setValueAtTime(fStart, cursor);
        osc.frequency.exponentialRampToValueAtTime(fPeak, cursor + dur * 0.52);
        osc.frequency.exponentialRampToValueAtTime(fEnd, cursor + dur);

        // Syrinx vibrato shimmer
        mod.type = "sine";
        mod.frequency.setValueAtTime(32 + Math.random() * 18, cursor);
        modGain.gain.setValueAtTime(i === notes - 1 ? 85 : 35, cursor);
        mod.connect(modGain);
        modGain.connect(osc.frequency);

        const peakGain = muffledCutoffHz ? 0.036 : 0.095;
        g.gain.setValueAtTime(0.0001, cursor);
        g.gain.linearRampToValueAtTime(peakGain, cursor + 0.016);
        g.gain.exponentialRampToValueAtTime(0.0001, cursor + dur);

        osc.connect(g);
        g.connect(outBus);

        osc.start(cursor);
        mod.start(cursor);
        osc.stop(cursor + dur + 0.02);
        mod.stop(cursor + dur + 0.02);

        cursor += dur + 0.035 + Math.random() * 0.045;
      }
    } else if (speciesRoll < 0.8) {
      // Archetype B: Cheerful Pipit / Finch rapid double-chirp ("cit-cit! cit-cit!")
      const pairs = 2 + Math.floor(Math.random() * 2);
      const base = 2680 + Math.random() * 620;
      for (let p = 0; p < pairs; p++) {
        for (let sub = 0; sub < 2; sub++) {
          const st = t0 + p * 0.23 + sub * 0.075;
          const dur = 0.052;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(base * (sub === 0 ? 1 : 1.14), st);
          osc.frequency.exponentialRampToValueAtTime(base * (sub === 0 ? 1.28 : 1.38), st + 0.028);
          osc.frequency.exponentialRampToValueAtTime(base * 0.96, st + dur);

          const peakGain = muffledCutoffHz ? 0.03 : 0.082;
          g.gain.setValueAtTime(0.0001, st);
          g.gain.linearRampToValueAtTime(peakGain, st + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, st + dur);

          osc.connect(g);
          g.connect(outBus);
          osc.start(st);
          osc.stop(st + dur + 0.015);
        }
      }
    } else {
      // Archetype C: Gentle Morning Singing Trill
      const st = t0;
      const dur = 0.34;
      const osc = ctx.createOscillator();
      const trillLfo = ctx.createOscillator();
      const trillDepth = ctx.createGain();
      const g = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(2420, st);
      osc.frequency.exponentialRampToValueAtTime(2980, st + dur * 0.7);
      osc.frequency.exponentialRampToValueAtTime(2600, st + dur);

      trillLfo.type = "sine";
      trillLfo.frequency.setValueAtTime(24, st);
      trillDepth.gain.setValueAtTime(160, st);
      trillLfo.connect(trillDepth);
      trillDepth.connect(osc.frequency);

      const peakGain = muffledCutoffHz ? 0.026 : 0.072;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(peakGain, st + 0.035);
      g.gain.exponentialRampToValueAtTime(0.0001, st + dur);

      osc.connect(g);
      g.connect(outBus);
      osc.start(st);
      trillLfo.start(st);
      osc.stop(st + dur + 0.02);
      trillLfo.stop(st + dur + 0.02);
    }
  }

  private setupSchoolyardAmbience(ctx: AudioContext, session: AmbientSession): void {
    const now = ctx.currentTime;

    // Layer 1A: Warm outdoor morning air bed
    const airNoise = ctx.createBufferSource();
    airNoise.buffer = this.getPinkNoiseBuffer(ctx);
    airNoise.loop = true;

    const airFilter = ctx.createBiquadFilter();
    airFilter.type = "lowpass";
    airFilter.frequency.setValueAtTime(340, now);

    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.18, now);

    airNoise.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(session.sessionGain);

    // Layer 1B: Rustling schoolyard tree leaves with organic wind swells
    const leafNoise = ctx.createBufferSource();
    leafNoise.buffer = this.getPinkNoiseBuffer(ctx);
    leafNoise.loop = true;

    const leafFilter = ctx.createBiquadFilter();
    leafFilter.type = "bandpass";
    leafFilter.frequency.setValueAtTime(920, now);
    leafFilter.Q.setValueAtTime(0.85, now);

    const leafLfo = ctx.createOscillator();
    const leafLfoFreqDepth = ctx.createGain();
    leafLfo.type = "sine";
    leafLfo.frequency.setValueAtTime(0.14, now);
    leafLfoFreqDepth.gain.setValueAtTime(320, now);
    leafLfo.connect(leafLfoFreqDepth);
    leafLfoFreqDepth.connect(leafFilter.frequency);

    const leafGain = ctx.createGain();
    leafGain.gain.setValueAtTime(0.16, now);

    const gustLfo = ctx.createOscillator();
    const gustDepth = ctx.createGain();
    gustLfo.type = "sine";
    gustLfo.frequency.setValueAtTime(0.09, now);
    gustDepth.gain.setValueAtTime(0.075, now);
    gustLfo.connect(gustDepth);
    gustDepth.connect(leafGain.gain);

    leafNoise.connect(leafFilter);
    leafFilter.connect(leafGain);
    leafGain.connect(session.sessionGain);

    airNoise.start(now);
    leafNoise.start(now, 1.3);
    leafLfo.start(now);
    gustLfo.start(now);

    session.sources.push(airNoise, leafNoise, leafLfo, gustLfo);
    session.nodes.push(
      airFilter,
      airGain,
      leafFilter,
      leafLfoFreqDepth,
      leafGain,
      gustDepth
    );

    // Layer 2: Call-and-response tropical morning songbirds across left & right trees
    this.scheduleRecurring(
      session,
      1300,
      3100,
      () => {
        const firstPan = Math.random() > 0.5 ? -0.65 : 0.62;
        this.triggerMorningSongbirdPhrase(ctx, session.sessionGain, firstPan);

        // 45% chance another bird in the opposite tree answers back naturally!
        if (Math.random() < 0.45) {
          const replyId = window.setTimeout(() => {
            if (!session.disposed && this.ctx && this.ctx.state === "running") {
              this.triggerMorningSongbirdPhrase(
                this.ctx,
                session.sessionGain,
                -firstPan * 0.85
              );
            }
          }, 520 + Math.random() * 420);
          session.timers.push(replyId);
        }
      },
      180 // Immediate welcoming bird song upon entering Halaman Sekolah!
    );

    // Layer 3: Spatial Schoolyard Sports Court (distant basketball dribble on right court)
    // & faint outside-gate vehicle when standing near the school gate
    this.scheduleRecurring(
      session,
      4200,
      7800,
      () => {
        const t0 = ctx.currentTime;
        const nearCourt = this.playerPos.x > 52 && this.playerPos.y < 68;
        const nearGate = this.playerPos.x < 36 && this.playerPos.y > 66;

        if (nearGate && Math.random() < 0.55) {
          // Faint muffled vehicle passing outside the front school gate (left-bottom)
          this.triggerPassingVehicle(ctx, session.sessionGain, true, "car", 0.35);
          return;
        }

        // Subtle rhythmic basketball bounce on the right concrete court (Zona 3)
        const bounces = 2 + Math.floor(Math.random() * 2);
        const courtGainScale = nearCourt ? 1.35 : 0.65;
        for (let i = 0; i < bounces; i++) {
          const st = t0 + i * (0.42 + Math.random() * 0.06);
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(148, st);
          osc.frequency.exponentialRampToValueAtTime(68, st + 0.085);

          g.gain.setValueAtTime(0.0001, st);
          g.gain.linearRampToValueAtTime(0.048 * courtGainScale, st + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0001, st + 0.095);

          osc.connect(g);
          this.connectWithPan(ctx, g, session.sessionGain, 0.68);
          osc.start(st);
          osc.stop(st + 0.11);
        }
      },
      2200
    );

    // Layer 4: Occasional warm distant school bell chime from the main building corridor
    this.scheduleRecurring(
      session,
      9500,
      16000,
      () => {
        const t0 = ctx.currentTime;
        const notes = [659.25, 783.99, 987.77]; // E5 -> G5 -> B5 gentle school chime
        notes.forEach((freq, idx) => {
          const start = t0 + idx * 0.26;
          const osc = ctx.createOscillator();
          const overtone = ctx.createOscillator();
          const g = ctx.createGain();
          const og = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, start);
          overtone.type = "sine";
          overtone.frequency.setValueAtTime(freq * 2.0, start);

          og.gain.setValueAtTime(0.008, start);
          og.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

          g.gain.setValueAtTime(0.0001, start);
          g.gain.linearRampToValueAtTime(0.034, start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, start + 0.95);

          osc.connect(g);
          overtone.connect(og);
          og.connect(g);
          this.connectWithPan(ctx, g, session.sessionGain, -0.15);

          osc.start(start);
          overtone.start(start);
          osc.stop(start + 1.0);
          overtone.stop(start + 0.5);
        });
      },
      4800
    );
  }

  // =========================================================================
  // 2. CLASSROOM ("class"): Cozy Wall Clock Tick-Tock, Chalk on Blackboard,
  //    Notebook Page Rustle & Muffled Window Birdsong
  // =========================================================================

  private triggerClassroomFoleyDetail(
    ctx: AudioContext,
    destination: AudioNode,
    forceBoth = false
  ): void {
    const t0 = ctx.currentTime;
    const roll = Math.random();

    if (forceBoth || roll < 0.45) {
      // Crisp textbook / notebook page turn
      const src = ctx.createBufferSource();
      src.buffer = this.getPinkNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(980, t0);
      filter.frequency.exponentialRampToValueAtTime(2350, t0 + 0.11);
      filter.frequency.exponentialRampToValueAtTime(1050, t0 + 0.25);
      filter.Q.setValueAtTime(1.35, t0);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.115, t0 + 0.045);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);

      src.connect(filter);
      filter.connect(g);
      this.connectWithPan(ctx, g, destination, (Math.random() - 0.5) * 0.65);
      src.start(t0, Math.random() * 2.0, 0.29);
    }

    if (forceBoth || roll >= 0.45) {
      // Chalk writing strokes on front blackboard
      const offset = forceBoth ? 0.32 : 0;
      const strokes = 3 + Math.floor(Math.random() * 3);
      const pan = (Math.random() - 0.5) * 0.5;
      for (let i = 0; i < strokes; i++) {
        const st = t0 + offset + i * (0.085 + Math.random() * 0.045);
        const dur = 0.055 + Math.random() * 0.03;
        const src = ctx.createBufferSource();
        src.buffer = this.getWhiteNoiseBuffer(ctx);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(2050 + Math.random() * 520, st);
        filter.Q.setValueAtTime(3.4, st);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, st);
        g.gain.linearRampToValueAtTime(0.068, st + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, st + dur);

        src.connect(filter);
        filter.connect(g);
        this.connectWithPan(ctx, g, destination, pan);
        src.start(st, Math.random() * 1.5, dur + 0.02);
      }
    }
  }

  private setupClassroomAmbience(ctx: AudioContext, session: AmbientSession): void {
    const now = ctx.currentTime;

    // Layer 1: Warm enclosed classroom acoustic tone
    const roomNoise = ctx.createBufferSource();
    roomNoise.buffer = this.getPinkNoiseBuffer(ctx);
    roomNoise.loop = true;

    const roomLowpass = ctx.createBiquadFilter();
    roomLowpass.type = "lowpass";
    roomLowpass.frequency.setValueAtTime(250, now);

    const roomGain = ctx.createGain();
    roomGain.gain.setValueAtTime(0.17, now);

    // Subtle calm indoor study room resonance
    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = "bandpass";
    murmurFilter.frequency.setValueAtTime(420, now);
    murmurFilter.Q.setValueAtTime(2.6, now);

    const murmurGain = ctx.createGain();
    murmurGain.gain.setValueAtTime(0.052, now);

    const murmurLfo = ctx.createOscillator();
    const murmurLfoDepth = ctx.createGain();
    murmurLfo.type = "sine";
    murmurLfo.frequency.setValueAtTime(0.22, now);
    murmurLfoDepth.gain.setValueAtTime(0.02, now);
    murmurLfo.connect(murmurLfoDepth);
    murmurLfoDepth.connect(murmurGain.gain);

    roomNoise.connect(roomLowpass);
    roomLowpass.connect(roomGain);
    roomGain.connect(session.sessionGain);

    roomNoise.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(session.sessionGain);

    roomNoise.start(now);
    murmurLfo.start(now);
    session.sources.push(roomNoise, murmurLfo);
    session.nodes.push(roomLowpass, roomGain, murmurFilter, murmurGain, murmurLfoDepth);

    // Layer 2: Steady cozy classroom wall clock tick-tock (every 1s)
    const triggerClockTick = () => {
      if (
        session.disposed ||
        !this.ctx ||
        this.ctx.state !== "running" ||
        !this.getSoundEnabled() ||
        !this.getAmbienceEnabled()
      ) {
        return;
      }
      this.clockTickToggle = !this.clockTickToggle;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(this.clockTickToggle ? 1240 : 960, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.024);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1150, t);
      filter.Q.setValueAtTime(1.9, t);

      g.gain.setValueAtTime(0.052, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);

      osc.connect(filter);
      filter.connect(g);
      this.connectWithPan(ctx, g, session.sessionGain, 0.32);

      osc.start(t);
      osc.stop(t + 0.036);
    };

    const firstClockId = window.setTimeout(triggerClockTick, 200);
    const clockInterval = window.setInterval(triggerClockTick, 1000);
    session.timers.push(firstClockId, clockInterval);

    // Layer 3: Chalk strokes & textbook page rustle
    this.scheduleRecurring(
      session,
      2300,
      4600,
      () => {
        this.triggerClassroomFoleyDetail(ctx, session.sessionGain, false);
      },
      350
    );

    // Layer 4: Faint muffled outdoor birdsong drifting through left classroom window
    this.scheduleRecurring(
      session,
      4800,
      8600,
      () => {
        this.triggerMorningSongbirdPhrase(ctx, session.sessionGain, -0.72, 1250);
      },
      1900
    );
  }

  // =========================================================================
  // 3. STREET ("street"): Dynamic Urban Traffic Bed, Stereo Doppler Cars &
  //    Motorcycles, Polite Distant Horn & Friendly Bicycle Bell
  // =========================================================================

  private triggerPassingVehicle(
    ctx: AudioContext,
    destination: AudioNode,
    leftToRight: boolean,
    vehicleType: "car" | "scooter",
    distanceScale = 1.0
  ): void {
    const t0 = ctx.currentTime;
    const dur =
      vehicleType === "car"
        ? 2.2 + Math.random() * 0.65
        : 1.75 + Math.random() * 0.45;
    const peakTime = t0 + dur * 0.46;

    // Shared stereo panner sweeping smoothly across the road
    const vehicleBus = ctx.createGain();
    vehicleBus.gain.setValueAtTime(distanceScale, t0);

    if (typeof ctx.createStereoPanner === "function") {
      const panner = ctx.createStereoPanner();
      const startPan = leftToRight ? -0.92 : 0.92;
      const endPan = leftToRight ? 0.92 : -0.92;
      panner.pan.setValueAtTime(startPan, t0);
      panner.pan.linearRampToValueAtTime(endPan, t0 + dur);
      vehicleBus.connect(panner);
      panner.connect(destination);
    } else {
      vehicleBus.connect(destination);
    }

    // 1. Tire-on-asphalt aerodynamic Doppler whoosh
    const tireSrc = ctx.createBufferSource();
    tireSrc.buffer = this.getPinkNoiseBuffer(ctx);

    const tireFilter = ctx.createBiquadFilter();
    tireFilter.type = "bandpass";
    tireFilter.frequency.setValueAtTime(vehicleType === "car" ? 210 : 310, t0);
    tireFilter.frequency.exponentialRampToValueAtTime(
      vehicleType === "car" ? 690 : 880,
      peakTime
    );
    tireFilter.frequency.exponentialRampToValueAtTime(
      vehicleType === "car" ? 175 : 240,
      t0 + dur
    );
    tireFilter.Q.setValueAtTime(0.85, t0);

    const tireGain = ctx.createGain();
    tireGain.gain.setValueAtTime(0.0001, t0);
    tireGain.gain.linearRampToValueAtTime(
      vehicleType === "car" ? 0.2 : 0.13,
      peakTime
    );
    tireGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    tireSrc.connect(tireFilter);
    tireFilter.connect(tireGain);
    tireGain.connect(vehicleBus);
    tireSrc.start(t0, Math.random() * 1.8, dur + 0.05);

    // 2. Realistic Engine Harmonic with True Acoustic Doppler Pitch Shift
    const engineOsc = ctx.createOscillator();
    const engineFilter = ctx.createBiquadFilter();
    const engineGain = ctx.createGain();

    if (vehicleType === "car") {
      const baseHz = 95 + Math.random() * 28;
      engineOsc.type = "sawtooth";
      engineOsc.frequency.setValueAtTime(baseHz * 1.14, t0);
      engineOsc.frequency.linearRampToValueAtTime(baseHz * 1.06, peakTime - 0.12);
      // Doppler drop as car passes the child on the sidewalk
      engineOsc.frequency.exponentialRampToValueAtTime(baseHz * 0.84, peakTime + 0.28);
      engineOsc.frequency.exponentialRampToValueAtTime(baseHz * 0.78, t0 + dur);

      engineFilter.type = "lowpass";
      engineFilter.frequency.setValueAtTime(220, t0);
      engineFilter.frequency.exponentialRampToValueAtTime(380, peakTime);
      engineFilter.frequency.exponentialRampToValueAtTime(170, t0 + dur);

      engineGain.gain.setValueAtTime(0.0001, t0);
      engineGain.gain.linearRampToValueAtTime(0.055, peakTime);
      engineGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    } else {
      // Indonesian afternoon scooter / motorcycle ("motor lewat") with gentle throttle flutter
      const baseHz = 155 + Math.random() * 42;
      engineOsc.type = "triangle";
      engineOsc.frequency.setValueAtTime(baseHz * 1.15, t0);
      engineOsc.frequency.linearRampToValueAtTime(baseHz * 1.07, peakTime - 0.1);
      engineOsc.frequency.exponentialRampToValueAtTime(baseHz * 0.83, peakTime + 0.24);
      engineOsc.frequency.exponentialRampToValueAtTime(baseHz * 0.77, t0 + dur);

      const flutterLfo = ctx.createOscillator();
      const flutterDepth = ctx.createGain();
      flutterLfo.type = "sine";
      flutterLfo.frequency.setValueAtTime(26 + Math.random() * 8, t0);
      flutterDepth.gain.setValueAtTime(14, t0);
      flutterLfo.connect(flutterDepth);
      flutterDepth.connect(engineOsc.frequency);
      flutterLfo.start(t0);
      flutterLfo.stop(t0 + dur + 0.04);

      engineFilter.type = "bandpass";
      engineFilter.frequency.setValueAtTime(340, t0);
      engineFilter.frequency.exponentialRampToValueAtTime(580, peakTime);
      engineFilter.frequency.exponentialRampToValueAtTime(260, t0 + dur);
      engineFilter.Q.setValueAtTime(1.3, t0);

      engineGain.gain.setValueAtTime(0.0001, t0);
      engineGain.gain.linearRampToValueAtTime(0.072, peakTime);
      engineGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    }

    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(vehicleBus);

    engineOsc.start(t0);
    engineOsc.stop(t0 + dur + 0.04);
  }

  private triggerBicycleBell(
    ctx: AudioContext,
    destination: AudioNode,
    pan = 0.4
  ): void {
    const t0 = ctx.currentTime;
    [0, 0.13].forEach((offset) => {
      const st = t0 + offset;
      [1567.98, 2349.32].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, st);

        g.gain.setValueAtTime(0.0001, st);
        g.gain.linearRampToValueAtTime(idx === 0 ? 0.052 : 0.032, st + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.34);

        osc.connect(g);
        this.connectWithPan(ctx, g, destination, pan);
        osc.start(st);
        osc.stop(st + 0.37);
      });
    });
  }

  private triggerDistantPoliteHorn(
    ctx: AudioContext,
    destination: AudioNode,
    pan: number
  ): void {
    const t0 = ctx.currentTime;
    // Soft, friendly distant two-tap car/scooter horn ("tit-tit") filtered warmly so it never startles children
    [0, 0.17].forEach((offset, idx) => {
      const st = t0 + offset;
      const dur = idx === 0 ? 0.1 : 0.14;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(680, st);
      filter.Q.setValueAtTime(1.5, st);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(0.038, st + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, st + dur);

      [415.3, 523.25].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, st);
        osc.connect(filter);
        osc.start(st);
        osc.stop(st + dur + 0.02);
      });

      filter.connect(g);
      this.connectWithPan(ctx, g, destination, pan);
    });
  }

  private setupStreetAmbience(ctx: AudioContext, session: AmbientSession): void {
    const now = ctx.currentTime;

    // Layer 1: Continuous urban roadside traffic rumble + afternoon sidewalk air
    const roadNoise = ctx.createBufferSource();
    roadNoise.buffer = this.getPinkNoiseBuffer(ctx);
    roadNoise.loop = true;

    const roadLowpass = ctx.createBiquadFilter();
    roadLowpass.type = "lowpass";
    roadLowpass.frequency.setValueAtTime(360, now);

    const roadGain = ctx.createGain();
    roadGain.gain.setValueAtTime(0.28, now);

    const trafficSwellLfo = ctx.createOscillator();
    const trafficSwellDepth = ctx.createGain();
    trafficSwellLfo.type = "sine";
    trafficSwellLfo.frequency.setValueAtTime(0.11, now);
    trafficSwellDepth.gain.setValueAtTime(0.06, now);
    trafficSwellLfo.connect(trafficSwellDepth);
    trafficSwellDepth.connect(roadGain.gain);

    roadNoise.connect(roadLowpass);
    roadLowpass.connect(roadGain);
    roadGain.connect(session.sessionGain);

    roadNoise.start(now);
    trafficSwellLfo.start(now);
    session.sources.push(roadNoise, trafficSwellLfo);
    session.nodes.push(roadLowpass, roadGain, trafficSwellDepth);

    // Layer 2: Passing cars & scooters with stereo pan & Doppler pitch shift
    this.scheduleRecurring(
      session,
      2100,
      4600,
      () => {
        const leftToRight = Math.random() > 0.5;
        const vType = Math.random() > 0.45 ? "car" : "scooter";
        // Slightly louder when walking closer to the asphalt roadway vs upper sidewalk
        const proximityScale = this.playerPos.y > 58 ? 1.15 : 0.9;
        this.triggerPassingVehicle(ctx, session.sessionGain, leftToRight, vType, proximityScale);
      },
      220 // Immediate passing vehicle upon entering Jalan Pulang!
    );

    // Layer 3: Bicycle bells, polite distant car horn, & roadside tree sparrows
    this.scheduleRecurring(
      session,
      4400,
      8200,
      () => {
        const roll = Math.random();
        if (roll < 0.42) {
          this.triggerBicycleBell(ctx, session.sessionGain, (Math.random() - 0.5) * 1.1);
        } else if (roll < 0.75) {
          this.triggerDistantPoliteHorn(
            ctx,
            session.sessionGain,
            Math.random() > 0.5 ? -0.65 : 0.65
          );
        } else {
          this.triggerMorningSongbirdPhrase(ctx, session.sessionGain, -0.5, 2400);
        }
      },
      1500
    );
  }

  // =========================================================================
  // 4. HOME ("home"): Warm Sanctuary Pad, Porch Wind Chimes, Peaceful
  //    Afternoon Garden Dove ("Tekukur Sore") & Soft Afternoon Shimmer
  // =========================================================================

  private triggerPorchWindChimes(ctx: AudioContext, destination: AudioNode): void {
    const chimeScale = [783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98]; // G5, A5, C6, D6, E6, G6
    const t0 = ctx.currentTime;
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const st = t0 + i * (0.21 + Math.random() * 0.16);
      const freq = chimeScale[Math.floor(Math.random() * chimeScale.length)];
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const g = ctx.createGain();
      const hg = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, st);

      harmonic.type = "sine";
      harmonic.frequency.setValueAtTime(freq * 2.76, st); // Delicate metallic/bamboo wind-chime overtone
      hg.gain.setValueAtTime(0.008, st);
      hg.gain.exponentialRampToValueAtTime(0.0001, st + 0.35);

      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(0.048, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 1.45);

      osc.connect(g);
      harmonic.connect(hg);
      hg.connect(g);
      this.connectWithPan(ctx, g, destination, 0.35 + (Math.random() - 0.5) * 0.45);

      osc.start(st);
      harmonic.start(st);
      osc.stop(st + 1.5);
      harmonic.stop(st + 0.4);
    }
  }

  private triggerGardenDoveCoo(
    ctx: AudioContext,
    destination: AudioNode,
    pan = -0.4
  ): void {
    const t0 = ctx.currentTime;
    // Authentic peaceful Indonesian afternoon dove ("kur-kuuu-kur")
    const syllables = [
      { delay: 0, dur: 0.18, fStart: 510, fPeak: 575, fEnd: 520, gain: 0.036 },
      { delay: 0.24, dur: 0.36, fStart: 540, fPeak: 615, fEnd: 495, gain: 0.048 },
      { delay: 0.68, dur: 0.24, fStart: 495, fPeak: 530, fEnd: 465, gain: 0.032 },
    ];

    syllables.forEach((s) => {
      const st = t0 + s.delay;
      const osc = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const g = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(s.fStart, st);
      osc.frequency.exponentialRampToValueAtTime(s.fPeak, st + s.dur * 0.4);
      osc.frequency.exponentialRampToValueAtTime(s.fEnd, st + s.dur);

      // Gentle throat purr on the first syllable
      mod.type = "sine";
      mod.frequency.setValueAtTime(28, st);
      modGain.gain.setValueAtTime(s.delay === 0 ? 18 : 6, st);
      mod.connect(modGain);
      modGain.connect(osc.frequency);

      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(s.gain, st + 0.035);
      g.gain.exponentialRampToValueAtTime(0.0001, st + s.dur);

      osc.connect(g);
      this.connectWithPan(ctx, g, destination, pan);

      osc.start(st);
      mod.start(st);
      osc.stop(st + s.dur + 0.02);
      mod.stop(st + s.dur + 0.02);
    });
  }

  private setupHomeAmbience(ctx: AudioContext, session: AmbientSession): void {
    const now = ctx.currentTime;

    // Layer 1: Whisper-soft peaceful residential garden breeze
    const airNoise = ctx.createBufferSource();
    airNoise.buffer = this.getPinkNoiseBuffer(ctx);
    airNoise.loop = true;

    const airFilter = ctx.createBiquadFilter();
    airFilter.type = "lowpass";
    airFilter.frequency.setValueAtTime(240, now);

    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.13, now);

    airNoise.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(session.sessionGain);
    airNoise.start(now);

    // Layer 2: Warm calming home sanctuary harmonic pad (C4 + G4 + E5 gentle breathing)
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.setValueAtTime(460, now);

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.03, now);

    const padLfo = ctx.createOscillator();
    const padLfoDepth = ctx.createGain();
    padLfo.type = "sine";
    padLfo.frequency.setValueAtTime(0.1, now);
    padLfoDepth.gain.setValueAtTime(0.011, now);
    padLfo.connect(padLfoDepth);
    padLfoDepth.connect(padGain.gain);

    const droneC = ctx.createOscillator();
    droneC.type = "sine";
    droneC.frequency.setValueAtTime(261.63, now); // C4

    const droneG = ctx.createOscillator();
    droneG.type = "sine";
    droneG.frequency.setValueAtTime(392.0, now); // G4

    droneC.connect(padFilter);
    droneG.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(session.sessionGain);

    droneC.start(now);
    droneG.start(now);
    padLfo.start(now);

    session.sources.push(airNoise, droneC, droneG, padLfo);
    session.nodes.push(airFilter, airGain, padFilter, padGain, padLfoDepth);

    // Layer 3: Delicate porch pentatonic wind chimes
    this.scheduleRecurring(
      session,
      3000,
      5800,
      () => {
        this.triggerPorchWindChimes(ctx, session.sessionGain);
      },
      220 // Immediate welcoming wind chimes upon arriving Home!
    );

    // Layer 4: Peaceful afternoon garden dove & subtle dusk cricket pulse
    this.scheduleRecurring(
      session,
      5800,
      10500,
      () => {
        if (Math.random() < 0.65) {
          this.triggerGardenDoveCoo(ctx, session.sessionGain, -0.42);
        } else {
          // Soft peaceful afternoon yard cricket pulse (gentle, low volume)
          const t0 = ctx.currentTime;
          for (let i = 0; i < 3; i++) {
            const st = t0 + i * 0.085;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(3950, st);
            g.gain.setValueAtTime(0.0001, st);
            g.gain.linearRampToValueAtTime(0.018, st + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, st + 0.055);
            osc.connect(g);
            this.connectWithPan(ctx, g, session.sessionGain, -0.55);
            osc.start(st);
            osc.stop(st + 0.065);
          }
        }
      },
      1800
    );
  }

  // --- Background Melody Loop (Location-Adaptive & Non-Masking) ---

  private playMarimbaStep(ctx: AudioContext, targetGain: GainNode, step: number): void {
    const loc = this.desiredLocation || "school";
    const pattern = LOCATION_MELODIES[loc];
    const idx = step % pattern.length;
    const f = pattern[idx];
    const now = ctx.currentTime;

    const isCalmIndoor = loc === "home" || loc === "class";
    const noteGainPeak = loc === "class" ? 0.036 : loc === "home" ? 0.04 : 0.052;
    const cutoff = loc === "home" ? 740 : loc === "class" ? 840 : 1080;

    if (f > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = isCalmIndoor ? "sine" : "triangle";
      osc.frequency.setValueAtTime(f, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoff, now);

      gain.gain.setValueAtTime(noteGainPeak, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(targetGain);

      osc.start(now);
      osc.stop(now + 0.4);
    }

    // Play warm bass root only during active phrase bars (steps 0..15), leaving steps 16..23 open for pure ambience
    if (idx < 16) {
      const bassMap: Record<number, number> = {
        0: 130.81, // C3
        4: 110.0, // A2
        8: 87.31, // F2
        12: 98.0, // G2
      };
      const bassFreq = bassMap[idx];
      if (bassFreq) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(bassFreq, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(280, now);

        gain.gain.setValueAtTime(isCalmIndoor ? 0.042 : 0.062, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(targetGain);

        osc.start(now);
        osc.stop(now + 0.85);
      }
    }
  }

  public startBackgroundMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    this.syncBuses();
    if (this.musicIntervalId !== null) return;

    this.musicIntervalId = window.setInterval(() => {
      if (
        !this.getSoundEnabled() ||
        !this.getMusicEnabled() ||
        !this.ctx ||
        this.ctx.state !== "running" ||
        !this.musicGain
      ) {
        return;
      }
      this.playMarimbaStep(this.ctx, this.musicGain, this.melodyStep);
      this.melodyStep = (this.melodyStep + 1) % 24;
    }, 280);
  }

  public stopBackgroundMusic(): void {
    if (this.musicIntervalId !== null) {
      window.clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  // --- Interactive Sound Effects (Surface-Aware Footsteps & Game Events) ---

  public playFootstepSFX(x?: number, y?: number): void {
    if (typeof x === "number" && typeof y === "number") {
      this.updateSpatialPosition(x, y);
    }

    if (!this.getSoundEnabled()) return;
    const nowPerf = performance.now();
    if (nowPerf - this.lastFootstepMs < 245) return;
    this.lastFootstepMs = nowPerf;
    this.footstepAlt = !this.footstepAlt;

    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running" || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const loc = this.desiredLocation || "school";
      const px = this.playerPos.x;
      const py = this.playerPos.y;

      // Determine ground material under the student's shoes
      const isGrassZone =
        loc === "school" &&
        ((px < 42 && py > 28 && py < 66) || (px > 56 && py > 62));

      if (isGrassZone) {
        // Soft grass rustle footstep on school lawn / garden
        const src = ctx.createBufferSource();
        src.buffer = this.getPinkNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(this.footstepAlt ? 1350 : 1550, now);
        filter.Q.setValueAtTime(1.6, now);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.048, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

        src.connect(filter);
        filter.connect(g);
        g.connect(this.sfxGain);
        src.start(now, Math.random() * 1.5, 0.075);
        return;
      }

      const isAsphaltOrPaving = loc === "street" || loc === "school";
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isAsphaltOrPaving ? "triangle" : "sine";

      const pitch = isAsphaltOrPaving
        ? this.footstepAlt
          ? 172
          : 202
        : this.footstepAlt
        ? 235
        : 268;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(isAsphaltOrPaving ? 82 : 128, now + 0.045);

      gain.gain.setValueAtTime(isAsphaltOrPaving ? 0.036 : 0.026, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch {
      // Ignore
    }
  }

  public playUiClickSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.055);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  public playTapRippleSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.09);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  public playDoorTransitionSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.13);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore
    }
  }

  public playBagUnzipSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      [480, 560, 660].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);
        gain.gain.setValueAtTime(0.055, now + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.07);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.08);
      });
    } catch {
      // Ignore
    }
  }

  public playNpcGreetSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + idx * 0.055);
        gain.gain.setValueAtTime(0.09, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.055 + 0.24);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.26);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Soft, friendly, non-spoiler proximity callout chime when player enters an NPC's 3-4m collider.
   */
  public playNpcCalloutCueSFX(npcId: string, panOffset = 0): void {
    if (!this.getSoundEnabled()) return;
    const nowPerf = performance.now();
    if (nowPerf - this.lastCalloutMs < 320) return;
    this.lastCalloutMs = nowPerf;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const clampedPan = Math.max(-0.65, Math.min(0.65, panOffset));

      const isHomePhone = npcId === "home-npc-5";
      const isDigitalDevice =
        npcId === "class-npc-3" || npcId === "street-npc-2" || npcId === "home-npc-2";
      const isPeerKid =
        npcId === "school-npc-3" ||
        npcId === "school-npc-5" ||
        npcId === "class-npc-2" ||
        npcId === "class-npc-4" ||
        npcId === "street-npc-5" ||
        npcId === "home-npc-3";

      if (isHomePhone) {
        [0, 0.16].forEach((offset) => {
          const st = now + offset;
          [783.99, 987.77].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, st);

            g.gain.setValueAtTime(0.0001, st);
            g.gain.linearRampToValueAtTime(idx === 0 ? 0.085 : 0.055, st + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, st + 0.14);

            osc.connect(g);
            this.connectWithPan(ctx, g, this.sfxGain!, clampedPan);
            osc.start(st);
            osc.stop(st + 0.16);
          });
        });
        return;
      }

      if (isDigitalDevice) {
        const notes = [587.33, 880.0];
        notes.forEach((freq, idx) => {
          const st = now + idx * 0.075;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, st);

          g.gain.setValueAtTime(0.0001, st);
          g.gain.linearRampToValueAtTime(0.095, st + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, st + 0.28);

          osc.connect(g);
          this.connectWithPan(ctx, g, this.sfxGain!, clampedPan);
          osc.start(st);
          osc.stop(st + 0.31);
        });
        return;
      }

      if (isPeerKid) {
        const first = ctx.createOscillator();
        const firstGain = ctx.createGain();
        first.type = "triangle";
        first.frequency.setValueAtTime(523.25, now);
        first.frequency.exponentialRampToValueAtTime(587.33, now + 0.09);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1450, now);

        firstGain.gain.setValueAtTime(0.0001, now);
        firstGain.gain.linearRampToValueAtTime(0.09, now + 0.015);
        firstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        first.connect(filter);
        filter.connect(firstGain);
        this.connectWithPan(ctx, firstGain, this.sfxGain, clampedPan);
        first.start(now);
        first.stop(now + 0.14);

        const secondStart = now + 0.105;
        const second = ctx.createOscillator();
        const secondGain = ctx.createGain();
        second.type = "sine";
        second.frequency.setValueAtTime(659.25, secondStart);
        second.frequency.exponentialRampToValueAtTime(783.99, secondStart + 0.13);

        secondGain.gain.setValueAtTime(0.0001, secondStart);
        secondGain.gain.linearRampToValueAtTime(0.105, secondStart + 0.018);
        secondGain.gain.exponentialRampToValueAtTime(0.0001, secondStart + 0.28);

        second.connect(secondGain);
        this.connectWithPan(ctx, secondGain, this.sfxGain, clampedPan);
        second.start(secondStart);
        second.stop(secondStart + 0.31);
        return;
      }

      const warmNotes = [440.0, 554.37, 659.25];
      warmNotes.forEach((freq, idx) => {
        const st = now + idx * 0.068;
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        const overGain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, st);
        if (idx === 2) {
          osc.frequency.exponentialRampToValueAtTime(freq * 1.03, st + 0.12);
        }

        overtone.type = "triangle";
        overtone.frequency.setValueAtTime(freq * 2, st);
        overGain.gain.setValueAtTime(0.02, st);
        overGain.gain.exponentialRampToValueAtTime(0.0001, st + 0.16);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1350, st);

        g.gain.setValueAtTime(0.0001, st);
        g.gain.linearRampToValueAtTime(0.095, st + 0.014);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.3);

        osc.connect(filter);
        overtone.connect(overGain);
        overGain.connect(filter);
        filter.connect(g);
        this.connectWithPan(ctx, g, this.sfxGain!, clampedPan);

        osc.start(st);
        overtone.start(st);
        osc.stop(st + 0.33);
        overtone.stop(st + 0.2);
      });
    } catch {
      // Ignore
    }
  }

  public playStrangerAlertSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      [440, 349.23].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + idx * 0.09);
        gain.gain.setValueAtTime(0.1, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.25);
      });
    } catch {
      // Ignore
    }
  }

  public playCorrectAnswerSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime + 0.005;
      // Bright, uplifting marimba + glockenspiel reward arpeggio (C5 -> E5 -> G5 -> C6)
      const notes = [
        { freq: 523.25, offset: 0, dur: 0.24, gain: 0.14, bellGain: 0.028 },
        { freq: 659.25, offset: 0.068, dur: 0.24, gain: 0.15, bellGain: 0.036 },
        { freq: 783.99, offset: 0.136, dur: 0.26, gain: 0.16, bellGain: 0.045 },
        { freq: 1046.5, offset: 0.205, dur: 0.44, gain: 0.18, bellGain: 0.06 },
      ];

      notes.forEach((n) => {
        const start = now + n.offset;
        const bodyOsc = ctx.createOscillator();
        const overtoneOsc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const bodyGain = ctx.createGain();
        const overtoneGain = ctx.createGain();

        bodyOsc.type = "triangle";
        bodyOsc.frequency.setValueAtTime(n.freq, start);

        overtoneOsc.type = "sine";
        overtoneOsc.frequency.setValueAtTime(n.freq * 2, start);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(Math.min(3600, n.freq * 3.4), start);

        bodyGain.gain.setValueAtTime(0.0001, start);
        bodyGain.gain.linearRampToValueAtTime(n.gain, start + 0.012);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);

        overtoneGain.gain.setValueAtTime(0.0001, start);
        overtoneGain.gain.linearRampToValueAtTime(n.bellGain, start + 0.009);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur * 0.78);

        bodyOsc.connect(filter);
        filter.connect(bodyGain);
        bodyGain.connect(this.sfxGain!);

        overtoneOsc.connect(overtoneGain);
        overtoneGain.connect(this.sfxGain!);

        bodyOsc.start(start);
        overtoneOsc.start(start);
        bodyOsc.stop(start + n.dur + 0.03);
        overtoneOsc.stop(start + n.dur + 0.03);
      });

      // Soft high star-burst sparkle chord tone (E6) on the final C6 peak
      const shimmerStart = now + 0.215;
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = "sine";
      shimmerOsc.frequency.setValueAtTime(1318.51, shimmerStart);
      shimmerGain.gain.setValueAtTime(0.0001, shimmerStart);
      shimmerGain.gain.linearRampToValueAtTime(0.042, shimmerStart + 0.015);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, shimmerStart + 0.34);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(this.sfxGain);
      shimmerOsc.start(shimmerStart);
      shimmerOsc.stop(shimmerStart + 0.37);
    } catch {
      // Ignore
    }
  }

  public playEncourageAnswerSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime + 0.005;
      // Warm, non-punitive wooden marimba "coba lagi yuk" bounce (G4 -> E4 -> D4)
      const notes = [
        { freq: 392.0, offset: 0, dur: 0.18, gain: 0.15 },
        { freq: 329.63, offset: 0.088, dur: 0.19, gain: 0.145 },
        { freq: 293.66, offset: 0.176, dur: 0.26, gain: 0.14 },
      ];

      notes.forEach((n) => {
        const start = now + n.offset;
        const warmOsc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const warmGain = ctx.createGain();
        const subGain = ctx.createGain();

        warmOsc.type = "triangle";
        warmOsc.frequency.setValueAtTime(n.freq, start);

        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(n.freq, start);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1250, start);

        warmGain.gain.setValueAtTime(0.0001, start);
        warmGain.gain.linearRampToValueAtTime(n.gain, start + 0.014);
        warmGain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);

        subGain.gain.setValueAtTime(0.0001, start);
        subGain.gain.linearRampToValueAtTime(n.gain * 0.55, start + 0.012);
        subGain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur * 0.9);

        warmOsc.connect(filter);
        filter.connect(warmGain);
        warmGain.connect(this.sfxGain!);

        subOsc.connect(subGain);
        subGain.connect(this.sfxGain!);

        warmOsc.start(start);
        subOsc.start(start);
        warmOsc.stop(start + n.dur + 0.03);
        subOsc.stop(start + n.dur + 0.03);
      });
    } catch {
      // Ignore
    }
  }

  public playVictoryFanfareSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + idx * 0.09);
        gain.gain.setValueAtTime(0.13, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.55);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.6);
      });
    } catch {
      // Ignore
    }
  }

  public playBadgeUnlockSFX(): void {
    if (!this.getSoundEnabled()) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    try {
      const now = ctx.currentTime + 0.16;
      const notes = [659.25, 783.99, 987.77, 1318.51, 1567.98];
      notes.forEach((f, idx) => {
        const start = now + idx * 0.075;
        const osc = ctx.createOscillator();
        const harmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, start);

        harmonic.type = "triangle";
        harmonic.frequency.setValueAtTime(f * 2, start);

        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(0.035, start);
        hGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.14, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);

        osc.connect(gain);
        harmonic.connect(hGain);
        hGain.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(start);
        harmonic.start(start);
        osc.stop(start + 0.66);
        harmonic.stop(start + 0.4);
      });
    } catch {
      // Ignore
    }
  }
}

export const audioManager = new SafeStepAudioManager();
