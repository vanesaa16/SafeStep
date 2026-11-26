/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, X, Check } from "lucide-react";
import {
  ACHIEVEMENT_BADGES,
  AchievementBadge,
  getUnlockedBadges,
  getNextBadgeTarget,
} from "../data/badges";
import { playUiClickSFX } from "../utils/soundEffects";

interface BadgeEmblemSVGProps {
  badge: AchievementBadge;
  locked?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Custom 3D layered vector medal emblem for SafeStep Achievement Badges.
 */
export function BadgeEmblemSVG({
  badge,
  locked = false,
  size = "md",
}: BadgeEmblemSVGProps) {
  const rawUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const uid = `badge-${badge.id}-${rawUid}`;

  const sizeClass =
    size === "sm"
      ? "w-6 h-6"
      : size === "lg"
      ? "w-20 h-20 sm:w-22 sm:h-22"
      : "w-14 h-14 sm:w-16 sm:h-16";

  const pal = locked
    ? {
        medalLight: "#E2E8F0",
        medalMid: "#94A3B8",
        medalDark: "#64748B",
        rimStroke: "#CBD5E1",
        ribbonLeft: "#94A3B8",
        ribbonRight: "#64748B",
        centerBg: "#F8FAFC",
      }
    : badge.palette;

  return (
    <div className={`${sizeClass} shrink-0 select-none relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 80 88"
        className="w-full h-full overflow-visible drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${uid}-medal`} x1="16" y1="8" x2="64" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={pal.medalLight} />
            <stop offset="52%" stopColor={pal.medalMid} />
            <stop offset="100%" stopColor={pal.medalDark} />
          </linearGradient>
          <linearGradient id={`${uid}-inner`} x1="22" y1="16" x2="58" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor={pal.centerBg} />
          </linearGradient>
        </defs>

        {/* Bottom V-Ribbons */}
        <path
          d="M27 54L19 82L30 76L36 84L39 56Z"
          fill={pal.ribbonLeft}
        />
        <path
          d="M53 54L61 82L50 76L44 84L41 56Z"
          fill={pal.ribbonRight}
        />

        {/* Scalloped Outer 3D Starburst Medal Rim */}
        <path
          d="M40 5L47.5 9.2L56 8.5L60.2 16L67.8 20.2L67 28.8L71.2 36.2L66.5 43.5L66.8 52L59 55.8L54.5 63.2L46 62L40 66.5L34 62L25.5 63.2L21 55.8L13.2 52L13.5 43.5L8.8 36.2L13 28.8L12.2 20.2L19.8 16L24 8.5L32.5 9.2L40 5Z"
          fill={`url(#${uid}-medal)`}
          stroke={pal.rimStroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Inner Engraved Medal Ring */}
        <circle
          cx="40"
          cy="35.5"
          r="20.5"
          fill={`url(#${uid}-inner)`}
          stroke={pal.medalDark}
          strokeWidth="2"
        />

        {/* Specular Highlight Arc */}
        {!locked && (
          <path
            d="M25 24C29 18.5 36 16.5 44 17.5"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}

        {/* Thematic Center Icon */}
        {locked ? (
          <g transform="translate(31, 25)">
            <rect x="2" y="8" width="14" height="11" rx="2.5" fill="#94A3B8" />
            <path
              d="M5 8V5.5C5 3.3 6.8 1.5 9 1.5C11.2 1.5 13 3.3 13 5.5V8"
              stroke="#64748B"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="9" cy="13.5" r="1.6" fill="#F8FAFC" />
          </g>
        ) : badge.icon === "footstep" ? (
          <g>
            <ellipse
              cx="36"
              cy="38"
              rx="5.2"
              ry="8"
              transform="rotate(-12 36 38)"
              fill={pal.medalMid}
            />
            <circle cx="31.5" cy="27.5" r="2" fill={pal.medalDark} />
            <circle cx="35.5" cy="26.2" r="2.1" fill={pal.medalDark} />
            <circle cx="39.8" cy="27.2" r="1.9" fill={pal.medalDark} />
            <path
              d="M44 35L48 39L55 31"
              stroke="#16A34A"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : badge.icon === "star-shield" ? (
          <path
            d="M40 21L44.2 29.6L53.6 31L46.8 37.6L48.4 47L40 42.5L31.6 47L33.2 37.6L26.4 31L35.8 29.6L40 21Z"
            fill="#FACC15"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : badge.icon === "guardian" ? (
          <g>
            <path
              d="M40 21L52 25.8V35.2C52 43 46.8 48.6 40 51.2C33.2 48.6 28 43 28 35.2V25.8L40 21Z"
              fill={pal.medalMid}
              stroke={pal.medalDark}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M34.5 35.8L38.3 39.6L46 31.5"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : badge.icon === "compass" ? (
          <g>
            <circle cx="40" cy="35.5" r="12.5" fill={pal.medalLight} opacity="0.35" stroke={pal.medalDark} strokeWidth="1.8" />
            <polygon points="40,23.5 44.2,35.5 40,33 35.8,35.5" fill="#DC2626" />
            <polygon points="40,47.5 44.2,35.5 40,38 35.8,35.5" fill={pal.medalDark} />
            <circle cx="40" cy="35.5" r="2.5" fill="#FFFFFF" stroke={pal.medalDark} strokeWidth="1.4" />
          </g>
        ) : (
          /* Golden Crown */
          <g>
            <path
              d="M27.5 42.5L29.5 27.5L36.5 33.5L40 24.5L43.5 33.5L50.5 27.5L52.5 42.5H27.5Z"
              fill="#FACC15"
              stroke="#B45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <rect x="27.5" y="42.5" width="25" height="4" rx="1.8" fill="#D97706" />
            <circle cx="29.5" cy="26.5" r="2" fill="#EF4444" />
            <circle cx="40" cy="23.5" r="2.3" fill="#2563EB" />
            <circle cx="50.5" cy="26.5" r="2" fill="#10B981" />
          </g>
        )}
      </svg>
    </div>
  );
}

interface BadgeUnlockToastProps {
  badge: AchievementBadge | null;
  playerName: string;
  currentPoints: number;
  onOpenCollection: () => void;
  onDismiss: () => void;
}

/**
 * Celebratory floating achievement banner that appears immediately on screen
 * when a child reaches a new point threshold.
 */
export function BadgeUnlockToast({
  badge,
  playerName,
  currentPoints,
  onOpenCollection,
  onDismiss,
}: BadgeUnlockToastProps) {
  useEffect(() => {
    if (!badge) return;
    const timer = window.setTimeout(() => {
      onDismiss();
    }, 6800);
    return () => window.clearTimeout(timer);
  }, [badge, onDismiss]);

  const nextBadge = getNextBadgeTarget(currentPoints);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key={badge.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -36, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[10100] w-[calc(100%-1.5rem)] max-w-md pointer-events-auto select-none"
        >
          <div className="bg-[#FFFDF7] border-2 border-amber-400 rounded-3xl p-4 sm:p-4.5 shadow-[0_18px_45px_rgba(15,23,42,0.28)] text-slate-900 relative overflow-hidden">
            {/* Subtle warm celebratory top glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500" />

            <button
              type="button"
              onClick={() => {
                playUiClickSFX();
                onDismiss();
              }}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Tutup notifikasi badge"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-3.5 pr-6">
              <motion.div
                initial={{ rotate: -14, scale: 0.65 }}
                animate={{ rotate: [0, -6, 6, 0], scale: 1 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
              >
                <BadgeEmblemSVG badge={badge} size="md" />
              </motion.div>

              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <span className="font-bold">Badge Prestasi Baru!</span>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span className="font-mono tabular-nums font-bold">
                    {badge.requiredPoints} Poin
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-display font-extrabold text-slate-900 leading-snug truncate">
                  {badge.title}
                </h4>

                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                  Selamat{playerName ? `, ${playerName}` : ""}! {badge.praiseMessage}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-200/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium truncate">
                {nextBadge
                  ? `Target berikutnya: ${nextBadge.title} (${nextBadge.requiredPoints} Poin)`
                  : "Semua Badge Prestasi telah berhasil kamu raih!"}
              </span>

              <button
                type="button"
                onClick={() => {
                  playUiClickSFX();
                  onOpenCollection();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Lihat Koleksi
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BadgeCollectionModalProps {
  isOpen: boolean;
  points: number;
  playerName: string;
  onClose: () => void;
}

/**
 * Full Achievement Badge showcase & next-milestone motivation modal.
 */
export function BadgeCollectionModal({
  isOpen,
  points,
  playerName,
  onClose,
}: BadgeCollectionModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        playUiClickSFX();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const unlockedBadges = getUnlockedBadges(points);
  const nextBadge = getNextBadgeTarget(points);
  const prevThreshold =
    unlockedBadges.length > 0
      ? unlockedBadges[unlockedBadges.length - 1].requiredPoints
      : 0;
  const progressPercent = nextBadge
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((points - prevThreshold) /
              Math.max(10, nextBadge.requiredPoints - prevThreshold)) *
              100
          )
        )
      )
    : 100;
  const pointsRemaining = nextBadge ? Math.max(0, nextBadge.requiredPoints - points) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10080] flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4 overflow-y-auto select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Koleksi Badge Prestasi"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="bg-[#FFFDF7] border-2 border-amber-300 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-[0_24px_60px_rgba(15,23,42,0.35)] text-slate-900 flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-200/90 shrink-0">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <span className="font-bold text-amber-800">Penghargaan Siswa</span>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">
                    {unlockedBadges.length}/{ACHIEVEMENT_BADGES.length} Diraih
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 mt-0.5">
                  Koleksi Badge Prestasi {playerName ? playerName : ""}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  playUiClickSFX();
                  onClose();
                }}
                className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Tutup koleksi badge"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Motivational Next-Badge Progress Section */}
            <div className="my-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="font-semibold text-slate-800">
                  {nextBadge ? (
                    <>
                      Kumpulkan{" "}
                      <span className="font-mono tabular-nums font-extrabold text-[#DC2626]">
                        {pointsRemaining} Poin
                      </span>{" "}
                      lagi untuk membuka{" "}
                      <strong className="text-slate-900">{nextBadge.title}</strong>!
                    </>
                  ) : (
                    <strong className="text-emerald-800">
                      Luar biasa! Seluruh 5 Badge Prestasi telah berhasil kamu kumpulkan!
                    </strong>
                  )}
                </div>

                <div className="font-mono tabular-nums text-xs font-bold text-amber-900">
                  Skor Saat Ini: {points} Poin
                </div>
              </div>

              <div className="mt-2.5 w-full h-3 bg-white rounded-full overflow-hidden border border-amber-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>

            {/* Scrollable 5-Badge Grid */}
            <div className="overflow-y-auto pr-0.5 space-y-2.5 flex-1">
              {ACHIEVEMENT_BADGES.map((badge) => {
                const isUnlocked = points >= badge.requiredPoints;
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 flex items-center gap-3.5 sm:gap-4 transition-all ${
                      isUnlocked
                        ? `${badge.palette.cardTint} ${badge.palette.cardBorder}`
                        : "bg-stone-50/80 border-stone-200 opacity-80"
                    }`}
                  >
                    <BadgeEmblemSVG badge={badge} locked={!isUnlocked} size="md" />

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                        <span
                          className={
                            isUnlocked ? `${badge.palette.accentText} font-bold` : "text-slate-500"
                          }
                        >
                          {badge.tierLabel}
                        </span>
                        <span aria-hidden="true" className="text-stone-300">·</span>
                        <span className="font-mono tabular-nums font-bold text-slate-700">
                          Target {badge.requiredPoints} Poin
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-display font-extrabold text-slate-900 leading-snug mt-0.5">
                        {badge.title}
                      </h4>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                        {isUnlocked ? badge.praiseMessage : badge.description}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end">
                      {isUnlocked ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Check className="w-4 h-4 stroke-[2.6]" />
                          <span className="hidden sm:inline">Diraih</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Terkunci</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Button */}
            <div className="pt-4 mt-3 border-t border-stone-200/90 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  playUiClickSFX();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-display font-bold text-sm cursor-pointer shadow-[0_3px_0_#1E40AF] active:translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Lanjut Kumpulkan Poin
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
