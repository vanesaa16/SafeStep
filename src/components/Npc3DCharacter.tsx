/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useId } from "react";

export interface Npc3DCharacterProps {
  npcId: string;
  npcName?: string;
  npcType?: string; // "stranger" | "authority" | "peer"
  colorClass?: string;
  isMeeting?: boolean;
  isWaving?: boolean;
  isCompleted?: boolean;
  variant?: "map" | "portrait" | "mini";
}

type AgeGroup = "adult" | "teen" | "kid";
type GenderLook = "male" | "female";
type HairStyle3D =
  | "short-parted"
  | "spiky-kid"
  | "wavy-modern"
  | "undercut"
  | "bob-girl"
  | "cap"
  | "messy-teen";
type OutfitStyle3D =
  | "hoodie"
  | "jacket-tee"
  | "staff-uniform"
  | "teacher-formal"
  | "kid-sporty"
  | "kid-uniform-vest"
  | "kid-girl-cardigan"
  | "senior-vest"
  | "apron-shop"
  | "polo-guest";
type PropType3D =
  | "none"
  | "beckon"
  | "gift"
  | "phone"
  | "laptop"
  | "tablet"
  | "camera"
  | "icecream"
  | "keys"
  | "clipboard"
  | "remote";

interface SkinPalette {
  hi: string;
  mid: string;
  sub: string;
  deep: string;
  lip: string;
}

interface ColorShades {
  light: string;
  mid: string;
  dark: string;
  deep: string;
}

interface Npc3DProfile {
  age: AgeGroup;
  gender: GenderLook;
  skin: SkinPalette;
  hairStyle: HairStyle3D;
  hairColors: ColorShades;
  capColors?: ColorShades;
  outfit: OutfitStyle3D;
  topColors: ColorShades;
  innerColors: ColorShades;
  bottomColors: ColorShades;
  shoeColors: ColorShades;
  irisColor: string;
  glasses?: "clear" | "sunglasses" | "none";
  stubble?: boolean;
  prop: PropType3D;
  baseExpression: "friendly" | "sly" | "stern" | "curious";
}

const SKIN_TONES: Record<"fair" | "warm" | "tan" | "olive", SkinPalette> = {
  fair: {
    hi: "#FFF3E8",
    mid: "#F9CCB2",
    sub: "#E3A181",
    deep: "#BF7B5B",
    lip: "#D9726A",
  },
  warm: {
    hi: "#FDE7D4",
    mid: "#F0BA96",
    sub: "#D6906A",
    deep: "#B06B49",
    lip: "#CC685E",
  },
  tan: {
    hi: "#F8D9BD",
    mid: "#E2A67D",
    sub: "#C48058",
    deep: "#9B5D3A",
    lip: "#BA5E53",
  },
  olive: {
    hi: "#F6DEC6",
    mid: "#DDA882",
    sub: "#BC7F59",
    deep: "#935A39",
    lip: "#B85C54",
  },
};

const HAIR_PALETTES: Record<"espresso" | "jet" | "chestnut" | "charcoal" | "auburn", ColorShades> = {
  espresso: { light: "#6D4C41", mid: "#3E2723", dark: "#241411", deep: "#140A08" },
  jet: { light: "#475569", mid: "#1E293B", dark: "#0F172A", deep: "#060913" },
  chestnut: { light: "#8D5B4C", mid: "#5D3A2E", dark: "#3B2219", deep: "#24130D" },
  charcoal: { light: "#64748B", mid: "#334155", dark: "#1E293B", deep: "#0F172A" },
  auburn: { light: "#9A523C", mid: "#683222", dark: "#431D12", deep: "#291009" },
};

const CLOTH_PALETTES: Record<string, ColorShades> = {
  slate: { light: "#64748B", mid: "#334155", dark: "#1E293B", deep: "#0F172A" },
  blue: { light: "#60A5FA", mid: "#2563EB", dark: "#1D4ED8", deep: "#1E3A8A" },
  orange: { light: "#FB923C", mid: "#F97316", dark: "#C2410C", deep: "#7C2D12" },
  purple: { light: "#C084FC", mid: "#9333EA", dark: "#6B21A8", deep: "#3B0764" },
  red: { light: "#F87171", mid: "#DC2626", dark: "#991B1B", deep: "#450A0A" },
  emerald: { light: "#34D399", mid: "#059669", dark: "#065F46", deep: "#022C22" },
  indigo: { light: "#818CF8", mid: "#4F46E5", dark: "#3730A3", deep: "#1E1B4B" },
  sky: { light: "#38BDF8", mid: "#0284C7", dark: "#0369A1", deep: "#0C4A6E" },
  amber: { light: "#FBBF24", mid: "#D97706", dark: "#92400E", deep: "#451A03" },
  fuchsia: { light: "#E879F9", mid: "#A21CAF", dark: "#701A75", deep: "#4A044E" },
  teal: { light: "#2DD4BF", mid: "#0D9488", dark: "#115E59", deep: "#042F2E" },
  rose: { light: "#FB7185", mid: "#E11D48", dark: "#9F1239", deep: "#4C0519" },
  violet: { light: "#A78BFA", mid: "#7C3AED", dark: "#5B21B6", deep: "#2E1065" },
  cyan: { light: "#22D3EE", mid: "#0891B2", dark: "#155E75", deep: "#083344" },
  stone: { light: "#A8A29E", mid: "#57534E", dark: "#292524", deep: "#1C1917" },
  pink: { light: "#F472B6", mid: "#DB2777", dark: "#9D174D", deep: "#500724" },
  white: { light: "#FFFFFF", mid: "#F1F5F9", dark: "#CBD5E1", deep: "#94A3B8" },
  khaki: { light: "#E7D8C5", mid: "#C6AD8F", dark: "#9A7E5F", deep: "#6B533B" },
  denim: { light: "#6085B5", mid: "#3B5984", dark: "#233858", deep: "#152338" },
  sdRed: { light: "#F06564", mid: "#D93837", dark: "#9E1F1E", deep: "#691111" },
};

const NPC_PROFILES: Record<string, Npc3DProfile> = {
  // === MAP 1: HALAMAN SEKOLAH ===
  "school-npc-1": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.tan,
    hairStyle: "cap",
    hairColors: HAIR_PALETTES.jet,
    capColors: CLOTH_PALETTES.slate,
    outfit: "hoodie",
    topColors: CLOTH_PALETTES.slate,
    innerColors: CLOTH_PALETTES.stone,
    bottomColors: CLOTH_PALETTES.denim,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#2C1D14",
    stubble: true,
    prop: "beckon",
    baseExpression: "sly",
  },
  "school-npc-2": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.warm,
    hairStyle: "short-parted",
    hairColors: HAIR_PALETTES.jet,
    outfit: "staff-uniform",
    topColors: CLOTH_PALETTES.blue,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.slate,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#3B2618",
    prop: "beckon",
    baseExpression: "friendly",
  },
  "school-npc-3": {
    age: "kid",
    gender: "male",
    skin: SKIN_TONES.warm,
    hairStyle: "spiky-kid",
    hairColors: HAIR_PALETTES.chestnut,
    outfit: "kid-sporty",
    topColors: CLOTH_PALETTES.orange,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.denim,
    shoeColors: CLOTH_PALETTES.blue,
    irisColor: "#42291B",
    prop: "beckon",
    baseExpression: "sly",
  },
  "school-npc-4": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.fair,
    hairStyle: "wavy-modern",
    hairColors: HAIR_PALETTES.espresso,
    outfit: "jacket-tee",
    topColors: CLOTH_PALETTES.fuchsia,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.slate,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#332218",
    prop: "gift",
    baseExpression: "sly",
  },
  "school-npc-5": {
    age: "teen",
    gender: "male",
    skin: SKIN_TONES.tan,
    hairStyle: "undercut",
    hairColors: HAIR_PALETTES.jet,
    outfit: "senior-vest",
    topColors: CLOTH_PALETTES.red,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.sdRed,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#261810",
    prop: "none",
    baseExpression: "stern",
  },

  // === MAP 2: RUANG KELAS ===
  "class-npc-1": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.olive,
    hairStyle: "short-parted",
    hairColors: HAIR_PALETTES.espresso,
    outfit: "teacher-formal",
    topColors: CLOTH_PALETTES.emerald,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.stone,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#2E1E14",
    glasses: "clear",
    prop: "clipboard",
    baseExpression: "friendly",
  },
  "class-npc-2": {
    age: "kid",
    gender: "male",
    skin: SKIN_TONES.fair,
    hairStyle: "messy-teen",
    hairColors: HAIR_PALETTES.jet,
    outfit: "kid-uniform-vest",
    topColors: CLOTH_PALETTES.indigo,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.sdRed,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#3A2519",
    prop: "phone",
    baseExpression: "sly",
  },
  "class-npc-3": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.fair,
    hairStyle: "wavy-modern",
    hairColors: HAIR_PALETTES.charcoal,
    outfit: "jacket-tee",
    topColors: CLOTH_PALETTES.purple,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.slate,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#2B3A4A",
    glasses: "clear",
    prop: "laptop",
    baseExpression: "friendly",
  },
  "class-npc-4": {
    age: "kid",
    gender: "female",
    skin: SKIN_TONES.warm,
    hairStyle: "bob-girl",
    hairColors: HAIR_PALETTES.espresso,
    outfit: "kid-girl-cardigan",
    topColors: CLOTH_PALETTES.sky,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.sdRed,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#462C1D",
    prop: "beckon",
    baseExpression: "curious",
  },
  "class-npc-5": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.tan,
    hairStyle: "cap",
    hairColors: HAIR_PALETTES.espresso,
    capColors: CLOTH_PALETTES.amber,
    outfit: "jacket-tee",
    topColors: CLOTH_PALETTES.amber,
    innerColors: CLOTH_PALETTES.slate,
    bottomColors: CLOTH_PALETTES.denim,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#291A11",
    stubble: true,
    prop: "camera",
    baseExpression: "sly",
  },

  // === MAP 3: JALAN RAYA ===
  "street-npc-1": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.warm,
    hairStyle: "short-parted",
    hairColors: HAIR_PALETTES.jet,
    outfit: "jacket-tee",
    topColors: CLOTH_PALETTES.fuchsia,
    innerColors: CLOTH_PALETTES.slate,
    bottomColors: CLOTH_PALETTES.stone,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#261A13",
    glasses: "sunglasses",
    prop: "keys",
    baseExpression: "sly",
  },
  "street-npc-2": {
    age: "teen",
    gender: "male",
    skin: SKIN_TONES.fair,
    hairStyle: "messy-teen",
    hairColors: HAIR_PALETTES.auburn,
    outfit: "hoodie",
    topColors: CLOTH_PALETTES.teal,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.denim,
    shoeColors: CLOTH_PALETTES.teal,
    irisColor: "#3B281B",
    prop: "phone",
    baseExpression: "sly",
  },
  "street-npc-3": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.olive,
    hairStyle: "cap",
    hairColors: HAIR_PALETTES.jet,
    capColors: CLOTH_PALETTES.rose,
    outfit: "hoodie",
    topColors: CLOTH_PALETTES.rose,
    innerColors: CLOTH_PALETTES.slate,
    bottomColors: CLOTH_PALETTES.slate,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#24160E",
    stubble: true,
    prop: "phone",
    baseExpression: "stern",
  },
  "street-npc-4": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.tan,
    hairStyle: "wavy-modern",
    hairColors: HAIR_PALETTES.espresso,
    outfit: "apron-shop",
    topColors: CLOTH_PALETTES.indigo,
    innerColors: CLOTH_PALETTES.amber,
    bottomColors: CLOTH_PALETTES.khaki,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#362216",
    prop: "icecream",
    baseExpression: "friendly",
  },
  "street-npc-5": {
    age: "kid",
    gender: "male",
    skin: SKIN_TONES.warm,
    hairStyle: "spiky-kid",
    hairColors: HAIR_PALETTES.jet,
    outfit: "hoodie",
    topColors: CLOTH_PALETTES.amber,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.denim,
    shoeColors: CLOTH_PALETTES.red,
    irisColor: "#3D2618",
    prop: "beckon",
    baseExpression: "curious",
  },

  // === MAP 4: RUMAH ===
  "home-npc-1": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.olive,
    hairStyle: "short-parted",
    hairColors: HAIR_PALETTES.charcoal,
    outfit: "polo-guest",
    topColors: CLOTH_PALETTES.violet,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.khaki,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#2C1C12",
    prop: "beckon",
    baseExpression: "sly",
  },
  "home-npc-2": {
    age: "teen",
    gender: "female",
    skin: SKIN_TONES.fair,
    hairStyle: "bob-girl",
    hairColors: HAIR_PALETTES.chestnut,
    outfit: "hoodie",
    topColors: CLOTH_PALETTES.cyan,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.slate,
    shoeColors: CLOTH_PALETTES.cyan,
    irisColor: "#38261B",
    prop: "tablet",
    baseExpression: "friendly",
  },
  "home-npc-3": {
    age: "teen",
    gender: "male",
    skin: SKIN_TONES.warm,
    hairStyle: "undercut",
    hairColors: HAIR_PALETTES.espresso,
    outfit: "hoodie",
    topColors: CLOTH_PALETTES.red,
    innerColors: CLOTH_PALETTES.white,
    bottomColors: CLOTH_PALETTES.slate,
    shoeColors: CLOTH_PALETTES.red,
    irisColor: "#311F15",
    prop: "remote",
    baseExpression: "sly",
  },
  "home-npc-4": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.tan,
    hairStyle: "wavy-modern",
    hairColors: HAIR_PALETTES.jet,
    outfit: "polo-guest",
    topColors: CLOTH_PALETTES.stone,
    innerColors: CLOTH_PALETTES.amber,
    bottomColors: CLOTH_PALETTES.denim,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#2A1B12",
    prop: "gift",
    baseExpression: "sly",
  },
  "home-npc-5": {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.fair,
    hairStyle: "short-parted",
    hairColors: HAIR_PALETTES.espresso,
    outfit: "jacket-tee",
    topColors: CLOTH_PALETTES.pink,
    innerColors: CLOTH_PALETTES.slate,
    bottomColors: CLOTH_PALETTES.slate,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#2D1E15",
    prop: "phone",
    baseExpression: "sly",
  },
};

function resolveFallbackColorKey(colorClass?: string): string {
  if (!colorClass) return "blue";
  const keys = Object.keys(CLOTH_PALETTES);
  for (const k of keys) {
    if (colorClass.includes(k)) return k;
  }
  return "indigo";
}

function resolveNpcProfile(npcId: string, npcType?: string, colorClass?: string): Npc3DProfile {
  if (NPC_PROFILES[npcId]) {
    return NPC_PROFILES[npcId];
  }
  const palette = CLOTH_PALETTES[resolveFallbackColorKey(colorClass)] || CLOTH_PALETTES.indigo;
  if (npcType === "peer") {
    return {
      age: "kid",
      gender: "male",
      skin: SKIN_TONES.warm,
      hairStyle: "spiky-kid",
      hairColors: HAIR_PALETTES.espresso,
      outfit: "kid-sporty",
      topColors: palette,
      innerColors: CLOTH_PALETTES.white,
      bottomColors: CLOTH_PALETTES.denim,
      shoeColors: CLOTH_PALETTES.blue,
      irisColor: "#3B2618",
      prop: "beckon",
      baseExpression: "curious",
    };
  }
  if (npcType === "authority") {
    return {
      age: "adult",
      gender: "male",
      skin: SKIN_TONES.warm,
      hairStyle: "short-parted",
      hairColors: HAIR_PALETTES.jet,
      outfit: "teacher-formal",
      topColors: palette,
      innerColors: CLOTH_PALETTES.white,
      bottomColors: CLOTH_PALETTES.slate,
      shoeColors: CLOTH_PALETTES.stone,
      irisColor: "#2E1E14",
      glasses: "clear",
      prop: "clipboard",
      baseExpression: "friendly",
    };
  }
  return {
    age: "adult",
    gender: "male",
    skin: SKIN_TONES.tan,
    hairStyle: "cap",
    hairColors: HAIR_PALETTES.jet,
    capColors: palette,
    outfit: "jacket-tee",
    topColors: palette,
    innerColors: CLOTH_PALETTES.slate,
    bottomColors: CLOTH_PALETTES.slate,
    shoeColors: CLOTH_PALETTES.stone,
    irisColor: "#261810",
    stubble: true,
    prop: "beckon",
    baseExpression: "sly",
  };
}

function computeStaggerSeconds(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 1000;
  }
  return Number(((hash % 28) * 0.12).toFixed(2));
}

export default function Npc3DCharacter({
  npcId,
  npcName,
  npcType,
  colorClass,
  isMeeting = false,
  isWaving = false,
  isCompleted = false,
  variant = "map",
}: Npc3DCharacterProps) {
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9]/g, "");
  const profile = resolveNpcProfile(npcId, npcType, colorClass);
  const animDelay = `${computeStaggerSeconds(npcId)}s`;

  const isStrangerLike =
    npcType === "stranger" ||
    profile.baseExpression === "sly" ||
    profile.baseExpression === "stern" ||
    (npcName ? npcName.toLowerCase().includes("asing") || npcName.toLowerCase().includes("mencurigakan") : false);

  // Never spoil danger on the world map: map NPCs always greet with a natural, welcoming expression
  const isMapMode = variant === "map";
  const showSuspiciousLook =
    !isMapMode && !isCompleted && (isMeeting ? isStrangerLike : profile.baseExpression === "stern");
  const showSlySmirk =
    !isMapMode && !isCompleted && (showSuspiciousLook || profile.baseExpression === "sly");
  const showSternMouth = !isMapMode && profile.baseExpression === "stern" && !isCompleted;

  const hasRightHandProp = profile.prop !== "none" && profile.prop !== "beckon";
  const waveWithLeftArm = isWaving && !isCompleted && hasRightHandProp;
  const waveWithRightArm = isWaving && !isCompleted && !hasRightHandProp;

  // Size classes by variant & age proportion so kids, teens, and adults look naturally scaled in 3D
  let sizeClass = "w-[46px] h-[63px] sm:w-[54px] sm:h-[74px]";
  if (variant === "map") {
    if (profile.age === "kid") {
      sizeClass = "w-[40px] h-[55px] sm:w-[47px] sm:h-[64px]";
    } else if (profile.age === "teen") {
      sizeClass = "w-[43px] h-[59px] sm:w-[50px] sm:h-[69px]";
    }
  } else if (variant === "portrait") {
    sizeClass = "w-full h-full";
  } else if (variant === "mini") {
    sizeClass = "w-full h-full";
  }

  const isBust = variant === "portrait" || variant === "mini";
  const viewBox = isBust ? "14 4 92 100" : "0 0 120 165";
  const capPalette = profile.capColors || profile.topColors;

  return (
    <svg
      viewBox={viewBox}
      className={`${sizeClass} select-none overflow-visible drop-shadow-[0_5px_6px_rgba(15,23,42,0.28)]`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={npcName || "Karakter NPC 3D"}
    >
      <defs>
        {/* 3D Spherical Subsurface Human Skin Shader */}
        <radialGradient id={`${uid}-skin`} cx="46%" cy="42%" r="60%" fx="34%" fy="26%">
          <stop offset="0%" stopColor={profile.skin.hi} />
          <stop offset="46%" stopColor={profile.skin.mid} />
          <stop offset="82%" stopColor={profile.skin.sub} />
          <stop offset="100%" stopColor={profile.skin.deep} />
        </radialGradient>

        {/* 3D Cylindrical Neck & Limb Skin Shader */}
        <linearGradient id={`${uid}-skinCyl`} x1="0%" y1="0%" x2="100%" y2="15%">
          <stop offset="0%" stopColor={profile.skin.hi} />
          <stop offset="35%" stopColor={profile.skin.mid} />
          <stop offset="78%" stopColor={profile.skin.sub} />
          <stop offset="100%" stopColor={profile.skin.deep} />
        </linearGradient>

        {/* Soft Subsurface Cheek Blush */}
        <radialGradient id={`${uid}-blush`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
        </radialGradient>

        {/* 3D Spherical Eyeball Sclera */}
        <radialGradient id={`${uid}-sclera`} cx="42%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="72%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </radialGradient>

        {/* 3D Deep Iris Shader */}
        <radialGradient id={`${uid}-iris`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#7C5338" />
          <stop offset="55%" stopColor={profile.irisColor} />
          <stop offset="100%" stopColor="#090605" />
        </radialGradient>

        {/* 3D Volumetric Hair Shader */}
        <radialGradient id={`${uid}-hair`} cx="42%" cy="28%" r="68%" fx="32%" fy="18%">
          <stop offset="0%" stopColor={profile.hairColors.light} />
          <stop offset="45%" stopColor={profile.hairColors.mid} />
          <stop offset="85%" stopColor={profile.hairColors.dark} />
          <stop offset="100%" stopColor={profile.hairColors.deep} />
        </radialGradient>

        {/* 3D Cap Dome Shader */}
        <radialGradient id={`${uid}-cap`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor={capPalette.light} />
          <stop offset="52%" stopColor={capPalette.mid} />
          <stop offset="100%" stopColor={capPalette.deep} />
        </radialGradient>

        {/* 3D Cylindrical Primary Top / Jacket Cloth Shader */}
        <linearGradient id={`${uid}-top`} x1="0%" y1="0%" x2="100%" y2="18%">
          <stop offset="0%" stopColor={profile.topColors.light} />
          <stop offset="28%" stopColor={profile.topColors.mid} />
          <stop offset="78%" stopColor={profile.topColors.dark} />
          <stop offset="96%" stopColor={profile.topColors.deep} />
          <stop offset="100%" stopColor={profile.topColors.mid} />
        </linearGradient>

        {/* 3D Inner Shirt / Secondary Cloth Shader */}
        <linearGradient id={`${uid}-inner`} x1="0%" y1="10%" x2="100%" y2="20%">
          <stop offset="0%" stopColor={profile.innerColors.light} />
          <stop offset="45%" stopColor={profile.innerColors.mid} />
          <stop offset="100%" stopColor={profile.innerColors.dark} />
        </linearGradient>

        {/* 3D Cylindrical Pants / Skirt Shader */}
        <linearGradient id={`${uid}-bottom`} x1="0%" y1="0%" x2="100%" y2="12%">
          <stop offset="0%" stopColor={profile.bottomColors.light} />
          <stop offset="35%" stopColor={profile.bottomColors.mid} />
          <stop offset="82%" stopColor={profile.bottomColors.dark} />
          <stop offset="100%" stopColor={profile.bottomColors.deep} />
        </linearGradient>

        {/* 3D Footwear Dome Shader */}
        <radialGradient id={`${uid}-shoe`} cx="36%" cy="30%" r="70%">
          <stop offset="0%" stopColor={profile.shoeColors.light} />
          <stop offset="50%" stopColor={profile.shoeColors.mid} />
          <stop offset="100%" stopColor={profile.shoeColors.deep} />
        </radialGradient>

        {/* Ground Contact Shadow */}
        <radialGradient id={`${uid}-groundShadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#020617" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#0F172A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </radialGradient>

        {/* Digital Screen Glow for Phone / Laptop / Tablet */}
        <linearGradient id={`${uid}-screenGlow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* ================= 3D GROUND CONTACT SHADOW (MAP MODE) ================= */}
      {!isBust && (
        <ellipse
          cx="60"
          cy="156"
          rx="27"
          ry="6"
          fill={`url(#${uid}-groundShadow)`}
          className="animate-npc3d-shadow"
          style={{ animationDelay: animDelay }}
        />
      )}

      {/* ================= LOWER BODY: 3D LEGS, TROUSERS/SKIRT & SHOES ================= */}
      {!isBust && (
        <g id={`${uid}-legs`}>
          {profile.outfit === "kid-sporty" ? (
            <>
              {/* 3D Athletic Shorts */}
              <path
                d="M 41,103 L 79,103 L 80,124 C 80,126 63,126 62,124 L 60,115 L 58,124 C 57,126 40,126 40,124 Z"
                fill={`url(#${uid}-bottom)`}
              />
              {/* 3D Skin Calves & Knees */}
              <rect x="43" y="123" width="11" height="20" rx="5" fill={`url(#${uid}-skinCyl)`} />
              <rect x="66" y="123" width="11" height="20" rx="5" fill={`url(#${uid}-skinCyl)`} />
              {/* Knee 3D highlight */}
              <ellipse cx="47.5" cy="128" rx="2.5" ry="2" fill={profile.skin.hi} opacity="0.45" />
              <ellipse cx="70.5" cy="128" rx="2.5" ry="2" fill={profile.skin.hi} opacity="0.45" />
              {/* White Sport Socks */}
              <rect x="42.5" y="137" width="12" height="7" rx="2" fill="#F8FAFC" />
              <rect x="42.5" y="138.5" width="12" height="1.6" fill={profile.topColors.mid} />
              <rect x="65.5" y="137" width="12" height="7" rx="2" fill="#F8FAFC" />
              <rect x="65.5" y="138.5" width="12" height="1.6" fill={profile.topColors.mid} />
            </>
          ) : profile.outfit === "kid-girl-cardigan" ? (
            <>
              {/* 3D Skin Lower Legs */}
              <rect x="44" y="122" width="10.5" height="21" rx="5" fill={`url(#${uid}-skinCyl)`} />
              <rect x="65.5" y="122" width="10.5" height="21" rx="5" fill={`url(#${uid}-skinCyl)`} />
              {/* Neat 3D White Knee Socks */}
              <rect x="43.5" y="134" width="11.5" height="10" rx="2.5" fill="#F8FAFC" />
              <rect x="65" y="134" width="11.5" height="10" rx="2.5" fill="#F8FAFC" />
              {/* 3D Pleated School Skirt */}
              <path
                d="M 40,102 L 80,102 L 85,127 C 72,130 48,130 35,127 Z"
                fill={`url(#${uid}-bottom)`}
              />
              {/* Soft 3D Pleat Shading Folds */}
              <path d="M 49,103 L 46,128" stroke="rgba(0,0,0,0.22)" strokeWidth="2" strokeLinecap="round" />
              <path d="M 60,103 L 60,129" stroke="rgba(0,0,0,0.22)" strokeWidth="2" strokeLinecap="round" />
              <path d="M 71,103 L 74,128" stroke="rgba(0,0,0,0.22)" strokeWidth="2" strokeLinecap="round" />
              <path d="M 44,104 L 41,126" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 55,104 L 54,127" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Full-length 3D Cylindrical Trousers */}
              <path
                d="M 40,102 L 80,102 L 79,144 C 79,146 65,146 64,144 L 60,115 L 56,144 C 55,146 41,146 41,144 Z"
                fill={`url(#${uid}-bottom)`}
              />
              {/* 3D Thigh & Knee Volumetric Highlights */}
              <ellipse cx="47" cy="121" rx="3.5" ry="11" fill="white" opacity="0.12" />
              <ellipse cx="70" cy="121" rx="3.5" ry="11" fill="white" opacity="0.1" />
              {/* Center Inseam Ambient Occlusion Shadow */}
              <path d="M 60,105 L 60,116" stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* 3D Chunky Sneakers / Sculpted Shoes */}
          {/* Left Shoe */}
          <g>
            <path
              d="M 35,149 C 35,143 42,140.5 55.5,142 L 56.5,151 C 56.5,154 35,154 35,149 Z"
              fill={`url(#${uid}-shoe)`}
            />
            {/* 3D White Rubber Midsole Bevel */}
            <path
              d="M 34.5,150.5 C 40,152 50,152 57,150.5 L 57,153.2 C 50,155 40,155 34.5,153.2 Z"
              fill="#F8FAFC"
            />
            {/* Specular Toe Catchlight */}
            <ellipse cx="42" cy="145.5" rx="4" ry="1.6" fill="white" opacity="0.28" />
          </g>

          {/* Right Shoe */}
          <g>
            <path
              d="M 64.5,142 C 78,140.5 85,143 85,149 C 85,154 63.5,154 63.5,151 Z"
              fill={`url(#${uid}-shoe)`}
            />
            {/* 3D White Rubber Midsole Bevel */}
            <path
              d="M 63,150.5 C 70,152 80,152 85.5,150.5 L 85.5,153.2 C 80,155 70,155 63,153.2 Z"
              fill="#F8FAFC"
            />
            {/* Specular Toe Catchlight */}
            <ellipse cx="74" cy="145.5" rx="4" ry="1.6" fill="white" opacity="0.24" />
          </g>
        </g>
      )}

      {/* ================= UPPER BODY GROUP (ANIMATED 3D BREATHING) ================= */}
      <g className="animate-npc3d-breathe" style={{ animationDelay: animDelay }}>
        {/* --- LEFT ARM (RELAXED OR RAISED FRIENDLY WAVE WHEN RIGHT HAND HOLDS PROP) --- */}
        {waveWithLeftArm ? (
          <g
            className="animate-npc3d-wave-callout-l"
            style={{ transformOrigin: "38px 69px" }}
          >
            <path
              d="M 39,67 C 31,66 24,60 21,50 C 19.5,46 27,44 29,48 C 32,56 36,61 41,64 Z"
              fill={profile.outfit === "kid-sporty" ? `url(#${uid}-skinCyl)` : `url(#${uid}-top)`}
            />
            <circle cx="24" cy="46.5" r="5.5" fill={`url(#${uid}-skin)`} />
            <path
              d="M 27,42 L 28,38.5 M 24,41.2 L 23.5,37.5 M 21,42.2 L 19.5,39"
              stroke={profile.skin.mid}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <g
            className={profile.prop === "none" && !waveWithRightArm ? "animate-npc3d-arm-wave" : ""}
            style={{ transformOrigin: "36px 70px", animationDelay: animDelay }}
          >
            {/* 3D Upper & Lower Left Sleeve */}
            <path
              d="M 38,67 C 31,69 25,79 24,95 C 23.5,99 31,100 32.5,96 C 34,85 37,77 40,73 Z"
              fill={profile.outfit === "kid-sporty" ? `url(#${uid}-inner)` : `url(#${uid}-top)`}
            />
            {profile.outfit === "kid-sporty" && (
              <path
                d="M 27.5,84 L 24.5,96 C 24,99 31,100 32,96 L 34,85 Z"
                fill={`url(#${uid}-skinCyl)`}
              />
            )}
            {/* 3D Sculpted Left Hand & Thumb */}
            <circle cx="27.5" cy="99" r="5.2" fill={`url(#${uid}-skin)`} />
            <ellipse cx="31" cy="97.5" rx="2.1" ry="1.5" fill={profile.skin.hi} opacity="0.7" />
          </g>
        )}

        {/* --- 3D SCULPTED TORSO & CLOTHING DETAILS --- */}
        <g id={`${uid}-torso`}>
          {/* Base 3D Torso Volume */}
          <path
            d="M 35,71 C 35,64 45,61 60,61 C 75,61 85,64 85,71 L 81,104 C 81,108 39,108 39,104 Z"
            fill={`url(#${uid}-top)`}
          />
          {/* Top-down 3D Clavicle / Chest Specular Highlight */}
          <ellipse cx="54" cy="72" rx="16" ry="8" fill="white" opacity="0.14" />

          {/* Outfit-Specific 3D Layers */}
          {profile.outfit === "jacket-tee" && (
            <>
              {/* Inner Crew-Neck Shirt visible in center opening */}
              <path
                d="M 50,63 L 70,63 L 68,106 L 52,106 Z"
                fill={`url(#${uid}-inner)`}
              />
              {/* Ambient Occlusion Shadow cast by open 3D jacket edges */}
              <line x1="50" y1="64" x2="52" y2="105" stroke="rgba(0,0,0,0.32)" strokeWidth="2" />
              <line x1="70" y1="64" x2="68" y2="105" stroke="rgba(0,0,0,0.28)" strokeWidth="2" />
              {/* 3D Jacket Lapels & Zipper Track */}
              <path d="M 43,63 L 50,63 L 51,82 L 45,76 Z" fill={profile.topColors.light} opacity="0.45" />
              <path d="M 77,63 L 70,63 L 69,82 L 75,76 Z" fill={profile.topColors.dark} opacity="0.55" />
            </>
          )}

          {profile.outfit === "hoodie" && (
            <>
              {/* 3D Puffy Hoodie Collar Cushion */}
              <path
                d="M 42,63 C 46,70 74,70 78,63 C 75,59 45,59 42,63 Z"
                fill={profile.topColors.mid}
              />
              <path
                d="M 44,64 C 50,69 70,69 76,64"
                stroke="rgba(0,0,0,0.25)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* 3D Hoodie Drawstrings with Aglets */}
              <path d="M 54,67 Q 53,76 54,82" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 66,67 Q 67,76 66,82" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="54" cy="82.5" r="1.3" fill="#94A3B8" />
              <circle cx="66" cy="82.5" r="1.3" fill="#94A3B8" />
              {/* 3D Kangaroo Front Pocket Bevel */}
              <path
                d="M 45,89 L 75,89 L 77,102 L 43,102 Z"
                fill="rgba(0,0,0,0.14)"
              />
              <path d="M 45,89 L 75,89" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
            </>
          )}

          {profile.outfit === "staff-uniform" && (
            <>
              {/* 3D Crisp Shirt Collar */}
              <polygon points="48,61 60,68 53,73 45,64" fill={profile.topColors.light} />
              <polygon points="72,61 60,68 67,73 75,64" fill={profile.topColors.light} />
              {/* Button Placket */}
              <line x1="60" y1="68" x2="60" y2="105" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
              {/* 3D Swinging Staff ID Lanyard & Badge */}
              <path d="M 51,63 L 60,82 L 69,63" stroke="#FACC15" strokeWidth="1.8" fill="none" />
              <rect x="55" y="81" width="10" height="13" rx="2" fill="#FFFFFF" />
              <rect x="56.5" y="83" width="7" height="4.5" rx="1" fill="#3B82F6" />
              <line x1="56.5" y1="90" x2="63.5" y2="90" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="56.5" y1="92" x2="61.5" y2="92" stroke="#CBD5E1" strokeWidth="1" />
            </>
          )}

          {profile.outfit === "teacher-formal" && (
            <>
              {/* White Inner Dress Collar & 3D Silk Tie */}
              <polygon points="50,61 60,69 70,61" fill="#FFFFFF" />
              <polygon points="57,67 63,67 64,92 60,97 56,92" fill="#1E293B" />
              <polygon points="58,68 61,68 61.5,88 58.5,88" fill="rgba(255,255,255,0.16)" />
              {/* Subtle Batik / Pocket Square Accent */}
              <rect x="66" y="75" width="9" height="2" rx="1" fill="#FBBF24" opacity="0.85" />
            </>
          )}

          {(profile.outfit === "kid-uniform-vest" || profile.outfit === "senior-vest") && (
            <>
              {/* White V-Neck Collar & Red SD/Senior Tie */}
              <polygon points="48,62 60,79 72,62" fill="#FFFFFF" />
              <polygon points="57.5,65 62.5,65 63.5,80 60,84 56.5,80" fill="#B91C1C" />
              {/* V-Neck Ribbed Trim */}
              <path d="M 48,62 L 60,79 L 72,62" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" fill="none" />
            </>
          )}

          {profile.outfit === "kid-girl-cardigan" && (
            <>
              {/* White Rounded Peter-Pan Collar & Cute Ribbon */}
              <path d="M 48,62 Q 54,70 60,66 Q 66,70 72,62" fill="#FFFFFF" />
              <path d="M 56,67 L 64,67 L 62,74 L 58,74 Z" fill="#E11D48" />
              {/* Cardigan Center Seam & 3D Buttons */}
              <line x1="60" y1="72" x2="60" y2="104" stroke="rgba(0,0,0,0.2)" strokeWidth="1.8" />
              <circle cx="60" cy="80" r="1.6" fill="#FEF3C7" />
              <circle cx="60" cy="88" r="1.6" fill="#FEF3C7" />
              <circle cx="60" cy="96" r="1.6" fill="#FEF3C7" />
            </>
          )}

          {profile.outfit === "apron-shop" && (
            <>
              {/* 3D Shopkeeper Apron over Shirt */}
              <path d="M 51,63 L 51,73 M 69,63 L 69,73" stroke="#FEF3C7" strokeWidth="2.5" />
              <path
                d="M 45,72 L 75,72 L 77,106 L 43,106 Z"
                fill={`url(#${uid}-inner)`}
              />
              <rect x="49" y="86" width="22" height="11" rx="2.5" fill="rgba(0,0,0,0.16)" />
            </>
          )}

          {profile.outfit === "polo-guest" && (
            <>
              {/* 3D Polo Collar & Placket */}
              <polygon points="48,61 60,68 53,72 45,64" fill={profile.topColors.light} />
              <polygon points="72,61 60,68 67,72 75,64" fill={profile.topColors.light} />
              <rect x="58" y="67" width="4" height="15" rx="1.5" fill="rgba(0,0,0,0.2)" />
              <circle cx="60" cy="71" r="1.1" fill="#F8FAFC" />
              <circle cx="60" cy="76" r="1.1" fill="#F8FAFC" />
            </>
          )}
        </g>

        {/* --- 3D CYLINDRICAL NECK & JAW CAST SHADOW --- */}
        <rect x="52.5" y="52" width="15" height="14" rx="6" fill={`url(#${uid}-skinCyl)`} />
        {/* Chin Ambient Occlusion Shadow on Neck */}
        <ellipse cx="60" cy="57" rx="7.5" ry="4" fill="rgba(67,29,18,0.32)" />

        {/* ================= 3D SCULPTED HUMAN HEAD (ANIMATED TILT & BLINK) ================= */}
        <g className="animate-npc3d-head" style={{ animationDelay: animDelay }}>
          {/* Back Hair Layer for Bob / Wavy Styles */}
          {profile.hairStyle === "bob-girl" && (
            <path
              d="M 31,36 C 30,16 44,9 60,9 C 76,9 90,16 89,36 C 89,50 86,59 78,61 L 42,61 C 34,59 31,50 31,36 Z"
              fill={`url(#${uid}-hair)`}
            />
          )}

          {/* 3D Sculpted Human Ears with Inner Concha Depth */}
          <g>
            <ellipse cx="35.5" cy="39" rx="4.6" ry="6.2" fill={`url(#${uid}-skin)`} />
            <ellipse cx="36.2" cy="39.2" rx="2.2" ry="3.5" fill={profile.skin.deep} opacity="0.5" />
            <ellipse cx="84.5" cy="39" rx="4.6" ry="6.2" fill={`url(#${uid}-skin)`} />
            <ellipse cx="83.8" cy="39.2" rx="2.2" ry="3.5" fill={profile.skin.deep} opacity="0.5" />
          </g>

          {/* 3D Sculpted Human Cranium, Cheekbones & Tapered Chin */}
          <path
            d="M 36,33 C 36,16.5 46,11 60,11 C 74,11 84,16.5 84,33 C 84,44.5 79.5,52.5 71.5,56.5 C 66.5,59 63.5,60 60,60 C 56.5,60 53.5,59 48.5,56.5 C 40.5,52.5 36,44.5 36,33 Z"
            fill={`url(#${uid}-skin)`}
          />
          {/* Subtle 3D Rim Light along Right Cheek Contour */}
          <path
            d="M 82.8,31 C 83,42 78.5,50.5 70.5,55"
            stroke="rgba(255,255,255,0.38)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Subtle Stubble Shadow on Jaw for Suspicious Adult Males */}
          {profile.stubble && (
            <path
              d="M 40,44 C 42,54 52,59.5 60,59.5 C 68,59.5 78,54 80,44 C 77,50 69,54.5 60,54.5 C 51,54.5 43,50 40,44 Z"
              fill="#334155"
              opacity="0.18"
            />
          )}

          {/* Soft Subsurface Cheek Blush */}
          <ellipse cx="44.5" cy="44" rx="6" ry="3.8" fill={`url(#${uid}-blush)`} />
          <ellipse cx="75.5" cy="44" rx="6" ry="3.8" fill={`url(#${uid}-blush)`} />

          {/* --- 3D GLOSSY HUMAN EYES WITH SPHERICAL DEPTH & BLINK --- */}
          {/* Eye Socket Soft Shading */}
          <ellipse cx="49.5" cy="36.5" rx="6.5" ry="5.5" fill={profile.skin.deep} opacity="0.22" />
          <ellipse cx="70.5" cy="36.5" rx="6.5" ry="5.5" fill={profile.skin.deep} opacity="0.22" />

          {/* Left Eye */}
          <g>
            <ellipse cx="49.5" cy="37" rx="5.6" ry="4.8" fill={`url(#${uid}-sclera)`} />
            <circle cx={showSuspiciousLook ? "50.3" : "49.8"} cy="37.2" r="3.4" fill={`url(#${uid}-iris)`} />
            <circle cx={showSuspiciousLook ? "50.3" : "49.8"} cy="37.2" r="1.6" fill="#050505" />
            {/* Dual 3D Studio Catchlights */}
            <circle cx="48.2" cy="35.6" r="1.35" fill="#FFFFFF" opacity="0.96" />
            <circle cx="51.2" cy="38.6" r="0.65" fill="#FFFFFF" opacity="0.65" />
            {/* Animated 3D Blink Eyelid */}
            <ellipse
              cx="49.5"
              cy="37"
              rx="5.9"
              ry="5.1"
              fill={profile.skin.mid}
              className="animate-npc3d-blink"
              style={{ animationDelay: animDelay }}
            />
            {/* Upper 3D Lash Crease */}
            <path
              d="M 43.8,36.2 C 45.5,32.2 53.5,32.2 55.2,36.2"
              stroke="#24150E"
              strokeWidth={profile.gender === "female" ? "2.1" : "1.6"}
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Right Eye */}
          <g>
            <ellipse cx="70.5" cy="37" rx="5.6" ry="4.8" fill={`url(#${uid}-sclera)`} />
            <circle cx={showSuspiciousLook ? "71.1" : "70.2"} cy="37.2" r="3.4" fill={`url(#${uid}-iris)`} />
            <circle cx={showSuspiciousLook ? "71.1" : "70.2"} cy="37.2" r="1.6" fill="#050505" />
            {/* Dual 3D Studio Catchlights */}
            <circle cx="69" cy="35.6" r="1.35" fill="#FFFFFF" opacity="0.96" />
            <circle cx="72" cy="38.6" r="0.65" fill="#FFFFFF" opacity="0.65" />
            {/* Animated 3D Blink Eyelid */}
            <ellipse
              cx="70.5"
              cy="37"
              rx="5.9"
              ry="5.1"
              fill={profile.skin.mid}
              className="animate-npc3d-blink"
              style={{ animationDelay: animDelay }}
            />
            {/* Upper 3D Lash Crease */}
            <path
              d="M 64.8,36.2 C 66.5,32.2 74.5,32.2 76.2,36.2"
              stroke="#24150E"
              strokeWidth={profile.gender === "female" ? "2.1" : "1.6"}
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* --- OPTIONAL 3D EYEGLASSES OR SUNGLASSES --- */}
          {profile.glasses === "clear" && (
            <g>
              <rect
                x="42"
                y="32"
                width="15"
                height="10"
                rx="3.2"
                fill="rgba(224,242,254,0.22)"
                stroke="#1E293B"
                strokeWidth="1.6"
              />
              <rect
                x="63"
                y="32"
                width="15"
                height="10"
                rx="3.2"
                fill="rgba(224,242,254,0.22)"
                stroke="#1E293B"
                strokeWidth="1.6"
              />
              <line x1="57" y1="36" x2="63" y2="36" stroke="#1E293B" strokeWidth="1.6" />
              {/* 3D Lens Sheen */}
              <line x1="44.5" y1="34" x2="48.5" y2="39.5" stroke="white" strokeWidth="1.2" opacity="0.65" strokeLinecap="round" />
              <line x1="65.5" y1="34" x2="69.5" y2="39.5" stroke="white" strokeWidth="1.2" opacity="0.65" strokeLinecap="round" />
            </g>
          )}

          {profile.glasses === "sunglasses" && (
            <g>
              <rect x="41.5" y="32" width="16" height="10" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="1.4" />
              <rect x="62.5" y="32" width="16" height="10" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="1.4" />
              <line x1="57.5" y1="35.5" x2="62.5" y2="35.5" stroke="#334155" strokeWidth="1.8" />
              <path d="M 43.5,34 L 51,34 L 46,40 Z" fill="white" opacity="0.28" />
              <path d="M 64.5,34 L 72,34 L 67,40 Z" fill="white" opacity="0.28" />
            </g>
          )}

          {/* --- 3D VOLUMETRIC EYEBROWS --- */}
          {showSuspiciousLook ? (
            <>
              <path
                d="M 43,29.5 Q 49,30.8 55,32.5"
                stroke={profile.hairColors.dark}
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 65,31.8 Q 71,28.2 77,29.8"
                stroke={profile.hairColors.dark}
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              <path
                d="M 43.5,30.5 Q 49.5,28 55,30.2"
                stroke={profile.hairColors.dark}
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 65,30.2 Q 70.5,28 76.5,30.5"
                stroke={profile.hairColors.dark}
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}

          {/* --- 3D SCULPTED HUMAN NOSE WITH SPECULAR TIP & NOSTRIL OCCLUSION --- */}
          <g>
            {/* Subtle Nose Bridge Side Contour */}
            <path
              d="M 61.5,36.5 Q 63,40.5 62.5,43"
              stroke={profile.skin.deep}
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.45"
              fill="none"
            />
            {/* Soft Nostril Base Shadow */}
            <ellipse cx="60" cy="44.8" rx="3.8" ry="1.6" fill={profile.skin.deep} opacity="0.45" />
            {/* Rounded 3D Nose Tip Bulb */}
            <ellipse cx="60" cy="43.3" rx="3.3" ry="2.3" fill={profile.skin.mid} />
            {/* Pinpoint 3D Nose Tip Highlight */}
            <ellipse cx="59.1" cy="42.6" rx="1.4" ry="0.9" fill="#FFFFFF" opacity="0.62" />
          </g>

          {/* --- 3D SCULPTED MOUTH & LIPS --- */}
          {showSternMouth ? (
            <g>
              {/* Assertive 3D Furrowed / Scowl Mouth */}
              <path
                d="M 53.5,51.5 Q 60,48.8 66.5,51.8"
                stroke="#7F1D1D"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 56,53.2 Q 60,52.4 64,53.2"
                stroke={profile.skin.deep}
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.45"
              />
            </g>
          ) : showSlySmirk ? (
            <g>
              {/* Sneaky Asymmetric 3D Smirk */}
              <path
                d="M 53,50.5 Q 60,53.8 68,48.2"
                stroke="#881337"
                strokeWidth="2.1"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 55.5,52.8 Q 61,54.8 65.5,51.8"
                stroke={profile.skin.lip}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.65"
                fill="none"
              />
            </g>
          ) : (
            <g>
              {/* Warm 3D Cushioned Human Smile with Upper Teeth */}
              <path
                d="M 52.5,49 C 55,54.5 65,54.5 67.5,49 Z"
                fill="#881337"
              />
              <path
                d="M 53.8,49.3 C 57,50.8 63,50.8 66.2,49.3 Z"
                fill="#FFFFFF"
              />
              <path
                d="M 54,52.8 Q 60,55.2 66,52.8"
                stroke={profile.skin.lip}
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.7"
                fill="none"
              />
            </g>
          )}

          {/* --- 3D VOLUMETRIC HAIR OR CAP --- */}
          {profile.hairStyle === "cap" ? (
            <g>
              {/* Forehead Cast Shadow under Cap Visor */}
              <path
                d="M 37,26 Q 60,21 83,26 L 83,30 Q 60,25 37,30 Z"
                fill="rgba(15,23,42,0.28)"
              />
              {/* Side Hair Temples peeking beneath Cap */}
              <path d="M 35.5,26 L 38,36 L 35,34 Z" fill={profile.hairColors.dark} />
              <path d="M 84.5,26 L 82,36 L 85,34 Z" fill={profile.hairColors.dark} />
              {/* 3D Domed Cap Crown */}
              <path
                d="M 35,26 C 35,11 46,6.5 60,6.5 C 74,6.5 85,11 85,26 Z"
                fill={`url(#${uid}-cap)`}
              />
              {/* Cap Seam & Top Button */}
              <path d="M 60,6.5 Q 53,15 51,25" stroke="rgba(255,255,255,0.18)" strokeWidth="1.1" fill="none" />
              <path d="M 60,6.5 Q 67,15 69,25" stroke="rgba(0,0,0,0.22)" strokeWidth="1.1" fill="none" />
              <ellipse cx="60" cy="6.5" rx="2.6" ry="1.4" fill={capPalette.deep} />
              {/* Curved 3D Cap Brim / Visor */}
              <path
                d="M 33,25.5 Q 60,18.5 88,25.5 C 86,29 62,24.5 33,27.5 Z"
                fill={capPalette.deep}
              />
              <path
                d="M 35,25 Q 60,19.5 86,25"
                stroke={capPalette.light}
                strokeWidth="1.3"
                opacity="0.55"
                fill="none"
              />
            </g>
          ) : profile.hairStyle === "spiky-kid" ? (
            <g>
              <path
                d="M 35,33 C 33,23 37,15 43,12 L 41,7 L 50,10 L 56,4.5 L 63,9.5 L 71,5.5 L 74,11.5 C 82,15 86,23 85,33 C 82,25 76,22 70,23 C 65,20 55,20 48,23 C 42,22 37,26 35,33 Z"
                fill={`url(#${uid}-hair)`}
              />
              {/* 3D Anisotropic Hair Specular Sheen */}
              <path
                d="M 44,15 Q 58,11 73,16"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : profile.hairStyle === "bob-girl" ? (
            <g>
              <path
                d="M 34,34 C 34,15 45,8.5 60,8.5 C 75,8.5 86,15 86,34 C 82,25 75,22 66,22 C 62,25 53,25 46,22 C 39,23 36,27 34,34 Z"
                fill={`url(#${uid}-hair)`}
              />
              {/* Glossy Hair Crown Ribbon Highlight */}
              <path
                d="M 43,16 Q 60,11.5 76,16.5"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Cute 3D Glossy Hair Barrette */}
              <rect x="71" y="21" width="7.5" height="3.2" rx="1.6" fill="#FBBF24" transform="rotate(14 71 21)" />
            </g>
          ) : profile.hairStyle === "undercut" ? (
            <g>
              {/* Shaved Temple Fade */}
              <path d="M 35.5,32 C 35,23 38,18 42,16 L 40,29 Z" fill={profile.hairColors.dark} opacity="0.55" />
              <path d="M 84.5,32 C 85,23 82,18 78,16 L 80,29 Z" fill={profile.hairColors.dark} opacity="0.55" />
              {/* Swept Voluminous 3D Top Pompadour */}
              <path
                d="M 39,24 C 37,12 49,5.5 64,6.5 C 77,7.5 84,14 81,25 C 75,20 65,19 54,21 C 47,22 42,23 39,24 Z"
                fill={`url(#${uid}-hair)`}
              />
              <path
                d="M 45,13 Q 61,9.5 75,14"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : profile.hairStyle === "wavy-modern" ? (
            <g>
              <path
                d="M 34.5,34 C 32,20 42,8 60,8 C 78,8 88,20 85.5,34 C 83,26 78,22 71,22 C 66,25 56,25 50,21 C 43,22 37,26 34.5,34 Z"
                fill={`url(#${uid}-hair)`}
              />
              <path
                d="M 42,16 C 52,11 67,11 77,16"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : profile.hairStyle === "messy-teen" ? (
            <g>
              <path
                d="M 34.5,33 C 33,18 44,8.5 60,8.5 C 76,8.5 87,18 85.5,33 C 82,25 76,23 71,25 L 67,21 L 60,26 L 53,21 L 47,25 C 41,23 37,26 34.5,33 Z"
                fill={`url(#${uid}-hair)`}
              />
              <path
                d="M 43,15.5 Q 60,11 76,15.5"
                stroke="rgba(255,255,255,0.24)"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : (
            /* Default: Neat 3D Side-Parted Adult Hair ("short-parted") */
            <g>
              <path
                d="M 35,34 C 33.5,18 43.5,8.5 60,8.5 C 76.5,8.5 86.5,18 85,34 C 83,25 78,21 71,21 C 63,22 54,23 47,19.5 C 42,22 37,26 35,34 Z"
                fill={`url(#${uid}-hair)`}
              />
              {/* Side Part Line & Specular Crown Highlight */}
              <path d="M 47,13 L 48,20" stroke="rgba(0,0,0,0.35)" strokeWidth="1.4" strokeLinecap="round" />
              <path
                d="M 50,14.5 Q 64,11.5 76,16"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}
        </g>

        {/* --- RIGHT ARM (ACTIVE GESTURING / 3D PROP-HOLDING ARM) --- */}
        <g
          className={
            waveWithRightArm
              ? "animate-npc3d-wave-callout-r"
              : profile.prop === "beckon"
              ? "animate-npc3d-arm-wave"
              : "animate-npc3d-arm-prop"
          }
          style={{
            transformOrigin: "82px 70px",
            animationDelay: waveWithRightArm ? "0s" : animDelay,
          }}
        >
          {waveWithRightArm || profile.prop === "beckon" ? (
            /* Raised Waving / Beckoning 3D Human Arm */
            <g>
              <path
                d="M 81,67 C 89,66 96,60 99,50 C 100.5,46 93,44 91,48 C 88,56 84,61 79,64 Z"
                fill={profile.outfit === "kid-sporty" ? `url(#${uid}-skinCyl)` : `url(#${uid}-top)`}
              />
              {/* 3D Open Waving Hand & Fingers */}
              <circle cx="96" cy="46.5" r="5.5" fill={`url(#${uid}-skin)`} />
              <path
                d="M 93,42 L 92,38.5 M 96,41.2 L 96.5,37.5 M 99,42.2 L 100.5,39"
                stroke={profile.skin.mid}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          ) : profile.prop === "none" ? (
            /* Assertive Bent Arm on Hip (Senior / Stern) */
            <g>
              <path
                d="M 81,67 L 95,80 L 84,93 L 79,88 L 86,80 L 79,73 Z"
                fill={`url(#${uid}-top)`}
              />
              <circle cx="81" cy="91.5" r="5" fill={`url(#${uid}-skin)`} />
            </g>
          ) : (
            /* Forward Bent 3D Arm Presenting Story Prop */
            <g>
              <path
                d="M 81,68 C 89,71 94,79 92,88 C 91,92 83,91 83,86 C 84,80 82,75 79,73 Z"
                fill={`url(#${uid}-top)`}
              />
              {/* 3D Hand Holding Prop */}
              <circle cx="88.5" cy="87.5" r="5.2" fill={`url(#${uid}-skin)`} />

              {/* === STORY-ACCURATE 3D PROPS === */}
              {profile.prop === "gift" && (
                <g transform="translate(79, 70)">
                  {/* 3D Gift Box Cube */}
                  <rect x="0" y="5" width="18" height="15" rx="2" fill="#E11D48" />
                  <rect x="0" y="5" width="9" height="15" rx="1.5" fill="#F43F5E" />
                  {/* Overhanging Lid */}
                  <rect x="-1.5" y="2" width="21" height="4.5" rx="1.2" fill="#BE123C" />
                  {/* Gold 3D Ribbon & Bow */}
                  <rect x="7.5" y="2" width="3" height="18" fill="#FBBF24" />
                  <rect x="0" y="10.5" width="18" height="2.8" fill="#FBBF24" />
                  <ellipse cx="6.5" cy="1.2" rx="3.5" ry="2" fill="#FDE047" transform="rotate(-18 6.5 1.2)" />
                  <ellipse cx="11.5" cy="1.2" rx="3.5" ry="2" fill="#F59E0B" transform="rotate(18 11.5 1.2)" />
                </g>
              )}

              {profile.prop === "phone" && (
                <g transform="translate(83, 69) rotate(-10)">
                  <rect x="0" y="0" width="12" height="20" rx="2.5" fill="#0F172A" stroke="#475569" strokeWidth="1" />
                  <rect x="1.3" y="2" width="9.4" height="15.5" rx="1.2" fill={`url(#${uid}-screenGlow)`} />
                  {/* Chat Notification Bubble */}
                  <rect x="2.5" y="5" width="7" height="3" rx="1" fill="#FFFFFF" opacity="0.9" />
                  <rect x="2.5" y="9.5" width="5" height="2.5" rx="1" fill="#FDE047" opacity="0.9" />
                </g>
              )}

              {profile.prop === "tablet" && (
                <g transform="translate(77, 68) rotate(-6)">
                  <rect x="0" y="0" width="19" height="23" rx="3" fill="#1E293B" stroke="#64748B" strokeWidth="1.2" />
                  <rect x="1.8" y="2.2" width="15.4" height="18.6" rx="1.5" fill={`url(#${uid}-screenGlow)`} />
                  <circle cx="9.5" cy="9" r="3" fill="#FFFFFF" opacity="0.85" />
                  <path d="M 5,16 C 5,13.5 14,13.5 14,16" fill="#FFFFFF" opacity="0.85" />
                </g>
              )}

              {profile.prop === "laptop" && (
                <g transform="translate(70, 69)">
                  {/* 3D Open Laptop Screen & Base */}
                  <polygon points="4,0 24,0 22,14 2,14" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
                  <polygon points="5.5,1.8 22.5,1.8 20.8,12.5 3.8,12.5" fill={`url(#${uid}-screenGlow)`} />
                  <polygon points="0,14 22,14 26,18 4,18" fill="#CBD5E1" />
                  <circle cx="13" cy="7" r="2.2" fill="#FDE047" />
                </g>
              )}

              {profile.prop === "camera" && (
                <g transform="translate(76, 73)">
                  <rect x="0" y="3" width="19" height="13" rx="2.5" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                  <rect x="5" y="0.5" width="6" height="3" rx="1" fill="#334155" />
                  {/* 3D Protruding Glass Lens */}
                  <circle cx="10" cy="9.5" r="5" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.3" />
                  <circle cx="10" cy="9.5" r="3" fill="#38BDF8" opacity="0.65" />
                  <circle cx="8.8" cy="8.3" r="1.1" fill="#FFFFFF" />
                  {/* Red Recording Dot */}
                  <circle cx="16" cy="5.5" r="1.2" fill="#EF4444" />
                </g>
              )}

              {profile.prop === "icecream" && (
                <g transform="translate(83, 64)">
                  {/* 3D Waffle Cone */}
                  <polygon points="2,13 12,13 7,26" fill="#D97706" />
                  <polygon points="2,13 7,13 7,26" fill="#F59E0B" />
                  {/* Double 3D Ice Cream Scoops */}
                  <circle cx="7" cy="11" r="5.2" fill="#FEF3C7" />
                  <circle cx="7" cy="5.5" r="4.8" fill="#F472B6" />
                  <circle cx="5.5" cy="4" r="1.4" fill="#FFFFFF" opacity="0.7" />
                </g>
              )}

              {profile.prop === "keys" && (
                <g transform="translate(84, 83)">
                  <circle cx="5" cy="5" r="3.8" stroke="#FBBF24" strokeWidth="1.6" fill="none" />
                  <rect x="2" y="8" width="6" height="9" rx="2" fill="#0F172A" stroke="#64748B" strokeWidth="0.9" />
                  <circle cx="5" cy="11.5" r="1.1" fill="#EF4444" />
                  <path d="M 8,6 L 14,12 L 12,13.5" stroke="#E2E8F0" strokeWidth="1.6" strokeLinecap="round" />
                </g>
              )}

              {profile.prop === "clipboard" && (
                <g transform="translate(77, 71) rotate(6)">
                  <rect x="0" y="0" width="16" height="21" rx="2" fill="#92400E" />
                  <rect x="2" y="3" width="12" height="16" rx="1" fill="#FFFFFF" />
                  <rect x="5" y="0" width="6" height="3" rx="1" fill="#94A3B8" />
                  <line x1="4" y1="7" x2="12" y2="7" stroke="#94A3B8" strokeWidth="1.2" />
                  <line x1="4" y1="10.5" x2="12" y2="10.5" stroke="#CBD5E1" strokeWidth="1.2" />
                  <line x1="4" y1="14" x2="10" y2="14" stroke="#CBD5E1" strokeWidth="1.2" />
                </g>
              )}

              {profile.prop === "remote" && (
                <g transform="translate(83, 71) rotate(-18)">
                  <rect x="0" y="0" width="9" height="18" rx="2.5" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                  <circle cx="4.5" cy="3.5" r="1.5" fill="#EF4444" />
                  <circle cx="3" cy="7.5" r="1" fill="#94A3B8" />
                  <circle cx="6" cy="7.5" r="1" fill="#94A3B8" />
                  <circle cx="4.5" cy="11" r="1.4" fill="#38BDF8" />
                </g>
              )}
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
