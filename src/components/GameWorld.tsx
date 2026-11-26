/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Position, PlayerState, Scenario, StudentLog } from "../types";
import { MAPS, getScenarioCalloutText, NEUTRAL_NPC_LABELS } from "../data/scenarios";
import {
  Volume2,
  VolumeX,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Award,
  Check,
  MessageCircle,
  HelpCircle,
  Eye,
  EyeOff,
  FileText,
  AudioLines,
  Gamepad2,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { isFullscreenSupported } from "../utils/fullscreen";
import { motion, AnimatePresence } from "motion/react";
import Dpad from "./Dpad";
import { KID_CHARACTERS } from "../data/characters";
import Npc3DCharacter from "./Npc3DCharacter";
import Student3DCharacter, { StudentOpenBag3D } from "./Student3DCharacter";
import Schoolyard3DScene from "./Schoolyard3DScene";
import Classroom3DScene from "./Classroom3DScene";
import Street3DScene from "./Street3DScene";
import Home3DScene from "./Home3DScene";
import {
  downloadDiagnosticReportPDF,
  downloadCertificateLandscapePDF,
} from "../utils/pdfGenerator";
import {
  ACHIEVEMENT_BADGES,
  getUnlockedBadges,
  getHighestUnlockedBadge,
  getNextBadgeTarget,
} from "../data/badges";
import { BadgeEmblemSVG } from "./AchievementBadgeSystem";
import {
  unlockAudioContext,
  getSoundEnabled,
  setSoundEnabled as persistSoundEnabled,
  getMusicEnabled,
  setMusicEnabled as persistMusicEnabled,
  getAmbienceEnabled,
  setAmbienceEnabled as persistAmbienceEnabled,
  getAmbienceVolume,
  setAmbienceVolume as persistAmbienceVolume,
  setAmbientLocation,
  stopAmbientSoundscape,
  previewAmbientCue,
  updatePlayerSpatialAudio,
  getLocationProfile,
  startBackgroundMusic,
  stopBackgroundMusic,
  setMusicDucked,
  playUiClickSFX,
  playTapRippleSFX,
  playFootstepSFX,
  playDoorTransitionSFX,
  playBagUnzipSFX,
  playNpcGreetSFX,
  playNpcCalloutCueSFX,
  playVictoryFanfareSFX,
} from "../utils/soundEffects";
import {
  playNpcVoice,
  preloadMapVoiceBufferPool,
  preloadNpcVoices,
  preloadTeacherFeedbackVoices,
  stopNpcVoice,
} from "../utils/npcVoicePlayer";

interface GameWorldProps {
  playerState: PlayerState;
  customScenarios: Scenario[];
  isModalOpen?: boolean;
  isBadgeModalOpen?: boolean;
  autoOpenVictory?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClearAutoVictory?: () => void;
  onOpenBadgeCollection?: () => void;
  onPlayAgain?: () => void;
  onRestartToHome?: () => void;
  onTriggerScenario: (npcId: string) => void;
  onTransitionMap: (targetMapId: string, spawnPosition: Position) => void;
  onExitGame: () => void;
}

type Direction = "up" | "down" | "left" | "right";

// ~7.3 meters outer predictive radar (silently pre-warms NPC voice into RAM as child walks toward NPC)
const NPC_PREWARM_RADIUS = 44.0;

// ~3.4 meters outer proximity sensor collider (triggers greeting chime, hand wave & floating speech bubble)
const NPC_PROXIMITY_RADIUS = 20.5;
const NPC_PROXIMITY_REARM_RADIUS = 24.2;

// ~1.3 meters inner close-contact trigger (walking right up to the NPC opens the scenario modal)
const NPC_CONTACT_RADIUS = 8.6;
const NPC_CONTACT_REARM_RADIUS = 12.8;

function formatCleanScenarioDialogue(rawText: string | undefined, playerName?: string): string {
  if (!rawText) return "";
  const formatted = rawText.replaceAll("[Nama Anak]", playerName || "Ananda").trim();
  if (
    (formatted.startsWith("'") && formatted.endsWith("'")) ||
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("“") && formatted.endsWith("”"))
  ) {
    return formatted.slice(1, -1).trim();
  }
  return formatted;
}

function getDefaultSpawnForMap(mapId: string): Position {
  if (mapId === "school") return { x: 45, y: 82 };
  if (mapId === "class") return { x: 50, y: 80 };
  if (mapId === "street") return { x: 14, y: 52 };
  return { x: 15, y: 50 };
}

interface WalkPortalZone {
  id: string;
  targetMapId: string;
  label: string;
  markerPos: Position;
  walkTarget: Position;
  spawnPosition: Position;
  matches: (x: number, y: number) => boolean;
}

const MAP_WALK_PORTALS: Record<string, WalkPortalZone[]> = {
  school: [
    {
      id: "school-door-to-class",
      targetMapId: "class",
      label: "Masuk Kelas ↑",
      markerPos: { x: 46.7, y: 16.5 },
      walkTarget: { x: 46.7, y: 15 },
      spawnPosition: { x: 50, y: 80 },
      matches: (x, y) => x >= 38 && x <= 55 && y <= 18.5,
    },
    {
      id: "school-right-to-street",
      targetMapId: "street",
      label: "Jalan Raya →",
      markerPos: { x: 93, y: 56 },
      walkTarget: { x: 93.5, y: 56 },
      spawnPosition: { x: 14, y: 52 },
      matches: (x) => x >= 91.5,
    },
  ],
  class: [
    {
      id: "class-right-to-street",
      targetMapId: "street",
      label: "Jalan Raya →",
      markerPos: { x: 93, y: 55 },
      walkTarget: { x: 93.5, y: 55 },
      spawnPosition: { x: 14, y: 52 },
      matches: (x) => x >= 91.5,
    },
    {
      id: "class-bottom-to-school",
      targetMapId: "school",
      label: "Halaman ↓",
      markerPos: { x: 50, y: 90 },
      walkTarget: { x: 50, y: 91.5 },
      spawnPosition: { x: 46.5, y: 26 },
      matches: (x, y) => y >= 90 && x >= 34 && x <= 66,
    },
  ],
  street: [
    {
      id: "street-right-to-home",
      targetMapId: "home",
      label: "Pulang ke Rumah →",
      markerPos: { x: 92.5, y: 50 },
      walkTarget: { x: 93.5, y: 50 },
      spawnPosition: { x: 15, y: 50 },
      matches: (x) => x >= 91.5,
    },
    {
      id: "street-left-to-school",
      targetMapId: "school",
      label: "← Sekolah",
      markerPos: { x: 7.5, y: 50 },
      walkTarget: { x: 6.5, y: 50 },
      spawnPosition: { x: 85, y: 62 },
      matches: (x) => x <= 8.5,
    },
  ],
  home: [
    {
      id: "home-door-to-street",
      targetMapId: "street",
      label: "← Jalan Raya",
      markerPos: { x: 8, y: 50 },
      walkTarget: { x: 6.8, y: 50 },
      spawnPosition: { x: 85, y: 50 },
      matches: (x, y) => x <= 9.5 && y >= 28 && y <= 76,
    },
  ],
};

// Map-specific native aspect ratios (ensures zero non-uniform scaling on widescreen displays)
const MAP_NATIVE_ASPECT_RATIOS: Record<string, number> = {
  school: 900 / 600, // 1.5 (3:2)
  class: 960 / 540,  // 16 / 9 = 1.7777778
  street: 900 / 600, // 1.5 (3:2)
  home: 900 / 600,   // 1.5 (3:2)
};

export default function GameWorld({
  playerState,
  customScenarios,
  isModalOpen = false,
  isBadgeModalOpen = false,
  autoOpenVictory = false,
  isFullscreen = false,
  onToggleFullscreen,
  onClearAutoVictory,
  onOpenBadgeCollection,
  onPlayAgain,
  onRestartToHome,
  onTriggerScenario,
  onTransitionMap,
  onExitGame,
}: GameWorldProps) {
  // Live 60fps coordinate ref + pointer proximity ref + direct DOM refs (zero per-frame React state thrashing)
  const posRef = useRef<Position>({ ...playerState.playerPosition });
  const pointerMapPosRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -999,
    y: -999,
    active: false,
  });
  const mapBoundsRef = useRef<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const playerDomRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const colliderDomRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const directionRef = useRef<Direction>("down");
  const isWalkingRef = useRef<boolean>(false);
  const nearbyNpcIdRef = useRef<string | null>(null);
  const proximityNpcIdsRef = useRef<string[]>([]);
  const activeBubbleNpcIdRef = useRef<string | null>(null);
  const audioCalledNpcsRef = useRef<Set<string>>(new Set());
  const prewarmedNpcsRef = useRef<Set<string>>(new Set());
  const lastTriggeredNpcIdRef = useRef<string | null>(null);
  const mapTransitionCooldownUntilRef = useRef<number>(0);
  const isTransitioningMapRef = useRef<boolean>(false);

  // Auto-walk target when child clicks/taps on the map floor or a distant NPC
  const targetWalkPosRef = useRef<{
    x: number;
    y: number;
    targetNpcId: string | null;
  } | null>(null);

  // Discrete UI states (only updated on actual transitions)
  const [direction, setDirection] = useState<Direction>("down");
  const [isWalking, setIsWalking] = useState(false);
  const [nearbyNpcId, setNearbyNpcId] = useState<string | null>(null);
  const [proximityNpcIds, setProximityNpcIds] = useState<string[]>([]);
  const [activeBubbleNpcId, setActiveBubbleNpcId] = useState<string | null>(null);
  const [speakingNpcId, setSpeakingNpcId] = useState<string | null>(null);
  const [walkTargetRipple, setWalkTargetRipple] = useState<Position | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => getSoundEnabled());
  const [musicEnabled, setMusicEnabledState] = useState<boolean>(() => getMusicEnabled());
  const [ambienceEnabled, setAmbienceEnabledState] = useState<boolean>(() => getAmbienceEnabled());
  const [ambienceVolume, setAmbienceVolumeState] = useState<number>(() => getAmbienceVolume());
  const [showAudioPopover, setShowAudioPopover] = useState(false);
  const [showControlGuide, setShowControlGuide] = useState(false);
  const [contextualNotice, setContextualNotice] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showNpcLabels, setShowNpcLabels] = useState<boolean>(() => {
    try {
      return localStorage.getItem("safestep_show_npc_labels") !== "false";
    } catch {
      return true;
    }
  });

  // State to toggle navigation D-Pad visibility across all game maps
  const [showDpad, setShowDpad] = useState<boolean>(() => {
    try {
      return localStorage.getItem("safestep_show_dpad") !== "false";
    } catch {
      return true;
    }
  });

  // Responsive viewport proportional framing matching each map's native aspect ratio (zero blank side wings)
  const viewportRef = useRef<HTMLDivElement>(null);
  const [sandboxStyle, setSandboxStyle] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const handleResize = () => {
      const w = vp.clientWidth;
      const h = vp.clientHeight;
      if (w <= 0 || h <= 0) return;

      const targetRatio = MAP_NATIVE_ASPECT_RATIOS[playerState.currentMapId] || 1.5;
      const padX = w >= 1280 ? 12 : w >= 768 ? 10 : 4;
      const padY = h >= 600 ? 8 : 4;
      const availW = Math.max(100, w - padX * 2);
      const availH = Math.max(100, h - padY * 2);

      let targetW = availW;
      let targetH = targetW / targetRatio;

      if (targetH > availH) {
        targetH = availH;
        targetW = targetH * targetRatio;
      }

      setSandboxStyle({
        width: Math.round(targetW),
        height: Math.round(targetH),
      });

      // Synchronously refresh cached map bounds for instant click/movement accuracy
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        mapBoundsRef.current = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(vp);
    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [playerState.currentMapId]);

  const noticeTimeoutRef = useRef<number | null>(null);
  const keysPressed = useRef<Record<string, boolean>>({});
  const activeDpadRef = useRef<Direction | null>(null);

  const currentMap = MAPS.find((m) => m.id === playerState.currentMapId) || MAPS[0];
  const currentAmbientProfile = getLocationProfile(currentMap.id);
  const currentCharacter =
    KID_CHARACTERS.find((c) => c.id === playerState.avatarId) || KID_CHARACTERS[0];

  const activeMapNpcs = useMemo(() => {
    const baseNpcs = currentMap.npcs;
    const knownIds = new Set(baseNpcs.map((n) => n.id));
    const overflowScenarios = customScenarios.filter(
      (sc) => sc.mapId === currentMap.id && !knownIds.has(sc.npcId)
    );
    if (overflowScenarios.length === 0) return baseNpcs;

    const overflowPositions: Position[] = [
      { x: 38, y: 60 },
      { x: 56, y: 38 },
      { x: 82, y: 32 },
      { x: 40, y: 32 },
      { x: 64, y: 66 },
    ];
    const overflowColors = [
      "bg-teal-600",
      "bg-orange-500",
      "bg-indigo-600",
      "bg-rose-500",
      "bg-emerald-600",
    ];

    const extraNpcs = overflowScenarios.map((sc, idx) => ({
      id: sc.npcId,
      name: sc.npcName || NEUTRAL_NPC_LABELS[sc.npcId] || `Karakter #${baseNpcs.length + idx + 1}`,
      description: `Skenario tambahan ${sc.category}`,
      color: overflowColors[idx % overflowColors.length],
      position: overflowPositions[idx % overflowPositions.length],
      scenarioId: sc.id,
    }));

    return [...baseNpcs, ...extraNpcs];
  }, [currentMap, customScenarios]);

  // Contextual Backpack Rule:
  // Outdoors (schoolyard & street): worn on back (`withBackpack = true`)
  // Indoors (classroom & home): taken off & placed opened on floor/study area (`withBackpack = false`)
  const isOutdoorMap = currentMap.id === "school" || currentMap.id === "street";
  const openBagPosition: Position | null =
    currentMap.id === "class"
      ? { x: 62, y: 80 }
      : currentMap.id === "home"
      ? { x: 86, y: 75 }
      : null;

  const totalMissions = customScenarios.length || 20;
  const completedCount = playerState.completedScenarios.length;
  const allCompleted = completedCount >= totalMissions;
  const maxPossiblePoints = totalMissions * 10;
  const earnedStars =
    playerState.points >= maxPossiblePoints * 0.85
      ? 3
      : playerState.points >= maxPossiblePoints * 0.45
      ? 2
      : 1;

  const unlockedBadges = getUnlockedBadges(playerState.points);
  const highestBadge = getHighestUnlockedBadge(playerState.points);
  const nextBadgeTarget = getNextBadgeTarget(playerState.points);

  const isMovementFrozen =
    isModalOpen || isBadgeModalOpen || isPaused || showCompletionModal;

  const showBannerNotice = useCallback((msg: string, durationMs = 2800) => {
    if (noticeTimeoutRef.current !== null) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    setContextualNotice(msg);
    noticeTimeoutRef.current = window.setTimeout(() => {
      setContextualNotice(null);
    }, durationMs);
  }, []);

  // Stable refs for physics loop
  const customScenariosRef = useRef(customScenarios);
  useEffect(() => {
    customScenariosRef.current = customScenarios;
  }, [customScenarios]);

  const playerStateRef = useRef(playerState);
  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  const currentMapRef = useRef(currentMap);
  useEffect(() => {
    currentMapRef.current = currentMap;
  }, [currentMap]);

  const activeMapNpcsRef = useRef(activeMapNpcs);
  useEffect(() => {
    activeMapNpcsRef.current = activeMapNpcs;
  }, [activeMapNpcs]);

  const onTransitionMapRef = useRef(onTransitionMap);
  useEffect(() => {
    onTransitionMapRef.current = onTransitionMap;
  }, [onTransitionMap]);

  const isMovementFrozenRef = useRef(isMovementFrozen);
  useEffect(() => {
    isMovementFrozenRef.current = isMovementFrozen;
    if (isMovementFrozen) {
      keysPressed.current = {};
      activeDpadRef.current = null;
      targetWalkPosRef.current = null;
      pointerMapPosRef.current.active = false;
      setWalkTargetRipple(null);
      if (isWalkingRef.current) {
        isWalkingRef.current = false;
        setIsWalking(false);
      }
    }
    if (isModalOpen || showCompletionModal) {
      setMusicDucked(true);
    }
  }, [isMovementFrozen, isModalOpen, showCompletionModal]);

  // Cache sandbox bounding box via ResizeObserver so onMouseMove proximity math is O(1) with zero DOM layout reflow
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const refreshBounds = () => {
      const rect = el.getBoundingClientRect();
      mapBoundsRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    };

    refreshBounds();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(refreshBounds) : null;
    ro?.observe(el);
    window.addEventListener("scroll", refreshBounds, { passive: true });
    window.addEventListener("resize", refreshBounds, { passive: true });

    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", refreshBounds);
      window.removeEventListener("resize", refreshBounds);
    };
  }, []);

  // Auto-open celebratory Victory modal when all 20 missions finish
  useEffect(() => {
    if (autoOpenVictory) {
      setShowCompletionModal(true);
      playVictoryFanfareSFX();
      onClearAutoVictory?.();
    }
  }, [autoOpenVictory, onClearAutoVictory]);

  // Sync audio preferences & location ambient soundscapes with singleton audioManager
  useEffect(() => {
    persistSoundEnabled(soundEnabled);
    if (soundEnabled) {
      startBackgroundMusic();
      setAmbientLocation(currentMapRef.current.id);
    } else {
      stopNpcVoice(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    persistMusicEnabled(musicEnabled);
  }, [musicEnabled]);

  useEffect(() => {
    persistAmbienceEnabled(ambienceEnabled);
    if (ambienceEnabled && soundEnabled) {
      setAmbientLocation(currentMapRef.current.id);
    }
  }, [ambienceEnabled, soundEnabled]);

  useEffect(() => {
    persistAmbienceVolume(ambienceVolume);
  }, [ambienceVolume]);

  useEffect(() => {
    startBackgroundMusic();
    setAmbientLocation(currentMapRef.current.id);
    return () => {
      stopNpcVoice(false);
      stopAmbientSoundscape();
      stopBackgroundMusic();
      if (noticeTimeoutRef.current !== null) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  // Hydrate the in-memory AudioBuffer Pool (`VoiceAudioBufferPool`) with all NPC & Teacher audio assets
  // for the active map as soon as the map loads so first-time triggers have 0ms fetch/decode latency
  useEffect(() => {
    prewarmedNpcsRef.current.clear();
    if (!soundEnabled) return;

    preloadMapVoiceBufferPool({
      mapId: currentMap.id,
      npcs: activeMapNpcs,
      scenarios: customScenarios,
      completedScenarioIds: playerState.completedScenarios,
      playerName: playerState.name,
      spawnPosition: posRef.current,
      resolveCalloutText: (npcId: string) => {
        const sc = customScenarios.find(
          (s) => s.npcId === npcId && s.mapId === currentMap.id
        );
        return getScenarioCalloutText(sc, npcId, playerState.name);
      },
    });
  }, [
    currentMap.id,
    activeMapNpcs,
    customScenarios,
    playerState.completedScenarios,
    playerState.name,
    soundEnabled,
  ]);

  // Sync DOM avatar position & crossfade location ambient soundscape on map transition
  const applyAvatarDomPosition = useCallback((x: number, y: number) => {
    const el = playerDomRef.current;
    if (!el) return;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.zIndex = String(Math.round(y * 10));
  }, []);

  const prevMapIdRef = useRef<string>(playerState.currentMapId);
  useEffect(() => {
    isTransitioningMapRef.current = false;
    posRef.current = { ...playerState.playerPosition };
    applyAvatarDomPosition(playerState.playerPosition.x, playerState.playerPosition.y);
    targetWalkPosRef.current = null;
    setWalkTargetRipple(null);
    lastTriggeredNpcIdRef.current = null;
    nearbyNpcIdRef.current = null;
    setNearbyNpcId(null);
    proximityNpcIdsRef.current = [];
    setProximityNpcIds([]);
    activeBubbleNpcIdRef.current = null;
    setActiveBubbleNpcId(null);
    setSpeakingNpcId(null);
    stopNpcVoice(false);
    audioCalledNpcsRef.current.clear();

    // Update spatial coordinates & crossfade ambient soundscape whenever location is set or changed
    updatePlayerSpatialAudio(playerState.playerPosition.x, playerState.playerPosition.y);
    setAmbientLocation(playerState.currentMapId);

    if (prevMapIdRef.current !== playerState.currentMapId) {
      prevMapIdRef.current = playerState.currentMapId;
      if (playerState.currentMapId === "school") {
        showBannerNotice("Halaman Sekolah: Kicauan burung pagi & semilir pepohonan menemani langkahmu!", 2800);
      } else if (playerState.currentMapId === "class") {
        playBagUnzipSFX();
        showBannerNotice("Masuk Ruang Kelas: Detak jam dinding & suasana kelas tenang — tas dibuka rapi!", 3200);
      } else if (playerState.currentMapId === "street") {
        showBannerNotice("Jalan Pulang Sekolah: Suara lalu lintas jalan raya — berjalanlah aman di trotoar!", 3000);
      } else if (playerState.currentMapId === "home") {
        playBagUnzipSFX();
        showBannerNotice("Tiba di Rumah: Suasana taman rumah & lonceng angin sore yang teduh!", 3200);
      }
    }
  }, [playerState.playerPosition, playerState.currentMapId, applyAvatarDomPosition, showBannerNotice]);

  // Synchronously pre-warms NPC dialogue + all scenario Teacher feedback options into RAM
  const prewarmScenarioVoiceBundleImmediate = useCallback(
    (npcId: string, matchedScenario: Scenario | undefined) => {
      if (!matchedScenario) return;
      const playerName = (playerStateRef.current.name || "").trim() || "Ananda";

      const nextDialogText = formatCleanScenarioDialogue(
        matchedScenario.dialogueText,
        playerName
      );
      if (nextDialogText) {
        preloadNpcVoices(
          [
            {
              npcId,
              mode: "dialog",
              text: nextDialogText,
            },
          ],
          1
        );
      }

      if (matchedScenario.options?.length) {
        // Order safe option first so most-chosen teacher appreciation is cached earliest
        const orderedOptions = [...matchedScenario.options].sort(
          (a, b) => Number(b.isCorrect) - Number(a.isCorrect)
        );
        preloadTeacherFeedbackVoices(
          matchedScenario.id,
          orderedOptions.map((opt) => ({
            text: opt.feedback.replaceAll("[Nama Anak]", playerName).trim(),
            isCorrect: opt.isCorrect,
          })),
          3
        );
      }
    },
    []
  );

  // Synchronously updates a collider ground ring DOM node without waiting on React state re-renders
  const syncColliderDomRingImmediate = useCallback((npcId: string, active: boolean) => {
    const ringEl = colliderDomRefs.current[npcId];
    if (!ringEl) return;
    if (active) {
      ringEl.classList.remove("opacity-0");
      ringEl.classList.add("animate-npc-proximity-ring");
    } else {
      ringEl.classList.remove("animate-npc-proximity-ring");
      ringEl.classList.add("opacity-0");
    }
  }, []);

  // Fires NPC AudioContext greeting + Teacher feedback pre-warm synchronously at t=0ms upon hitting collider boundary
  const triggerColliderBoundaryAudioImmediate = useCallback(
    (npcId: string, matchedScenario: Scenario | undefined, referenceX: number) => {
      if (isMovementFrozenRef.current) return;
      const npc = activeMapNpcsRef.current.find((n) => n.id === npcId);
      if (!npc) return;

      const isCompleted = matchedScenario
        ? playerStateRef.current.completedScenarios.includes(matchedScenario.id)
        : false;
      if (isCompleted) return;

      // Immediately unlock/resume Web Audio context on collider hit
      unlockAudioContext();
      syncColliderDomRingImmediate(npc.id, true);

      if (!audioCalledNpcsRef.current.has(npc.id)) {
        audioCalledNpcsRef.current.add(npc.id);
        const panOffset = Math.max(-0.6, Math.min(0.6, (npc.position.x - referenceX) / 45));
        playNpcCalloutCueSFX(npc.id, panOffset);

        const spokenCallout = getScenarioCalloutText(
          matchedScenario,
          npc.id,
          playerStateRef.current.name
        );
        void playNpcVoice({
          npcId: npc.id,
          scenarioId: matchedScenario?.id,
          mode: "callout",
          text: spokenCallout,
          onSpeakingChange: (speaking) => {
            setSpeakingNpcId((prev) =>
              speaking ? npc.id : prev === npc.id ? null : prev
            );
          },
        });

        // Pre-warm NPC main dialogue + Teacher feedback voices immediately upon hitting the collider boundary!
        prewarmScenarioVoiceBundleImmediate(npc.id, matchedScenario);
      }
    },
    [prewarmScenarioVoiceBundleImmediate, syncColliderDomRingImmediate]
  );

  // Opens scenario dialog synchronously; DialogModal is the single owner of playing the question voice so audio never plays twice
  const openNpcMission = useCallback(
    (npcId: string) => {
      if (isMovementFrozenRef.current) return;

      const map = currentMapRef.current;
      const npc = activeMapNpcsRef.current.find((n) => n.id === npcId);
      if (!npc) return;

      const matchedScenario = customScenariosRef.current.find(
        (s) => s.npcId === npc.id && s.mapId === map.id
      );
      if (!matchedScenario) return;

      // Synchronously freeze movement & record trigger BEFORE any render so stepFrame / evaluateWorldTriggers
      // or double-clicks can never re-enter openNpcMission
      isMovementFrozenRef.current = true;
      lastTriggeredNpcIdRef.current = npc.id;

      const isCompleted = playerStateRef.current.completedScenarios.includes(
        matchedScenario.id
      );

      targetWalkPosRef.current = null;
      pointerMapPosRef.current.active = false;
      setWalkTargetRipple(null);
      keysPressed.current = {};
      activeDpadRef.current = null;
      if (isWalkingRef.current) {
        isWalkingRef.current = false;
        setIsWalking(false);
      }

      setSpeakingNpcId(null);
      unlockAudioContext();
      stopNpcVoice(true);
      setMusicDucked(true);
      playNpcGreetSFX();

      if (!isCompleted) {
        prewarmScenarioVoiceBundleImmediate(npc.id, matchedScenario);
      }

      onTriggerScenario(npc.id);
    },
    [onTriggerScenario, prewarmScenarioVoiceBundleImmediate]
  );

  // Proximity Sensor Collider (~3-4m) & Close-Contact Trigger checks evaluated directly inside the render/pointer loop
  const evaluateWorldTriggers = useCallback(
    (
      x: number,
      y: number,
      options?: { skipAutoOpen?: boolean; suppressAudio?: boolean }
    ) => {
      const map = currentMapRef.current;
      const ptr = pointerMapPosRef.current;

      // Evaluate Avatar + Pointer (`onMouseMove`/`onMouseEnter`) Proximity Colliders Directly via Refs
      const nextProximityIds: string[] = [];
      let closestBubbleNpcId: string | null = null;
      let closestBubbleDist = Infinity;
      let closestNearbyNpcId: string | null = null;
      let closestNearbyDist = Infinity;

      for (const npc of activeMapNpcsRef.current) {
        const avatarDist = Math.hypot(npc.position.x - x, npc.position.y - y);
        const pointerDist =
          ptr.active && !isMovementFrozenRef.current
            ? Math.hypot(npc.position.x - ptr.x, npc.position.y - ptr.y)
            : Infinity;
        const effectiveColliderDist = Math.min(avatarDist, pointerDist);

        const matchedScenario = customScenariosRef.current.find(
          (s) => s.npcId === npc.id && s.mapId === map.id
        );
        if (!matchedScenario) continue;
        const isCompleted = playerStateRef.current.completedScenarios.includes(matchedScenario.id);

        // Outer predictive radar (~7.3m): pre-warm NPC greeting + dialog + teacher feedback on avatar or cursor approach
        if (
          !isCompleted &&
          effectiveColliderDist <= NPC_PREWARM_RADIUS &&
          !prewarmedNpcsRef.current.has(npc.id) &&
          !options?.suppressAudio
        ) {
          prewarmedNpcsRef.current.add(npc.id);
          const prewarmCallout = getScenarioCalloutText(
            matchedScenario,
            npc.id,
            playerStateRef.current.name
          );
          preloadNpcVoices(
            [
              {
                npcId: npc.id,
                mode: "callout",
                text: prewarmCallout,
              },
            ],
            1
          );
          prewarmScenarioVoiceBundleImmediate(npc.id, matchedScenario);
        }

        // Hysteresis for 3-4m proximity collider (fires immediately when either avatar or pointer hits collider boundary)
        const wasInProximity = proximityNpcIdsRef.current.includes(npc.id);
        const isWithinProximityCollider =
          !isCompleted &&
          (wasInProximity
            ? effectiveColliderDist < NPC_PROXIMITY_REARM_RADIUS
            : effectiveColliderDist <= NPC_PROXIMITY_RADIUS);

        syncColliderDomRingImmediate(npc.id, isWithinProximityCollider);

        const willAutoOpenThisFrame =
          !options?.skipAutoOpen &&
          ((targetWalkPosRef.current?.targetNpcId === npc.id &&
            avatarDist < NPC_CONTACT_RADIUS + 0.8) ||
            (avatarDist < NPC_CONTACT_RADIUS &&
              !isCompleted &&
              lastTriggeredNpcIdRef.current !== npc.id));

        if (isWithinProximityCollider) {
          nextProximityIds.push(npc.id);

          if (effectiveColliderDist < closestBubbleDist) {
            closestBubbleDist = effectiveColliderDist;
            closestBubbleNpcId = npc.id;
          }

          if (!options?.suppressAudio && !isMovementFrozenRef.current && !willAutoOpenThisFrame) {
            const refX = pointerDist < avatarDist && ptr.active ? ptr.x : x;
            triggerColliderBoundaryAudioImmediate(npc.id, matchedScenario, refX);
          }
        } else if (effectiveColliderDist >= NPC_PROXIMITY_REARM_RADIUS || isCompleted) {
          if (audioCalledNpcsRef.current.has(npc.id)) {
            audioCalledNpcsRef.current.delete(npc.id);
          }
        }

        // Track closest interactable NPC (active callout or close review) for Space/Enter & prompt
        const interactRange = isCompleted ? NPC_CONTACT_REARM_RADIUS : NPC_PROXIMITY_RADIUS;
        if (effectiveColliderDist <= interactRange && effectiveColliderDist < closestNearbyDist) {
          closestNearbyDist = effectiveColliderDist;
          closestNearbyNpcId = npc.id;
        }

        if (!options?.skipAutoOpen) {
          // If player tapped a specific NPC to walk over and interact, open upon arrival
          if (
            targetWalkPosRef.current?.targetNpcId === npc.id &&
            avatarDist < NPC_CONTACT_RADIUS + 0.8
          ) {
            lastTriggeredNpcIdRef.current = npc.id;
            openNpcMission(npc.id);
            return;
          }

          // Inner close-contact trigger: continuing to walk right up to an uncompleted NPC opens modal
          if (avatarDist < NPC_CONTACT_RADIUS && !isCompleted) {
            if (lastTriggeredNpcIdRef.current !== npc.id) {
              lastTriggeredNpcIdRef.current = npc.id;
              openNpcMission(npc.id);
              return;
            }
          }

          if (lastTriggeredNpcIdRef.current === npc.id && avatarDist >= NPC_CONTACT_REARM_RADIUS) {
            lastTriggeredNpcIdRef.current = null;
          }
        }
      }

      const prevProxKey = proximityNpcIdsRef.current.join(",");
      const nextProxKey = nextProximityIds.join(",");
      if (prevProxKey !== nextProxKey) {
        proximityNpcIdsRef.current = nextProximityIds;
        setProximityNpcIds(nextProximityIds);
      }

      if (activeBubbleNpcIdRef.current !== closestBubbleNpcId) {
        if (!closestBubbleNpcId && activeBubbleNpcIdRef.current) {
          setSpeakingNpcId(null);
          stopNpcVoice(false);
        }
        activeBubbleNpcIdRef.current = closestBubbleNpcId;
        setActiveBubbleNpcId(closestBubbleNpcId);
      }

      if (nearbyNpcIdRef.current !== closestNearbyNpcId) {
        nearbyNpcIdRef.current = closestNearbyNpcId;
        setNearbyNpcId(closestNearbyNpcId);
      }
    },
    [
      openNpcMission,
      prewarmScenarioVoiceBundleImmediate,
      syncColliderDomRingImmediate,
      triggerColliderBoundaryAudioImmediate,
    ]
  );

  // Refresh proximity state immediately when a scenario is completed or map changes
  useEffect(() => {
    evaluateWorldTriggers(posRef.current.x, posRef.current.y, {
      skipAutoOpen: true,
      suppressAudio: true,
    });
  }, [playerState.completedScenarios, currentMap.id, evaluateWorldTriggers]);

  // Smooth 60fps direct-DOM game render loop (checks movement + pointer collider proximity every frame via refs)
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    const BASE_SPEED = 29; // % of map width/height per second

    const stepFrame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!isMovementFrozenRef.current) {
        const up =
          Boolean(keysPressed.current["w"]) ||
          Boolean(keysPressed.current["arrowup"]) ||
          activeDpadRef.current === "up";
        const down =
          Boolean(keysPressed.current["s"]) ||
          Boolean(keysPressed.current["arrowdown"]) ||
          activeDpadRef.current === "down";
        const left =
          Boolean(keysPressed.current["a"]) ||
          Boolean(keysPressed.current["arrowleft"]) ||
          activeDpadRef.current === "left";
        const right =
          Boolean(keysPressed.current["d"]) ||
          Boolean(keysPressed.current["arrowright"]) ||
          activeDpadRef.current === "right";

        let vx = (right ? 1 : 0) - (left ? 1 : 0);
        let vy = (down ? 1 : 0) - (up ? 1 : 0);

        const hasManualInput = vx !== 0 || vy !== 0;

        if (hasManualInput) {
          // Manual input immediately cancels click-to-walk target
          if (targetWalkPosRef.current) {
            targetWalkPosRef.current = null;
            setWalkTargetRipple(null);
          }
          const mag = Math.hypot(vx, vy);
          vx /= mag;
          vy /= mag;
        } else if (targetWalkPosRef.current) {
          const tx = targetWalkPosRef.current.x;
          const ty = targetWalkPosRef.current.y;
          const dx = tx - posRef.current.x;
          const dy = ty - posRef.current.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= 0.9) {
            const arrivedNpcId = targetWalkPosRef.current.targetNpcId;
            targetWalkPosRef.current = null;
            setWalkTargetRipple(null);
            if (arrivedNpcId) {
              openNpcMission(arrivedNpcId);
            }
          } else {
            vx = dx / dist;
            vy = dy / dist;
          }
        }

        const movingNow = vx !== 0 || vy !== 0;

        if (movingNow !== isWalkingRef.current) {
          isWalkingRef.current = movingNow;
          setIsWalking(movingNow);
        }

        if (movingNow) {
          // Pick dominant facing direction for 4-way 3D character rig
          let nextDir: Direction = directionRef.current;
          if (Math.abs(vy) >= Math.abs(vx)) {
            nextDir = vy < 0 ? "up" : "down";
          } else {
            nextDir = vx < 0 ? "left" : "right";
          }

          if (nextDir !== directionRef.current) {
            directionRef.current = nextDir;
            setDirection(nextDir);
          }

          const nextX = Math.min(Math.max(posRef.current.x + vx * BASE_SPEED * dt, 6), 94);
          const nextY = Math.min(Math.max(posRef.current.y + vy * BASE_SPEED * dt, 12), 92);

          posRef.current.x = nextX;
          posRef.current.y = nextY;

          applyAvatarDomPosition(nextX, nextY);
          playFootstepSFX(nextX, nextY);

          // Automatic walk-through theme transition (doorway / edge portals)
          if (
            !isTransitioningMapRef.current &&
            now >= mapTransitionCooldownUntilRef.current
          ) {
            const portals = MAP_WALK_PORTALS[currentMapRef.current.id] || [];
            const matchedPortal = portals.find((p) => p.matches(nextX, nextY));
            if (matchedPortal) {
              isTransitioningMapRef.current = true;
              mapTransitionCooldownUntilRef.current = now + 700;
              targetWalkPosRef.current = null;
              pointerMapPosRef.current.active = false;
              setWalkTargetRipple(null);
              if (isWalkingRef.current) {
                isWalkingRef.current = false;
                setIsWalking(false);
              }
              unlockAudioContext();
              playDoorTransitionSFX();
              onTransitionMapRef.current(
                matchedPortal.targetMapId,
                matchedPortal.spawnPosition
              );
              rafId = requestAnimationFrame(stepFrame);
              return;
            }
          }
        }

        // Continuous ref-driven collider check inside the render loop (handles both avatar & live mouse proximity)
        if (!isMovementFrozenRef.current && (movingNow || pointerMapPosRef.current.active)) {
          evaluateWorldTriggers(posRef.current.x, posRef.current.y);
        }
      }

      rafId = requestAnimationFrame(stepFrame);
    };

    applyAvatarDomPosition(posRef.current.x, posRef.current.y);
    rafId = requestAnimationFrame(stepFrame);
    return () => cancelAnimationFrame(rafId);
  }, [applyAvatarDomPosition, evaluateWorldTriggers, openNpcMission]);

  // Keyboard listeners + Esc Pause + Space/Enter Greet + Window Blur safety reset
  useEffect(() => {
    const clearInputs = () => {
      keysPressed.current = {};
      activeDpadRef.current = null;
      if (isWalkingRef.current) {
        isWalkingRef.current = false;
        setIsWalking(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "escape") {
        if (!isModalOpen) {
          e.preventDefault();
          playUiClickSFX();
          if (showCompletionModal) {
            setShowCompletionModal(false);
          } else {
            setIsPaused((prev) => !prev);
          }
        }
        return;
      }

      if (isMovementFrozenRef.current) return;

      // Space or Enter greets nearby NPC
      if ((key === " " || key === "enter") && nearbyNpcIdRef.current) {
        e.preventDefault();
        openNpcMission(nearbyNpcIdRef.current);
        return;
      }

      if (
        ["w", "s", "a", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
          key
        )
      ) {
        e.preventDefault();
        keysPressed.current[key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        ["w", "s", "a", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
          key
        )
      ) {
        keysPressed.current[key] = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) clearInputs();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearInputs);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearInputs);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isModalOpen, showCompletionModal, openNpcMission]);

  // D-pad continuous pointer handlers
  const handleDpadPressStart = (dir: Direction) => {
    if (isMovementFrozenRef.current) return;
    targetWalkPosRef.current = null;
    setWalkTargetRipple(null);
    activeDpadRef.current = dir;
  };

  const handleDpadPressEnd = () => {
    activeDpadRef.current = null;
  };

  // Direct O(1) onMouseMove proximity sensor check on the map sandbox (unlocks AudioContext & triggers collider hit in 0ms)
  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMovementFrozenRef.current) return;

    let bounds = mapBoundsRef.current;
    if (bounds.width <= 0 || bounds.height <= 0) {
      if (!mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      bounds = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
      mapBoundsRef.current = bounds;
    }

    const mx = ((e.clientX - bounds.left) / bounds.width) * 100;
    const my = ((e.clientY - bounds.top) / bounds.height) * 100;
    pointerMapPosRef.current = { x: mx, y: my, active: true };

    evaluateWorldTriggers(posRef.current.x, posRef.current.y, { skipAutoOpen: true });
  };

  const handleMapMouseLeave = () => {
    pointerMapPosRef.current = { x: -999, y: -999, active: false };
    if (!isMovementFrozenRef.current) {
      evaluateWorldTriggers(posRef.current.x, posRef.current.y, { skipAutoOpen: true });
    }
  };

  // Direct onMouseEnter collider boundary handler: immediately fires NPC audio & Teacher feedback pre-warm on boundary contact
  const handleNpcColliderEnter = (npcId: string, matchedScenario: Scenario | undefined) => {
    if (isMovementFrozenRef.current) return;
    const refX = pointerMapPosRef.current.active ? pointerMapPosRef.current.x : posRef.current.x;
    triggerColliderBoundaryAudioImmediate(npcId, matchedScenario, refX);
    evaluateWorldTriggers(posRef.current.x, posRef.current.y, { skipAutoOpen: true });
  };

  // Click/Tap anywhere on the map sandbox floor to smoothly walk there!
  const handleMapSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showAudioPopover) {
      setShowAudioPopover(false);
    }
    if (isMovementFrozenRef.current || !mapContainerRef.current) return;
    unlockAudioContext();
    const rect = mapContainerRef.current.getBoundingClientRect();
    mapBoundsRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.min(Math.max(rawX, 6), 94);
    const clampedY = Math.min(Math.max(rawY, 12), 92);

    playTapRippleSFX();
    targetWalkPosRef.current = { x: clampedX, y: clampedY, targetNpcId: null };
    setWalkTargetRipple({ x: clampedX, y: clampedY });
  };

  // Click/Tap directly on any NPC: if already within active proximity collider, open dialog immediately; if far, auto-walk!
  const handleNpcClick = (e: React.MouseEvent, npcId: string) => {
    e.stopPropagation();
    if (isMovementFrozenRef.current) return;
    unlockAudioContext();

    const npc = activeMapNpcs.find((n) => n.id === npcId);
    if (!npc) return;

    const dist = Math.hypot(
      npc.position.x - posRef.current.x,
      npc.position.y - posRef.current.y
    );

    if (dist <= NPC_PROXIMITY_RADIUS || proximityNpcIdsRef.current.includes(npc.id)) {
      openNpcMission(npc.id);
    } else {
      playTapRippleSFX();
      const approachX = Math.min(Math.max(npc.position.x, 7), 93);
      const approachY = Math.min(Math.max(npc.position.y + 5.2, 14), 91);
      targetWalkPosRef.current = {
        x: approachX,
        y: approachY,
        targetNpcId: npc.id,
      };
      setWalkTargetRipple({ x: approachX, y: approachY });
    }
  };

  // Click on the opened 3D backpack in Classroom or Home
  const handleOpenBagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playBagUnzipSFX();
    if (currentMap.id === "class") {
      showBannerNotice(
        `Tas ${playerState.name || "Siswa"} sudah dibuka rapi: buku tulis, penggaris, dan pensil siap dipakai belajar!`
      );
    } else {
      showBannerNotice(
        `Tas sekolah ${playerState.name || "Siswa"} dilepas & dibuka rapi di sudut belajar rumah!`
      );
    }
  };

  const buildCurrentStudentLog = useCallback((): StudentLog => {
    const cleanSlug = (playerState.name || "Siswa").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      id: `student-${cleanSlug || "safestep"}`,
      studentName: playerState.name || "Siswa",
      totalPoints: playerState.points,
      completedScenariosCount: completedCount,
      completedAt: new Date().toISOString(),
      history: playerState.history,
    };
  }, [playerState.name, playerState.points, playerState.history, completedCount]);

  // Fitur 2: Unduh Sertifikat Anak (PDF Lanskap)
  const handleDownloadCertificate = async () => {
    if (isDownloadingPdf) return;
    playUiClickSFX();
    setIsDownloadingPdf(true);
    try {
      await downloadCertificateLandscapePDF(buildCurrentStudentLog(), customScenarios);
    } catch (err) {
      console.error("Failed generating landscape certificate PDF:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Fitur 1: Unduh Rapor Diagnostik (PDF Potret)
  const handleDownloadDiagnosticReport = async () => {
    if (isDownloadingPdf) return;
    playUiClickSFX();
    setIsDownloadingPdf(true);
    try {
      await downloadDiagnosticReportPDF(buildCurrentStudentLog(), customScenarios);
    } catch (err) {
      console.error("Failed generating portrait diagnostic report PDF:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const toggleNpcLabels = useCallback(() => {
    setShowNpcLabels((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("safestep_show_npc_labels", String(next));
      } catch {
        // Ignore storage write errors in restricted environments
      }
      return next;
    });
    playUiClickSFX();
  }, []);

  const toggleDpad = useCallback(() => {
    setShowDpad((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("safestep_show_dpad", String(next));
      } catch {
        // Ignore storage write errors in restricted environments
      }
      return next;
    });
    // Safely reset active touch direction if user hides D-pad while pressing
    if (activeDpadRef.current) {
      activeDpadRef.current = null;
    }
    playUiClickSFX();
  }, []);

  const nearbyNpc = activeMapNpcs.find((n) => n.id === nearbyNpcId) || null;
  const nearbyScenario = nearbyNpc
    ? customScenarios.find(
        (s) => s.npcId === nearbyNpc.id && s.mapId === currentMap.id
      )
    : null;
  const nearbyNpcLabel = nearbyNpc
    ? nearbyScenario?.npcName || NEUTRAL_NPC_LABELS[nearbyNpc.id] || nearbyNpc.name
    : "";

  return (
    <div
      id="gameplay-playground"
      className="h-dvh max-h-dvh bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#ECFDF5] flex flex-col justify-between text-slate-900 overflow-hidden relative font-sans"
    >
      {/* ================= TOP CHILD-FRIENDLY HUD BAR ================= */}
      <header
        id="hud-bar"
        className="bg-[#FFFDF7]/95 backdrop-blur-md border-b border-stone-200/90 px-3 sm:px-5 py-1.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-xs z-30 relative"
      >
        {/* Left: 3D Student Portrait + Name + Current Map & Contextual Bag Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-b from-sky-100 to-amber-50 border-2 border-amber-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0 pt-1">
            <Student3DCharacter
              characterId={currentCharacter.id}
              variant="hud"
              withBackpack={isOutdoorMap}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-display font-extrabold text-slate-900 leading-tight truncate">
              <span className="truncate">{playerState.name}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-0.5 truncate">
              <span className="font-bold text-[#0F766E] truncate">{currentMap.title}</span>
              {soundEnabled && ambienceEnabled && (
                <>
                  <span aria-hidden="true" className="text-stone-300 hidden sm:inline">·</span>
                  <span className="text-slate-500 truncate hidden sm:inline">
                    {currentAmbientProfile.shortLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Segmented 4-Map Quick Navigation (Interactive Buttons) */}
        <nav
          aria-label="Navigasi Peta"
          className="hidden lg:flex items-center gap-1 p-1 bg-stone-100 border border-stone-200/80 rounded-xl"
        >
          {MAPS.map((m) => {
            const mapScenarios = customScenarios.filter((s) => s.mapId === m.id);
            const mapDone = mapScenarios.filter((s) =>
              playerState.completedScenarios.includes(s.id)
            ).length;
            const isCurrent = playerState.currentMapId === m.id;
            const label =
              m.id === "school"
                ? "Sekolah"
                : m.id === "class"
                ? "Kelas"
                : m.id === "street"
                ? "Jalan Pulang"
                : "Rumah";

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (!isCurrent) {
                    playDoorTransitionSFX();
                    onTransitionMap(m.id, getDefaultSpawnForMap(m.id));
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isCurrent
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <span>{label}</span>
                <span className="font-mono tabular-nums text-[11px] text-slate-400">
                  {mapDone}/{mapScenarios.length || 5}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Clean Unboxed Tabular Metrics + Single Contextual Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unboxed Tabular Score & Mission Readout */}
          <div className="flex items-center gap-2 text-xs sm:text-sm pr-1 sm:pr-2 border-r border-stone-200">
            <div className="text-right">
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {completedCount}/{totalMissions}
              </span>
              <span className="text-slate-500 ml-1 hidden sm:inline">Misi</span>
            </div>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <div className="text-right">
              <span className="font-mono tabular-nums font-bold text-amber-700">
                {playerState.points}
              </span>
              <span className="text-slate-500 ml-1">Poin</span>
            </div>
          </div>

          {/* Interactive Badge Prestasi Progress Button */}
          {onOpenBadgeCollection && (
            <button
              id="btn-badge-collection"
              type="button"
              onClick={() => {
                playUiClickSFX();
                onOpenBadgeCollection();
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border font-display font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                unlockedBadges.length > 0
                  ? "bg-amber-50 hover:bg-amber-100 border-amber-300 text-slate-900"
                  : "bg-white hover:bg-stone-100 border-stone-200 text-slate-700"
              }`}
              title={
                nextBadgeTarget
                  ? `Koleksi Badge Prestasi · Target berikutnya: ${nextBadgeTarget.title} (${nextBadgeTarget.requiredPoints} Poin)`
                  : "Semua Badge Prestasi telah diraih!"
              }
            >
              <BadgeEmblemSVG
                badge={highestBadge || ACHIEVEMENT_BADGES[0]}
                locked={!highestBadge}
                size="sm"
              />
              <span className="font-mono tabular-nums font-extrabold">
                {unlockedBadges.length}/{ACHIEVEMENT_BADGES.length}
              </span>
              <span className="hidden md:inline text-slate-600 font-semibold">
                Badge
              </span>
            </button>
          )}

          {/* Single Contextual Finish / Report Button */}
          <button
            id="btn-finish-misi"
            type="button"
            onClick={() => {
              playVictoryFanfareSFX();
              setShowCompletionModal(true);
            }}
            className={`px-3.5 py-2 rounded-xl font-display font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              allCompleted
                ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_3px_0_#D97706]"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_0_#065F46]"
            }`}
            title="Lihat Rapor & Sertifikat Keselamatan"
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>{allCompleted ? "Klaim Piala!" : "Rapor"}</span>
          </button>

          {/* Minimalist NPC Role Label Toggle */}
          <button
            id="btn-toggle-npc-labels"
            type="button"
            onClick={toggleNpcLabels}
            aria-pressed={!showNpcLabels}
            className={`h-9 px-2.5 rounded-xl border text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              showNpcLabels
                ? "bg-white hover:bg-stone-100 border-stone-200 text-slate-700"
                : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900"
            }`}
            title={
              showNpcLabels
                ? "Sembunyikan label nama peran NPC di peta"
                : "Tampilkan label nama peran netral di bawah NPC"
            }
          >
            {showNpcLabels ? (
              <>
                <Eye className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span className="hidden xl:inline">Label Nama</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="hidden xl:inline">Tanpa Label</span>
              </>
            )}
          </button>

          {/* D-Pad Navigational Control Visibility Toggle in Header Toolbar */}
          <button
            id="btn-toggle-dpad"
            type="button"
            onClick={toggleDpad}
            aria-pressed={showDpad}
            className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              showDpad
                ? "bg-white hover:bg-stone-100 border-stone-200 text-slate-700"
                : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900"
            }`}
            title={
              showDpad
                ? "Sembunyikan Kontrol (sembunyikan tombol D-Pad navigasi dari layar)"
                : "Tampilkan Kontrol (tampilkan tombol D-Pad navigasi di layar)"
            }
            aria-label={showDpad ? "Sembunyikan Kontrol" : "Tampilkan Kontrol"}
          >
            <Gamepad2
              className={`w-4 h-4 shrink-0 transition-colors ${
                showDpad ? "text-emerald-600" : "text-amber-700"
              }`}
            />
            <span className="hidden sm:inline">
              {showDpad ? "Sembunyikan Kontrol" : "Tampilkan Kontrol"}
            </span>
            <span className="inline sm:hidden">
              {showDpad ? "Sembunyikan" : "Kontrol"}
            </span>
          </button>

          {/* Location Ambient Soundscape Mixer Popover Button */}
          <button
            id="btn-ambient-mixer"
            type="button"
            onClick={() => {
              playUiClickSFX();
              setShowControlGuide(false);
              setShowAudioPopover((prev) => !prev);
            }}
            aria-expanded={showAudioPopover}
            aria-label="Pengaturan Suasana Audio Lokasi"
            title={`Suasana Audio: ${currentAmbientProfile.shortLabel}`}
            className={`h-9 px-2.5 rounded-xl border text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              showAudioPopover
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : soundEnabled && ambienceEnabled
                ? "bg-white hover:bg-stone-100 border-stone-200 text-emerald-700"
                : "bg-white hover:bg-stone-100 border-stone-200 text-slate-400"
            }`}
          >
            <AudioLines className="w-4 h-4 shrink-0" />
            <span className="hidden 2xl:inline">Suasana</span>
          </button>

          {/* Master Sound Quick Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabledState(next);
              if (next) playUiClickSFX();
            }}
            className="w-9 h-9 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label={soundEnabled ? "Matikan Suara" : "Nyalakan Suara"}
            title={soundEnabled ? "Matikan Semua Suara" : "Nyalakan Suara"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Pause / Map Progress Menu Button (Esc) */}
          <button
            type="button"
            onClick={() => {
              playUiClickSFX();
              setShowAudioPopover(false);
              setIsPaused(true);
            }}
            className="w-9 h-9 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Jeda Permainan"
            title="Jeda & Kompas Peta (Esc)"
          >
            <Pause className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle Button for Laptop / Projector (InFocus) */}
          {isFullscreenSupported() && onToggleFullscreen && (
            <button
              id="btn-toggle-fullscreen"
              type="button"
              onClick={() => {
                playUiClickSFX();
                onToggleFullscreen();
              }}
              aria-pressed={isFullscreen}
              className={`h-9 px-2.5 rounded-xl border text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isFullscreen
                  ? "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900"
                  : "bg-white hover:bg-stone-100 border-stone-200 text-slate-700"
              }`}
              aria-label={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              title={
                isFullscreen
                  ? "Keluar dari mode Layar Penuh (Esc)"
                  : "Perbesar ke Layar Penuh untuk Laptop / InFocus"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-amber-700 shrink-0" />
              ) : (
                <Maximize2 className="w-4 h-4 text-[#2563EB] shrink-0" />
              )}
              <span className="hidden 2xl:inline">
                {isFullscreen ? "Keluar Penuh" : "Layar Penuh"}
              </span>
            </button>
          )}

          {/* Help Guide Toggle */}
          <button
            type="button"
            onClick={() => {
              playUiClickSFX();
              setShowAudioPopover(false);
              setShowControlGuide((prev) => !prev);
            }}
            className="hidden sm:flex w-9 h-9 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-slate-700 items-center justify-center cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Panduan Bermain"
            title="Panduan Kontrol"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Restart Game & Return to Initial Home Screen */}
          <button
            id="btn-restart-to-home"
            type="button"
            onClick={() => {
              playUiClickSFX();
              setShowAudioPopover(false);
              setShowControlGuide(false);
              setIsPaused(false);
              setShowCompletionModal(false);
              if (onRestartToHome) {
                onRestartToHome();
              } else {
                onExitGame();
              }
            }}
            className="h-9 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Mulai Ulang ke Beranda Awal"
            title="Mulai ulang game dan kembali ke beranda awal"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="hidden sm:inline">Mulai Ulang</span>
          </button>
        </div>
      </header>

      {/* ================= PRIMARY PROPORTIONAL 3D MAP SANDBOX VIEWPORT ================= */}
      <div
        ref={viewportRef}
        id="sandbox-viewport"
        onClick={handleMapSurfaceClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        className="flex-1 w-full min-h-0 relative overflow-hidden flex items-center justify-center p-1 sm:p-1.5 bg-gradient-to-br from-[#F1F5F9] via-[#EFF6FF] to-[#ECFDF5] select-none"
      >
        {/* ACTIVE MAP INTERACTIVE STAGE (Cleanly framed to exact native aspect ratio with zero blank side wings) */}
        <div
          ref={mapContainerRef}
          id="active-map-sandbox"
          onClick={(e) => {
            e.stopPropagation();
            handleMapSurfaceClick(e);
          }}
          className={`relative overflow-hidden rounded-2xl lg:rounded-[20px] shadow-[0_18px_48px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/10 border-2 border-white/85 transition-colors duration-300 select-none cursor-pointer ${currentMap.backgroundColor}`}
          style={
            sandboxStyle
              ? {
                  width: `${sandboxStyle.width}px`,
                  height: `${sandboxStyle.height}px`,
                  aspectRatio: `${MAP_NATIVE_ASPECT_RATIOS[currentMap.id] || 1.5}`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                }
              : {
                  aspectRatio: `${MAP_NATIVE_ASPECT_RATIOS[currentMap.id] || 1.5}`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: `min(100%, calc((100vh - 96px) * ${MAP_NATIVE_ASPECT_RATIOS[currentMap.id] || 1.5}))`,
                  height: `min(100%, calc(100vw / ${MAP_NATIVE_ASPECT_RATIOS[currentMap.id] || 1.5}))`,
                }
          }
        >
          {/* SMOOTH CROSSFADE 3D SCENE BACKDROP PER MAP */}
          <motion.div
            key={`scene-${currentMap.id}`}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* 1. SCHOOL MAP (5-Zone Realistic 3D Halaman Sekolah SD Negeri SafeStep) */}
            {currentMap.id === "school" && <Schoolyard3DScene />}

            {/* 2. CLASS MAP (3D Perspective Ruang Kelas 5A SD Negeri) */}
            {currentMap.id === "class" && <Classroom3DScene />}

            {/* 3. STREET MAP (3D Perjalanan Pulang Sekolah) */}
            {currentMap.id === "street" && <Street3DScene />}

            {/* 4. HOME MAP (3D Lingkungan Rumah Modern Siswa) */}
            {currentMap.id === "home" && <Home3DScene />}
          </motion.div>

          {/* SUBTLE DIEGETIC WALK-THROUGH PORTAL THRESHOLD INDICATORS */}
          {(MAP_WALK_PORTALS[currentMap.id] || []).map((portal) => {
            const isRightEdge = portal.markerPos.x >= 85;
            const isLeftEdge = portal.markerPos.x <= 15;
            const isBottomEdge = portal.markerPos.y >= 88;

            const positionStyle: React.CSSProperties = isRightEdge
              ? { right: "1.75%", top: `${portal.markerPos.y}%` }
              : isLeftEdge
              ? { left: "1.75%", top: `${portal.markerPos.y}%` }
              : isBottomEdge
              ? { left: `${portal.markerPos.x}%`, bottom: "1.5%" }
              : { left: `${portal.markerPos.x}%`, top: `${portal.markerPos.y}%` };

            const alignClasses = isRightEdge
              ? "-translate-y-1/2 items-end"
              : isLeftEdge
              ? "-translate-y-1/2 items-start"
              : isBottomEdge
              ? "-translate-x-1/2 flex-col-reverse items-center"
              : "-translate-x-1/2 -translate-y-1/2 items-center";

            return (
              <button
                key={portal.id}
                id={`walk-portal-${portal.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMovementFrozenRef.current) return;
                  unlockAudioContext();
                  playTapRippleSFX();
                  targetWalkPosRef.current = {
                    x: portal.walkTarget.x,
                    y: portal.walkTarget.y,
                    targetNpcId: null,
                  };
                  setWalkTargetRipple({
                    x: portal.walkTarget.x,
                    y: portal.walkTarget.y,
                  });
                }}
                style={positionStyle}
                className={`absolute z-[140] group flex flex-col gap-1 cursor-pointer focus:outline-none ${alignClasses}`}
                title={`Berjalan ke sini untuk otomatis pindah: ${portal.label}`}
                aria-label={`Akses otomatis ${portal.label}`}
              >
                <span className="w-8 h-4 rounded-full bg-amber-300/35 border-2 border-amber-300/90 shadow-[0_0_16px_rgba(251,191,36,0.55)] animate-pulse group-hover:scale-110 transition-transform" />
                <span className="px-2 py-0.5 rounded-md bg-slate-900/75 text-amber-100 border border-amber-200/40 text-[10px] font-display font-bold whitespace-nowrap shadow-xs group-hover:bg-slate-900/90 transition-colors">
                  {portal.label}
                </span>
              </button>
            );
          })}

          {/* CLICK / TAP-TO-WALK TARGET RIPPLE ON FLOOR */}
          {walkTargetRipple && (
            <div
              className="pointer-events-none absolute z-[120]"
              style={{
                left: `${walkTargetRipple.x}%`,
                top: `${walkTargetRipple.y}%`,
              }}
            >
              <div className="w-7 h-4 rounded-full border-2 border-amber-400 bg-amber-300/25 animate-tap-ripple" />
              <div className="w-2 h-1.5 rounded-full bg-amber-400 -translate-x-1/2 -translate-y-1/2 shadow-xs" />
            </div>
          )}

          {/* CONTEXTUAL 3D UNZIPPED OPEN SCHOOL BACKPACK IN CLASSROOM & HOME */}
          {openBagPosition && (
            <button
              type="button"
              id="student-open-backpack-prop"
              onClick={handleOpenBagClick}
              style={{
                left: `${openBagPosition.x}%`,
                top: `${openBagPosition.y}%`,
                zIndex: Math.round(openBagPosition.y * 10) - 2,
              }}
              className="absolute -translate-x-1/2 -translate-y-[78%] cursor-pointer transition-transform duration-150 hover:scale-108 focus:outline-none"
              title="Klik untuk melihat isi tas sekolahmu yang terbuka"
            >
              <StudentOpenBag3D
                characterId={currentCharacter.id}
                studentName={playerState.name}
              />
            </button>
          )}

          {/* ALWAYS-MOUNTED 3-4m PROXIMITY SENSOR COLLIDERS (Direct DOM + onMouseEnter/onMouseMove Zero-Render Audio Boundary) */}
          {activeMapNpcs.map((npc) => {
            const matchedScenario = customScenarios.find(
              (s) => s.npcId === npc.id && s.mapId === currentMap.id
            );
            if (!matchedScenario) return null;
            const isCompleted = playerState.completedScenarios.includes(matchedScenario.id);
            if (isCompleted) return null;

            const isInProximity = proximityNpcIds.includes(npc.id);

            return (
              <div
                key={`collider-${npc.id}`}
                id={`npc-collider-${npc.id}`}
                ref={(el) => {
                  colliderDomRefs.current[npc.id] = el;
                }}
                aria-hidden="true"
                onMouseEnter={() => handleNpcColliderEnter(npc.id, matchedScenario)}
                onMouseMove={() => handleNpcColliderEnter(npc.id, matchedScenario)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-[34%] aspect-[1.55/1] rounded-full border-2 border-amber-200/80 bg-amber-100/15 shadow-[0_0_24px_rgba(251,191,36,0.2)] transition-opacity duration-150 z-[6] ${
                  isInProximity ? "animate-npc-proximity-ring" : "opacity-0"
                }`}
                style={{
                  left: `${npc.position.x}%`,
                  top: `${npc.position.y}%`,
                }}
              />
            );
          })}

          {/* 3D ANIMATED HUMAN NPCS (Proximity Wave + Dynamic Speech Bubble, No Passive !/? Icons) */}
          {activeMapNpcs.map((npc) => {
            const matchedScenario = customScenarios.find(
              (s) => s.npcId === npc.id && s.mapId === currentMap.id
            );
            if (!matchedScenario) return null;
            const isCompleted = playerState.completedScenarios.includes(matchedScenario.id);
            const isInProximity = !isCompleted && proximityNpcIds.includes(npc.id);
            const showSpeechBubble =
              !isCompleted && activeBubbleNpcId === npc.id && !isMovementFrozen;
            const isMeeting = nearbyNpcId === npc.id;
            const displayNpcLabel =
              matchedScenario?.npcName || NEUTRAL_NPC_LABELS[npc.id] || npc.name;
            const calloutSpeech = getScenarioCalloutText(
              matchedScenario,
              npc.id,
              playerState.name
            );

            // Edge-safe alignment so speech bubbles near map borders never clip
            const nearLeftEdge = npc.position.x <= 24;
            const nearRightEdge = npc.position.x >= 76;
            const nearTopEdge = npc.position.y <= 26;

            const bubblePosClass = nearLeftEdge
              ? "left-0 -translate-x-[12%]"
              : nearRightEdge
              ? "right-0 translate-x-[12%]"
              : "left-1/2 -translate-x-1/2";

            const tailPosClass = nearLeftEdge
              ? "left-8"
              : nearRightEdge
              ? "right-8"
              : "left-1/2 -translate-x-1/2";

            return (
              <div
                key={npc.id}
                id={`npc-sprite-${npc.id}`}
                className="absolute -translate-x-1/2 -translate-y-[82%] cursor-pointer flex flex-col items-center select-none group"
                style={{
                  left: `${npc.position.x}%`,
                  top: `${npc.position.y}%`,
                  zIndex: showSpeechBubble ? 1450 : Math.round(npc.position.y * 10),
                }}
                onMouseEnter={() => handleNpcColliderEnter(npc.id, matchedScenario)}
                onClick={(e) => handleNpcClick(e, npc.id)}
              >
                {/* Dynamic Floating Proximity Speech Bubble (Replaces Passive ! / ? Icons) */}
                <AnimatePresence>
                  {showSpeechBubble && (
                    <motion.button
                      key={`bubble-${npc.id}`}
                      id={`npc-speech-bubble-${npc.id}`}
                      type="button"
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.92 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openNpcMission(npc.id);
                      }}
                      className={`absolute ${
                        nearTopEdge ? "bottom-[calc(100%-4px)]" : "bottom-[calc(100%+5px)]"
                      } ${bubblePosClass} z-40 w-[192px] sm:w-[232px] min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl`}
                      aria-label={`${displayNpcLabel}: ${calloutSpeech}. Ketuk untuk membuka percakapan.`}
                    >
                      <div className="relative bg-[#FFFDF8]/98 hover:bg-white border-2 border-amber-300 hover:border-amber-400 rounded-2xl px-3 py-2 text-left shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-colors animate-npc-speech-bob">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <span className="text-[10px] font-display font-extrabold text-[#0F766E] truncate">
                            {showNpcLabels ? displayNpcLabel : "Menyapamu"}
                          </span>
                          <span className="inline-flex items-center gap-1 shrink-0">
                            {speakingNpcId === npc.id && (
                              <span className="text-[9px] font-bold text-amber-700 animate-pulse">
                                Berbicara...
                              </span>
                            )}
                            <Volume2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                speakingNpcId === npc.id
                                  ? "text-amber-600 animate-bounce"
                                  : "text-amber-600"
                              }`}
                            />
                          </span>
                        </div>

                        <p className="text-[11px] sm:text-xs font-sans font-semibold text-slate-800 leading-snug">
                          “{calloutSpeech}”
                        </p>

                        <div className="mt-1 text-[10px] font-display font-bold text-amber-700 flex items-center justify-between">
                          <span>Ketuk untuk merespons</span>
                          <span aria-hidden="true">→</span>
                        </div>

                        {/* Speech Bubble Pointer Tail */}
                        <span
                          aria-hidden="true"
                          className={`absolute -bottom-[8px] ${tailPosClass} w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-amber-300`}
                        />
                        <span
                          aria-hidden="true"
                          className={`absolute -bottom-[5.5px] ${tailPosClass} w-0 h-0 border-l-[5.5px] border-l-transparent border-r-[5.5px] border-r-transparent border-t-[6.5px] border-t-[#FFFDF8]`}
                        />
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Subtle Completed Checkmark Only (No Passive ! / ? Icons for Uncompleted NPCs) */}
                {isCompleted && (
                  <div
                    className="mb-1 bg-emerald-500 border-2 border-white text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md z-20"
                    aria-label="Misi selesai"
                  >
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* 3D Animated Human NPC + Optional Neutral Identity Tag */}
                <div
                  className={`flex flex-col items-center relative transition-transform duration-150 ${
                    isInProximity ? "scale-105" : "group-hover:scale-105"
                  }`}
                >
                  <Npc3DCharacter
                    npcId={npc.id}
                    npcName={displayNpcLabel}
                    npcType={matchedScenario?.npcType}
                    colorClass={npc.color}
                    isMeeting={isMeeting}
                    isWaving={isInProximity}
                    isCompleted={isCompleted}
                    variant="map"
                  />

                  {showNpcLabels && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] -mt-0.5 font-bold shadow-xs shrink-0 whitespace-nowrap z-20 bg-slate-900/88 border border-white/25 text-white">
                      {displayNpcLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* 3D ANIMATED ELEMENTARY SCHOOL STUDENT PLAYER AVATAR (60fps Direct-DOM Driven) */}
          <div
            ref={playerDomRef}
            id="player-avatar"
            className="absolute -translate-x-1/2 -translate-y-[82%] flex flex-col items-center pointer-events-none will-change-[left,top]"
            style={{
              left: `${playerState.playerPosition.x}%`,
              top: `${playerState.playerPosition.y}%`,
              zIndex: Math.round(playerState.playerPosition.y * 10),
            }}
          >
            <Student3DCharacter
              characterId={currentCharacter.id}
              variant="map"
              direction={direction}
              isWalking={isWalking}
              withBackpack={isOutdoorMap}
            />

            <span className="border border-white/90 text-white font-display font-bold text-[9px] px-2 py-0.5 rounded-md -mt-0.5 shadow-sm bg-[#DC2626] z-20 whitespace-nowrap">
              {playerState.name}
            </span>
          </div>
        </div>

        {/* FLOATING NEARBY NPC INTERACT BUTTON (Space / Enter / Click - Neutral & Spoiler-Free) */}
        <AnimatePresence>
          {nearbyNpc && !isMovementFrozen && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => openNpcMission(nearbyNpc.id)}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1800] px-4 py-2.5 rounded-2xl border-2 border-white shadow-lg font-display font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap bg-amber-400 hover:bg-amber-300 text-slate-950"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>
                {showNpcLabels ? `Interaksi: ${nearbyNpcLabel}` : "Periksa Situasi"}
              </span>
              <span className="hidden sm:inline font-mono text-[11px] opacity-80">
                [Spasi]
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* CONTEXTUAL INDOOR BACKPACK & GAMEPLAY NOTICE */}
        <AnimatePresence>
          {contextualNotice && !isMovementFrozen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="absolute top-5 left-1/2 -translate-x-1/2 bg-[#FFFDF7] border-2 border-amber-300 text-slate-900 px-4 py-2.5 rounded-2xl font-sans font-bold text-xs shadow-lg z-[1900] max-w-md text-center"
            >
              {contextualNotice}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DYNAMIC LOCATION AMBIENT SOUNDSCAPE MIXER POPOVER */}
        <AnimatePresence>
          {showAudioPopover && (
            <motion.div
              id="hud-audio-popover"
              initial={{ scale: 0.95, opacity: 0, y: -6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 sm:right-5 z-[2050] bg-[#FFFDF7] p-4 rounded-2xl border-2 border-amber-200 w-76 sm:w-80 text-xs flex flex-col gap-3 shadow-xl text-slate-800"
            >
              <div className="flex items-start justify-between gap-2 border-b border-stone-200 pb-2.5">
                <div>
                  <div className="font-display font-extrabold text-sm text-slate-900">
                    Suasana Audio Lokasi
                  </div>
                  <div className="text-[11px] font-semibold text-[#0F766E] mt-0.5">
                    {currentAmbientProfile.title} · {currentAmbientProfile.shortLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAudioPopover(false)}
                  className="text-slate-400 hover:text-slate-800 cursor-pointer p-0.5"
                  aria-label="Tutup pengaturan audio"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {currentAmbientProfile.description}
              </p>

              <div className="text-[11px] font-medium text-slate-500">
                {currentAmbientProfile.layersLabel}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = !ambienceEnabled;
                    setAmbienceEnabledState(next);
                    if (!soundEnabled && next) {
                      setSoundEnabledState(true);
                    }
                    playUiClickSFX();
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                    soundEnabled && ambienceEnabled
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-white border-stone-200 text-slate-600"
                  }`}
                >
                  <span>Suara Alam/Peta</span>
                  <span className="font-mono tabular-nums font-bold">
                    {soundEnabled && ambienceEnabled ? "ON" : "OFF"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !musicEnabled;
                    setMusicEnabledState(next);
                    if (!soundEnabled && next) {
                      setSoundEnabledState(true);
                    }
                    playUiClickSFX();
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                    soundEnabled && musicEnabled
                      ? "bg-sky-50 border-sky-300 text-sky-900"
                      : "bg-white border-stone-200 text-slate-600"
                  }`}
                >
                  <span>Musik Latar</span>
                  <span className="font-mono tabular-nums font-bold">
                    {soundEnabled && musicEnabled ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 pt-0.5">
                <label
                  htmlFor="hud-ambience-volume"
                  className="text-xs font-semibold text-slate-700 shrink-0"
                >
                  Volume Suasana
                </label>
                <input
                  id="hud-ambience-volume"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(ambienceVolume * 100)}
                  onChange={(e) => {
                    const val = Number(e.target.value) / 100;
                    setAmbienceVolumeState(val);
                    if (val > 0 && !ambienceEnabled) {
                      setAmbienceEnabledState(true);
                    }
                    if (val > 0 && !soundEnabled) {
                      setSoundEnabledState(true);
                    }
                  }}
                  className="flex-1 accent-emerald-600 cursor-pointer"
                />
                <span className="w-9 text-right text-xs font-mono tabular-nums font-bold text-slate-700">
                  {Math.round(ambienceVolume * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!soundEnabled) setSoundEnabledState(true);
                  if (!ambienceEnabled) setAmbienceEnabledState(true);
                  previewAmbientCue(currentMap.id);
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-display font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span>Dengarkan Suasana {currentMap.title}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OPTIONAL QUICK CONTROL GUIDE POPOVER */}
        <AnimatePresence>
          {showControlGuide && (
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="absolute top-4 right-4 z-[2000] bg-[#FFFDF7] p-4 rounded-2xl border-2 border-amber-200 w-64 text-xs flex flex-col gap-2.5 shadow-xl text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-display font-extrabold text-sm text-slate-900">
                  Cara Bermain
                </span>
                <button
                  type="button"
                  onClick={() => setShowControlGuide(false)}
                  className="text-slate-400 hover:text-slate-800 cursor-pointer"
                  aria-label="Tutup panduan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-1.5 text-slate-700 font-medium leading-snug">
                <li>
                  <strong className="text-slate-900">Jalan:</strong> Tombol WASD, Panah Keyboard, D-Pad, atau klik langsung lantai peta.
                </li>
                <li>
                  <strong className="text-slate-900">Pindah Lokasi Otomatis:</strong> Masuk ke pintu kelas atau berjalan ke sisi kanan/pintu keluar untuk langsung berpindah tempat secara otomatis.
                </li>
                <li>
                  <strong className="text-slate-900">Interaksi:</strong> Berjalan mendekati karakter (sekitar 3–4 meter) hingga mereka melambaikan tangan & menyapa lewat balon teks, lalu ketuk balon teks atau dekati untuk merespons.
                </li>
                <li>
                  <strong className="text-slate-900">Label Nama:</strong> Klik ikon mata di atas untuk menyembunyikan atau menampilkan nama peran NPC.
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= PAUSE & MAP PROGRESS MODAL (ESC) ================= */}
        <AnimatePresence>
          {isPaused && (
            <div
              className="fixed inset-0 z-[4500] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Menu Jeda Permainan"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-[#FFFDF7] border-2 border-amber-200 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-900 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="text-xl font-display font-extrabold text-slate-900">
                      Permainan Dijeda
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Pilih lokasi peta atau lanjutkan petualanganmu
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playUiClickSFX();
                      setIsPaused(false);
                    }}
                    className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-600 cursor-pointer"
                    aria-label="Lanjutkan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Per-Map Progress Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-600">
                    Progres Misi Tiap Lokasi
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {MAPS.map((m) => {
                      const mapScenarios = customScenarios.filter((s) => s.mapId === m.id);
                      const done = mapScenarios.filter((s) =>
                        playerState.completedScenarios.includes(s.id)
                      ).length;
                      const isCurrent = playerState.currentMapId === m.id;
                      const mapAudioLabel = getLocationProfile(m.id).shortLabel;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            playDoorTransitionSFX();
                            setIsPaused(false);
                            if (!isCurrent) {
                              onTransitionMap(m.id, getDefaultSpawnForMap(m.id));
                            }
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-amber-50 border-amber-400"
                              : "bg-white hover:bg-stone-50 border-stone-200"
                          }`}
                        >
                          <div className="text-xs font-display font-bold text-slate-900 truncate">
                            {m.title}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-600 truncate">
                            <span className="font-mono tabular-nums font-semibold">
                              {done}/{mapScenarios.length || 5} Misi
                            </span>
                            <span aria-hidden="true" className="text-stone-300">·</span>
                            <span className="text-slate-500 truncate">{mapAudioLabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Map NPC Role Label Toggle */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Label Nama NPC di Peta
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      {showNpcLabels
                        ? "Menampilkan peran netral tanpa membocorkan ancaman"
                        : "Label nama disembunyikan (interaksi murni lewat sapaan jarak dekat)"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleNpcLabels}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      showNpcLabels
                        ? "bg-sky-50 border-sky-300 text-sky-900"
                        : "bg-amber-50 border-amber-300 text-amber-900"
                    }`}
                  >
                    {showNpcLabels ? (
                      <>
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Label Netral</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        <span>Tanpa Label</span>
                      </>
                    )}
                  </button>
                </div>

                {/* D-Pad Navigational Control Visibility Toggle in Pause Menu */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Tombol Kontrol Navigasi (D-Pad)
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      {showDpad
                        ? "D-Pad arah ditampilkan di layar (cocok untuk layar sentuh / tablet)"
                        : "D-Pad disembunyikan (karakter tetap dapat digerakkan dengan keyboard WASD / Panah)"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDpad}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      showDpad
                        ? "bg-white hover:bg-stone-50 border-stone-200 text-slate-800"
                        : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900"
                    }`}
                  >
                    <Gamepad2 className={`w-3.5 h-3.5 shrink-0 ${showDpad ? "text-emerald-600" : "text-amber-700"}`} />
                    <span>{showDpad ? "Sembunyikan Kontrol" : "Tampilkan Kontrol"}</span>
                  </button>
                </div>

                {/* Location Ambient Audio & Music Controls */}
                <div className="pt-3 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Audio Lokasi: {currentAmbientProfile.shortLabel}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {currentAmbientProfile.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !ambienceEnabled;
                        setAmbienceEnabledState(next);
                        if (!soundEnabled && next) {
                          setSoundEnabledState(true);
                        }
                        playUiClickSFX();
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                        soundEnabled && ambienceEnabled
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-white border-stone-200 text-slate-600"
                      }`}
                    >
                      <span>Suara Lingkungan</span>
                      <span className="font-mono tabular-nums font-bold">
                        {soundEnabled && ambienceEnabled ? "ON" : "OFF"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !musicEnabled;
                        setMusicEnabledState(next);
                        if (!soundEnabled && next) {
                          setSoundEnabledState(true);
                        }
                        playUiClickSFX();
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                        soundEnabled && musicEnabled
                          ? "bg-sky-50 border-sky-300 text-sky-900"
                          : "bg-white border-stone-200 text-slate-600"
                      }`}
                    >
                      <span>Musik Melodi</span>
                      <span className="font-mono tabular-nums font-bold">
                        {soundEnabled && musicEnabled ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="ambience-volume-slider"
                      className="text-xs font-medium text-slate-600 shrink-0"
                    >
                      Volume Lingkungan
                    </label>
                    <input
                      id="ambience-volume-slider"
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(ambienceVolume * 100)}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        setAmbienceVolumeState(val);
                        if (val > 0 && !ambienceEnabled) {
                          setAmbienceEnabledState(true);
                        }
                        if (val > 0 && !soundEnabled) {
                          setSoundEnabledState(true);
                        }
                      }}
                      className="flex-1 accent-emerald-600 cursor-pointer"
                    />
                    <span className="w-10 text-right text-xs font-mono tabular-nums font-bold text-slate-700">
                      {Math.round(ambienceVolume * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playUiClickSFX();
                      setIsPaused(false);
                    }}
                    className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_3px_0_#1E40AF]"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Lanjutkan Bermain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPaused(false);
                      playVictoryFanfareSFX();
                      setShowCompletionModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Lihat Rapor & Sertifikat</span>
                  </button>

                  {onRestartToHome && (
                    <button
                      type="button"
                      onClick={() => {
                        playUiClickSFX();
                        setIsPaused(false);
                        onRestartToHome();
                      }}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Mulai Ulang ke Beranda Awal</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      playUiClickSFX();
                      onExitGame();
                    }}
                    className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-stone-200 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar ke Beranda</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================= WARM CHILD-FRIENDLY VICTORY & REPORT MODAL ================= */}
        <AnimatePresence>
          {showCompletionModal && (
            <div
              className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Rapor Petualangan SafeStep"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 24 }}
                transition={{ type: "spring", stiffness: 190, damping: 20 }}
                className="bg-[#FFFDF7] border-2 border-amber-300 rounded-3xl w-full max-w-xl p-5 sm:p-7 text-center relative shadow-[0_24px_60px_rgba(15,23,42,0.35)] flex flex-col items-center my-auto text-slate-900"
              >
                <button
                  type="button"
                  onClick={() => {
                    playUiClickSFX();
                    setShowCompletionModal(false);
                  }}
                  className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-600 flex items-center justify-center cursor-pointer"
                  aria-label="Tutup jendela rapor"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Honest 1-3 Golden Star Rating SVG Row */}
                <div className="flex items-center justify-center gap-3 mt-1 mb-2">
                  {[1, 2, 3].map((starIdx) => {
                    const active = completedCount > 0 && starIdx <= earnedStars;
                    return (
                      <motion.svg
                        key={starIdx}
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: starIdx === 2 ? 1.15 : 1, opacity: 1 }}
                        transition={{ delay: starIdx * 0.1, type: "spring" }}
                        viewBox="0 0 40 40"
                        className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-xs"
                      >
                        <path
                          d="M20 3.5L24.9 13.8L36.2 15.3L28 23.2L30 34.5L20 29L10 34.5L12 23.2L3.8 15.3L15.1 13.8L20 3.5Z"
                          fill={active ? "#FACC15" : "#E2E8F0"}
                          stroke={active ? "#D97706" : "#CBD5E1"}
                          strokeWidth="2.2"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    );
                  })}
                </div>

                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
                  {allCompleted ? "Hebat & Berani, Pahlawan Cilik!" : "Ringkasan Petualanganmu"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  {playerState.name} ·{" "}
                  {allCompleted
                    ? "Seluruh 20 misi keselamatan telah diselesaikan!"
                    : `Baru menyelesaikan ${completedCount} dari ${totalMissions} misi keselamatan`}
                </p>

                {/* 3D Animated School Friends Cheering Together */}
                <div className="w-full bg-gradient-to-b from-sky-50 to-amber-50/70 rounded-2xl p-4 border border-amber-200/80 my-4 flex flex-col items-center">
                  <div className="flex items-end justify-center gap-6 sm:gap-10 pt-1">
                    <div className="flex flex-col items-center">
                      <Student3DCharacter
                        characterId="budi"
                        variant="celebrate"
                        withBackpack={false}
                      />
                    </div>

                    <div className="flex flex-col items-center">
                      <Student3DCharacter
                        characterId="ani"
                        variant="celebrate"
                        withBackpack={false}
                      />
                    </div>

                    <div className="flex flex-col items-center">
                      <Student3DCharacter
                        characterId="citra"
                        variant="celebrate"
                        withBackpack={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Clean Tabular Score Summary */}
                <div className="w-full grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white border border-stone-200 rounded-2xl py-3 px-4">
                    <div className="text-xs font-semibold text-slate-500">Total Skor</div>
                    <div className="text-2xl font-mono tabular-nums font-extrabold text-amber-600 mt-0.5">
                      {playerState.points}{" "}
                      <span className="text-xs font-sans font-semibold text-slate-400">
                        / {maxPossiblePoints}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl py-3 px-4">
                    <div className="text-xs font-semibold text-slate-500">Misi Dijawab</div>
                    <div className="text-2xl font-mono tabular-nums font-extrabold text-emerald-600 mt-0.5">
                      {completedCount}{" "}
                      <span className="text-xs font-sans font-semibold text-slate-400">
                        / {totalMissions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Earned Achievement Badges Showcase Row */}
                <div className="w-full bg-white border border-stone-200 rounded-2xl p-3.5 sm:p-4 mb-4">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="text-xs font-display font-extrabold text-slate-800">
                      Badge Prestasi ({unlockedBadges.length}/{ACHIEVEMENT_BADGES.length})
                    </div>
                    {onOpenBadgeCollection && (
                      <button
                        type="button"
                        onClick={() => {
                          playUiClickSFX();
                          setShowCompletionModal(false);
                          onOpenBadgeCollection();
                        }}
                        className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                      >
                        Lihat Detail Badge
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {ACHIEVEMENT_BADGES.map((badge) => {
                      const earned = playerState.points >= badge.requiredPoints;
                      return (
                        <div
                          key={badge.id}
                          className={`flex flex-col items-center p-1.5 rounded-xl transition-opacity ${
                            earned ? "opacity-100" : "opacity-55"
                          }`}
                          title={`${badge.title} (${badge.requiredPoints} Poin)`}
                        >
                          <BadgeEmblemSVG badge={badge} locked={!earned} size="sm" />
                          <span className="mt-1 text-[10px] font-mono tabular-nums font-bold text-slate-700">
                            {badge.requiredPoints}p
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3 Golden Safety Rules Reminder */}
                <div className="w-full text-left bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-1.5 mb-5">
                  <div className="text-xs font-display font-extrabold text-amber-900">
                    3 Aturan Emas Keselamatan Anak SD
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    1. <strong>Tolak & Menjauh</strong> bila orang asing memberi hadiah atau mengajak pergi.
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    2. <strong>Katakan TIDAK</strong> bila ada sentuhan tidak nyaman atau ajakan rahasia buruk.
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    3. <strong>Segera Lapor</strong> kepada Ayah, Ibu, Bapak/Ibu Guru, atau Satpam Sekolah.
                  </p>
                </div>

                {/* Separated Document Outputs: Sertifikat (PDF Lanskap) & Rapor Diagnostik (PDF Potret) */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadCertificate}
                    disabled={isDownloadingPdf}
                    className="py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-display font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-[0_3px_0_#1E40AF] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>Unduh Sertifikat (PDF Lanskap)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDiagnosticReport}
                    disabled={isDownloadingPdf}
                    className="py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-display font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-[0_3px_0_#0F766E] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Rapor Diagnostik (PDF Potret)</span>
                  </button>
                </div>

                {/* Secondary Actions: Play Again & Continue / Home */}
                <div className="w-full flex flex-col sm:flex-row gap-2.5">
                  {onPlayAgain && (
                    <button
                      type="button"
                      onClick={() => {
                        playUiClickSFX();
                        setShowCompletionModal(false);
                        onPlayAgain();
                      }}
                      className="flex-1 py-2.5 px-4 bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 font-display font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>Main Lagi</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      playUiClickSFX();
                      if (allCompleted) {
                        onExitGame();
                      } else {
                        setShowCompletionModal(false);
                      }
                    }}
                    className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-[0_3px_0_#D97706] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{allCompleted ? "Selesai & Simpan" : "Lanjut Jelajah"}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* ================= FLOATING ON-MAP TOUCH & NAVIGATION OVERLAYS ================= */}
        <div
          id="mobile-navigation-bay"
          className="pointer-events-none absolute inset-x-3 bottom-3 sm:inset-x-5 sm:bottom-4 z-[1700] flex items-end justify-between gap-3 select-none"
        >
          {/* Compact Mobile Map Switcher (Hidden on Desktop since Top HUD has Map Tabs) */}
          <div className="pointer-events-auto flex lg:hidden flex-wrap items-center gap-1 p-1 bg-[#FFFDF7]/92 backdrop-blur-md rounded-xl border border-stone-200/90 shadow-md">
            {MAPS.map((m) => {
              const isCurrent = playerState.currentMapId === m.id;
              const shortLabel =
                m.id === "school"
                  ? "Sekolah"
                  : m.id === "class"
                  ? "Kelas"
                  : m.id === "street"
                  ? "Jalan"
                  : "Rumah";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCurrent) {
                      playDoorTransitionSFX();
                      onTransitionMap(m.id, getDefaultSpawnForMap(m.id));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    isCurrent
                      ? "bg-amber-400 text-slate-950 shadow-xs font-bold"
                      : "text-slate-700 hover:text-slate-950 hover:bg-stone-100"
                  }`}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:block" />

          {/* Floating Corner D-Pad Controller (Toggleable via Top Toolbar & Pause Menu) */}
          <AnimatePresence>
            {showDpad && (
              <motion.div
                key="onscreen-dpad-wrapper"
                initial={{ opacity: 0, scale: 0.88, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 10 }}
                transition={{ duration: 0.16 }}
                className="pointer-events-auto shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Dpad
                  onPressStart={handleDpadPressStart}
                  onPressEnd={handleDpadPressEnd}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
