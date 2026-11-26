/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TeacherPersonaId } from "./npcVoicePlayer";

// Eagerly import all compact offline MP3 voice assets.
// - In standalone HTML builds (`vite.standalone.config.ts`), Vite inlines each MP3 as a data:audio/mpeg;base64 URI.
// - In PWA builds (`vite.config.ts`), Vite emits hashed /assets/*.mp3 files and Workbox precaches them for 100% offline playback.
const offlineAudioModules = import.meta.glob<string>("../assets/offlineAudio/*.mp3", {
  eager: true,
  import: "default",
});

const offlineAudioByName = new Map<string, string>();
for (const [modulePath, assetUrl] of Object.entries(offlineAudioModules)) {
  const filename = modulePath.split("/").pop()?.replace(/\.mp3$/i, "");
  if (filename && typeof assetUrl === "string" && assetUrl.length > 0) {
    offlineAudioByName.set(filename, assetUrl);
  }
}

/**
 * Resolves the embedded offline human Indonesian NPC voice MP3 URL for a scenario or NPC ID.
 */
export function getOfflineNpcDialogAudioUrl(npcId?: string, scenarioId?: string): string | undefined {
  if (scenarioId) {
    const byScenario = offlineAudioByName.get(`dialog_${scenarioId.replace(/-/g, "_")}`);
    if (byScenario) return byScenario;
  }

  if (npcId) {
    const derivedScenarioSlug = `sc_${npcId.replace("-npc-", "_").replace(/-/g, "_")}`;
    const byNpc = offlineAudioByName.get(`dialog_${derivedScenarioSlug}`);
    if (byNpc) return byNpc;
  }

  return undefined;
}

/**
 * Resolves the embedded offline human Indonesian teacher (Ibu Guru / Pak Guru) MP3 URL
 * matching the scenario's assigned teacher persona and answer correctness.
 */
export function getOfflineTeacherAudioUrl(
  teacherId: TeacherPersonaId | undefined,
  isCorrect: boolean
): string | undefined {
  const persona = (teacherId || "ibu-zephyr").replace(/-/g, "_");
  const outcome = isCorrect ? "correct" : "retry";
  return (
    offlineAudioByName.get(`teacher_${persona}_${outcome}`) ||
    offlineAudioByName.get(`teacher_ibu_zephyr_${outcome}`)
  );
}
