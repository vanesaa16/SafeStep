/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Play,
  School,
  AlertCircle,
  PenTool,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KID_CHARACTERS, KidCharacter } from "../data/characters";
import Student3DCharacter from "./Student3DCharacter";
import { playUiClickSFX } from "../utils/soundEffects";
import schoolGateIsometricBg from "../assets/images/school_gate_isometric_1793671326681.jpg";
import PWAInstallButton from "./PWAInstallButton";

interface MainHomeScreenProps {
  onStartGame: (name: string, avatarId: string) => void;
  onOpenTeacherDashboard: () => void;
}

export default function MainHomeScreen({
  onStartGame,
  onOpenTeacherDashboard,
}: MainHomeScreenProps) {
  const [playerName, setPlayerName] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("budi");
  const [isError, setIsError] = useState(false);
  const [bgImageError, setBgImageError] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const selectedCharacter =
    KID_CHARACTERS.find((c) => c.id === selectedCharacterId) || KID_CHARACTERS[0];

  const handleStart = () => {
    if (!playerName.trim()) {
      setIsError(true);
      return;
    }
    playUiClickSFX();
    setIsError(false);
    onStartGame(playerName.trim(), selectedCharacterId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStart();
    }
  };

  const handleTeacherLogin = () => {
    const trimmed = passwordInput.trim();
    if (trimmed === "123" || trimmed === "guru123" || trimmed === "admin") {
      playUiClickSFX();
      setShowLoginModal(false);
      onOpenTeacherDashboard();
    } else {
      setLoginError("PIN atau kata sandi salah!");
    }
  };

  const openTeacherModal = () => {
    playUiClickSFX();
    setShowLoginModal(true);
    setLoginError("");
    setPasswordInput("");
  };

  return (
    <div
      id="landing-container"
      className="h-dvh max-h-dvh w-full relative overflow-hidden flex items-center justify-center px-3 py-2.5 sm:px-6 sm:py-4 font-sans select-none bg-[#88C9F2]"
    >
      {/* ================= 3D ISOMETRIC SCHOOL GATE SCENE & SUNLIGHT AMBIENCE ================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Resilient Isometric Fallback Canvas (Zero-Broken-Image Policy) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7DD3FC] via-[#BAE6FD] to-[#86EFAC]">
          <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full opacity-90"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="isoRoadFallback" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="isoRoofFallback" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>
            </defs>
            <polygon points="0,560 920,210 1600,480 680,900 0,900" fill="#BEF264" opacity="0.55" />
            <polygon points="480,900 1600,440 1600,760 880,900" fill="url(#isoRoadFallback)" opacity="0.5" />
            <polygon points="420,250 760,120 960,200 620,330" fill="url(#isoRoofFallback)" opacity="0.45" />
          </svg>
        </div>

        {/* High-Fidelity 3D Isometric School Gate Environment */}
        {!bgImageError && (
          <img
            src={schoolGateIsometricBg}
            alt="Lingkungan 3D Isometric Gerbang Sekolah Dasar SafeStep di pagi hari"
            referrerPolicy="no-referrer"
            onError={() => setBgImageError(true)}
            className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02]"
          />
        )}

        {/* Warm Morning Sun Source Bloom (Top-Right, aligned with 3D scene lighting) */}
        <div className="absolute -top-24 -right-20 w-[440px] h-[440px] sm:w-[620px] sm:h-[620px] rounded-full bg-[radial-gradient(circle,rgba(254,249,195,0.72)_0%,rgba(253,224,71,0.34)_32%,rgba(251,191,36,0.12)_56%,transparent_74%)] animate-sunbeam-drift" />

        {/* Soft Volumetric Diagonal Sunbeams */}
        <div className="absolute inset-0 bg-[linear-gradient(122deg,transparent_24%,rgba(254,249,195,0.22)_42%,rgba(253,224,71,0.14)_50%,transparent_66%)] animate-sunbeam-drift" />

        {/* Subtle Atmospheric Depth & Contrast Scrim */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,251,235,0.06)_0%,rgba(15,23,42,0.28)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/25 via-slate-900/5 to-transparent" />
      </div>

      {/* ================= FLOATING GLASSMORPHISM MAIN CONTAINER (100VH NO-SCROLL) ================= */}
      <motion.main
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="safestep-glass-panel w-full max-w-[520px] max-h-full border border-white/85 shadow-[0_24px_64px_rgba(15,23,42,0.26),inset_0_1px_0_rgba(255,255,255,0.92)] px-4 py-3 sm:px-6 sm:py-4 relative z-10 flex flex-col justify-between gap-2 sm:gap-2.5"
      >
        {/* 1. Brand Lockup & Quiet Metadata */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2.5">
            <div
              id="shield-logo"
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 drop-shadow-[0_4px_10px_rgba(37,99,235,0.25)]"
            >
              <svg
                viewBox="0 0 64 64"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="safeShieldGrad"
                    x1="12"
                    y1="6"
                    x2="52"
                    y2="58"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="52%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                  <linearGradient
                    id="safeGoldTrim"
                    x1="10"
                    y1="6"
                    x2="54"
                    y2="58"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#FACC15" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
                <path
                  d="M32 5L54 13.5V30.5C54 44.5 44.6 54.4 32 59C19.4 54.4 10 44.5 10 30.5V13.5L32 5Z"
                  fill="url(#safeShieldGrad)"
                  stroke="url(#safeGoldTrim)"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 16.5L32 10.5L48 16.5V22H16V16.5Z"
                  fill="#EF4444"
                  opacity="0.95"
                />
                <path
                  d="M23.5 34.5L29.5 40.5L41.5 27.5"
                  stroke="#FFFFFF"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="text-left">
              <h1
                id="brand-title"
                className="text-2xl sm:text-[28px] font-display font-extrabold tracking-tight text-slate-900 leading-none"
              >
                Safe<span className="text-[#DC2626]">Step</span>
              </h1>
              <p
                id="brand-subtitle"
                className="text-xs sm:text-[13px] font-bold text-emerald-800 mt-0.5 leading-tight"
              >
                Petualangan Keselamatan Anak SD
              </p>
            </div>
          </div>

          <p
            id="stats-summary"
            className="mt-1.5 text-[11px] sm:text-xs font-semibold text-slate-600 flex items-center justify-center gap-2 tabular-nums"
          >
            <span>4 Peta 3D</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>20 Misi Kontekstual</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>200 Poin</span>
          </p>
        </div>

        {/* 2. Player Name Input */}
        <div id="name-input-card" className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="player-name-input"
              className="text-xs font-extrabold text-slate-800"
            >
              Siapa Namamu?
            </label>
            {isError && (
              <span
                role="alert"
                className="text-[11px] font-bold text-[#DC2626] flex items-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Tulis namamu dulu ya!</span>
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <PenTool className="w-4 h-4 text-amber-600" />
            </div>
            <input
              id="player-name-input"
              type="text"
              autoFocus
              maxLength={24}
              placeholder="Ketik nama panggilanmu di sini..."
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                if (e.target.value.trim()) setIsError(false);
              }}
              onKeyDown={handleKeyPress}
              className={`w-full pl-10 pr-3.5 py-2 sm:py-2.5 bg-white/90 rounded-2xl border-2 outline-none text-slate-900 font-bold text-sm transition-colors placeholder-slate-400 ${
                isError
                  ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
                  : "border-slate-200/95 focus:border-amber-500 focus:bg-white focus:ring-3 focus:ring-amber-400/25"
              }`}
            />
          </div>
        </div>

        {/* 3. Live Character Selection Stage (Golden Spotlight + Gentle Bounce) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              Pilih Karaktermu
            </span>
            <span className="text-[11px] font-semibold text-slate-600">
              Seragam SD Merah Putih
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {KID_CHARACTERS.map((char) => {
              const isSelected = selectedCharacterId === char.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  aria-label={`Pilih ${char.name}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    playUiClickSFX();
                    setSelectedCharacterId(char.id);
                  }}
                  className="text-left rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <CharacterLivePreviewTile
                    character={char}
                    isSelected={isSelected}
                  />
                </button>
              );
            })}
          </div>

          {/* Live Character Trait Caption (Clean Unboxed Text) */}
          <p className="text-[11px] text-slate-700 text-center leading-snug pt-0.5 truncate">
            <span className="font-extrabold text-slate-900">
              {playerName.trim() || selectedCharacter.name}
            </span>
            <span className="mx-1.5 text-slate-400">—</span>
            <span>{selectedCharacter.description}</span>
          </p>
        </div>

        {/* 4. Primary Start CTA & Centered Teacher Evaluation */}
        <div className="space-y-2">
          <motion.button
            id="start-adventure-btn"
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.14 }}
            onClick={handleStart}
            className="w-full py-2.5 sm:py-3 px-6 bg-gradient-to-b from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] rounded-2xl text-white font-display font-extrabold text-base tracking-wide flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-[0_4px_0_#991B1B,0_10px_22px_rgba(220,38,38,0.28)] active:translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#DC2626]"
          >
            <Play className="w-4 h-4 fill-white shrink-0" />
            <span>Mulai Petualangan!</span>
          </motion.button>

          <div
            id="controls-hint"
            className="text-center text-[10.5px] text-slate-600 font-semibold truncate"
          >
            WASD / Panah Jalan · Klik Peta / NPC · Spasi Sapa · Esc Jeda
          </div>

          <div className="pt-2 border-t border-slate-900/10 flex items-center justify-center gap-2 flex-wrap">
            <button
              id="teacher-login-btn"
              type="button"
              onClick={openTeacherModal}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white/75 hover:bg-white border border-slate-300/80 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
            >
              <School className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
              <span>Dashboard Guru</span>
            </button>
            <PWAInstallButton variant="home" />
          </div>
        </div>
      </motion.main>

      {/* ================= TEACHER LOGIN MODAL ================= */}
      <AnimatePresence>
        {showLoginModal && (
          <div
            id="login-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs"
          >
            <motion.div
              id="login-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="safestep-glass-panel border border-white/90 p-6 w-full max-w-sm shadow-2xl text-left relative"
            >
              <h3 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2 mb-2">
                <School className="w-5 h-5 text-[#DC2626] shrink-0" />
                <span>Masuk Dashboard Guru</span>
              </h3>

              <p className="text-xs text-slate-700 mb-4 leading-relaxed">
                Halaman ini khusus Bapak/Ibu guru untuk melihat rekap skor siswa, rapor diagnostik, sertifikat, dan kelola skenario.
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="teacher-password-input"
                    className="block text-xs font-bold text-slate-800 mb-1.5"
                  >
                    PIN / Kata Sandi Guru
                  </label>
                  <input
                    id="teacher-password-input"
                    type="password"
                    placeholder="Masukkan PIN guru"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTeacherLogin()}
                    className="w-full px-4 py-2.5 bg-white/95 border border-slate-300 focus:border-[#DC2626] focus:bg-white rounded-xl outline-none font-mono text-center text-slate-900 font-bold text-sm"
                  />
                </div>

                {loginError && (
                  <div className="text-xs font-semibold text-red-700 flex items-center gap-1.5 bg-red-50/95 p-2.5 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    id="close-login-modal"
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 py-2.5 px-4 bg-white/85 hover:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 transition-colors cursor-pointer text-center whitespace-nowrap"
                  >
                    Batal
                  </button>
                  <button
                    id="confirm-teacher-login"
                    type="button"
                    onClick={handleTeacherLogin}
                    className="flex-1 py-2.5 px-4 bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl font-bold text-xs text-white transition-colors cursor-pointer text-center whitespace-nowrap"
                  >
                    Masuk
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CharacterLivePreviewTileProps {
  character: KidCharacter;
  isSelected: boolean;
}

function CharacterLivePreviewTile({
  character,
  isSelected,
}: CharacterLivePreviewTileProps) {
  return (
    <div
      className={`relative overflow-hidden py-2 px-2 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center gap-1 text-center select-none ${
        isSelected
          ? "bg-gradient-to-b from-amber-50/95 via-white/95 to-amber-100/90 border-amber-400 ring-2 ring-amber-300/75 shadow-[0_0_24px_rgba(245,158,11,0.45),0_8px_18px_rgba(217,119,6,0.2)] text-slate-900"
          : "bg-white/65 hover:bg-white/85 border-white/80 hover:border-amber-300/80 text-slate-700 shadow-xs"
      }`}
    >
      {/* Golden Spotlight Cone & Podium Halo on Active Character */}
      {isSelected && (
        <>
          <div className="pointer-events-none absolute -top-4 inset-x-1 h-24 rounded-full bg-[radial-gradient(circle_at_50%_38%,rgba(254,240,138,0.85)_0%,rgba(251,191,36,0.34)_48%,transparent_76%)] animate-golden-spotlight" />
          <div className="pointer-events-none absolute bottom-7 w-16 h-3.5 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.58)_0%,rgba(251,191,36,0.22)_58%,transparent_80%)] animate-golden-spotlight" />
        </>
      )}

      {/* Selected Check Badge in Top-Right Corner */}
      <div
        className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-150 z-20 ${
          isSelected
            ? "border-amber-500 bg-amber-400 text-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.65)] scale-100"
            : "border-slate-300/80 bg-white/80 text-transparent scale-90"
        }`}
      >
        <Check className="w-2.5 h-2.5 stroke-[3]" />
      </div>

      {/* Direct Live 3D Avatar Preview Stage */}
      <div className="relative z-10 flex flex-col items-center justify-end h-[60px] sm:h-[68px] pt-1">
        <div className={isSelected ? "animate-avatar-selected-bounce" : "transition-transform duration-150"}>
          <Student3DCharacter
            characterId={character.id}
            variant="card"
            waving={isSelected}
            withBackpack={true}
          />
        </div>
      </div>

      <span
        className={`relative z-10 text-[11px] font-extrabold leading-tight whitespace-nowrap truncate max-w-full px-1 ${
          isSelected ? "text-amber-950" : "text-slate-700"
        }`}
      >
        {character.name}
      </span>
    </div>
  );
}
