/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useId } from "react";

export type StudentCharacterId = "budi" | "ani" | "citra" | string;
export type StudentVariant = "map" | "showcase" | "card" | "celebrate" | "hud";
export type StudentDirection = "up" | "down" | "left" | "right";

interface Student3DCharacterProps {
  characterId: StudentCharacterId;
  variant?: StudentVariant;
  isWalking?: boolean;
  direction?: StudentDirection;
  waving?: boolean;
  waveSide?: "left" | "right";
  withBackpack?: boolean;
  className?: string;
}

interface StudentPalette {
  id: "budi" | "ani" | "citra";
  skinHi: string;
  skinMid: string;
  skinSub: string;
  skinDeep: string;
  lipColor: string;
  bagLight: string;
  bagMid: string;
  bagDark: string;
  bagAccent: string;
  bottleColor: string;
  irisLight: string;
  irisDark: string;
  animDelay: string;
}

function getStudentPalette(characterId: string): StudentPalette {
  if (characterId === "ani") {
    return {
      id: "ani",
      skinHi: "#FFF6EE",
      skinMid: "#FAD2B8",
      skinSub: "#E2A181",
      skinDeep: "#BC7959",
      lipColor: "#D96B66",
      bagLight: "#F472B6",
      bagMid: "#DB2777",
      bagDark: "#9D174D",
      bagAccent: "#FDE047",
      bottleColor: "#34D399",
      irisLight: "#6D4C3D",
      irisDark: "#24140E",
      animDelay: "-0.9s",
    };
  }
  if (characterId === "citra") {
    return {
      id: "citra",
      skinHi: "#FFF5EC",
      skinMid: "#F8CEB4",
      skinSub: "#DF9C7B",
      skinDeep: "#B87556",
      lipColor: "#DC6868",
      bagLight: "#FBBF24",
      bagMid: "#EA580C",
      bagDark: "#9A3412",
      bagAccent: "#38BDF8",
      bottleColor: "#F472B6",
      irisLight: "#5B3E75",
      irisDark: "#211331",
      animDelay: "-1.8s",
    };
  }
  return {
    id: "budi",
    skinHi: "#FDF0E2",
    skinMid: "#F3C3A1",
    skinSub: "#D8936D",
    skinDeep: "#AF6C49",
    lipColor: "#CC665E",
    bagLight: "#3B82F6",
    bagMid: "#1D4ED8",
    bagDark: "#1E3A8A",
    bagAccent: "#FACC15",
    bottleColor: "#38BDF8",
    irisLight: "#5C3D2E",
    irisDark: "#22130C",
    animDelay: "-0.2s",
  };
}

export default function Student3DCharacter({
  characterId,
  variant = "map",
  isWalking = false,
  direction = "down",
  waving = false,
  waveSide,
  withBackpack = true,
  className = "",
}: Student3DCharacterProps) {
  const rawUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const uid = `kid3d-${characterId}-${rawUid}`;
  const pal = getStudentPalette(characterId);

  const isBackView = variant === "map" && direction === "up";
  const turnX =
    variant === "map"
      ? direction === "left"
        ? -3.8
        : direction === "right"
        ? 3.8
        : 0
      : 0;

  const isCelebrating = variant === "celebrate";
  const effectiveWaveSide: "left" | "right" | null = isCelebrating
    ? null
    : waving
    ? waveSide ?? (pal.id === "citra" ? "left" : "right")
    : null;

  const sizeClasses =
    variant === "hud"
      ? "w-full h-full"
      : variant === "map"
      ? "w-[48px] h-[64px] sm:w-[56px] sm:h-[74px]"
      : variant === "showcase"
      ? "w-[68px] h-[92px] sm:w-[82px] sm:h-[110px]"
      : variant === "celebrate"
      ? "w-[60px] h-[80px] sm:w-[68px] sm:h-[90px]"
      : "w-[48px] h-[64px] sm:w-[54px] sm:h-[72px]";

  const viewBox = variant === "hud" ? "24 6 72 72" : "0 0 120 156";

  const bodyMotionClass =
    variant === "hud"
      ? ""
      : isWalking
      ? "animate-kid3d-walk-bob"
      : "animate-kid3d-breathe";

  const headMotionClass =
    variant === "hud" || isWalking ? "" : "animate-kid3d-head";

  const leftLegClass = isWalking ? "animate-kid3d-leg-l" : "";
  const rightLegClass = isWalking ? "animate-kid3d-leg-r" : "";

  const leftArmClass = isCelebrating
    ? "animate-kid3d-cheer-l"
    : effectiveWaveSide === "left"
    ? "animate-kid3d-wave"
    : isWalking
    ? "animate-kid3d-arm-l"
    : "";

  const rightArmClass = isCelebrating
    ? "animate-kid3d-cheer-r"
    : effectiveWaveSide === "right"
    ? "animate-kid3d-wave"
    : isWalking
    ? "animate-kid3d-arm-r"
    : "";

  return (
    <svg
      viewBox={viewBox}
      className={`${sizeClasses} overflow-visible select-none drop-shadow-[0_6px_8px_rgba(15,23,42,0.3)] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* 3D Subsurface Child Skin */}
        <radialGradient id={`${uid}-skin`} cx="36%" cy="28%" r="68%">
          <stop offset="0%" stopColor={pal.skinHi} />
          <stop offset="44%" stopColor={pal.skinMid} />
          <stop offset="82%" stopColor={pal.skinSub} />
          <stop offset="100%" stopColor={pal.skinDeep} />
        </radialGradient>

        {/* Soft Neck / Limb Cylindrical Skin */}
        <linearGradient id={`${uid}-limbSkin`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={pal.skinHi} />
          <stop offset="52%" stopColor={pal.skinMid} />
          <stop offset="100%" stopColor={pal.skinSub} />
        </linearGradient>

        {/* Rosy 3D Subsurface Cheek Blush */}
        <radialGradient id={`${uid}-blush`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FB7185" stopOpacity="0.52" />
          <stop offset="65%" stopColor="#F43F5E" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
        </radialGradient>

        {/* 3D Spherical Eye Sclera */}
        <linearGradient id={`${uid}-sclera`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="28%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>

        {/* 3D Eye Iris */}
        <radialGradient id={`${uid}-iris`} cx="42%" cy="36%" r="62%">
          <stop offset="0%" stopColor={pal.irisLight} />
          <stop offset="68%" stopColor={pal.irisDark} />
          <stop offset="100%" stopColor="#090D16" />
        </radialGradient>

        {/* Volumetric White SD Uniform Shirt */}
        <linearGradient id={`${uid}-shirt`} x1="14%" y1="6%" x2="88%" y2="94%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="48%" stopColor="#F8FAFC" />
          <stop offset="82%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Crisp Collar / Sleeve 3D Cylinder */}
        <linearGradient id={`${uid}-sleeve`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Volumetric White Hijab Outer Drape */}
        <radialGradient id={`${uid}-hijab`} cx="35%" cy="22%" r="75%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="52%" stopColor="#F8FAFC" />
          <stop offset="84%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </radialGradient>

        {/* Hijab Chest Fold Gradient */}
        <linearGradient id={`${uid}-hijabDrape`} x1="18%" y1="0%" x2="86%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="56%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Volumetric Red SD Uniform (Rok / Celana Merah Hati SD) */}
        <linearGradient id={`${uid}-sdRed`} x1="12%" y1="0%" x2="90%" y2="96%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="42%" stopColor="#DC2626" />
          <stop offset="82%" stopColor="#991B1B" />
          <stop offset="100%" stopColor="#691111" />
        </linearGradient>

        {/* Darker Red Pleat Shadow */}
        <linearGradient id={`${uid}-sdRedDark`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#991B1B" />
          <stop offset="100%" stopColor="#580D0D" />
        </linearGradient>

        {/* 3D Silk Red SD Tie */}
        <linearGradient id={`${uid}-tie`} x1="18%" y1="0%" x2="86%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="38%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>

        {/* Budi Volumetric Chestnut-Espresso Hair */}
        <radialGradient id={`${uid}-budiHair`} cx="35%" cy="20%" r="74%">
          <stop offset="0%" stopColor="#7C5343" />
          <stop offset="42%" stopColor="#4A302A" />
          <stop offset="84%" stopColor="#2B1915" />
          <stop offset="100%" stopColor="#180D0A" />
        </radialGradient>

        {/* Citra Volumetric Glossy Dark Hair */}
        <radialGradient id={`${uid}-citraHair`} cx="35%" cy="20%" r="74%">
          <stop offset="0%" stopColor="#554370" />
          <stop offset="44%" stopColor="#2B213B" />
          <stop offset="84%" stopColor="#191224" />
          <stop offset="100%" stopColor="#0E0916" />
        </radialGradient>

        {/* Citra 3D Golden Hair Beads & Buckle */}
        <radialGradient id={`${uid}-goldBead`} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="38%" stopColor="#FACC15" />
          <stop offset="78%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>

        {/* 3D School Backpack Body */}
        <linearGradient id={`${uid}-bag`} x1="14%" y1="5%" x2="88%" y2="95%">
          <stop offset="0%" stopColor={pal.bagLight} />
          <stop offset="52%" stopColor={pal.bagMid} />
          <stop offset="100%" stopColor={pal.bagDark} />
        </linearGradient>

        {/* 3D School Shoe Upper */}
        <linearGradient id={`${uid}-shoe`} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="45%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#090D16" />
        </linearGradient>

        {/* Ground Ambient Occlusion Contact Shadow */}
        <radialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0F172A" stopOpacity="0.48" />
          <stop offset="65%" stopColor="#0F172A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground Contact 3D Shadow */}
      {variant !== "hud" && (
        <ellipse
          cx="60"
          cy="147"
          rx="27"
          ry="7.5"
          fill={`url(#${uid}-shadow)`}
          className={isWalking ? "" : "animate-npc3d-shadow"}
          style={{ animationDelay: pal.animDelay }}
        />
      )}

      {/* Main 3D Animated Kid Rig */}
      <g
        className={bodyMotionClass}
        style={!isWalking ? { animationDelay: pal.animDelay } : undefined}
      >
        {isBackView ? (
          /* ================= 3D BACK VIEW (WALKING UPWARD ON MAP) ================= */
          <g>
            {/* Left & Right 3D Legs (Back View) */}
            <g className={leftLegClass}>
              {pal.id === "budi" ? (
                <path
                  d="M 41,101 L 39,129 C 39,131 53,131 53,129 L 55,101 Z"
                  fill={`url(#${uid}-sdRed)`}
                />
              ) : (
                <rect
                  x="41"
                  y="113"
                  width="11"
                  height="16"
                  rx="5"
                  fill={`url(#${uid}-limbSkin)`}
                />
              )}
              <rect x="40.5" y="125" width="12" height="8" rx="3" fill="#FFFFFF" />
              <rect x="38.5" y="132" width="15.5" height="9" rx="4.5" fill={`url(#${uid}-shoe)`} />
              <rect x="38" y="138.5" width="16.5" height="3.2" rx="1.6" fill="#F8FAFC" />
            </g>

            <g className={rightLegClass}>
              {pal.id === "budi" ? (
                <path
                  d="M 65,101 L 67,129 C 67,131 81,131 81,129 L 79,101 Z"
                  fill={`url(#${uid}-sdRed)`}
                />
              ) : (
                <rect
                  x="68"
                  y="113"
                  width="11"
                  height="16"
                  rx="5"
                  fill={`url(#${uid}-limbSkin)`}
                />
              )}
              <rect x="67.5" y="125" width="12" height="8" rx="3" fill="#FFFFFF" />
              <rect x="66" y="132" width="15.5" height="9" rx="4.5" fill={`url(#${uid}-shoe)`} />
              <rect x="65.5" y="138.5" width="16.5" height="3.2" rx="1.6" fill="#F8FAFC" />
            </g>

            {/* Pleated Red Skirt from Behind for Ani & Citra */}
            {pal.id !== "budi" && (
              <g>
                <path
                  d={
                    pal.id === "ani"
                      ? "M 37,97 L 31,128 C 45,131 75,131 89,128 L 83,97 Z"
                      : "M 37,97 L 32,120 C 46,123 74,123 88,120 L 83,97 Z"
                  }
                  fill={`url(#${uid}-sdRed)`}
                />
                <path
                  d={
                    pal.id === "ani"
                      ? "M 47,98 L 44,129 M 60,98 L 60,130 M 73,98 L 76,129"
                      : "M 47,98 L 45,121 M 60,98 L 60,122 M 73,98 L 75,121"
                  }
                  stroke="#691111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </g>
            )}

            {/* Back Arms Swinging */}
            <g className={leftArmClass}>
              <path
                d="M 38,73 C 31,78 27,88 26,97"
                stroke={pal.id === "ani" ? `url(#${uid}-sleeve)` : `url(#${uid}-limbSkin)`}
                strokeWidth="9.5"
                strokeLinecap="round"
              />
              <path
                d="M 39,72 L 30,83"
                stroke={`url(#${uid}-sleeve)`}
                strokeWidth="11.5"
                strokeLinecap="round"
              />
              <circle cx="25.5" cy="99" r="5" fill={`url(#${uid}-skin)`} />
            </g>

            <g className={rightArmClass}>
              <path
                d="M 82,73 C 89,78 93,88 94,97"
                stroke={pal.id === "ani" ? `url(#${uid}-sleeve)` : `url(#${uid}-limbSkin)`}
                strokeWidth="9.5"
                strokeLinecap="round"
              />
              <path
                d="M 81,72 L 90,83"
                stroke={`url(#${uid}-sleeve)`}
                strokeWidth="11.5"
                strokeLinecap="round"
              />
              <circle cx="94.5" cy="99" r="5" fill={`url(#${uid}-skin)`} />
            </g>

            {/* White Shirt Back Base */}
            <path
              d="M 37,69 C 45,66 75,66 83,69 L 84,100 L 36,100 Z"
              fill={`url(#${uid}-shirt)`}
            />

            {/* Full 3D School Backpack (Tas Ransel Anak SD) - Worn Outdoors */}
            {withBackpack ? (
              <g>
                <path
                  d="M 53,67 C 53,60 67,60 67,67"
                  stroke={pal.bagDark}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Side Water Bottle */}
                <rect x="80" y="80" width="7.5" height="16" rx="3.5" fill={pal.bottleColor} />
                <rect x="81.5" y="77" width="4.5" height="4" rx="1.5" fill="#F8FAFC" />
                <rect x="79.5" y="87" width="8.5" height="9.5" rx="3" fill={pal.bagDark} opacity="0.78" />
                {/* Main 3D Rounded Backpack Shell */}
                <rect x="38" y="67" width="44" height="36" rx="12" fill={`url(#${uid}-bag)`} />
                {/* Top Flap Specular Highlight */}
                <path
                  d="M 41,77 C 41,69 79,69 79,77 L 79,82 C 66,85 54,85 41,82 Z"
                  fill="#FFFFFF"
                  opacity="0.2"
                />
                {/* Front Lower 3D Zipper Pocket */}
                <rect x="43" y="83" width="34" height="16" rx="6.5" fill={pal.bagDark} opacity="0.45" />
                {/* Reflective Safety Strip */}
                <rect x="47" y="88" width="26" height="3.5" rx="1.75" fill={pal.bagAccent} />
                {/* Cute Keychain Charm */}
                <circle cx="46" cy="85" r="2.6" fill="#FDE047" />
              </g>
            ) : (
              /* Clean 3D Back SD Shirt Pleat When Backpack is Taken Off Indoors */
              <g>
                <line x1="60" y1="70" x2="60" y2="98" stroke="#CBD5E1" strokeWidth="1.5" />
                <path d="M 42,73 Q 60,76 78,73" stroke="#E2E8F0" strokeWidth="1.6" fill="none" />
                {pal.id === "budi" && (
                  <rect x="37" y="96" width="46" height="4.2" rx="1.8" fill="#1E293B" />
                )}
              </g>
            )}

            {/* Back of 3D Head / Hair / Hijab */}
            <g>
              {pal.id === "ani" ? (
                <g>
                  <path
                    d="M 32,40 C 30,18 43,9 60,9 C 77,9 90,18 88,40 C 88,56 84,72 76,78 C 66,83 54,83 44,78 C 36,72 32,56 32,40 Z"
                    fill={`url(#${uid}-hijab)`}
                  />
                  <path
                    d="M 44,62 C 52,70 68,70 76,62"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              ) : pal.id === "citra" ? (
                <g>
                  <ellipse cx="34" cy="43" rx="4.5" ry="5.8" fill={`url(#${uid}-skin)`} />
                  <ellipse cx="86" cy="43" rx="4.5" ry="5.8" fill={`url(#${uid}-skin)`} />
                  <path
                    d="M 34,39 C 33,19 44,10 60,10 C 76,10 87,19 86,39 C 86,52 76,59 60,59 C 44,59 34,52 34,39 Z"
                    fill={`url(#${uid}-citraHair)`}
                  />
                  <path
                    d="M 60,13 L 60,56"
                    stroke="#4C3F63"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                  {/* Bouncy 3D Pigtails Left & Right */}
                  <g className="animate-kid3d-pigtail">
                    <path
                      d="M 35,44 C 21,42 14,52 18,63 C 21,69 30,66 35,55 Z"
                      fill={`url(#${uid}-citraHair)`}
                    />
                    <circle cx="30" cy="44.5" r="4.5" fill={`url(#${uid}-goldBead)`} />
                    <circle cx="34" cy="48.5" r="4" fill={`url(#${uid}-goldBead)`} />
                  </g>
                  <g className="animate-kid3d-pigtail">
                    <path
                      d="M 85,44 C 99,42 106,52 102,63 C 99,69 90,66 85,55 Z"
                      fill={`url(#${uid}-citraHair)`}
                    />
                    <circle cx="90" cy="44.5" r="4.5" fill={`url(#${uid}-goldBead)`} />
                    <circle cx="86" cy="48.5" r="4" fill={`url(#${uid}-goldBead)`} />
                  </g>
                </g>
              ) : (
                <g>
                  <ellipse cx="34" cy="43" rx="4.5" ry="5.8" fill={`url(#${uid}-skin)`} />
                  <ellipse cx="86" cy="43" rx="4.5" ry="5.8" fill={`url(#${uid}-skin)`} />
                  <rect x="52.5" y="55" width="15" height="13" rx="5.5" fill={`url(#${uid}-limbSkin)`} />
                  <path
                    d="M 34,41 C 31,20 42,10 60,10 C 78,10 89,20 86,41 C 85,52 77,58 60,58 C 43,58 35,52 34,41 Z"
                    fill={`url(#${uid}-budiHair)`}
                  />
                  <path
                    d="M 44,21 C 52,16 68,16 76,21"
                    stroke="#A1887F"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity="0.48"
                  />
                </g>
              )}
            </g>
          </g>
        ) : (
          /* ================= 3D FRONT & 3/4 VIEW (MAP / SHOWCASE / CARD / CELEBRATE / HUD) ================= */
          <g>
            {/* 1. PEEKING 3D SCHOOL BACKPACK BEHIND TORSO (Only When Worn) */}
            {withBackpack && variant !== "hud" && (
              <g transform={`translate(${-turnX * 0.55}, 0)`}>
                {/* Top carry loop */}
                <path
                  d="M 53,64 C 53,58 67,58 67,64"
                  stroke={pal.bagDark}
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* 3D Backpack side curves peeking left & right behind shoulders */}
                <rect
                  x="31.5"
                  y="67"
                  width="57"
                  height="33"
                  rx="13"
                  fill={`url(#${uid}-bag)`}
                />
                {/* Side tumbler water bottle peeking on student's left side */}
                <rect
                  x="84.5"
                  y="77"
                  width="6.5"
                  height="15"
                  rx="3"
                  fill={pal.bottleColor}
                />
                <rect x="85.8" y="74.5" width="4" height="3.5" rx="1.2" fill="#FFFFFF" />
                <rect
                  x="84"
                  y="84"
                  width="7.2"
                  height="8.5"
                  rx="2.5"
                  fill={pal.bagDark}
                  opacity="0.8"
                />
              </g>
            )}

            {/* 2. VOLUMETRIC 3D LEGS, SOCKS & INDONESIAN SCHOOL SHOES */}
            {variant !== "hud" && (
              <g>
                {/* Left Leg (Viewer's Left) */}
                <g className={leftLegClass}>
                  {pal.id === "budi" ? (
                    <g>
                      <path
                        d="M 39.5,98 L 37,128 C 37,130.5 53,130.5 53,128 L 57,98 Z"
                        fill={`url(#${uid}-sdRed)`}
                      />
                      <ellipse cx="45" cy="113" rx="3" ry="9.5" fill="#FFFFFF" opacity="0.14" />
                      <rect x="39" y="127" width="12.5" height="6.5" rx="2.5" fill="#FFFFFF" />
                      <line x1="39.5" y1="129" x2="51" y2="129" stroke="#CBD5E1" strokeWidth="1.2" />
                    </g>
                  ) : pal.id === "citra" ? (
                    <g>
                      <rect
                        x="40.5"
                        y="112"
                        width="11"
                        height="9.5"
                        rx="4.5"
                        fill={`url(#${uid}-limbSkin)`}
                      />
                      <rect x="40" y="119" width="12" height="14.5" rx="4" fill="#FFFFFF" />
                      <rect x="47.5" y="119" width="4.5" height="14.5" rx="2" fill="#E2E8F0" opacity="0.65" />
                      <line x1="40.5" y1="121.5" x2="51.5" y2="121.5" stroke="#DC2626" strokeWidth="1.3" />
                      <line x1="40.5" y1="123.5" x2="51.5" y2="123.5" stroke="#1E3A8A" strokeWidth="1" />
                    </g>
                  ) : (
                    <g>
                      <rect x="40" y="125" width="12" height="8.5" rx="3" fill="#FFFFFF" />
                      <rect x="47.5" y="125" width="4.5" height="8.5" rx="2" fill="#E2E8F0" opacity="0.65" />
                    </g>
                  )}

                  {/* 3D Black School Sneaker + White Rubber Toe & Sole (Left) */}
                  <g transform={`translate(${turnX * 0.25}, 0)`}>
                    <path
                      d="M 38.5,132 L 34.5,138.5 C 34.5,141.5 53.5,141.5 53.5,138.5 L 52.5,132 Z"
                      fill={`url(#${uid}-shoe)`}
                    />
                    <path
                      d="M 34.5,137.5 C 35,135 38.8,134.8 41.8,136.5 L 41.8,139.5 L 34.5,139.5 Z"
                      fill="#F8FAFC"
                    />
                    <rect x="34" y="138.8" width="20" height="3.4" rx="1.7" fill="#FFFFFF" />
                    <line x1="35" y1="140.6" x2="53" y2="140.6" stroke="#CBD5E1" strokeWidth="1" />
                    <line x1="42.5" y1="134" x2="47.5" y2="135.2" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="43.5" y1="136" x2="48.5" y2="137" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                  </g>
                </g>

                {/* Right Leg (Viewer's Right) */}
                <g className={rightLegClass}>
                  {pal.id === "budi" ? (
                    <g>
                      <path
                        d="M 63,98 L 67,128 C 67,130.5 83,130.5 83,128 L 80.5,98 Z"
                        fill={`url(#${uid}-sdRed)`}
                      />
                      <ellipse cx="73" cy="113" rx="3" ry="9.5" fill="#FFFFFF" opacity="0.12" />
                      <rect x="68.5" y="127" width="12.5" height="6.5" rx="2.5" fill="#FFFFFF" />
                      <line x1="69" y1="129" x2="80.5" y2="129" stroke="#CBD5E1" strokeWidth="1.2" />
                    </g>
                  ) : pal.id === "citra" ? (
                    <g>
                      <rect
                        x="68.5"
                        y="112"
                        width="11"
                        height="9.5"
                        rx="4.5"
                        fill={`url(#${uid}-limbSkin)`}
                      />
                      <rect x="68" y="119" width="12" height="14.5" rx="4" fill="#FFFFFF" />
                      <rect x="75.5" y="119" width="4.5" height="14.5" rx="2" fill="#E2E8F0" opacity="0.65" />
                      <line x1="68.5" y1="121.5" x2="79.5" y2="121.5" stroke="#DC2626" strokeWidth="1.3" />
                      <line x1="68.5" y1="123.5" x2="79.5" y2="123.5" stroke="#1E3A8A" strokeWidth="1" />
                    </g>
                  ) : (
                    <g>
                      <rect x="68" y="125" width="12" height="8.5" rx="3" fill="#FFFFFF" />
                      <rect x="75.5" y="125" width="4.5" height="8.5" rx="2" fill="#E2E8F0" opacity="0.65" />
                    </g>
                  )}

                  {/* 3D Black School Sneaker (Right) */}
                  <g transform={`translate(${turnX * 0.25}, 0)`}>
                    <path
                      d="M 67.5,132 L 66.5,138.5 C 66.5,141.5 85.5,141.5 85.5,138.5 L 81.5,132 Z"
                      fill={`url(#${uid}-shoe)`}
                    />
                    <path
                      d="M 85.5,137.5 C 85,135 81.2,134.8 78.2,136.5 L 78.2,139.5 L 85.5,139.5 Z"
                      fill="#F8FAFC"
                    />
                    <rect x="66" y="138.8" width="20" height="3.4" rx="1.7" fill="#FFFFFF" />
                    <line x1="67" y1="140.6" x2="85" y2="140.6" stroke="#CBD5E1" strokeWidth="1" />
                    <line x1="77.5" y1="134" x2="72.5" y2="135.2" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="76.5" y1="136" x2="71.5" y2="137" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                  </g>
                </g>

                {/* 3D Pleated Red SD Skirt (Rok Wiru Merah) for Ani & Citra */}
                {pal.id !== "budi" && (
                  <g transform={`translate(${turnX * 0.3}, 0)`}>
                    {pal.id === "ani" ? (
                      <g>
                        <path
                          d="M 37.5,97 L 30.5,127 C 46,131 74,131 89.5,127 L 82.5,97 Z"
                          fill={`url(#${uid}-sdRed)`}
                        />
                        <polygon points="45,98 49,98 46,128.5 41,128" fill={`url(#${uid}-sdRedDark)`} opacity="0.55" />
                        <polygon points="58,98 62,98 62,129.5 57,129.5" fill={`url(#${uid}-sdRedDark)`} opacity="0.55" />
                        <polygon points="71,98 75,98 79,128 74,128.5" fill={`url(#${uid}-sdRedDark)`} opacity="0.55" />
                        <line x1="53" y1="99" x2="51.5" y2="128" stroke="#FCA5A5" strokeWidth="1.5" opacity="0.32" />
                        <line x1="66.5" y1="99" x2="68" y2="128" stroke="#FCA5A5" strokeWidth="1.5" opacity="0.32" />
                        <rect x="37" y="95.5" width="46" height="4" rx="2" fill="#991B1B" />
                      </g>
                    ) : (
                      <g>
                        <path
                          d="M 37.5,96.5 L 31,117.5 C 46,121 74,121 89,117.5 L 82.5,96.5 Z"
                          fill={`url(#${uid}-sdRed)`}
                        />
                        <polygon points="45,97.5 49,97.5 46,119 41,118.5" fill={`url(#${uid}-sdRedDark)`} opacity="0.55" />
                        <polygon points="58,97.5 62,97.5 62,119.5 57,119.5" fill={`url(#${uid}-sdRedDark)`} opacity="0.55" />
                        <polygon points="71,97.5 75,97.5 79,118.5 74,119" fill={`url(#${uid}-sdRedDark)`} opacity="0.55" />
                        <line x1="53" y1="99" x2="51.5" y2="118.5" stroke="#FCA5A5" strokeWidth="1.5" opacity="0.35" />
                        <line x1="66.5" y1="99" x2="68" y2="118.5" stroke="#FCA5A5" strokeWidth="1.5" opacity="0.35" />
                        <rect x="37" y="95" width="46" height="4" rx="2" fill="#991B1B" />
                      </g>
                    )}
                  </g>
                )}

                {/* Budi's Trouser Crotch Bridge & Black SD Belt with Gold Buckle */}
                {pal.id === "budi" && (
                  <g transform={`translate(${turnX * 0.35}, 0)`}>
                    <path
                      d="M 38.5,96 L 81.5,96 L 81.5,104.5 L 60,107.5 L 38.5,104.5 Z"
                      fill={`url(#${uid}-sdRed)`}
                    />
                    <rect x="37.5" y="95.5" width="45" height="4.8" rx="2" fill="#1E293B" />
                    <rect x="55.5" y="94.8" width="9" height="6.2" rx="1.6" fill={`url(#${uid}-goldBead)`} />
                    <rect x="57.5" y="96.3" width="5" height="3.2" rx="0.8" fill="#92400E" opacity="0.55" />
                  </g>
                )}
              </g>
            )}

            {/* 3. LEFT & RIGHT 3D ARMS (WITH WAVING / CHEERING / WALKING POSES) */}
            <g className={leftArmClass}>
              {isCelebrating || effectiveWaveSide === "left" ? (
                <g>
                  <path
                    d="M 37,74 C 27,68 19,59 15,49"
                    stroke={pal.id === "ani" ? `url(#${uid}-sleeve)` : `url(#${uid}-limbSkin)`}
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <path
                    d={pal.id === "ani" ? "M 38,74 C 29,69 21,61 17,52" : "M 38,74 L 27,67"}
                    stroke={`url(#${uid}-sleeve)`}
                    strokeWidth={pal.id === "ani" ? "10" : "11.5"}
                    strokeLinecap="round"
                  />
                  <circle cx="13.5" cy="46.5" r="5.3" fill={`url(#${uid}-skin)`} />
                  <path
                    d="M 10,43 L 8.5,38.5 M 13,42 L 12.5,37 M 16,42.5 L 16.8,38 M 18.2,45 L 20.5,42.5"
                    stroke={pal.skinMid}
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                <g>
                  <path
                    d="M 38,74 C 31,81 27,90 25.5,99"
                    stroke={pal.id === "ani" ? `url(#${uid}-sleeve)` : `url(#${uid}-limbSkin)`}
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <path
                    d={pal.id === "ani" ? "M 38,74 C 31,81 27.5,89 26,97" : "M 38.5,73.5 L 30.5,84"}
                    stroke={`url(#${uid}-sleeve)`}
                    strokeWidth={pal.id === "ani" ? "10" : "11.5"}
                    strokeLinecap="round"
                  />
                  {pal.id === "budi" && (
                    <g>
                      <rect x="22" y="93.5" width="7.5" height="3.2" rx="1.4" fill="#1D4ED8" />
                      <circle cx="25.8" cy="95.1" r="2" fill="#38BDF8" />
                    </g>
                  )}
                  <circle cx="25" cy="101" r="5" fill={`url(#${uid}-skin)`} />
                  <ellipse cx="27.5" cy="99.5" rx="2.1" ry="1.5" fill={pal.skinHi} opacity="0.72" />
                </g>
              )}
            </g>

            {/* Right Arm (Viewer's Right) */}
            <g className={rightArmClass}>
              {isCelebrating || effectiveWaveSide === "right" ? (
                <g>
                  <path
                    d="M 83,74 C 93,68 101,59 105,49"
                    stroke={pal.id === "ani" ? `url(#${uid}-sleeve)` : `url(#${uid}-limbSkin)`}
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <path
                    d={pal.id === "ani" ? "M 82,74 C 91,69 99,61 103,52" : "M 82,74 L 93,67"}
                    stroke={`url(#${uid}-sleeve)`}
                    strokeWidth={pal.id === "ani" ? "10" : "11.5"}
                    strokeLinecap="round"
                  />
                  <circle cx="106.5" cy="46.5" r="5.3" fill={`url(#${uid}-skin)`} />
                  <path
                    d="M 110,43 L 111.5,38.5 M 107,42 L 107.5,37 M 104,42.5 L 103.2,38 M 101.8,45 L 99.5,42.5"
                    stroke={pal.skinMid}
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                <g>
                  <path
                    d="M 82,74 C 89,81 93,90 94.5,99"
                    stroke={pal.id === "ani" ? `url(#${uid}-sleeve)` : `url(#${uid}-limbSkin)`}
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <path
                    d={pal.id === "ani" ? "M 82,74 C 89,81 92.5,89 94,97" : "M 81.5,73.5 L 89.5,84"}
                    stroke={`url(#${uid}-sleeve)`}
                    strokeWidth={pal.id === "ani" ? "10" : "11.5"}
                    strokeLinecap="round"
                  />
                  {pal.id === "citra" && (
                    <rect x="90.5" y="94" width="7" height="2.8" rx="1.4" fill="#FACC15" />
                  )}
                  <circle cx="95" cy="101" r="5" fill={`url(#${uid}-skin)`} />
                  <ellipse cx="92.5" cy="99.5" rx="2.1" ry="1.5" fill={pal.skinHi} opacity="0.72" />
                </g>
              )}
            </g>

            {/* 4. VOLUMETRIC 3D WHITE SD UNIFORM TORSO & BACKPACK STRAPS */}
            <g transform={`translate(${turnX * 0.45}, 0)`}>
              {/* Sculpted White SD Shirt Body */}
              <path
                d={
                  pal.id === "ani"
                    ? "M 37,69.5 C 46,66.5 74,66.5 83,69.5 L 85,101 C 72,103.5 48,103.5 35,101 Z"
                    : "M 37,69.5 C 46,66.5 74,66.5 83,69.5 L 83,97 L 37,97 Z"
                }
                fill={`url(#${uid}-shirt)`}
              />

              {/* Top-down 3D Clavicle / Chest Specular Highlight */}
              <ellipse cx="55" cy="76" rx="14" ry="7" fill="#FFFFFF" opacity="0.45" />

              {/* Subtle 3D Side Torso Contour Shading */}
              <path
                d="M 75.5,70.5 L 82.5,70.5 L 82.5,96.5 L 73.5,96.5 Z"
                fill="#CBD5E1"
                opacity="0.38"
              />

              {/* Center Button Placket & Buttons */}
              <line x1="60" y1="71" x2="60" y2="97" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="60" cy="81" r="1.3" fill="#94A3B8" />
              <circle cx="60" cy="89" r="1.3" fill="#94A3B8" />
              <circle cx="60" cy="95" r="1.3" fill="#94A3B8" />

              {/* 3D Padded School Backpack Shoulder Straps Wrapping Shoulders */}
              {withBackpack && (
                <g>
                  <path
                    d="M 41,68.5 C 39.5,76 39.5,85 41,93"
                    stroke={`url(#${uid}-bag)`}
                    strokeWidth="5.2"
                    strokeLinecap="round"
                  />
                  <rect x="38.6" y="82" width="5" height="2.4" rx="1" fill={pal.bagAccent} />
                  <rect x="38.4" y="87.5" width="5.4" height="3" rx="1" fill="#1E293B" />

                  <path
                    d="M 79,68.5 C 80.5,76 80.5,85 79,93"
                    stroke={`url(#${uid}-bag)`}
                    strokeWidth="5.2"
                    strokeLinecap="round"
                  />
                  <rect x="76.4" y="82" width="5" height="2.4" rx="1" fill={pal.bagAccent} />
                  <rect x="76.2" y="87.5" width="5.4" height="3" rx="1" fill="#1E293B" />
                </g>
              )}

              {/* Indonesian Red-White Flag Emblem (Right Chest) */}
              <g transform={pal.id === "ani" ? "translate(0, 8)" : ""}>
                <rect
                  x="45"
                  y="77.5"
                  width="8"
                  height="5.2"
                  rx="1"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="0.8"
                />
                <rect x="45" y="77.5" width="8" height="2.6" rx="0.8" fill="#DC2626" />
              </g>

              {/* Left Breast Pocket + Official SD Tut Wuri Shield Badge */}
              <g transform={pal.id === "ani" ? "translate(0, 8)" : ""}>
                <rect
                  x="66.5"
                  y="77.5"
                  width="8.5"
                  height="9.5"
                  rx="1.5"
                  fill="#F8FAFC"
                  stroke="#CBD5E1"
                  strokeWidth="0.9"
                />
                <path
                  d="M 68,79 L 73.5,79 L 73.5,83.2 L 70.75,85.8 L 68,83.2 Z"
                  fill="#DC2626"
                />
                <circle cx="70.75" cy="82" r="1.2" fill="#FACC15" />
              </g>

              {/* Crisp 3D Pointed School Collar & Red SD Necktie (Budi & Citra) */}
              {pal.id !== "ani" && (
                <g>
                  <ellipse cx="60" cy="69" rx="7.5" ry="3.5" fill={pal.skinDeep} opacity="0.45" />
                  {/* 3D Cylindrical Neck + Jaw Cast Shadow */}
                  <rect x="53.5" y="55" width="13" height="14" rx="5.5" fill={`url(#${uid}-limbSkin)`} />
                  <ellipse cx="60" cy="59.5" rx="6.8" ry="3.5" fill="rgba(67,29,18,0.28)" />

                  {/* Collar Drop Shadow */}
                  <path
                    d="M 46,70.5 L 60,76.5 L 74,70.5"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    opacity="0.4"
                    fill="none"
                  />
                  {/* Left & Right 3D White Collar Wings */}
                  <polygon
                    points="60,71 46,67 51,76"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                  <polygon
                    points="60,71 74,67 69,76"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                  {/* Volumetric 3D Red SD Necktie (Dasi Merah SD) */}
                  <polygon points="56.2,70 63.8,70 62.2,75 57.8,75" fill="#991B1B" />
                  <path
                    d="M 57.8,74.8 L 62.2,74.8 L 64.8,88 L 60,94 L 55.2,88 Z"
                    fill={`url(#${uid}-tie)`}
                  />
                  <polygon points="58.5,75.5 60.8,75.5 61.2,86 58.8,86" fill="#FFFFFF" opacity="0.18" />
                  {/* Gold SD Emblem on Tie */}
                  <polygon points="60,81 62.2,83.3 60,85.6 57.8,83.3" fill="#FACC15" />
                </g>
              )}
            </g>

            {/* 5. ANI'S SCULPTED 3D WHITE SCHOOL HIJAB DRAPE OVER SHOULDERS & CHEST */}
            {pal.id === "ani" && (
              <g transform={`translate(${turnX * 0.55}, 0)`}>
                <path
                  d="M 32,40 C 29,18 42,9 60,9 C 78,9 91,18 88,40 C 88,56 83,70 75.5,76.5 C 68,82.5 52,82.5 44.5,76.5 C 37,70 32,56 32,40 Z"
                  fill={`url(#${uid}-hijab)`}
                />
                {/* Soft Chest Drape with 3D Fabric Folds */}
                <path
                  d="M 39.5,56 C 44.5,65 52,68 60,68 C 68,68 75.5,65 80.5,56 C 82.5,70 74.5,82.5 60,84 C 45.5,82.5 37.5,70 39.5,56 Z"
                  fill={`url(#${uid}-hijabDrape)`}
                />
                <path
                  d="M 43.5,64 C 48.5,72 54,75 60,75 C 66,75 71.5,72 76.5,64"
                  stroke="#CBD5E1"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 47.5,71 C 52.5,77 67.5,77 72.5,71"
                  stroke="#FFFFFF"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                />
                {/* Cute Pastel Hijab Pin Brooch */}
                <g transform="translate(70.5, 67.5)">
                  <circle cx="0" cy="0" r="2.8" fill="#F472B6" />
                  <circle cx="0" cy="0" r="1.1" fill="#FEF08A" />
                </g>
              </g>
            )}

            {/* 6. VOLUMETRIC 3D SCULPTED HUMAN CHILD HEAD, FACE & HAIR */}
            <g
              className={headMotionClass}
              style={!isWalking ? { animationDelay: pal.animDelay } : undefined}
              transform={`translate(${turnX * 0.7}, 0)`}
            >
              {/* Citra's Back Hair Volume & Bouncy 3D Dual Pigtails */}
              {pal.id === "citra" && (
                <g>
                  <path
                    d="M 32,41 C 28,21 39,8.5 60,8.5 C 81,8.5 92,21 88,41 C 88,50 83,56 78,54 C 74,52 46,52 42,54 C 37,56 32,50 32,41 Z"
                    fill={`url(#${uid}-citraHair)`}
                  />
                  {/* Left Bouncy 3D Pigtail + Twin Golden Beads */}
                  <g className="animate-kid3d-pigtail" style={{ animationDelay: pal.animDelay }}>
                    <path
                      d="M 34,43 C 20,41 13,51 17,62 C 20,69 29.5,66 34.5,54 Z"
                      fill={`url(#${uid}-citraHair)`}
                    />
                    <path
                      d="M 21,50 C 18,54 19,59 22,61"
                      stroke="#554370"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="29.5" cy="43.5" r="4.5" fill={`url(#${uid}-goldBead)`} />
                    <circle cx="33.5" cy="47.5" r="4" fill={`url(#${uid}-goldBead)`} />
                    <circle cx="28.2" cy="42" r="1.3" fill="#FFFFFF" opacity="0.78" />
                    <circle cx="32.3" cy="46.2" r="1.1" fill="#FFFFFF" opacity="0.78" />
                  </g>

                  {/* Right Bouncy 3D Pigtail + Twin Golden Beads */}
                  <g className="animate-kid3d-pigtail" style={{ animationDelay: pal.animDelay }}>
                    <path
                      d="M 86,43 C 100,41 107,51 103,62 C 100,69 90.5,66 85.5,54 Z"
                      fill={`url(#${uid}-citraHair)`}
                    />
                    <path
                      d="M 99,50 C 102,54 101,59 98,61"
                      stroke="#554370"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="90.5" cy="43.5" r="4.5" fill={`url(#${uid}-goldBead)`} />
                    <circle cx="86.5" cy="47.5" r="4" fill={`url(#${uid}-goldBead)`} />
                    <circle cx="89.2" cy="42" r="1.3" fill="#FFFFFF" opacity="0.78" />
                    <circle cx="85.3" cy="46.2" r="1.1" fill="#FFFFFF" opacity="0.78" />
                  </g>
                </g>
              )}

              {/* Budi's Back Hair Crown */}
              {pal.id === "budi" && (
                <path
                  d="M 32,40 C 28,20 39,8.5 60,8.5 C 81,8.5 92,20 88,40 C 88,47 84,51 82,48 C 79,40 41,40 38,48 C 36,51 32,47 32,40 Z"
                  fill={`url(#${uid}-budiHair)`}
                />
              )}

              {/* 3D Sculpted Human Child Ears with Inner Concha Depth (Budi & Citra) */}
              {pal.id !== "ani" && (
                <g>
                  <ellipse cx="35.5" cy="41.5" rx="4.6" ry="6" fill={`url(#${uid}-skin)`} />
                  <ellipse cx="36.2" cy="41.8" rx="2.2" ry="3.4" fill={pal.skinDeep} opacity="0.52" />
                  <ellipse cx="84.5" cy="41.5" rx="4.6" ry="6" fill={`url(#${uid}-skin)`} />
                  <ellipse cx="83.8" cy="41.8" rx="2.2" ry="3.4" fill={pal.skinDeep} opacity="0.52" />
                </g>
              )}

              {/* Sculpted 3D Human Child Cranium, Soft Cheekbones & Rounded Chin */}
              {pal.id === "ani" ? (
                <g>
                  {/* Neat Inner Hijab Ciput Cap */}
                  <path
                    d="M 39.5,35 C 39.5,22 48,17.5 60,17.5 C 72,17.5 80.5,22 80.5,35 Z"
                    fill="#E2E8F0"
                  />
                  {/* Ani's 3D Face Opening Framed Softly by Hijab */}
                  <path
                    d="M 40,37.5 C 40,24.5 48.5,20 60,20 C 71.5,20 80,24.5 80,37.5 C 80,48.5 75,56 67.5,59.5 C 63.5,61.2 56.5,61.2 52.5,59.5 C 45,56 40,48.5 40,37.5 Z"
                    fill={`url(#${uid}-skin)`}
                  />
                  {/* Subtle 3D Rim Light along Right Cheek */}
                  <path
                    d="M 78.8,36 C 78.8,45.5 74.5,53.5 67.5,57.5"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Soft Hijab Rim Shadow Along Forehead */}
                  <path
                    d="M 40.5,36 C 41.5,24 49,20 60,20 C 71,20 78.5,24 79.5,36"
                    stroke="#CBD5E1"
                    strokeWidth="1.6"
                    fill="none"
                  />
                </g>
              ) : (
                <g>
                  <path
                    d="M 36.5,36 C 36.5,19.5 46,13.5 60,13.5 C 74,13.5 83.5,19.5 83.5,36 C 83.5,47.5 78.5,55.5 70.5,59.2 C 65.5,61.5 54.5,61.5 49.5,59.2 C 41.5,55.5 36.5,47.5 36.5,36 Z"
                    fill={`url(#${uid}-skin)`}
                  />
                  {/* Subtle 3D Studio Rim Light along Right Cheek Contour */}
                  <path
                    d="M 82.2,34 C 82.2,44.5 77.5,53 69.8,57.5"
                    stroke="rgba(255,255,255,0.42)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              )}

              {/* Facial Features Group (Shifts Slightly for 3D 3/4 Turn) */}
              <g transform={`translate(${turnX * 0.85}, 0)`}>
                {/* Soft Subsurface Cheek Blush */}
                <ellipse cx="45" cy="46" rx="5.8" ry="3.5" fill={`url(#${uid}-blush)`} />
                <ellipse cx="75" cy="46" rx="5.8" ry="3.5" fill={`url(#${uid}-blush)`} />

                {/* 3D Volumetric Child Eyebrows */}
                <path
                  d="M 43.5,31.5 Q 49,29.2 54.5,31.2"
                  stroke={pal.id === "citra" ? "#211331" : "#3E2723"}
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 65.5,31.2 Q 71,29.2 76.5,31.5"
                  stroke={pal.id === "citra" ? "#211331" : "#3E2723"}
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Eye Socket Soft Ambient Shading */}
                <ellipse cx="49.2" cy="39" rx="6.4" ry="5.6" fill={pal.skinDeep} opacity="0.2" />
                <ellipse cx="70.8" cy="39" rx="6.4" ry="5.6" fill={pal.skinDeep} opacity="0.2" />

                {/* Left 3D Glossy Human Child Eye */}
                <g>
                  <ellipse cx="49.2" cy="39.5" rx="5.8" ry="5.3" fill={`url(#${uid}-sclera)`} />
                  <circle cx={49.5 + turnX * 0.22} cy="39.8" r="3.9" fill={`url(#${uid}-iris)`} />
                  <circle cx={49.5 + turnX * 0.25} cy="39.9" r="1.9" fill="#050505" />
                  {/* Dual 3D Studio Catchlights */}
                  <circle cx={47.9 + turnX * 0.18} cy="38" r="1.5" fill="#FFFFFF" opacity="0.96" />
                  <circle cx={51.1 + turnX * 0.18} cy="41.4" r="0.75" fill="#FFFFFF" opacity="0.72" />
                  {/* Animated 3D Blinking Eyelid */}
                  <ellipse
                    cx="49.2"
                    cy="39.5"
                    rx="6.1"
                    ry="5.6"
                    fill={pal.skinMid}
                    className="animate-npc3d-blink"
                    style={{ animationDelay: pal.animDelay }}
                  />
                  {/* Upper 3D Lash Crease */}
                  <path
                    d="M 43.2,38.6 C 45,34 53.5,34 55.2,38.6"
                    stroke="#1E140F"
                    strokeWidth={pal.id === "budi" ? "1.8" : "2.2"}
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>

                {/* Right 3D Glossy Human Child Eye */}
                <g>
                  <ellipse cx="70.8" cy="39.5" rx="5.8" ry="5.3" fill={`url(#${uid}-sclera)`} />
                  <circle cx={70.5 + turnX * 0.22} cy="39.8" r="3.9" fill={`url(#${uid}-iris)`} />
                  <circle cx={70.5 + turnX * 0.25} cy="39.9" r="1.9" fill="#050505" />
                  {/* Dual 3D Studio Catchlights */}
                  <circle cx={68.9 + turnX * 0.18} cy="38" r="1.5" fill="#FFFFFF" opacity="0.96" />
                  <circle cx={72.1 + turnX * 0.18} cy="41.4" r="0.75" fill="#FFFFFF" opacity="0.72" />
                  {/* Animated 3D Blinking Eyelid */}
                  <ellipse
                    cx="70.8"
                    cy="39.5"
                    rx="6.1"
                    ry="5.6"
                    fill={pal.skinMid}
                    className="animate-npc3d-blink"
                    style={{ animationDelay: pal.animDelay }}
                  />
                  {/* Upper 3D Lash Crease */}
                  <path
                    d="M 64.8,38.6 C 66.5,34 75,34 76.8,38.6"
                    stroke="#1E140F"
                    strokeWidth={pal.id === "budi" ? "1.8" : "2.2"}
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>

                {/* 3D Sculpted Child Nose with Bridge Contour, Nostril Shadow & Specular Tip */}
                <g>
                  <path
                    d="M 61.2,39.2 Q 62.4,42.5 62,44.6"
                    stroke={pal.skinDeep}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    opacity="0.4"
                    fill="none"
                  />
                  <ellipse cx="60" cy="46.2" rx="3.4" ry="1.4" fill={pal.skinDeep} opacity="0.42" />
                  <ellipse cx="60" cy="44.9" rx="3" ry="2.1" fill={pal.skinMid} />
                  <ellipse cx="59.2" cy="44.2" rx="1.3" ry="0.85" fill="#FFFFFF" opacity="0.65" />
                </g>

                {/* Warm 3D Cushioned Child Smile with Upper Teeth, Tongue & Lower Lip */}
                <g>
                  <path
                    d="M 53,50 C 55.2,56.5 64.8,56.5 67,50 C 62.5,51.2 57.5,51.2 53,50 Z"
                    fill="#881337"
                  />
                  <path
                    d="M 54.3,50.3 C 57.8,51.4 62.2,51.4 65.7,50.3 L 65,52 C 61.8,52.6 58.2,52.6 55,52 Z"
                    fill="#FFFFFF"
                  />
                  <ellipse cx="60" cy="54.1" rx="3.5" ry="1.7" fill="#FB7185" />
                  <path
                    d="M 54.5,54.8 Q 60,57.2 65.5,54.8"
                    stroke={pal.lipColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.72"
                    fill="none"
                  />
                </g>
              </g>

              {/* 7. VOLUMETRIC 3D FRONT HAIR BANGS & ANISOTROPIC SPECULAR SHEEN */}
              {pal.id === "budi" && (
                <g>
                  {/* Sculpted Neat Indonesian Schoolboy Side-Parted Fringe */}
                  <path
                    d="M 34.5,34 C 35,19 44.5,9.5 60,9.5 C 75.5,9.5 85,19 85.5,34 C 82,26 76,24 70.5,27.5 C 66.5,30 62.5,29 59.5,24.5 C 55.5,29 50.5,30 45.5,27 C 40.5,24.5 36.5,27 34.5,34 Z"
                    fill={`url(#${uid}-budiHair)`}
                  />
                  {/* Side Part Seam & 3D Specular Hair Crown Sheen */}
                  <path d="M 47,14.5 L 48.5,21.5" stroke="rgba(0,0,0,0.32)" strokeWidth="1.4" strokeLinecap="round" />
                  <path
                    d="M 49.5,16.5 Q 62,12.5 75.5,17.5"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              )}

              {pal.id === "citra" && (
                <g>
                  {/* Sculpted Rounded Schoolgirl Bangs with Soft Side Locks */}
                  <path
                    d="M 34,35.5 C 34.5,19.5 44.5,9.5 60,9.5 C 75.5,9.5 85.5,19.5 86,35.5 L 85,41.5 C 81.5,38.5 79.5,32.5 76.5,29.5 C 71.5,32.5 66,31.5 62,26.5 C 58,31.5 50.5,32.5 44.5,29.5 C 40.5,32.5 38.5,38.5 35,41.5 Z"
                    fill={`url(#${uid}-citraHair)`}
                  />
                  {/* Glossy 3D Hair Halo Highlight */}
                  <path
                    d="M 43,17.5 Q 60,12.5 76.5,17.5"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              )}
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}

interface StudentOpenBag3DProps {
  characterId: StudentCharacterId;
  studentName?: string;
  className?: string;
}

/**
 * 3D Unzipped & Opened School Backpack placed neatly in the Classroom or Home Study Corner
 * when the student takes off their bag indoors.
 */
export function StudentOpenBag3D({
  characterId,
  studentName,
  className = "",
}: StudentOpenBag3DProps) {
  const rawUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const uid = `openbag3d-${characterId}-${rawUid}`;
  const pal = getStudentPalette(characterId);
  const shortLabel = (studentName || "Sekolah")
    .trim()
    .split(" ")[0]
    .slice(0, 10);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 110 104"
        className="w-[46px] h-[44px] sm:w-[56px] sm:h-[54px] overflow-visible drop-shadow-[0_6px_8px_rgba(15,23,42,0.28)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${uid}-body`} x1="12%" y1="6%" x2="88%" y2="96%">
            <stop offset="0%" stopColor={pal.bagLight} />
            <stop offset="52%" stopColor={pal.bagMid} />
            <stop offset="100%" stopColor={pal.bagDark} />
          </linearGradient>
          <linearGradient id={`${uid}-flap`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pal.bagMid} />
            <stop offset="100%" stopColor={pal.bagDark} />
          </linearGradient>
          <radialGradient id={`${uid}-ao`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#0F172A" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground Contact Ambient Occlusion Shadow */}
        <ellipse cx="55" cy="92" rx="35" ry="9" fill={`url(#${uid}-ao)`} />

        {/* Resting Shoulder Straps Curled Beside Base */}
        <path
          d="M 27,54 C 15,62 14,82 26,86"
          stroke={pal.bagDark}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 80,56 C 91,63 92,81 81,86"
          stroke={pal.bagDark}
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Top Carry Handle Loop */}
        <path
          d="M 43,23 C 43,13 63,13 63,23"
          stroke={pal.bagDark}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Unzipped Folded-Back Top Lid Behind Compartment */}
        <path
          d="M 23,36 C 21,19 37,14 54,15 C 71,16 84,22 82,37 Z"
          fill={`url(#${uid}-flap)`}
          stroke="#1E293B"
          strokeWidth="1.2"
        />

        {/* Wide Open Dark Inner Bag Compartment */}
        <ellipse
          cx="53"
          cy="39"
          rx="27"
          ry="12"
          fill="#1E1B4B"
          stroke="#F8FAFC"
          strokeWidth="1.4"
          strokeDasharray="2.5 2"
        />

        {/* === SCHOOL SUPPLIES PEEKING OUT OF OPEN BAG === */}
        {/* 1. Red & White SD Exercise Book (Buku Tulis Merah Putih) */}
        <g transform="rotate(-11 40 31)">
          <rect x="29" y="16" width="18" height="24" rx="2" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
          <rect x="31" y="18" width="14" height="20" rx="1" fill="#FFFBEB" opacity="0.22" />
          <rect x="32.5" y="21" width="11" height="6" rx="1" fill="#FFFFFF" />
          <line x1="34" y1="23.5" x2="42" y2="23.5" stroke="#94A3B8" strokeWidth="1" />
          <line x1="34" y1="25.5" x2="40" y2="25.5" stroke="#94A3B8" strokeWidth="1" />
        </g>

        {/* 2. Sky-Blue Science / Drawing Textbook */}
        <g transform="rotate(8 56 30)">
          <rect x="46" y="14" width="19" height="25" rx="2" fill="#0EA5E9" stroke="#0369A1" strokeWidth="1" />
          <rect x="49" y="19" width="13" height="6.5" rx="1" fill="#FEF08A" />
          <line x1="51" y1="22" x2="60" y2="22" stroke="#854D0E" strokeWidth="1.1" />
        </g>

        {/* 3. Translucent Yellow School Ruler with Ticks */}
        <g transform="rotate(19 67 28)">
          <rect x="62" y="10" width="7.5" height="27" rx="1.2" fill="#FACC15" stroke="#A16207" strokeWidth="0.9" />
          <line x1="62.5" y1="14" x2="65.5" y2="14" stroke="#713F12" strokeWidth="0.9" />
          <line x1="62.5" y1="18" x2="66.5" y2="18" stroke="#713F12" strokeWidth="0.9" />
          <line x1="62.5" y1="22" x2="65.5" y2="22" stroke="#713F12" strokeWidth="0.9" />
          <line x1="62.5" y1="26" x2="66.5" y2="26" stroke="#713F12" strokeWidth="0.9" />
        </g>

        {/* 4. Sharpened Wooden Pencil + Eraser */}
        <g transform="rotate(-20 35 28)">
          <rect x="31" y="12" width="4.4" height="22" rx="1" fill="#F59E0B" stroke="#92400E" strokeWidth="0.8" />
          <rect x="31" y="9.5" width="4.4" height="3.5" rx="1" fill="#FB7185" />
          <polygon points="31,12 35.4,12 33.2,7" fill="#FDE68A" />
          <polygon points="32.4,8.8 34,8.8 33.2,7" fill="#1E293B" />
        </g>

        {/* Side Water Bottle Tumbler in Mesh Pocket */}
        <g>
          <rect x="78" y="45" width="11" height="28" rx="5" fill={pal.bottleColor} stroke="#0F172A" strokeWidth="0.9" />
          <rect x="80.5" y="40.5" width="6" height="5.5" rx="1.8" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.8" />
          <path
            d="M 77.5,58 L 89.5,58 L 88.5,83 C 88.5,86 78.5,86 78.5,83 Z"
            fill={pal.bagDark}
            opacity="0.86"
          />
          <line x1="79" y1="63" x2="88" y2="63" stroke="#FFFFFF" strokeWidth="0.9" opacity="0.35" />
        </g>

        {/* Main 3D Lower & Mid Backpack Body */}
        <path
          d="M 24,41 C 34,47 72,47 82,41 L 84,78 C 84,86 76,90 53,90 C 30,90 22,86 22,78 Z"
          fill={`url(#${uid}-body)`}
          stroke="#1E293B"
          strokeWidth="1.2"
        />

        {/* Open Zipper Rim & Metallic Zipper Slider Pull */}
        <path
          d="M 24,41 C 34,47.5 72,47.5 82,41"
          stroke="#FDE047"
          strokeWidth="2.4"
          strokeDasharray="3 2"
          strokeLinecap="round"
          fill="none"
        />
        <g transform="translate(76, 42)">
          <rect x="-2.5" y="-1" width="5" height="7.5" rx="1.5" fill="#FACC15" stroke="#713F12" strokeWidth="0.8" />
          <circle cx="0" cy="4.5" r="1" fill="#713F12" />
        </g>

        {/* Front 3D Lower Utility Pocket + Reflective Strip + Star Keychain */}
        <rect
          x="30"
          y="55"
          width="46"
          height="26"
          rx="8"
          fill={pal.bagDark}
          opacity="0.5"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1"
        />
        <rect x="36" y="64" width="34" height="4.5" rx="2.2" fill={pal.bagAccent} />
        <path
          d="M 30,52 C 42,55 64,55 76,52"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.28"
          fill="none"
        />
        <circle cx="34" cy="58" r="3.4" fill="#FDE047" stroke="#A16207" strokeWidth="0.8" />
      </svg>

      <span className="mt-0.5 text-[8.5px] font-bold tracking-tight text-slate-800 bg-white/90 px-1.5 py-0.5 rounded border border-stone-300/80 shadow-xs whitespace-nowrap">
        Tas {shortLabel} · Terbuka
      </span>
    </div>
  );
}
