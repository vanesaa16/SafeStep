/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Scenario, Option, PlayerHistory } from "../types";
import { CheckCircle2, AlertCircle, ArrowRight, Volume2, X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Npc3DCharacter from "./Npc3DCharacter";
import { NEUTRAL_NPC_LABELS } from "../data/scenarios";
import {
  playCorrectAnswerSFX,
  playEncourageAnswerSFX,
  playUiClickSFX,
  setMusicDucked,
  unlockAudioContext,
} from "../utils/soundEffects";
import { stopAllVoice, preloadAudio } from "../utils/audioManager";
import { isStandaloneHtmlMode } from "../firebase";
import {
  getTeacherPersonaForScenario,
  playNpcVoice,
  playOptionVoice,
  playTeacherFeedbackVoice,
  preloadOptionVoices,
  preloadTeacherFeedbackVoices,
} from "../utils/npcVoicePlayer";

export interface DialogModalProps {
  isOpen?: boolean;
  scenario: Scenario;
  isCompletedBefore?: boolean;
  playerName?: string;
  previousAnswer?: PlayerHistory;
  onClose: () => void;
  onSubmitAnswer?: (option: Option, isCorrect: boolean) => void;
}

export function DialogModal({
  isOpen = true,
  scenario,
  isCompletedBefore = false,
  playerName,
  previousAnswer,
  onClose,
  onSubmitAnswer,
}: DialogModalProps) {
  const normalizedPlayerName = (playerName || "").trim() || "Ananda";
  const isVanesaPlayer =
    normalizedPlayerName.toLowerCase() === "vanesa" ||
    normalizedPlayerName.toLowerCase() === "vanessa";

  const formatText = useCallback(
    (text: string) => {
      if (!text) return "";
      return text.replaceAll("[Nama Anak]", normalizedPlayerName);
    },
    [normalizedPlayerName]
  );

  const formatDialogue = useCallback(
    (text: string) => {
      const formatted = formatText(text).trim();
      if (
        (formatted.startsWith("'") && formatted.endsWith("'")) ||
        (formatted.startsWith('"') && formatted.endsWith('"')) ||
        (formatted.startsWith("“") && formatted.endsWith("”"))
      ) {
        return formatted.slice(1, -1).trim();
      }
      return formatted;
    },
    [formatText]
  );

  const matchedPrevOption = previousAnswer
    ? scenario.options.find((o) => o.text === previousAnswer.chosenOptionText) ||
      scenario.options.find((o) => o.isCorrect === previousAnswer.isSolvedCorrectly)
    : null;

  const initialSelectedId =
    isCompletedBefore && matchedPrevOption ? matchedPrevOption.id : null;

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(initialSelectedId);
  const selectedOptionIdRef = useRef<string | null>(initialSelectedId);
  const hasSubmittedRef = useRef<boolean>(isCompletedBefore);

  const [hasSubmitted, setHasSubmitted] = useState(isCompletedBefore);
  const [chosenOption, setChosenOption] = useState<Option | null>(
    isCompletedBefore && matchedPrevOption ? matchedPrevOption : null
  );
  const [showStarBurst, setShowStarBurst] = useState(false);
  const [isNpcSpeaking, setIsNpcSpeaking] = useState(false);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const [speakingOptionId, setSpeakingOptionId] = useState<string | null>(null);

  const playedDialogKeyRef = useRef<string | null>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  const displayNpcName =
    scenario.npcName || NEUTRAL_NPC_LABELS[scenario.npcId] || "Karakter";
  const showEvaluatedCategory = hasSubmitted || isCompletedBefore;
  const spokenDialogueText = formatDialogue(
    scenario.questionText || scenario.dialogueText || scenario.question
  );
  const teacherPersona = getTeacherPersonaForScenario(scenario.id);
  const dialogPlaybackKey = `${scenario.id}|${scenario.questionAudioUrl || ""}|${spokenDialogueText}`;

  const playScenarioDialogVoice = useCallback(() => {
    setIsTeacherSpeaking(false);
    setSpeakingOptionId(null);
    setMusicDucked(true);
    void playNpcVoice({
      npcId: scenario.npcId,
      scenarioId: scenario.id,
      mode: "dialog",
      text: spokenDialogueText,
      keepMusicDuckedOnEnd: true,
      forceRestart: true,
      onSpeakingChange: setIsNpcSpeaking,
    });
  }, [scenario.id, scenario.npcId, spokenDialogueText]);

  const getFeedbackVoiceText = useCallback(
    (option: Option) => {
      const rawFeedback = (option.feedbackText || option.feedback || "").trim();
      if (rawFeedback) {
        return formatText(rawFeedback);
      }
      return option.isCorrect
        ? `Hebat sekali, ${normalizedPlayerName}! Jawabanmu tepat!`
        : "Tidak apa-apa, ayo coba jawab sekali lagi ya!";
    },
    [formatText, normalizedPlayerName]
  );

  const getOptionVoiceText = useCallback(
    (option: Option, idx: number) => {
      const optionLetter = option.id
        ? option.id.toUpperCase()
        : String.fromCharCode(65 + idx);
      return `Pilihan ${optionLetter}. ${formatText(option.text)}`;
    },
    [formatText]
  );

  // 0. Pre-load suara guru & pilihan jawaban untuk skenario aktif agar instan saat diklik
  useEffect(() => {
    if (!isOpen) return;

    const orderedOptions = [...scenario.options].sort(
      (a, b) => Number(b.isCorrect) - Number(a.isCorrect)
    );
    preloadTeacherFeedbackVoices(
      scenario.id,
      orderedOptions.map((opt) => ({
        text: getFeedbackVoiceText(opt),
        isCorrect: opt.isCorrect,
      })),
      3
    );

    preloadOptionVoices(
      scenario.id,
      scenario.options.map((opt, idx) => ({
        text: getOptionVoiceText(opt, idx),
      })),
      3
    );

    if (!isStandaloneHtmlMode && (typeof navigator === "undefined" || navigator.onLine)) {
      if (isVanesaPlayer && scenario.questionAudioUrl) {
        preloadAudio(scenario.questionAudioUrl);
      }
      for (const opt of scenario.options) {
        if (opt.feedbackAudioUrl && (isVanesaPlayer || !opt.isCorrect)) {
          preloadAudio(opt.feedbackAudioUrl);
        }
      }
    }
  }, [isOpen, isVanesaPlayer, scenario, getFeedbackVoiceText, getOptionVoiceText]);

  // 1. Putar Audio Pertanyaan / Dialog Karakter Sekali Saja Saat Modal Dibuka (StrictMode-safe)
  useEffect(() => {
    if (!isOpen) {
      playedDialogKeyRef.current = null;
      stopAllVoice();
      return;
    }

    if (playedDialogKeyRef.current === dialogPlaybackKey) {
      return;
    }

    const timerId = window.setTimeout(() => {
      if (playedDialogKeyRef.current === dialogPlaybackKey) return;
      playedDialogKeyRef.current = dialogPlaybackKey;
      playScenarioDialogVoice();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isOpen, dialogPlaybackKey, playScenarioDialogVoice]);

  // Hentikan suara saat modal ditutup / unmount
  useEffect(() => {
    return () => {
      playedDialogKeyRef.current = null;
      stopAllVoice();
      setMusicDucked(false);
    };
  }, []);

  const handlePlayDialogVoice = useCallback(() => {
    unlockAudioContext();
    playScenarioDialogVoice();
  }, [playScenarioDialogVoice]);

  const handlePlayTeacherVoice = useCallback(
    (option: Option) => {
      unlockAudioContext();
      setIsNpcSpeaking(false);
      setSpeakingOptionId(null);
      void playTeacherFeedbackVoice({
        scenarioId: scenario.id,
        text: getFeedbackVoiceText(option),
        isCorrect: option.isCorrect,
        keepMusicDuckedOnEnd: true,
        forceRestart: true,
        onSpeakingChange: setIsTeacherSpeaking,
      });
    },
    [scenario.id, getFeedbackVoiceText]
  );

  const handlePlayOptionVoice = useCallback(
    (option: Option, idx: number) => {
      unlockAudioContext();
      setIsNpcSpeaking(false);
      setIsTeacherSpeaking(false);
      setMusicDucked(true);
      void playOptionVoice({
        scenarioId: scenario.id,
        text: getOptionVoiceText(option, idx),
        keepMusicDuckedOnEnd: true,
        forceRestart: true,
        onSpeakingChange: (speaking) => {
          setSpeakingOptionId((prev) =>
            speaking ? option.id : prev === option.id ? null : prev
          );
        },
      });
    },
    [scenario.id, getOptionVoiceText]
  );

  // 2. Handler Pilihan Jawaban: Putar SFX benar/salah secara instan lalu lanjut ke suara bimbingan/apresiasi guru
  const handleSelectOption = useCallback(
    (option: Option) => {
      if (hasSubmittedRef.current) return;
      unlockAudioContext();
      stopAllVoice();
      selectedOptionIdRef.current = option.id;
      setSelectedOptionId(option.id);
      hasSubmittedRef.current = true;
      setHasSubmitted(true);
      setChosenOption(option);
      setIsNpcSpeaking(false);
      setSpeakingOptionId(null);

      if (option.isCorrect) {
        playCorrectAnswerSFX();
        if (!isCompletedBefore) {
          setShowStarBurst(true);
        }
      } else {
        playEncourageAnswerSFX();
      }

      void playTeacherFeedbackVoice({
        scenarioId: scenario.id,
        text: getFeedbackVoiceText(option),
        isCorrect: option.isCorrect,
        initialDelaySec: option.isCorrect ? 0.34 : 0.28,
        keepMusicDuckedOnEnd: true,
        forceRestart: true,
        onSpeakingChange: setIsTeacherSpeaking,
      });

      onSubmitAnswer?.(option, option.isCorrect);

      // Pastikan panel feedback di bawah pertanyaan langsung terlihat tanpa perlu scroll ke bawah
      if (scrollContentRef.current && scrollContentRef.current.scrollTop > 0) {
        scrollContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [isCompletedBefore, onSubmitAnswer, scenario.id, getFeedbackVoiceText]
  );

  // Coba jawab sekali lagi jika anak ingin mencoba opsi lain yang lebih aman
  const handleRetry = useCallback(() => {
    unlockAudioContext();
    stopAllVoice();
    playUiClickSFX();
    setShowStarBurst(false);
    setIsTeacherSpeaking(false);
    setSpeakingOptionId(null);
    hasSubmittedRef.current = false;
    setHasSubmitted(false);
    setChosenOption(null);
    selectedOptionIdRef.current = null;
    setSelectedOptionId(null);
  }, []);

  // Keyboard navigation: 1/2/3 atau A/B/C langsung menentukan jawaban, Enter/Spasi untuk lanjut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "escape") {
        e.preventDefault();
        playUiClickSFX();
        onClose();
        return;
      }

      if (!hasSubmitted) {
        if (key === "1" || key === "a") {
          const opt = scenario.options[0];
          if (opt) handleSelectOption(opt);
        } else if (key === "2" || key === "b") {
          const opt = scenario.options[1];
          if (opt) handleSelectOption(opt);
        } else if (key === "3" || key === "c") {
          const opt = scenario.options[2];
          if (opt) handleSelectOption(opt);
        }
      } else if (key === "enter" || key === " ") {
        e.preventDefault();
        playUiClickSFX();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasSubmitted, scenario.options, handleSelectOption, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="dialog-modal-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-npc"
    >
      <motion.div
        id="dialog-modal-card"
        initial={{ scale: 0.94, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="bg-[#FFFDF7] rounded-3xl border-2 border-amber-200 w-full max-w-xl shadow-[0_22px_50px_rgba(15,23,42,0.28)] overflow-hidden text-[#1E293B] flex flex-col max-h-[92vh] relative"
      >
        {/* Celebratory Star Burst Overlay when child answers safely */}
        <AnimatePresence>
          {showStarBurst && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-6 flex justify-center gap-6 z-30"
            >
              {[0, 1, 2].map((idx) => (
                <motion.svg
                  key={idx}
                  initial={{ scale: 0, y: 12, rotate: -20 }}
                  animate={{ scale: [0, 1.25, 1], y: -8, rotate: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.55 }}
                  viewBox="0 0 36 36"
                  className="w-8 h-8 drop-shadow-sm"
                >
                  <path
                    d="M18 3L22.3 12.2L32.4 13.5L25 20.5L26.9 30.5L18 25.6L9.1 30.5L11 20.5L3.6 13.5L13.7 12.2L18 3Z"
                    fill="#FACC15"
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warm Storybook Header */}
        <div
          id="dialog-header-bar"
          className="bg-amber-50/90 px-5 sm:px-6 py-4 border-b border-amber-200/80 flex justify-between items-start gap-3 shrink-0"
        >
          <div className="flex flex-col gap-0.5">
            <div
              id="dialog-category-badge"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
            >
              {showEvaluatedCategory ? (
                <>
                  <span className="text-sky-700 font-bold">{scenario.category}</span>
                  <span aria-hidden="true" className="text-stone-400">·</span>
                  <span>
                    {isCompletedBefore ? "Ulasan Misi Selesai" : "Evaluasi Selesai"}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-amber-800 font-bold">Situasi Interaksi</span>
                  <span aria-hidden="true" className="text-stone-400">·</span>
                  <span>Analisis Mandiri</span>
                </>
              )}
            </div>
            <h4
              id="dialog-npc"
              className="text-lg sm:text-xl font-display font-extrabold text-slate-900 leading-snug"
            >
              {displayNpcName}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => {
              playUiClickSFX();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Storybook Content */}
        <div ref={scrollContentRef} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* 3D Human NPC Portrait + Direct NPC Speech Bubble */}
          <div id="dialog-speech-section" className="flex items-start gap-3.5 sm:gap-4">
            <div
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-end justify-center shrink-0 border-2 shadow-sm overflow-hidden pt-1.5 px-1 relative ${
                hasSubmitted
                  ? chosenOption?.isCorrect
                    ? "bg-gradient-to-b from-emerald-100 to-amber-50 border-emerald-300"
                    : "bg-gradient-to-b from-amber-100 to-amber-50 border-amber-300"
                  : "bg-gradient-to-b from-sky-100 to-amber-50 border-amber-200"
              }`}
            >
              <Npc3DCharacter
                npcId={scenario.npcId}
                npcName={displayNpcName}
                npcType={scenario.npcType}
                isMeeting={!hasSubmitted}
                isCompleted={hasSubmitted && Boolean(chosenOption?.isCorrect)}
                variant="portrait"
              />
            </div>

            <div className="relative flex-1 bg-amber-50/65 border border-amber-200/90 p-4 rounded-2xl text-[15px] sm:text-base leading-relaxed text-slate-900 shadow-xs">
              <p className="font-semibold">
                &ldquo;{spokenDialogueText}&rdquo;
              </p>

              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={handlePlayDialogVoice}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-amber-100/80 border border-amber-200 text-xs font-display font-bold text-amber-900 cursor-pointer transition-colors"
                  title="Putar ulang suara karakter"
                >
                  <Volume2
                    className={`w-3.5 h-3.5 text-amber-600 shrink-0 ${
                      isNpcSpeaking ? "animate-bounce" : ""
                    }`}
                  />
                  <span>{isNpcSpeaking ? "Sedang Berbicara..." : "Dengarkan Suara"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Compact Action Prompt + Teacher Feedback (Below Question) + Tactile A / B / C Answer Buttons */}
          <div className="space-y-2.5">
            <h5
              id="dialog-question"
              className="text-xs sm:text-sm font-display font-bold text-slate-600 px-0.5"
            >
              {formatText(scenario.question) || "Apa yang harus kamu lakukan?"}
            </h5>

            {isCompletedBefore && (
              <div
                id="mission-locked-alert"
                className="px-3.5 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 font-semibold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-sky-600" />
                <span>
                  Misi ini sudah pernah kamu selesaikan. Kamu sedang melihat kembali hasil jawabanmu.
                </span>
              </div>
            )}

            {/* Warm, Constructive Child-Friendly Feedback Positioned Directly Below the Question */}
            <AnimatePresence>
              {hasSubmitted && chosenOption && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border-2 text-sm leading-relaxed flex flex-col gap-2 ${
                    chosenOption.isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                      : "bg-amber-50 border-amber-300 text-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`text-xs font-semibold ${
                          chosenOption.isCorrect ? "text-emerald-700" : "text-amber-800"
                        }`}
                      >
                        {chosenOption.isCorrect
                          ? `Apresiasi ${teacherPersona.label}`
                          : `Bimbingan ${teacherPersona.label}`}
                      </span>
                      <div className="font-display font-extrabold text-base">
                        {chosenOption.isCorrect ? (
                          <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Pilihan Tepat & Aman!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-900">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            <span>Mari Lebih Waspada!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isCompletedBefore && (
                        <span className="font-mono tabular-nums text-xs font-bold text-slate-700">
                          {chosenOption.isCorrect ? "+10 Poin" : "+0 Poin"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePlayTeacherVoice(chosenOption)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-display font-bold cursor-pointer transition-colors ${
                          chosenOption.isCorrect
                            ? "bg-white/90 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900"
                            : "bg-white/90 hover:bg-amber-100/80 border-amber-300 text-amber-950"
                        }`}
                        title={`Putar suara ${teacherPersona.label}`}
                      >
                        <Volume2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            chosenOption.isCorrect ? "text-emerald-600" : "text-amber-600"
                          } ${isTeacherSpeaking ? "animate-bounce" : ""}`}
                        />
                        <span>
                          {isTeacherSpeaking
                            ? `${teacherPersona.label} Berbicara...`
                            : `Suara ${teacherPersona.label}`}
                        </span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-slate-700">
                    {formatText(chosenOption.feedback)}
                  </p>

                  {!chosenOption.isCorrect && (
                    <p className="mt-0.5 pt-2 border-t border-amber-200/80 text-xs font-semibold text-amber-900">
                      Ingat: Selalu utamakan keselamatan diri dan segera ceritakan kejadian mencurigakan kepada orang tua atau Bapak/Ibu Guru.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tactile A / B / C Answer Buttons */}
            <div className="space-y-2">
              {scenario.options.map((option, idx) => {
                const isSelected = selectedOptionId === option.id;
                let cardClasses =
                  "bg-white hover:bg-amber-50/50 border-stone-200 hover:border-amber-300 text-slate-800 shadow-[0_2px_0_#E2E8F0]";
                let badgeClasses = "bg-stone-100 border-stone-300 text-slate-700";

                if (isSelected && !hasSubmitted) {
                  cardClasses =
                    "bg-amber-50 border-amber-400 text-slate-900 ring-2 ring-amber-300/50 shadow-[0_2px_0_#F59E0B]";
                  badgeClasses = "bg-amber-400 border-amber-500 text-slate-950";
                } else if (hasSubmitted) {
                  if (option.isCorrect) {
                    cardClasses =
                      "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-none";
                    badgeClasses = "bg-emerald-500 border-emerald-600 text-white";
                  } else if (isSelected && !option.isCorrect) {
                    cardClasses =
                      "bg-rose-50 border-rose-300 text-rose-950 shadow-none";
                    badgeClasses = "bg-rose-500 border-rose-600 text-white";
                  } else {
                    cardClasses =
                      "opacity-55 bg-stone-50 border-stone-200 text-slate-500 shadow-none";
                    badgeClasses = "bg-stone-100 border-stone-200 text-slate-400";
                  }
                }

                const optionLetter = option.id
                  ? option.id.toUpperCase()
                  : String.fromCharCode(65 + idx);
                const isOptionSpeaking = speakingOptionId === option.id;

                return (
                  <div
                    key={option.id}
                    className={`w-full min-h-[54px] rounded-2xl border-2 transition-all duration-150 flex items-stretch overflow-hidden ${cardClasses}`}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => unlockAudioContext()}
                      onFocus={() => unlockAudioContext()}
                      onClick={() => handleSelectOption(option)}
                      disabled={hasSubmitted}
                      className="flex-1 text-left px-4 py-3.5 text-sm font-semibold flex items-start gap-3 cursor-pointer disabled:cursor-default leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400"
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-xs font-display font-extrabold mt-0.5 ${badgeClasses}`}
                      >
                        {optionLetter}
                      </span>
                      <span className="flex-1 pt-0.5">{formatText(option.text)}</span>
                    </button>

                    <div className="flex items-center pr-2.5 sm:pr-3 pl-1 shrink-0">
                      <button
                        id={`btn-option-voice-${option.id || optionLetter.toLowerCase()}`}
                        type="button"
                        onMouseEnter={() => unlockAudioContext()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayOptionVoice(option, idx);
                        }}
                        aria-label={`Dengarkan suara pilihan ${optionLetter}`}
                        title={`Dengarkan suara pilihan ${optionLetter}`}
                        className={`h-9 px-2.5 rounded-xl border text-xs font-display font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          isOptionSpeaking
                            ? "bg-amber-100 border-amber-400 text-amber-950 shadow-xs"
                            : "bg-white/95 hover:bg-amber-100/80 border-stone-200 hover:border-amber-300 text-slate-700 hover:text-amber-950"
                        }`}
                      >
                        <Volume2
                          className={`w-3.5 h-3.5 shrink-0 text-amber-600 ${
                            isOptionSpeaking ? "animate-bounce" : ""
                          }`}
                        />
                        <span className="hidden sm:inline">
                          {isOptionSpeaking ? "Dibaca..." : "Suara"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-t border-stone-200/90 shrink-0 flex items-center justify-between gap-3">
          <span className="hidden sm:inline text-xs text-slate-500 font-medium">
            {!hasSubmitted
              ? "Klik jawaban, tekan A / B / C, atau klik Suara"
              : chosenOption && !chosenOption.isCorrect && !isCompletedBefore
                ? "Boleh coba jawab sekali lagi agar lebih aman"
                : "Tekan Enter atau Spasi untuk lanjut"}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {hasSubmitted && chosenOption && !chosenOption.isCorrect && !isCompletedBefore ? (
              <>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-display font-bold text-sm shadow-[0_3px_0_#D97706] cursor-pointer flex items-center gap-1.5 active:translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Coba Jawab Sekali Lagi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playUiClickSFX();
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-slate-800 rounded-xl font-display font-bold text-sm cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <span>Lanjut Saja</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : hasSubmitted ? (
              <button
                type="button"
                onClick={() => {
                  playUiClickSFX();
                  onClose();
                }}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-display font-bold text-sm shadow-[0_3px_0_#1E40AF] cursor-pointer flex items-center gap-1.5 active:translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <span>Lanjutkan Petualangan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs text-amber-900/80 font-bold bg-amber-100/70 px-3 py-1.5 rounded-lg border border-amber-200">
                Pilih jawaban di atas
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DialogModal;
