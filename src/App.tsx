/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Scenario, PlayerState, Option, StudentLog, PlayerHistory } from "./types";
import { DEFAULT_SCENARIOS, normalizeScenarioLabels } from "./data/scenarios";
import MainHomeScreen from "./components/MainHomeScreen";
import GameWorld from "./components/GameWorld";
import DialogModal from "./components/DialogModal";
import TeacherDashboard from "./components/TeacherDashboard";
import {
  AchievementBadge,
  getNewlyUnlockedBadges,
} from "./data/badges";
import {
  BadgeUnlockToast,
  BadgeCollectionModal,
} from "./components/AchievementBadgeSystem";
import { playBadgeUnlockSFX, unlockAudioContext } from "./utils/soundEffects";
import {
  isStandaloneHtmlMode,
  testFirestoreConnection,
  fetchPublishedScenariosFromFirestore,
  savePublishedScenariosWithStatus,
  FirestoreScenarioSyncResult,
  resetPublishedScenariosInFirestore,
  syncStudentLogToFirestore,
} from "./firebase";
import {
  fetchApiJsonWithRetry,
  flushPendingStudentLogs,
  syncStudentLogToServer,
} from "./utils/serverSync";
import { upgradeCustomScenarioVoicesOnReconnect } from "./utils/npcVoicePlayer";
import OfflineIndicator from "./components/OfflineIndicator";
import {
  enterFullscreen,
  exitFullscreen,
  isCurrentlyFullscreen,
  isFullscreenSupported,
  subscribeFullscreenChange,
} from "./utils/fullscreen";

export default function App() {
  const [screen, setScreen] = useState<'home' | 'game' | 'teacher_dashboard'>('home');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>({
    name: "",
    points: 0,
    currentMapId: "school",
    completedScenarios: [],
    playerPosition: { x: 45, y: 82 },
    history: []
  });
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [pendingVictoryCelebration, setPendingVictoryCelebration] = useState(false);
  const [autoOpenVictory, setAutoOpenVictory] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<AchievementBadge | null>(null);
  const [showBadgeCollection, setShowBadgeCollection] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isCurrentlyFullscreen());
  const userExitedFullscreenRef = useRef<boolean>(false);
  const prevFullscreenRef = useRef<boolean>(isCurrentlyFullscreen());

  // Automatically activate browser Fullscreen API on app launch & first user gesture (for laptop / projector presentation)
  useEffect(() => {
    const unsubscribe = subscribeFullscreenChange((active) => {
      const wasActive = prevFullscreenRef.current;
      prevFullscreenRef.current = active;
      setIsFullscreen(active);
      if (wasActive && !active) {
        // Respect manual exit (via Esc or button) so the app doesn't force fullscreen again unexpectedly
        userExitedFullscreenRef.current = true;
      }
    });

    if (!isFullscreenSupported()) {
      return unsubscribe;
    }

    // Immediate attempt on mount (succeeds in permissive / PWA / kiosk contexts)
    void enterFullscreen();

    let isRequesting = false;
    const handleFirstUserGesture = () => {
      if (userExitedFullscreenRef.current || isCurrentlyFullscreen()) {
        cleanupGestureListeners();
        return;
      }
      if (isRequesting) return;
      isRequesting = true;
      void enterFullscreen()
        .then((entered) => {
          if (entered || isCurrentlyFullscreen() || userExitedFullscreenRef.current) {
            cleanupGestureListeners();
          }
        })
        .finally(() => {
          isRequesting = false;
        });
    };

    const cleanupGestureListeners = () => {
      window.removeEventListener("click", handleFirstUserGesture, true);
      window.removeEventListener("touchend", handleFirstUserGesture, true);
      window.removeEventListener("keydown", handleFirstUserGesture, true);
    };

    window.addEventListener("click", handleFirstUserGesture, { capture: true, passive: true });
    window.addEventListener("touchend", handleFirstUserGesture, { capture: true, passive: true });
    window.addEventListener("keydown", handleFirstUserGesture, { capture: true, passive: true });

    return () => {
      cleanupGestureListeners();
      unsubscribe();
    };
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    if (!isFullscreenSupported()) return;
    if (isCurrentlyFullscreen()) {
      userExitedFullscreenRef.current = true;
      await exitFullscreen();
    } else {
      userExitedFullscreenRef.current = false;
      await enterFullscreen();
    }
  }, []);

  // Initialize Scenarios (load custom ones from localStorage or baked standalone HTML payload, else default static)
  useEffect(() => {
    const bakedScenarios = (
      window as unknown as { __SAFESTEP_INITIAL_SCENARIOS__?: Scenario[] }
    ).__SAFESTEP_INITIAL_SCENARIOS__;

    const resolveFallbackScenarios = (): Scenario[] => {
      if (Array.isArray(bakedScenarios) && bakedScenarios.length > 0) {
        return normalizeScenarioLabels(bakedScenarios);
      }
      return DEFAULT_SCENARIOS;
    };

    // First try local storage for immediate offline/fallback load (preserves edits inside standalone HTML too)
    const savedCustom = localStorage.getItem("safestep_custom_scenarios");
    if (savedCustom) {
      try {
        const normalized = normalizeScenarioLabels(JSON.parse(savedCustom));
        setScenarios(normalized);
        localStorage.setItem("safestep_custom_scenarios", JSON.stringify(normalized));
      } catch (_e) {
        setScenarios(resolveFallbackScenarios());
      }
    } else {
      setScenarios(resolveFallbackScenarios());
    }

    if (!isStandaloneHtmlMode && (typeof navigator === "undefined" || navigator.onLine)) {
      void testFirestoreConnection();

      // Flush any student logs deferred during an earlier offline/restart window
      void flushPendingStudentLogs();

      // Fetch from Express backend persistence
      fetchApiJsonWithRetry<Scenario[]>("/api/custom_scenarios", {}, 1)
        .then((res) => {
          if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
            const normalized = normalizeScenarioLabels(res.data);
            setScenarios(normalized);
            localStorage.setItem("safestep_custom_scenarios", JSON.stringify(normalized));
          }
        })
        .catch(() => {});

      // Fetch published scenarios bundle from Cloud Firestore (single document read)
      fetchPublishedScenariosFromFirestore()
        .then((cloudScenarios) => {
          if (Array.isArray(cloudScenarios) && cloudScenarios.length > 0) {
            const normalized = normalizeScenarioLabels(cloudScenarios);
            setScenarios(normalized);
            localStorage.setItem("safestep_custom_scenarios", JSON.stringify(normalized));
          }
        })
        .catch((err) => console.warn("Could not read published scenarios from Firestore:", err));
    }
  }, []);

  // Auto-upgrade custom question voices from AI fallback to warm Gemini teacher voices whenever online/reconnected
  useEffect(() => {
    if (scenarios.length === 0) return;
    const activePlayerName = playerState.name || "Ananda";

    void upgradeCustomScenarioVoicesOnReconnect(scenarios, activePlayerName);

    const handleOnlineReconnect = () => {
      void upgradeCustomScenarioVoicesOnReconnect(scenarios, activePlayerName);
    };
    window.addEventListener("online", handleOnlineReconnect);
    return () => {
      window.removeEventListener("online", handleOnlineReconnect);
    };
  }, [scenarios, playerState.name]);

  // Save changes to custom scenarios edited or uploaded in teacher console
  const handleSaveModifiedScenarios = async (
    newScenarios: Scenario[]
  ): Promise<FirestoreScenarioSyncResult> => {
    const boundedScenarios = newScenarios.slice(0, 30);
    setScenarios(boundedScenarios);
    localStorage.setItem("safestep_custom_scenarios", JSON.stringify(boundedScenarios));

    if (isStandaloneHtmlMode) {
      return { synced: false, reason: "standalone" };
    }

    // Save to Express persistence
    void fetchApiJsonWithRetry("/api/custom_scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(boundedScenarios),
    });

    // Sync to Firestore when teacher is authenticated as verified admin
    try {
      return await savePublishedScenariosWithStatus(boundedScenarios);
    } catch (err) {
      console.warn("Could not sync scenarios to Firestore:", err);
      throw err;
    }
  };

  const handleResetScenariosDefault = () => {
    setScenarios(DEFAULT_SCENARIOS);
    localStorage.removeItem("safestep_custom_scenarios");

    if (!isStandaloneHtmlMode) {
      // Reset on Express persistence
      void fetchApiJsonWithRetry("/api/custom_scenarios/reset", { method: "POST" });

      // Reset in Firestore when teacher is authenticated as verified admin
      resetPublishedScenariosInFirestore().catch((err) =>
        console.warn("Could not reset scenarios in Firestore:", err)
      );
    }
  };

  // Start game triggers
  const handleStartGame = (name: string, avatarId: string) => {
    unlockAudioContext();
    if (!userExitedFullscreenRef.current && !isCurrentlyFullscreen()) {
      void enterFullscreen();
    }
    setNewlyUnlockedBadge(null);
    setShowBadgeCollection(false);
    setPlayerState({
      name: name.trim().slice(0, 80),
      avatarId,
      points: 0,
      currentMapId: "school",
      completedScenarios: [],
      playerPosition: { x: 45, y: 82 }, // Starts on main gate entrance paving block path
      history: []
    });
    setScreen('game');
  };

  // Room transitions teleportations
  const handleTransitionMap = (targetMapId: string, spawnPosition: { x: number, y: number }) => {
    setPlayerState(prev => ({
      ...prev,
      currentMapId: targetMapId,
      playerPosition: spawnPosition
    }));
  };

  // Triggering dialogue from game interactions
  const handleTriggerScenario = (npcId: string) => {
    const matched = scenarios.find(s => s.npcId === npcId && s.mapId === playerState.currentMapId);
    if (matched) {
      setActiveScenarioId(matched.id);
    }
  };

  // Evaluating user's answer triggers
  const handleSubmitAnswer = (option: Option, isCorrect: boolean) => {
    if (!activeScenarioId) return;

    const scenario = scenarios.find(s => s.id === activeScenarioId);
    if (!scenario) return;

    // Check if player already completed this successfully before to avoid spamming points
    const isAlreadyCompleted = playerState.completedScenarios.includes(activeScenarioId);
    const pointsAwarded = (isCorrect && !isAlreadyCompleted) ? 10 : 0;

    // Build the transcript item
    const newItemHistory: PlayerHistory = {
      scenarioId: scenario.id,
      scenarioName: scenario.npcName,
      category: scenario.category,
      mapName: scenario.mapId === "school" ? "Halaman Sekolah" : scenario.mapId === "class" ? "Ruang Kelas" : scenario.mapId === "street" ? "Jalan Raya" : "Rumah",
      isSolvedCorrectly: isCorrect,
      chosenOptionText: option.text,
      pointsAwarded,
      timestamp: new Date().toISOString()
    };

    // Update Player Status State
    const nextCompleted = isAlreadyCompleted
      ? playerState.completedScenarios
      : [...playerState.completedScenarios, activeScenarioId];

    const updatedState: PlayerState = {
      ...playerState,
      points: playerState.points + pointsAwarded,
      completedScenarios: nextCompleted,
      history: [...playerState.history, newItemHistory].slice(0, 50)
    };

    setPlayerState(updatedState);

    // Check if the child just reached a new Badge Prestasi point milestone!
    const newlyEarnedBadges = getNewlyUnlockedBadges(
      playerState.points,
      updatedState.points
    );
    if (newlyEarnedBadges.length > 0) {
      const latestUnlocked = newlyEarnedBadges[newlyEarnedBadges.length - 1];
      setNewlyUnlockedBadge(latestUnlocked);
      playBadgeUnlockSFX();
    }

    // If student just finished the final scenario for the first time, queue celebratory Victory modal on dialog close!
    const totalMissionTarget = scenarios.length || 20;
    if (!isAlreadyCompleted && nextCompleted.length >= totalMissionTarget) {
      setPendingVictoryCelebration(true);
    }

    // Auto-commit record immediately to Teacher statistics ledger!
    saveStudentLogToDatabase(updatedState);
  };

  // Persistence to Student Logs Database
  const saveStudentLogToDatabase = (state: PlayerState) => {
    const cleanName = state.name.trim().slice(0, 80);
    if (!cleanName) return;

    const logsJSON = localStorage.getItem("safestep_student_logs");
    let logs: StudentLog[] = [];
    if (logsJSON) {
      try {
        logs = JSON.parse(logsJSON);
      } catch (_e) {
        logs = [];
      }
    }

    const existingIndex = logs.findIndex(l => l.studentName.toLowerCase() === cleanName.toLowerCase());
    
    const newLog: StudentLog = {
      id: existingIndex >= 0 ? logs[existingIndex].id : `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentName: cleanName,
      totalPoints: Math.max(0, Math.min(1000, state.points)),
      completedScenariosCount: Math.max(0, Math.min(30, state.completedScenarios.length)),
      completedAt: new Date().toISOString(),
      history: state.history.slice(0, 50)
    };

    if (existingIndex >= 0) {
      logs[existingIndex] = newLog;
    } else {
      logs.push(newLog);
    }

    localStorage.setItem("safestep_student_logs", JSON.stringify(logs));

    if (!isStandaloneHtmlMode) {
      // Sync directly to the Express backend database with automatic retry & offline queue
      void syncStudentLogToServer(newLog);

      // Sync to Firestore when a verified Google user is signed in
      syncStudentLogToFirestore(newLog).catch((err) =>
        console.warn("Could not sync student log to Firestore:", err)
      );
    }
  };

  const handleCloseDialog = () => {
    setActiveScenarioId(null);
    if (pendingVictoryCelebration) {
      setPendingVictoryCelebration(false);
      setAutoOpenVictory(true);
    }
  };

  const handlePlayAgain = () => {
    setAutoOpenVictory(false);
    setPendingVictoryCelebration(false);
    setNewlyUnlockedBadge(null);
    setShowBadgeCollection(false);
    setActiveScenarioId(null);
    setPlayerState(prev => ({
      ...prev,
      points: 0,
      currentMapId: "school",
      completedScenarios: [],
      playerPosition: { x: 45, y: 82 },
      history: []
    }));
  };

  const handleRestartToHome = () => {
    setAutoOpenVictory(false);
    setPendingVictoryCelebration(false);
    setNewlyUnlockedBadge(null);
    setShowBadgeCollection(false);
    setActiveScenarioId(null);
    setPlayerState({
      name: "",
      points: 0,
      currentMapId: "school",
      completedScenarios: [],
      playerPosition: { x: 45, y: 82 },
      history: []
    });
    setScreen('home');
  };

  const handleExitGame = () => {
    setAutoOpenVictory(false);
    setPendingVictoryCelebration(false);
    setNewlyUnlockedBadge(null);
    setShowBadgeCollection(false);
    setActiveScenarioId(null);
    // Commit final logs
    saveStudentLogToDatabase(playerState);
    setScreen('home');
  };

  // Find active triggering scenario
  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  return (
    <main className="min-h-screen select-none bg-[#090d16] text-[#eee] font-sans">
      
      {/* 1. Main Home Screen */}
      {screen === 'home' && (
        <MainHomeScreen
          onStartGame={handleStartGame}
          onOpenTeacherDashboard={() => setScreen('teacher_dashboard')}
        />
      )}

      {/* 2. Interactive exploration Game */}
      {screen === 'game' && (
        <GameWorld
          playerState={playerState}
          customScenarios={scenarios}
          isModalOpen={Boolean(activeScenario)}
          isBadgeModalOpen={showBadgeCollection}
          autoOpenVictory={autoOpenVictory}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onClearAutoVictory={() => setAutoOpenVictory(false)}
          onOpenBadgeCollection={() => setShowBadgeCollection(true)}
          onPlayAgain={handlePlayAgain}
          onRestartToHome={handleRestartToHome}
          onTriggerScenario={handleTriggerScenario}
          onTransitionMap={handleTransitionMap}
          onExitGame={handleExitGame}
        />
      )}

      {/* 3. Teacher Evaluator Dashboard */}
      {screen === 'teacher_dashboard' && (
        <TeacherDashboard
          scenarios={scenarios}
          onSaveModifiedScenarios={handleSaveModifiedScenarios}
          onResetScenariosDefault={handleResetScenariosDefault}
          onClose={() => setScreen('home')}
        />
      )}

      {/* 4. Overlay Dialogue Mission triggers */}
      {activeScenario && (
        <DialogModal
          scenario={activeScenario}
          isCompletedBefore={playerState.completedScenarios.includes(activeScenario.id)}
          playerName={playerState.name}
          previousAnswer={playerState.history.find(h => h.scenarioId === activeScenario.id)}
          onClose={handleCloseDialog}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}

      {/* 5. Live Achievement Badge Celebration & Badge Collection Showcase */}
      {screen === 'game' && (
        <>
          <BadgeUnlockToast
            badge={newlyUnlockedBadge}
            playerName={playerState.name}
            currentPoints={playerState.points}
            onOpenCollection={() => {
              setNewlyUnlockedBadge(null);
              setShowBadgeCollection(true);
            }}
            onDismiss={() => setNewlyUnlockedBadge(null)}
          />

          <BadgeCollectionModal
            isOpen={showBadgeCollection}
            points={playerState.points}
            playerName={playerState.name}
            onClose={() => setShowBadgeCollection(false)}
          />
        </>
      )}

      <OfflineIndicator />
    </main>
  );
}
