/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BadgeEmblemIcon =
  | "footstep"
  | "star-shield"
  | "guardian"
  | "compass"
  | "crown";

export interface AchievementBadge {
  id: string;
  title: string;
  tierLabel: string;
  requiredPoints: number;
  description: string;
  praiseMessage: string;
  icon: BadgeEmblemIcon;
  palette: {
    medalLight: string;
    medalMid: string;
    medalDark: string;
    rimStroke: string;
    ribbonLeft: string;
    ribbonRight: string;
    centerBg: string;
    accentText: string;
    cardTint: string;
    cardBorder: string;
  };
}

export const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: "langkah-awal",
    title: "Langkah Awal Waspada",
    tierLabel: "Lencana Perunggu",
    requiredPoints: 30,
    description: "Berhasil mengumpulkan 30 poin pertama dari keputusan yang aman.",
    praiseMessage:
      "Langkah pertamamu luar biasa! Kamu mulai berani mengenali situasi aman di sekitarmu.",
    icon: "footstep",
    palette: {
      medalLight: "#FDBA74",
      medalMid: "#EA580C",
      medalDark: "#9A3412",
      rimStroke: "#FED7AA",
      ribbonLeft: "#DC2626",
      ribbonRight: "#B91C1C",
      centerBg: "#FFF7ED",
      accentText: "text-orange-800",
      cardTint: "bg-orange-50/80",
      cardBorder: "border-orange-300",
    },
  },
  {
    id: "sahabat-cerdas",
    title: "Sahabat Cerdas Sekolah",
    tierLabel: "Lencana Perak",
    requiredPoints: 60,
    description: "Mengumpulkan 60 poin dengan sikap santun, jujur, dan peduli teman.",
    praiseMessage:
      "Keren sekali! Kamu makin sigap menjaga diri dan menjadi teman yang baik di sekolah.",
    icon: "star-shield",
    palette: {
      medalLight: "#F8FAFC",
      medalMid: "#94A3B8",
      medalDark: "#475569",
      rimStroke: "#E2E8F0",
      ribbonLeft: "#2563EB",
      ribbonRight: "#1D4ED8",
      centerBg: "#F1F5F9",
      accentText: "text-slate-700",
      cardTint: "bg-sky-50/75",
      cardBorder: "border-sky-300",
    },
  },
  {
    id: "penjaga-tangguh",
    title: "Penjaga Diri Tangguh",
    tierLabel: "Lencana Safir",
    requiredPoints: 100,
    description: "Menembus 100 poin dan berani berkata TIDAK pada ajakan berbahaya.",
    praiseMessage:
      "Setengah perjalanan terlampaui! Kamu tahu cara menolak ajakan mencurigakan dengan tegas.",
    icon: "guardian",
    palette: {
      medalLight: "#7DD3FC",
      medalMid: "#0284C7",
      medalDark: "#075985",
      rimStroke: "#BAE6FD",
      ribbonLeft: "#E11D48",
      ribbonRight: "#BE123C",
      centerBg: "#F0F9FF",
      accentText: "text-sky-800",
      cardTint: "bg-sky-50/85",
      cardBorder: "border-sky-400",
    },
  },
  {
    id: "pelopor-aman",
    title: "Pelopor Pulang Aman",
    tierLabel: "Lencana Zamrud",
    requiredPoints: 150,
    description: "Meraih 150 poin dengan ketelitian tinggi di jalan raya dan lingkungan rumah.",
    praiseMessage:
      "Hebat! Kamu sangat teliti menjaga keselamatan dari sekolah, jalan pulang, hingga ke rumah.",
    icon: "compass",
    palette: {
      medalLight: "#6EE7B7",
      medalMid: "#059669",
      medalDark: "#065F46",
      rimStroke: "#A7F3D0",
      ribbonLeft: "#D97706",
      ribbonRight: "#B45309",
      centerBg: "#ECFDF5",
      accentText: "text-emerald-800",
      cardTint: "bg-emerald-50/85",
      cardBorder: "border-emerald-400",
    },
  },
  {
    id: "pahlawan-safestep",
    title: "Pahlawan Cilik SafeStep",
    tierLabel: "Mahkota Emas",
    requiredPoints: 200,
    description: "Mencapai skor sempurna 200 poin dan menuntaskan seluruh misi dengan tepat.",
    praiseMessage:
      "Luar biasa! Kamu meraih lencana tertinggi SafeStep dan siap menjadi teladan keselamatan!",
    icon: "crown",
    palette: {
      medalLight: "#FEF08A",
      medalMid: "#F59E0B",
      medalDark: "#B45309",
      rimStroke: "#FEF9C3",
      ribbonLeft: "#DC2626",
      ribbonRight: "#991B1B",
      centerBg: "#FFFBEB",
      accentText: "text-amber-900",
      cardTint: "bg-amber-50/90",
      cardBorder: "border-amber-400",
    },
  },
];

export function getUnlockedBadges(points: number): AchievementBadge[] {
  return ACHIEVEMENT_BADGES.filter((b) => points >= b.requiredPoints);
}

export function getHighestUnlockedBadge(points: number): AchievementBadge | null {
  const unlocked = getUnlockedBadges(points);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

export function getNextBadgeTarget(points: number): AchievementBadge | null {
  return ACHIEVEMENT_BADGES.find((b) => points < b.requiredPoints) ?? null;
}

export function getNewlyUnlockedBadges(
  previousPoints: number,
  nextPoints: number
): AchievementBadge[] {
  if (nextPoints <= previousPoints) return [];
  return ACHIEVEMENT_BADGES.filter(
    (b) => previousPoints < b.requiredPoints && nextPoints >= b.requiredPoints
  );
}
