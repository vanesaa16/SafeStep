/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  audioManager,
  AMBIENT_PROFILES,
  unlockAudio,
  stopAllVoice,
  playVoice,
  type AmbientLocationId,
  type AmbientProfileInfo,
} from "./audioManager";

export { AMBIENT_PROFILES, unlockAudio, stopAllVoice, playVoice };
export type { AmbientLocationId, AmbientProfileInfo };

export function unlockAudioContext(): void {
  audioManager.unlockAudioContext();
}

export function getVoicePlaybackBus(): { ctx: AudioContext; voiceGain: GainNode } | null {
  return audioManager.getVoicePlaybackBus();
}

export function getDecodingAudioContext(): AudioContext | null {
  return audioManager.getDecodingAudioContext();
}

export function warmUpVoiceGraph(): void {
  audioManager.warmUpVoiceGraph();
}

export function getSoundEnabled(): boolean {
  return audioManager.getSoundEnabled();
}

export function setSoundEnabled(enabled: boolean): void {
  audioManager.setSoundEnabled(enabled);
}

export function getMusicEnabled(): boolean {
  return audioManager.getMusicEnabled();
}

export function setMusicEnabled(enabled: boolean): void {
  audioManager.setMusicEnabled(enabled);
}

export function getAmbienceEnabled(): boolean {
  return audioManager.getAmbienceEnabled();
}

export function setAmbienceEnabled(enabled: boolean): void {
  audioManager.setAmbienceEnabled(enabled);
}

export function getAmbienceVolume(): number {
  return audioManager.getAmbienceVolume();
}

export function setAmbienceVolume(volume: number): void {
  audioManager.setAmbienceVolume(volume);
}

export function setAmbientLocation(mapId: string): void {
  audioManager.setAmbientLocation(mapId);
}

export function stopAmbientSoundscape(): void {
  audioManager.stopAmbientSoundscape();
}

export function previewAmbientCue(mapId?: string): void {
  audioManager.previewAmbientCue(mapId);
}

export function updatePlayerSpatialAudio(x: number, y: number): void {
  audioManager.updateSpatialPosition(x, y);
}

export function getLocationProfile(mapId: string): AmbientProfileInfo {
  return audioManager.getLocationProfile(mapId);
}

export function startBackgroundMusic(): void {
  audioManager.startBackgroundMusic();
}

export function stopBackgroundMusic(): void {
  audioManager.stopBackgroundMusic();
}

export function setMusicDucked(ducked: boolean): void {
  audioManager.setDucked(ducked);
}

export function playUiClickSFX(): void {
  audioManager.playUiClickSFX();
}

export function playTapRippleSFX(): void {
  audioManager.playTapRippleSFX();
}

export function playFootstepSFX(x?: number, y?: number): void {
  audioManager.playFootstepSFX(x, y);
}

export function playDoorTransitionSFX(): void {
  audioManager.playDoorTransitionSFX();
}

export function playBagUnzipSFX(): void {
  audioManager.playBagUnzipSFX();
}

export function playNpcGreetSFX(): void {
  audioManager.playNpcGreetSFX();
}

export function playNpcCalloutCueSFX(npcId: string, panOffset = 0): void {
  audioManager.playNpcCalloutCueSFX(npcId, panOffset);
}

export function playStrangerAlertSFX(): void {
  audioManager.playStrangerAlertSFX();
}

export function playCorrectAnswerSFX(): void {
  audioManager.playCorrectAnswerSFX();
}

export function playEncourageAnswerSFX(): void {
  audioManager.playEncourageAnswerSFX();
}

export function playVictoryFanfareSFX(): void {
  audioManager.playVictoryFanfareSFX();
}

export function playBadgeUnlockSFX(): void {
  audioManager.playBadgeUnlockSFX();
}
