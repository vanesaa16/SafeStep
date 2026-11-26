/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface DeskConfig {
  x: number;
  y: number;
  width: number;
  depth: number;
  label: string;
  bookColorLeft: string;
  bookColorRight: string;
  bottleColor: string;
  bagColorLeft?: string;
  bagColorRight?: string;
}

const DESK_ROWS: DeskConfig[] = [
  // Row 1 (Front)
  {
    x: 238,
    y: 246,
    width: 150,
    depth: 48,
    label: "Budi & Ani",
    bookColorLeft: "#EF4444",
    bookColorRight: "#3B82F6",
    bottleColor: "#06B6D4",
    bagColorLeft: "#DC2626",
    bagColorRight: "#EC4899",
  },
  {
    x: 572,
    y: 246,
    width: 150,
    depth: 48,
    label: "Citra & Doni",
    bookColorLeft: "#10B981",
    bookColorRight: "#F59E0B",
    bottleColor: "#8B5CF6",
    bagColorLeft: "#F59E0B",
    bagColorRight: "#2563EB",
  },
  // Row 2 (Middle - slightly wider for natural 3D perspective foreshortening)
  {
    x: 224,
    y: 340,
    width: 158,
    depth: 51,
    label: "Edo & Fani",
    bookColorLeft: "#8B5CF6",
    bookColorRight: "#EC4899",
    bottleColor: "#10B981",
    bagColorLeft: "#0EA5E9",
  },
  {
    x: 578,
    y: 340,
    width: 158,
    depth: 51,
    label: "Gilang & Hana",
    bookColorLeft: "#3B82F6",
    bookColorRight: "#EF4444",
    bottleColor: "#F97316",
    bagColorRight: "#9333EA",
  },
  // Row 3 (Back - closest to camera, widest in 3D perspective)
  {
    x: 208,
    y: 434,
    width: 168,
    depth: 54,
    label: "Rian & Susi",
    bookColorLeft: "#F59E0B",
    bookColorRight: "#06B6D4",
    bottleColor: "#EC4899",
    bagColorLeft: "#16A34A",
    bagColorRight: "#E11D48",
  },
  {
    x: 584,
    y: 434,
    width: 168,
    depth: 54,
    label: "Andi & Maya",
    bookColorLeft: "#14B8A6",
    bookColorRight: "#6366F1",
    bottleColor: "#3B82F6",
    bagColorLeft: "#EA580C",
  },
];

export default function Classroom3DScene({ adaptiveViewBox }: { adaptiveViewBox?: string }) {
  // Longitudinal floor tile lines fanning out in 1-point 3D perspective across full virtual horizon
  const tileColumns = Array.from({ length: 25 }, (_, i) => {
    const t = (i - 6) / 12; // spans from negative wing to positive wing
    return {
      xTop: 96 + t * (864 - 96),
      xBot: 0 + t * 960,
    };
  });

  // Foreshortened horizontal floor tile rows (denser near front wall, broader near camera)
  const tileRowsY = [182, 208, 238, 272, 312, 358, 412, 472, 540];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#FAFAF9]">
      <svg
        viewBox={adaptiveViewBox || "0 0 960 540"}
        className="w-full h-full block"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 3D Ceramic Floor Gloss & Sunlight Gradient */}
          <radialGradient id="sdFloor3D" cx="54%" cy="42%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="46%" stopColor="#F7F4EC" />
            <stop offset="84%" stopColor="#EAE3D5" />
            <stop offset="100%" stopColor="#DDD4C3" />
          </radialGradient>

          {/* Front Wall Cream Paint */}
          <linearGradient id="sdFrontWallCream" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDFBF4" />
            <stop offset="100%" stopColor="#F2E9D8" />
          </linearGradient>

          {/* Front Wall Classic SD Mint-Sage Wainscoting */}
          <linearGradient id="sdFrontWallGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8FD1AE" />
            <stop offset="100%" stopColor="#6BAE8B" />
          </linearGradient>

          {/* Left Wall Shaded 3D Perspective Gradients */}
          <linearGradient id="sdLeftWallCream" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EFE4CE" />
            <stop offset="100%" stopColor="#E4D6BC" />
          </linearGradient>
          <linearGradient id="sdLeftWallGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7ABFA0" />
            <stop offset="100%" stopColor="#5D9E7D" />
          </linearGradient>

          {/* Right Window Wall 3D Perspective Gradients */}
          <linearGradient id="sdRightWallCream" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E9DCC3" />
            <stop offset="100%" stopColor="#F6EEDC" />
          </linearGradient>
          <linearGradient id="sdRightWallGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#62A382" />
            <stop offset="100%" stopColor="#82C6A3" />
          </linearGradient>

          {/* Outdoor Sky & Sunlit Yard visible through 3D Windows */}
          <linearGradient id="sdWindowSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="65%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#BBF7D0" />
          </linearGradient>

          {/* Volumetric Morning Sunbeam across Classroom Floor */}
          <linearGradient id="sdSunbeam" x1="100%" y1="20%" x2="0%" y2="80%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#FEF9C3" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* 3D Teak Wood Desktop Shader */}
          <linearGradient id="sdTeakTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E9BE8E" />
            <stop offset="55%" stopColor="#D79F69" />
            <stop offset="100%" stopColor="#C2864E" />
          </linearGradient>

          {/* 3D Dark Teak Front & Leg Shader */}
          <linearGradient id="sdTeakFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A86E3B" />
            <stop offset="100%" stopColor="#7C4D25" />
          </linearGradient>

          {/* 3D Porcelain Whiteboard Gloss */}
          <linearGradient id="sdWhiteboard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#EEF2F6" />
          </linearGradient>

          {/* Soft Ambient Floor Shadow */}
          <radialGradient id="sdSoftShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.24" />
            <stop offset="70%" stopColor="#1E293B" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ================= 1. CEILING & RECESSED SCHOOL LIGHTS (SEAMLESS FULL-BLEED) ================= */}
        <polygon points="-2000,-100 3000,-100 864,18 96,18" fill="#EAE3D2" />
        <line x1="-2000" y1="18" x2="3000" y2="18" stroke="#CBBFA8" strokeWidth="2" />
        {/* Ceiling Fluorescent Lamp Strips */}
        <rect x="-60" y="4" width="130" height="6" rx="3" fill="#FFFFFF" opacity="0.75" />
        <rect x="260" y="4" width="130" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
        <rect x="570" y="4" width="130" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
        <rect x="890" y="4" width="130" height="6" rx="3" fill="#FFFFFF" opacity="0.75" />

        {/* ================= 2. 3D PERSPECTIVE CERAMIC TILE FLOOR (FULL-BLEED EXTENSION) ================= */}
        <polygon points="-2000,182 3000,182 3000,600 -2000,600" fill="url(#sdFloor3D)" />

        {/* Longitudinal 3D Perspective Grout Lines across wide horizon */}
        {tileColumns.map((col, idx) => (
          <line
            key={`col-${idx}`}
            x1={col.xTop}
            y1={182}
            x2={col.xBot}
            y2={540}
            stroke="#CFC7B8"
            strokeWidth="1.15"
            opacity="0.7"
          />
        ))}

        {/* Horizontal Foreshortened 3D Grout Lines across wide horizon */}
        {tileRowsY.map((y, idx) => (
          <line
            key={`row-${idx}`}
            x1="-2000"
            y1={y}
            x2="3000"
            y2={y}
            stroke="#CFC7B8"
            strokeWidth={idx > 4 ? "1.3" : "0.95"}
            opacity="0.72"
          />
        ))}

        {/* Glossy Floor Reflection of Whiteboard & Front Wall */}
        <polygon
          points="280,182 680,182 705,228 255,228"
          fill="#FFFFFF"
          opacity="0.25"
        />

        {/* Ambient Occlusion Shadow along Wall-Floor Creases */}
        <polygon points="-2000,182 3000,182 3000,192 -2000,192" fill="#475569" opacity="0.14" />
        <polygon points="96,182 106,186 18,540 0,540" fill="#334155" opacity="0.13" />
        <polygon points="864,182 854,186 942,540 960,540" fill="#334155" opacity="0.13" />

        {/* ================= 3. FRONT WALL (SEAMLESS CONTINUOUS HORIZON) ================= */}
        {/* Upper Cream Paint */}
        <rect x="-2000" y="18" width="5000" height="106" fill="url(#sdFrontWallCream)" />
        {/* Lower Mint-Sage Green Wainscoting */}
        <rect x="-2000" y="124" width="5000" height="58" fill="url(#sdFrontWallGreen)" />
        {/* 3D Teak Wood Molding Rail */}
        <rect x="-2000" y="121" width="5000" height="5.5" fill="#A46B39" />
        <rect x="-2000" y="126.5" width="5000" height="2" fill="rgba(0,0,0,0.18)" />
        {/* Ceramic Baseboard (Plint Keramik Cokelat) */}
        <rect x="-2000" y="177" width="5000" height="5.5" fill="#6D4C3D" />

        {/* ================= 4. LEFT 3D PERSPECTIVE WALL & MADING ================= */}
        {/* Upper Cream Trapezoid */}
        <polygon points="-2000,0 96,18 96,124 -2000,330" fill="url(#sdLeftWallCream)" />
        {/* Lower SD Green Trapezoid */}
        <polygon points="-2000,330 96,124 96,182 -2000,600" fill="url(#sdLeftWallGreen)" />
        {/* Left Wall Wood Chair-Rail */}
        <polygon points="-2000,326 96,121 96,126.5 -2000,335" fill="#8E592C" />
        {/* Left Wall Ceramic Baseboard */}
        <polygon points="-2000,528 96,177 96,182 -2000,600" fill="#5C3E31" />
        {/* Vertical Corner Crease */}
        <line x1="96" y1="18" x2="96" y2="182" stroke="#B7A990" strokeWidth="1.6" />

        {/* Perspective Framed Poster 1 on Left Wall: Peta Indonesia */}
        <g>
          <polygon points="56,76 88,44 88,96 56,146" fill="#8B5A2B" />
          <polygon points="58,79 86.5,48 86.5,93 58,141" fill="#E0F2FE" />
          {/* Mini Archipelago Silhouettes */}
          <polygon points="62,104 72,92 73,97 64,111" fill="#16A34A" />
          <polygon points="74,84 82,73 82,79 76,88" fill="#16A34A" />
          <polygon points="67,114 78,100 78,104 68,118" fill="#15803D" />
        </g>

        {/* Perspective Framed Corkboard Mading Kelas 5A on Left Wall */}
        <g>
          <polygon points="12,182 52,106 52,204 12,316" fill="#92400E" />
          <polygon points="15,189 49,113 49,198 15,305" fill="#E9C46A" />
          {/* Pinned Colorful Student Artworks in 3D Perspective */}
          <polygon points="19,202 31,170 31,212 19,248" fill="#FFFFFF" />
          <polygon points="34,162 45,134 45,172 34,204" fill="#BAE6FD" />
          <polygon points="19,258 44,188 44,218 19,292" fill="#FEF08A" />
          <circle cx="25" cy="190" r="2.2" fill="#EF4444" />
          <circle cx="39" cy="150" r="2" fill="#2563EB" />
        </g>

        {/* ================= 5. RIGHT 3D PERSPECTIVE WINDOW WALL ================= */}
        {/* Upper Cream Trapezoid */}
        <polygon points="864,18 960,0 960,330 864,124" fill="url(#sdRightWallCream)" />
        {/* Lower SD Green Trapezoid */}
        <polygon points="864,124 960,330 960,540 864,182" fill="url(#sdRightWallGreen)" />
        {/* Right Wall Wood Chair-Rail */}
        <polygon points="864,121 960,326 960,335 864,126.5" fill="#8E592C" />
        {/* Right Wall Ceramic Baseboard */}
        <polygon points="864,177 960,528 960,540 864,182" fill="#5C3E31" />
        <line x1="864" y1="18" x2="864" y2="182" stroke="#B7A990" strokeWidth="1.6" />

        {/* 3 Recessed 3D Wooden SD Windows along Right Wall */}
        {/* Window 1 (Far/Front) */}
        <g>
          <polygon points="870,38 890,52 890,130 870,94" fill="#78471E" />
          <polygon points="872,42 888,55 888,124 872,92" fill="url(#sdWindowSky)" />
          <ellipse cx="881" cy="106" rx="5" ry="14" fill="#65A30D" opacity="0.8" />
          <line x1="872" y1="71" x2="888" y2="90" stroke="#FFFFFF" strokeWidth="1.6" />
          {/* 3D Window Sill */}
          <polygon points="868,94 890,130 886,134 867,98" fill="#B47B48" />
        </g>

        {/* Window 2 (Middle) */}
        <g>
          <polygon points="896,64 920,88 920,208 896,152" fill="#78471E" />
          <polygon points="898.5,69 917.5,91 917.5,200 898.5,149" fill="url(#sdWindowSky)" />
          <ellipse cx="909" cy="168" rx="7" ry="20" fill="#4D7C0F" opacity="0.82" />
          <ellipse cx="913" cy="179" rx="6" ry="16" fill="#84CC16" opacity="0.85" />
          <line x1="898.5" y1="113" x2="917.5" y2="146" stroke="#FFFFFF" strokeWidth="2" />
          {/* Glass Diagonal Reflection */}
          <polygon points="902,83 911,94 908,131 901,118" fill="#FFFFFF" opacity="0.38" />
          {/* 3D Window Sill */}
          <polygon points="894,152 920,208 915,212 892,156" fill="#B47B48" />
        </g>

        {/* Window 3 (Near/Back - right next to Stranger Photographer NPC) */}
        <g>
          <polygon points="926,96 954,136 954,324 926,242" fill="#78471E" />
          <polygon points="929,103 950,140 950,312 929,237" fill="url(#sdWindowSky)" />
          <ellipse cx="941" cy="265" rx="8" ry="30" fill="#65A30D" opacity="0.85" />
          <line x1="929" y1="174" x2="950" y2="228" stroke="#FFFFFF" strokeWidth="2.4" />
          <polygon points="932,126 943,145 939,198 931,175" fill="#FFFFFF" opacity="0.38" />
          {/* 3D Window Sill */}
          <polygon points="924,242 954,324 947,330 921,248" fill="#B47B48" />
        </g>

        {/* ================= 6. FRONT-OF-CLASS 3D INDONESIAN SD LANDMARKS ================= */}
        {/* 3D Raised Front Teacher Platform (Panggung Depan Kelas) */}
        <g>
          <polygon points="230,210 730,210 738,218 222,218" fill="#1E293B" opacity="0.16" />
          {/* Top Tiled Platform Surface */}
          <polygon points="236,182 724,182 734,206 226,206" fill="#F4F1EA" stroke="#D6CFC2" strokeWidth="1" />
          {/* 3D Step Front Bevel Riser */}
          <polygon points="226,206 734,206 734,213 226,213" fill="#B8B0A0" />
          {/* Yellow/Amber Anti-Slip Step Nose Line */}
          <line x1="227" y1="206.5" x2="733" y2="206.5" stroke="#EAB308" strokeWidth="2" />
        </g>

        {/* Simbol Nasional 3D: Foto Presiden, Garuda Pancasila & Foto Wapres */}
        <g>
          {/* Left Frame: Foto Presiden */}
          <rect x="417" y="24" width="22" height="28" rx="1.5" fill="rgba(0,0,0,0.18)" />
          <rect x="415" y="22" width="22" height="28" rx="1.5" fill="#92400E" stroke="#F59E0B" strokeWidth="1" />
          <rect x="417.5" y="24.5" width="17" height="23" fill="#FEFCE8" />
          <circle cx="426" cy="32" r="3.5" fill="#D97706" />
          <path d="M 420,44 C 420,38 432,38 432,44 Z" fill="#1E293B" />

          {/* Center Emblem: 3D Garuda Pancasila */}
          <circle cx="481" cy="36" r="15" fill="rgba(0,0,0,0.18)" />
          <circle cx="480" cy="34.5" r="15" fill="#FFFBEB" stroke="#D97706" strokeWidth="2.2" />
          {/* Golden Eagle Wings & Shield */}
          <path
            d="M 469,33 Q 473,26 480,31 Q 487,26 491,33 Q 487,40 480,42 Q 473,40 469,33 Z"
            fill="#F59E0B"
          />
          <rect x="477" y="31.2" width="6" height="7" rx="1" fill="#DC2626" stroke="#FFFFFF" strokeWidth="0.7" />
          <circle cx="480" cy="34.7" r="1.3" fill="#FACC15" />

          {/* Right Frame: Foto Wakil Presiden */}
          <rect x="523" y="24" width="22" height="28" rx="1.5" fill="rgba(0,0,0,0.18)" />
          <rect x="521" y="22" width="22" height="28" rx="1.5" fill="#92400E" stroke="#F59E0B" strokeWidth="1" />
          <rect x="523.5" y="24.5" width="17" height="23" fill="#FEFCE8" />
          <circle cx="532" cy="32" r="3.5" fill="#D97706" />
          <path d="M 526,44 C 526,38 538,38 538,44 Z" fill="#334155" />
        </g>

        {/* 3D Round Classroom Wall Clock (Jam Dinding SD) */}
        <g transform="translate(246, 44)">
          <circle cx="1.5" cy="2" r="14" fill="rgba(0,0,0,0.18)" />
          <circle cx="0" cy="0" r="14" fill="#DC2626" />
          <circle cx="0" cy="0" r="11" fill="#FFFFFF" />
          <line x1="0" y1="0" x2="-4.8" y2="3.2" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2="-7.8" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="0" cy="0" r="1.4" fill="#DC2626" />
        </g>

        {/* Papan Absensi Kehadiran Siswa on Right of Whiteboard */}
        <g transform="translate(712, 58)">
          <rect x="2" y="2" width="46" height="38" rx="2" fill="rgba(0,0,0,0.15)" />
          <rect x="0" y="0" width="46" height="38" rx="2" fill="#FFFFFF" stroke="#8B5A2B" strokeWidth="2" />
          <rect x="3" y="3" width="40" height="8" rx="1" fill="#059669" />
          <text x="23" y="8.8" textAnchor="middle" fontSize="4.8" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">
            PAPAN ABSEN
          </text>
          <line x1="5" y1="17" x2="41" y2="17" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="5" y1="23" x2="41" y2="23" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="5" y1="29" x2="41" y2="29" stroke="#CBD5E1" strokeWidth="1.2" />
          <text x="23" y="35" textAnchor="middle" fontSize="4.8" fontWeight="800" fill="#0F172A" fontFamily="sans-serif">
            Hadir: 28 · Sakit: 0
          </text>
        </g>

        {/* 3D LARGE MAGNETIC WHITEBOARD (Papan Tulis Putih Proporsional 3D - Taller & Less Elongated) */}
        <g>
          {/* Cast Wall Shadow */}
          <rect x="299" y="55" width="362" height="97" rx="4" fill="rgba(15,23,42,0.22)" />
          {/* 3D Extruded Brushed Aluminum Outer Frame */}
          <rect x="296" y="51" width="362" height="96" rx="4" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.8" />
          {/* Inner Porcelain Writing Surface */}
          <rect x="304" y="58" width="346" height="82" rx="2" fill="url(#sdWhiteboard)" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Glossy Glass Diagonal Sheen */}
          <polygon points="345,58 415,58 360,140 290,140" fill="#FFFFFF" opacity="0.55" />

          {/* Authentic SD Classroom Handwriting & Lesson Diagram */}
          <text x="316" y="71" fontSize="7" fontWeight="700" fill="#334155" fontFamily="sans-serif">
            Selasa, 30 Oktober
          </text>
          <text x="638" y="71" textAnchor="end" fontSize="7" fontWeight="800" fill="#0F766E" fontFamily="sans-serif">
            Kelas V-A · SD Negeri SafeStep
          </text>
          <line x1="314" y1="76" x2="640" y2="76" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2" />

          <text x="480" y="93" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1E3A8A" fontFamily="sans-serif" letterSpacing="0.5">
            MATERI TEMATIK: KESELAMATAN DIRI ANAK
          </text>

          <rect x="348" y="102" width="264" height="23" rx="5" fill="#FEF9C3" stroke="#F59E0B" strokeWidth="1.3" />
          <text x="480" y="117.5" textAnchor="middle" fontSize="11" fontWeight="900" fill="#991B1B" fontFamily="sans-serif">
            ATURAN 3L: TOLAK · LARI · LAPORKAN!
          </text>

          {/* Colorful 3D Round Whiteboard Magnets */}
          <circle cx="320" cy="128" r="3.8" fill="#EF4444" />
          <circle cx="332" cy="128" r="3.8" fill="#3B82F6" />
          <circle cx="344" cy="128" r="3.8" fill="#10B981" />
          <circle cx="632" cy="128" r="3.8" fill="#F59E0B" />

          {/* 3D Protruding Aluminum Marker Tray & Markers */}
          <polygon points="360,147 600,147 608,154 352,154" fill="#94A3B8" stroke="#475569" strokeWidth="1.1" />
          {/* Board Markers & Magnetic Eraser */}
          <rect x="390" y="148" width="26" height="3.5" rx="1.5" fill="#1D4ED8" />
          <rect x="426" y="148" width="26" height="3.5" rx="1.5" fill="#DC2626" />
          <rect x="462" y="148" width="26" height="3.5" rx="1.5" fill="#0F172A" />
          <rect x="528" y="144" width="32" height="7.5" rx="1.8" fill="#FACC15" stroke="#1E293B" strokeWidth="1" />
          <rect x="528" y="149" width="32" height="3" fill="#1E293B" />
        </g>

        {/* FRONT-LEFT: Tiang Bendera Merah Putih Kelas & 3D Lemari Buku Kayu */}
        <g>
          {/* Wooden Corner Pedestal & Indoor Flag */}
          <ellipse cx="120" cy="198" rx="14" ry="5" fill="rgba(0,0,0,0.22)" />
          <polygon points="109,191 131,191 135,198 105,198" fill="#78350F" />
          <rect x="118.5" y="70" width="3.5" height="125" fill="#B45309" />
          <circle cx="120" cy="68" r="3.5" fill="#FBBF24" />
          {/* Draped 3D Red-and-White Flag */}
          <path d="M 122,72 Q 138,83 133,112 L 122,107 Z" fill="#DC2626" />
          <path d="M 125,90 Q 137,101 134,120 L 122,115 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.7" />

          {/* 3D Tall Teak Classroom Storage Cabinet (Lemari Kelas - Proportional Height) */}
          <ellipse cx="174" cy="197" rx="40" ry="9" fill="url(#sdSoftShadow)" />
          {/* Cabinet Left 3D Side Depth */}
          <polygon points="135,78 144,74 144,188 135,193" fill="#7C4D25" />
          {/* Cabinet Main Front */}
          <rect x="144" y="74" width="62" height="116" rx="2" fill="#B47642" stroke="#6E421F" strokeWidth="1.5" />
          {/* Upper Glass Shelves with Colorful Textbooks */}
          <rect x="149" y="81" width="24" height="48" rx="1" fill="#E0F2FE" stroke="#7C4D25" strokeWidth="1.2" />
          <rect x="177" y="81" width="24" height="48" rx="1" fill="#E0F2FE" stroke="#7C4D25" strokeWidth="1.2" />
          {/* Books inside Glass Cabinet */}
          <rect x="151" y="91" width="4.5" height="13" fill="#EF4444" />
          <rect x="157" y="88" width="4.5" height="16" fill="#3B82F6" />
          <rect x="163" y="92" width="4.5" height="12" fill="#10B981" />
          <rect x="180" y="90" width="5.5" height="14" fill="#F59E0B" />
          <rect x="187" y="93" width="5.5" height="11" fill="#8B5CF6" />
          <line x1="149" y1="105" x2="173" y2="105" stroke="#7C4D25" strokeWidth="1.5" />
          <line x1="177" y1="105" x2="201" y2="105" stroke="#7C4D25" strokeWidth="1.5" />
          {/* Lower Wood Doors */}
          <rect x="149" y="137" width="24" height="47" rx="1" fill="#9A6030" />
          <rect x="177" y="137" width="24" height="47" rx="1" fill="#9A6030" />
          <circle cx="170" cy="160" r="1.6" fill="#FBBF24" />
          <circle cx="180" cy="160" r="1.6" fill="#FBBF24" />
          {/* Golden Class Trophies on Top of Cabinet */}
          <polygon points="158,74 167,74 165,70 160,70" fill="#78350F" />
          <circle cx="162.5" cy="65" r="4.5" fill="#FACC15" />
          <polygon points="181,74 188,74 187,71 182,71" fill="#78350F" />
          <circle cx="184.5" cy="67" r="3.5" fill="#F59E0B" />
        </g>

        {/* FRONT-RIGHT: 3D Teacher's Desk & Chair (Meja & Kursi Guru Proporsional) */}
        <g>
          {/* Teacher Chair behind the desk */}
          <rect x="722" y="144" width="36" height="26" rx="4" fill="#475569" stroke="#1E293B" strokeWidth="1.4" />
          <rect x="726" y="148" width="28" height="15" rx="2" fill="#64748B" />

          {/* Floor Shadow under Teacher Desk */}
          <ellipse cx="738" cy="228" rx="72" ry="13" fill="url(#sdSoftShadow)" />

          {/* 3D Teacher Desk Base & Side Drawer Pedestal */}
          <rect x="678" y="190" width="122" height="40" fill="url(#sdTeakFront)" stroke="#6E421F" strokeWidth="1.5" />
          {/* Right Drawer Stack */}
          <rect x="756" y="193" width="40" height="11" fill="#935A2D" stroke="#6E421F" strokeWidth="1.1" />
          <rect x="756" y="206" width="40" height="11" fill="#935A2D" stroke="#6E421F" strokeWidth="1.1" />
          <rect x="756" y="219" width="40" height="10" fill="#935A2D" stroke="#6E421F" strokeWidth="1.1" />
          <rect x="772" y="197" width="8" height="2.2" rx="1" fill="#FDE047" />
          <rect x="772" y="210" width="8" height="2.2" rx="1" fill="#FDE047" />

          {/* 3D Overhanging Teak Tabletop (Adjusted depth and width for proportional look) */}
          <polygon
            points="674,166 798,166 806,190 666,190"
            fill="url(#sdTeakTop)"
            stroke="#8B5A2B"
            strokeWidth="1.5"
          />
          <rect x="666" y="190" width="140" height="5.5" fill="#9A6030" />

          {/* Decorative Green/Gold Batik Table Runner */}
          <polygon points="720,166 756,166 759,196 717,196" fill="#0D9488" opacity="0.88" />
          <line x1="717" y1="196" x2="759" y2="196" stroke="#FACC15" strokeWidth="2.2" />

          {/* Props on Teacher's Desk: Open 3D Laptop, Stack of Books & Flower Vase */}
          {/* 3D Open School Laptop */}
          <polygon points="682,157 708,157 706,174 680,174" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
          <polygon points="684,159 706,159 704.5,172 682.5,172" fill="#38BDF8" />
          <polygon points="680,174 706,174 710,180 677,180" fill="#CBD5E1" />

          {/* Stacked Class Registers (Buku Nilai & Absen) */}
          <rect x="725" y="171" width="24" height="5.5" rx="1" fill="#2563EB" />
          <rect x="727" y="166" width="22" height="5" rx="1" fill="#EF4444" />

          {/* 3D Ceramic Flower Vase */}
          <ellipse cx="780" cy="175" rx="6.5" ry="7.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
          <circle cx="777" cy="164" r="4.2" fill="#F43F5E" />
          <circle cx="783" cy="163" r="4.2" fill="#FBBF24" />
          <circle cx="780" cy="160" r="4" fill="#EC4899" />
          <path d="M 780,169 L 780,164" stroke="#16A34A" strokeWidth="2.2" />
        </g>

        {/* ================= 7. POJOK BACA 3D (BACK-LEFT READING CORNER) ================= */}
        <g>
          {/* 3D Perspective Colorful EVA Foam Puzzle Carpet */}
          <polygon points="38,396 162,396 150,458 18,458" fill="#F87171" stroke="#DC2626" strokeWidth="1.2" />
          <polygon points="100,396 162,396 156,427 94,427" fill="#60A5FA" />
          <polygon points="28,427 94,427 88,458 18,458" fill="#FACC15" />
          <polygon points="94,427 156,427 150,458 88,458" fill="#4ADE80" />
          {/* 3D Carpet Thickness Edge */}
          <polygon points="18,458 150,458 150,463 18,463" fill="#991B1B" opacity="0.45" />

          {/* 3D Low Wooden Reading Shelf with Colorful Books & Globe */}
          <polygon points="28,342 62,298 62,386 28,440" fill="#A46B39" stroke="#6E421F" strokeWidth="1.4" />
          <polygon points="62,298 82,298 82,386 62,386" fill="#855127" stroke="#6E421F" strokeWidth="1.2" />
          {/* Colorful Storybooks on Shelf */}
          <polygon points="34,362 58,330 58,350 34,382" fill="#3B82F6" />
          <polygon points="34,394 58,360 58,380 34,414" fill="#F59E0B" />
          {/* 3D Mini Globe on Top */}
          <circle cx="56" cy="294" r="9" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.1" />
          <path d="M 50,292 Q 56,288 60,294 Q 57,300 51,298 Z" fill="#22C55E" />
          <path d="M 50,305 L 62,305" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" />

          {/* Label Sign on Reading Corner */}
          <rect x="46" y="466" width="84" height="14" rx="4" fill="#ECFDF5" stroke="#10B981" strokeWidth="1" />
          <text x="88" y="475.5" textAnchor="middle" fontSize="7" fontWeight="900" fill="#065F46" fontFamily="sans-serif">
            POJOK BACA SD
          </text>
        </g>

        {/* ================= 8. 3D WOODEN SD STUDENT DESKS, CHAIRS & BACKPACKS (PROPORTIONAL 3D) ================= */}
        {DESK_ROWS.map((desk, idx) => (
          <g key={idx}>
            <StudentDesk3D desk={desk} />
          </g>
        ))}

        {/* ================= 9. ENTRANCE DOORWAY, SHOE RACK & SORTED TRASH BINS ================= */}
        {/* Bottom-Right: 3D Wooden Shoe Rack & Dual Sorted Trash Bins */}
        <g>
          {/* 3D Wooden Shoe Rack (Rak Sepatu Kelas) */}
          <ellipse cx="820" cy="508" rx="42" ry="8" fill="url(#sdSoftShadow)" />
          <polygon points="782,472 858,472 864,484 776,484" fill="#D79F69" stroke="#7C4D25" strokeWidth="1.2" />
          <rect x="778" y="484" width="82" height="24" fill="#9A6030" stroke="#6E421F" strokeWidth="1.2" />
          <line x1="780" y1="496" x2="859" y2="496" stroke="#6E421F" strokeWidth="2" />
          {/* Mini 3D Shoes on Rack */}
          <ellipse cx="794" cy="491" rx="6" ry="3" fill="#1E293B" />
          <ellipse cx="808" cy="491" rx="6" ry="3" fill="#1E293B" />
          <ellipse cx="828" cy="491" rx="6" ry="3" fill="#DC2626" />
          <ellipse cx="842" cy="491" rx="6" ry="3" fill="#DC2626" />
          <ellipse cx="801" cy="502" rx="6" ry="3" fill="#2563EB" />
          <ellipse cx="836" cy="502" rx="6" ry="3" fill="#1E293B" />

          {/* 3D Dual Trash Bins (Organik Hijau & Anorganik Kuning) */}
          <g transform="translate(878, 464)">
            {/* Green Organic Bin */}
            <ellipse cx="12" cy="44" rx="12" ry="4" fill="rgba(0,0,0,0.2)" />
            <polygon points="2,14 22,14 20,43 4,43" fill="#16A34A" stroke="#14532D" strokeWidth="1.1" />
            <ellipse cx="12" cy="14" rx="11" ry="4" fill="#4ADE80" stroke="#14532D" strokeWidth="1" />
            {/* Yellow Inorganic Bin */}
            <ellipse cx="38" cy="48" rx="12" ry="4" fill="rgba(0,0,0,0.2)" />
            <polygon points="28,18 48,18 46,47 30,47" fill="#EAB308" stroke="#713F12" strokeWidth="1.1" />
            <ellipse cx="38" cy="18" rx="11" ry="4" fill="#FEF08A" stroke="#713F12" strokeWidth="1" />
          </g>
        </g>

        {/* Bottom-Center: 3D Open Classroom Doorway Threshold & Welcome Mat */}
        <g>
          {/* 3D Teak Door Frame Pillars at Bottom Threshold */}
          <rect x="408" y="516" width="14" height="24" fill="#78350F" />
          <rect x="538" y="516" width="14" height="24" fill="#78350F" />
          {/* Coir Doormat (Keset Pintu Kelas) */}
          <polygon
            points="426,506 524,506 532,536 418,536"
            fill="#B45309"
            stroke="#78350F"
            strokeWidth="2"
          />
          <polygon points="432,510 518,510 524,532 426,532" fill="#D97706" />
          <text x="475" y="524" textAnchor="middle" fontSize="7" fontWeight="900" fill="#FEF3C7" fontFamily="sans-serif" letterSpacing="1">
            KELAS V-A
          </text>
        </g>

        {/* ================= 10. VOLUMETRIC 3D MORNING SUNBEAMS FROM RIGHT WINDOWS ================= */}
        <polygon points="890,52 890,122 620,268 575,206" fill="url(#sdSunbeam)" />
        <polygon points="918,88 918,198 595,402 535,312" fill="url(#sdSunbeam)" />
        <polygon points="950,136 950,310 575,528 502,440" fill="url(#sdSunbeam)" />
      </svg>
    </div>
  );
}

function StudentDesk3D({ desk }: { desk: DeskConfig }) {
  const { x, y, width, depth, label, bookColorLeft, bookColorRight, bottleColor, bagColorLeft, bagColorRight } = desk;
  const overhang = 5;
  const frontY = y + depth;
  const legHeight = 26;

  const leftChairX = x + width * 0.12;
  const rightChairX = x + width * 0.56;
  const chairW = width * 0.32;
  const chairY = frontY - 6;

  return (
    <g>
      {/* 1. Ambient Occlusion Floor Shadow under Desk & Chairs */}
      <ellipse
        cx={x + width / 2}
        cy={frontY + legHeight + 5}
        rx={width * 0.54}
        ry={14}
        fill="url(#sdSoftShadow)"
      />

      {/* 2. Desk Tapered Wooden Legs */}
      <rect x={x + 6} y={frontY} width="6" height={legHeight} rx="1.5" fill="#6E421F" />
      <rect x={x + width - 12} y={frontY} width="6" height={legHeight} rx="1.5" fill="#6E421F" />
      {/* Center Divider Leg */}
      <rect x={x + width / 2 - 2.5} y={frontY} width="5" height={legHeight - 3} rx="1" fill="#5C3618" />

      {/* 3. 3D Under-Desk Book Cubby (Kolong Meja Kayu SD) */}
      <rect
        x={x + 8}
        y={frontY - 2}
        width={width - 16}
        height="14"
        rx="1.5"
        fill="#4A2B12"
        stroke="#7C4D25"
        strokeWidth="1.2"
      />
      {/* Books peeking inside the cubby */}
      <rect x={x + 18} y={frontY + 4} width="24" height="4.5" rx="1" fill="#FDE047" opacity="0.85" />
      <rect x={x + width - 44} y={frontY + 4} width="24" height="4.5" rx="1" fill="#93C5FD" opacity="0.85" />

      {/* 4. 3D Perspective Beveled Teak Tabletop (Natural double-desk SD proportions) */}
      <polygon
        points={`${x},${y} ${x + width},${y} ${x + width + overhang},${frontY} ${x - overhang},${frontY}`}
        fill="url(#sdTeakTop)"
        stroke="#8B5A2B"
        strokeWidth="1.4"
      />
      {/* Tabletop Front 3D Thickness Lip */}
      <rect
        x={x - overhang}
        y={frontY}
        width={width + overhang * 2}
        height="5.5"
        rx="1"
        fill="#9A6030"
        stroke="#6E421F"
        strokeWidth="1"
      />
      {/* Subtle Wood Grain Highlight */}
      <line
        x1={x + 10}
        y1={y + 6}
        x2={x + width - 10}
        y2={y + 6}
        stroke="#FFFBEB"
        strokeWidth="1.2"
        opacity="0.35"
      />
      {/* Dual-Desk Center Seam */}
      <line
        x1={x + width / 2}
        y1={y + 1}
        x2={x + width / 2}
        y2={frontY}
        stroke="#8B5A2B"
        strokeWidth="1"
        opacity="0.45"
      />

      {/* 5. 3D School Supplies on Top of Desk */}
      {/* Left Student's Open Notebook & Colored Textbook */}
      <g transform={`translate(${x + 14}, ${y + 10})`}>
        <polygon points="2,0 26,0 28,19 0,19" fill={bookColorLeft} />
        <polygon points="4,2 25,2 26.5,17 2,17" fill="#FFFFFF" />
        <line x1="14.5" y1="2" x2="14.5" y2="17" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="6" y1="6.5" x2="12" y2="6.5" stroke="#94A3B8" strokeWidth="0.9" />
        <line x1="6" y1="10" x2="12" y2="10" stroke="#94A3B8" strokeWidth="0.9" />
        <line x1="17" y1="6.5" x2="23" y2="6.5" stroke="#94A3B8" strokeWidth="0.9" />
        {/* Pencil beside notebook */}
        <line x1="33" y1="3" x2="36" y2="17" stroke="#FACC15" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Right Student's Textbook, Pencil Case & 3D Water Bottle */}
      <g transform={`translate(${x + width / 2 + 12}, ${y + 10})`}>
        <polygon points="2,1 24,1 26,19 0,19" fill={bookColorRight} />
        <rect x="5" y="4" width="14" height="5.5" rx="1" fill="#FFFFFF" opacity="0.88" />
        {/* 3D Pencil Case */}
        <rect x="30" y="10" width="18" height="7" rx="2.5" fill="#F43F5E" />
        <line x1="32" y1="13.5" x2="46" y2="13.5" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.7" />
      </g>

      {/* 3D Standing Kid Water Tumbler (Botol Minum) */}
      <g transform={`translate(${x + width - 20}, ${y + 5})`}>
        <ellipse cx="5" cy="18" rx="4.8" ry="2" fill="rgba(0,0,0,0.2)" />
        <rect x="1" y="4" width="8" height="14" rx="3" fill={bottleColor} />
        <rect x="2.2" y="1" width="5.6" height="4" rx="1.4" fill="#F8FAFC" />
        <line x1="3" y1="6" x2="3" y2="15" stroke="#FFFFFF" strokeWidth="1.1" opacity="0.55" strokeLinecap="round" />
      </g>

      {/* Neat Nameplate Tag on Desk */}
      <g transform={`translate(${x + width / 2}, ${y + depth - 8})`}>
        <rect x="-30" y="-5" width="60" height="9.5" rx="3" fill="rgba(255,255,255,0.92)" stroke="#D6C7B2" strokeWidth="0.8" />
        <text x="0" y="2" textAnchor="middle" fontSize="6.2" fontWeight="900" fill="#292524" fontFamily="sans-serif">
          {label}
        </text>
      </g>

      {/* 6. TWO 3D WOODEN STUDENT CHAIRS FACING WHITEBOARD (VIEWED FROM ELEVATED REAR 3D ANGLE) */}
      <Chair3D x={leftChairX} y={chairY} width={chairW} bagColor={bagColorLeft} />
      <Chair3D x={rightChairX} y={chairY} width={chairW} bagColor={bagColorRight} />
    </g>
  );
}

function Chair3D({
  x,
  y,
  width,
  bagColor,
}: {
  x: number;
  y: number;
  width: number;
  bagColor?: string;
}) {
  return (
    <g>
      {/* Wooden Seat Cushion peeking forward */}
      <rect
        x={x + 2}
        y={y + 6}
        width={width - 4}
        height="10"
        rx="2"
        fill="#C2864E"
        stroke="#6E421F"
        strokeWidth="1.1"
      />
      {/* Rear Chair Legs */}
      <rect x={x + 3} y={y + 4} width="4.5" height="24" rx="1.2" fill="#7C4D25" />
      <rect x={x + width - 7.5} y={y + 4} width="4.5" height="24" rx="1.2" fill="#7C4D25" />
      {/* Curved 3D Wooden Backrest Slat */}
      <rect
        x={x + 1}
        y={y + 2}
        width={width - 2}
        height="10"
        rx="2.5"
        fill="#B47642"
        stroke="#6E421F"
        strokeWidth="1.1"
      />
      <line
        x1={x + 4}
        y1={y + 4.5}
        x2={x + width - 4}
        y2={y + 4.5}
        stroke="#FDE68A"
        strokeWidth="1"
        opacity="0.35"
      />

      {/* Optional 3D Student Backpack (Tas Sekolah SD) Hanging on Chair Backrest */}
      {bagColor && (
        <g transform={`translate(${x + width * 0.18}, ${y + 5})`}>
          {/* Shoulder Straps hooking over chair */}
          <path d="M 3,-2 Q 5,3 3,6 M 21,-2 Q 19,3 21,6" stroke="#1E293B" strokeWidth="1.8" fill="none" />
          {/* 3D Puffy Backpack Body */}
          <rect x="0" y="1" width="24" height="19" rx="5" fill={bagColor} stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
          {/* Top Highlight Dome */}
          <ellipse cx="12" cy="5" rx="8" ry="2.5" fill="#FFFFFF" opacity="0.26" />
          {/* 3D Front Zippered Pocket */}
          <rect x="3.5" y="8.5" width="17" height="8.5" rx="3" fill="rgba(0,0,0,0.18)" />
          <line x1="5.5" y1="11" x2="18.5" y2="11" stroke="#FDE047" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}
