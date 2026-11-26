/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Realistic 3D Oblique-Perspective Indonesian Elementary School Courtyard
 * ("Halaman Sekolah — SD Negeri SafeStep")
 *
 * Masterplan 5-Zone Coordinate Alignment (viewBox 900 x 600 === 100% x 100%):
 * 1. Zona Gerbang & Pos Satpam (Kiri Bawah):
 *    - Pos Satpam permanen semen & kaca (x=54..188, y=434..554)
 *    - Gerbang besi utama & pagar keliling (y=548..596, bukaan gerbang x=346..488)
 *    - NPC: school-npc-1 ("Tamu di Gerbang") @ x=27% (243), y=87% (522)
 * 2. Zona Tiang Bendera & Rumput Utama (Kiri Tengah):
 *    - Podium semen/keramik 3 tingkat + Tiang Bendera Merah Putih @ x=186, y=282
 *    - Rumput gajah mini rapi + jalan setapak batu pipih (stepping stones)
 *    - NPC: school-npc-4 ("Pengunjung Halaman") @ x=27% (243), y=58% (348)
 * 3. Zona Lapangan Serbaguna Realistis (Area Kanan):
 *    - Terintegrasi arsitektural (bukan tempelan stiker) dengan kanstin beton & drainase
 *    - Aspal/semen cat hijau-oranye + garis marka putih + 2 ring basket besi permanen
 *    - NPC: school-npc-5 ("Kakak Kelas") @ x=74% (666), y=46% (276)
 * 4. Zona Taman & Pojok Bersantai (Kanan Bawah):
 *    - Pohon peneduh rindang + lingkaran semen tempat duduk mengelilingi pohon @ x=782, y=482
 *    - Bangku taman kayu @ x=598, y=444 + jalan setapak semen & taman bunga warna-warni
 *    - NPC: school-npc-3 ("Teman di Taman") @ x=72% (648), y=81% (486)
 * 5. Zona Akses Utama & Koridor Sekolah (Bagian Atas):
 *    - Gedung SD 1 lantai memanjang (hijau-putih/krem-putih), atap genteng merah bervolume
 *    - Koridor ubin keramik berelevasi lebih tinggi + tiang penyangga + tangga semen ke Kelas V-A & V-B
 *    - NPC: school-npc-2 ("Petugas Sekolah") @ x=62% (558), y=23% (138)
 *    - Exit: "Ke Kelas ↑" @ x=47% (423), y=14% (84) | "Ke Jalan →" @ x=92% (828), y=62% (372)
 */

interface RealisticTreeProps {
  cx: number;
  baseY: number;
  scale?: number;
  withCircularBench?: boolean;
}

function RealisticSchoolTree({
  cx,
  baseY,
  scale = 1,
  withCircularBench = false,
}: RealisticTreeProps) {
  return (
    <g transform={`translate(${cx}, ${baseY}) scale(${scale})`}>
      {/* Soft dappled canopy ground shadow */}
      <ellipse
        cx={withCircularBench ? -8 : -6}
        cy={6}
        rx={withCircularBench ? 64 : 46}
        ry={withCircularBench ? 24 : 17}
        fill="#1E3A1E"
        opacity="0.24"
      />

      {/* Optional Circular Concrete Seating Planter (Zona 4 Taman & Pojok Bersantai) */}
      {withCircularBench && (
        <g>
          {/* Outer concrete cylinder shadow */}
          <ellipse cx="0" cy="8" rx="46" ry="18" fill="#0F172A" opacity="0.2" />
          {/* Concrete bench vertical wall */}
          <path
            d="M -44,-2 L -44,8 A 44,16 0 0,0 44,8 L 44,-2 Z"
            fill="url(#syConcreteRiser)"
            stroke="#64748B"
            strokeWidth="1.2"
          />
          {/* Concrete circular seat top */}
          <ellipse
            cx="0"
            cy="-2"
            rx="44"
            ry="16"
            fill="url(#syConcreteSeat)"
            stroke="#94A3B8"
            strokeWidth="1.3"
          />
          {/* Radial concrete bench joint lines */}
          <line x1="-43" y1="-2" x2="-28" y2="-2" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="28" y1="-2" x2="43" y2="-2" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="0" y1="10" x2="0" y2="14" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="-26" y1="7" x2="-31" y2="10" stroke="#CBD5E1" strokeWidth="1" />
          <line x1="26" y1="7" x2="31" y2="10" stroke="#CBD5E1" strokeWidth="1" />
          {/* Inner soil bed ring */}
          <ellipse
            cx="0"
            cy="-3"
            rx="27"
            ry="9.5"
            fill="#4A321F"
            stroke="#78716C"
            strokeWidth="1.2"
          />
          <ellipse cx="-2" cy="-3.5" rx="22" ry="7" fill="#5C3D26" opacity="0.8" />
        </g>
      )}

      {/* Natural root flare & organic bark trunk */}
      <path
        d="M -11,-2 C -8,-18 -7,-44 -7,-66 C -7,-78 -18,-88 -25,-98 C -27,-101 -23,-104 -20,-101 C -13,-93 -6,-85 -3,-75 C -1,-86 8,-96 18,-103 C 21,-105 24,-102 21,-99 C 14,-90 6,-79 6,-66 C 6,-44 8,-18 11,-2 C 5,2 -5,2 -11,-2 Z"
        fill="url(#syTrunkBark)"
      />
      {/* Bark highlight & texture */}
      <path
        d="M -2,-6 C -2,-26 -2,-50 -1,-70"
        stroke="#9A6B43"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M 4,-12 C 3,-32 3,-52 4,-66"
        stroke="#3E220E"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Deep Back Canopy Shadow Layer */}
      <g>
        <ellipse cx="-28" cy="-94" rx="28" ry="20" fill="url(#syLeafDeep)" />
        <ellipse cx="28" cy="-92" rx="29" ry="20" fill="url(#syLeafDeep)" />
        <ellipse cx="0" cy="-84" rx="38" ry="22" fill="url(#syLeafDeep)" />
      </g>

      {/* Mid Foliage Clusters */}
      <g>
        <ellipse cx="-32" cy="-102" rx="26" ry="19" fill="url(#syLeafMid)" />
        <ellipse cx="30" cy="-100" rx="27" ry="19" fill="url(#syLeafMid)" />
        <ellipse cx="-14" cy="-118" rx="28" ry="21" fill="url(#syLeafMid)" />
        <ellipse cx="16" cy="-116" rx="27" ry="20" fill="url(#syLeafMid)" />
        <ellipse cx="0" cy="-96" rx="34" ry="21" fill="url(#syLeafMid)" />
      </g>

      {/* Sunlit Upper-Right & Crown Foliage Clusters */}
      <g>
        <ellipse cx="-18" cy="-106" rx="21" ry="15" fill="url(#syLeafSun)" />
        <ellipse cx="18" cy="-108" rx="23" ry="16" fill="url(#syLeafSun)" />
        <ellipse cx="2" cy="-130" rx="26" ry="19" fill="url(#syLeafCrown)" />
        <ellipse cx="12" cy="-124" rx="18" ry="13" fill="#D9F99D" opacity="0.45" />
        <ellipse cx="-10" cy="-124" rx="15" ry="11" fill="#BEF264" opacity="0.38" />
      </g>

      {/* Crisp organic leaf cluster accents */}
      <path
        d="M -42,-96 Q -24,-84 -4,-90 Q 18,-82 40,-94"
        fill="none"
        stroke="#2D5A18"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M -22,-132 Q 2,-144 22,-128"
        fill="none"
        stroke="#ECFCCB"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </g>
  );
}

interface FlowerClusterProps {
  x: number;
  y: number;
  colors?: [string, string, string];
  scale?: number;
}

function FlowerBedCluster({
  x,
  y,
  colors = ["#F43F5E", "#FACC15", "#FB923C"],
  scale = 1,
}: FlowerClusterProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="4" rx="20" ry="7" fill="#1E3A1E" opacity="0.22" />
      <ellipse cx="-9" cy="0" rx="10" ry="6.5" fill="#2F6F28" />
      <ellipse cx="9" cy="0" rx="10" ry="6.5" fill="#3A8431" />
      <ellipse cx="0" cy="-2" rx="12" ry="7.5" fill="#4D9E3F" />
      {/* Blossoms */}
      <circle cx="-10" cy="-2" r="3" fill={colors[0]} />
      <circle cx="-10" cy="-2" r="1.1" fill="#FEF08A" />
      <circle cx="-2" cy="-5" r="3.2" fill={colors[1]} />
      <circle cx="-2" cy="-5" r="1.1" fill="#FFFBEB" />
      <circle cx="7" cy="-3" r="3" fill={colors[2]} />
      <circle cx="7" cy="-3" r="1.1" fill="#FEF08A" />
      <circle cx="13" cy="1" r="2.5" fill={colors[0]} />
      <circle cx="-4" cy="2" r="2.6" fill={colors[2]} />
    </g>
  );
}

export default function Schoolyard3DScene() {
  // Paving block horizontal perspective rows along Main Road (x tapers from 366..474 at top to 344..492 at bottom)
  const mainPavingRows = Array.from({ length: 18 }, (_, i) => {
    const t = i / 17;
    const y = 140 + Math.pow(t, 1.08) * 456;
    const xLeft = 366 - t * 22;
    const xRight = 474 + t * 18;
    return { y, xLeft, xRight, rowIdx: i };
  });

  // Stepping stones from Main Paving Road (x=358, y=282) to 3-Tier Flagpole Podium (x=226, y=282)
  const steppingStones = [
    { cx: 344, cy: 283, rx: 11, ry: 6.5 },
    { cx: 319, cy: 280, rx: 11.5, ry: 6.8 },
    { cx: 294, cy: 284, rx: 11, ry: 6.5 },
    { cx: 269, cy: 281, rx: 11.5, ry: 6.8 },
    { cx: 244, cy: 283, rx: 11, ry: 6.5 },
  ];

  // Corridor pillars across the 1-story SD building
  const corridorPillars = [88, 224, 358, 474, 636, 796];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#68B43E]">
      <svg
        viewBox="0 0 900 600"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Lawn Grass Gradients (Rumput Gajah Mini) */}
          <linearGradient id="syGrassMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#84CC49" />
            <stop offset="48%" stopColor="#6BB83B" />
            <stop offset="100%" stopColor="#52992B" />
          </linearGradient>

          <linearGradient id="syGrassGarden" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7BC644" />
            <stop offset="100%" stopColor="#4E9428" />
          </linearGradient>

          {/* Main Paving Block Surface */}
          <linearGradient id="syPavingMain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DFDDD6" />
            <stop offset="50%" stopColor="#EAE8E1" />
            <stop offset="100%" stopColor="#D4D0C7" />
          </linearGradient>

          {/* Brushed Concrete Walkway Surface */}
          <linearGradient id="syConcreteWalk" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="55%" stopColor="#DDE1E6" />
            <stop offset="100%" stopColor="#CBD2D9" />
          </linearGradient>

          <linearGradient id="syConcreteSeat" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="syConcreteRiser" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Realistic Painted Concrete/Asphalt Sports Court Gradients */}
          <linearGradient id="syCourtApron" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E57C3E" />
            <stop offset="55%" stopColor="#D4682C" />
            <stop offset="100%" stopColor="#BC5620" />
          </linearGradient>

          <linearGradient id="syCourtGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3D8D66" />
            <stop offset="50%" stopColor="#317856" />
            <stop offset="100%" stopColor="#266346" />
          </linearGradient>

          <linearGradient id="sySteelPost" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="45%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* School Building Gradients */}
          <linearGradient id="syRoofTerracotta" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E3533D" />
            <stop offset="58%" stopColor="#C53B28" />
            <stop offset="100%" stopColor="#932416" />
          </linearGradient>

          <linearGradient id="syWallCream" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDF9EE" />
            <stop offset="100%" stopColor="#F3EBD6" />
          </linearGradient>

          <linearGradient id="syWallSchoolGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5BB084" />
            <stop offset="100%" stopColor="#3F8D65" />
          </linearGradient>

          <linearGradient id="syCorridorTile" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E7E5DF" />
            <stop offset="100%" stopColor="#F7F5F0" />
          </linearGradient>

          <linearGradient id="syFoundationStone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Tree Gradients */}
          <linearGradient id="syTrunkBark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4A2811" />
            <stop offset="45%" stopColor="#7C4D27" />
            <stop offset="100%" stopColor="#3B1E0B" />
          </linearGradient>

          <linearGradient id="syLeafDeep" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#386B1D" />
            <stop offset="100%" stopColor="#1F420E" />
          </linearGradient>

          <linearGradient id="syLeafMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#65A830" />
            <stop offset="100%" stopColor="#3D7519" />
          </linearGradient>

          <linearGradient id="syLeafSun" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9BE145" />
            <stop offset="100%" stopColor="#5D9E28" />
          </linearGradient>

          <linearGradient id="syLeafCrown" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BEF264" />
            <stop offset="100%" stopColor="#74B832" />
          </linearGradient>

          {/* Morning Sunlight Ambient Glow (Top-Right) */}
          <radialGradient id="syMorningSun" cx="88%" cy="10%" r="55%">
            <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.46" />
            <stop offset="45%" stopColor="#FDE047" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ================= 0. BASE MINI ELEPHANT GRASS & MOWN LAWN TEXTURE ================= */}
        <rect x="0" y="0" width="900" height="600" fill="url(#syGrassMain)" />

        {/* Subtle neat mown grass stripes across Zona 2 (Left Lawn) & Zona 4 (Right-Bottom Park) */}
        {[165, 215, 265, 315, 365, 415, 465, 515].map((stripeY, idx) => (
          <rect
            key={idx}
            x="0"
            y={stripeY}
            width="900"
            height="24"
            fill="#FFFFFF"
            opacity="0.05"
          />
        ))}

        {/* Fine grass blade tufts on Left Lawn & Bottom-Right Garden */}
        {[
          [110, 204], [146, 238], [98, 318], [148, 356], [282, 214], [306, 344],
          [268, 396], [122, 408], [528, 424], [546, 518], [692, 526], [834, 516],
        ].map(([gx, gy], idx) => (
          <path
            key={idx}
            d={`M ${gx},${gy} l -3,-6 M ${gx},${gy} l 1,-7 M ${gx},${gy} l 4,-5`}
            stroke="#3B7A1E"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.55"
          />
        ))}

        {/* ================= 1. PAVED WALKWAYS & NAVIGATION ROUTES ================= */}

        {/* A. East Concrete Branch Walkway (Connects Main Paving Road -> Sports Court, Garden & East Exit) */}
        <polygon
          points="472,348 898,348 898,392 472,392"
          fill="url(#syConcreteWalk)"
          stroke="#94A3B8"
          strokeWidth="2"
        />
        {/* Concrete curb top & bottom along East Walkway */}
        <rect x="472" y="345" width="426" height="4" fill="#F8FAFC" />
        <rect x="472" y="391" width="426" height="4" fill="#94A3B8" />
        {[520, 572, 624, 676, 728, 780, 832].map((jx, idx) => (
          <line
            key={idx}
            x1={jx}
            y1="349"
            x2={jx}
            y2="391"
            stroke="#CBD5E1"
            strokeWidth="1.3"
          />
        ))}
        {/* East Side-Gate Brick/Cement Pillars Flanking Exit "Ke Jalan →" */}
        <g>
          <rect x="878" y="332" width="16" height="20" rx="1" fill="#FFFBEB" stroke="#64748B" strokeWidth="1.2" />
          <rect x="876" y="329" width="20" height="4" rx="1" fill="#DC2626" />
          <rect x="878" y="386" width="16" height="20" rx="1" fill="#FFFBEB" stroke="#64748B" strokeWidth="1.2" />
          <rect x="876" y="383" width="20" height="4" rx="1" fill="#DC2626" />
        </g>

        {/* B. Zona 4 Garden Concrete Footpath (Branches down into Shaded Park & Wooden Bench) */}
        <path
          d="M 556,390 L 606,390 L 642,474 L 742,474 L 742,506 L 616,506 L 556,390 Z"
          fill="url(#syConcreteWalk)"
          stroke="#94A3B8"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line x1="572" y1="422" x2="618" y2="422" stroke="#CBD5E1" strokeWidth="1.2" />
        <line x1="592" y1="456" x2="634" y2="456" stroke="#CBD5E1" strokeWidth="1.2" />
        <line x1="664" y1="475" x2="664" y2="505" stroke="#CBD5E1" strokeWidth="1.2" />
        <line x1="706" y1="475" x2="706" y2="505" stroke="#CBD5E1" strokeWidth="1.2" />

        {/* C. Zona 1 Security Post Entrance Apron (Left-Bottom Paving Extension to Pos Satpam) */}
        <polygon
          points="158,484 356,484 348,554 148,554"
          fill="url(#syPavingMain)"
          stroke="#A8A29E"
          strokeWidth="2"
        />
        <rect x="158" y="481" width="198" height="4" fill="#F1F5F9" />
        {[196, 236, 276, 316].map((px, idx) => (
          <line
            key={idx}
            x1={px}
            y1="485"
            x2={px - 4}
            y2="553"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
        ))}
        <line x1="154" y1="518" x2="352" y2="518" stroke="#CBD5E1" strokeWidth="1.2" />

        {/* D. Main Central Paving Block Road (Gerbang Utama Bawah -> Tangga Koridor Kelas Atas) */}
        {/* Outer Concrete Kanstin Curbs */}
        <polygon
          points="358,136 482,136 502,600 334,600"
          fill="#F1F5F9"
          stroke="#94A3B8"
          strokeWidth="1.8"
        />
        {/* Terracotta Soldier-Course Brick Edge Trim */}
        <polygon
          points="364,136 476,136 494,600 342,600"
          fill="#C8755D"
        />
        {/* Inner Interlocking Cement Paving Block Surface */}
        <polygon
          points="370,136 470,136 486,600 350,600"
          fill="url(#syPavingMain)"
        />
        {/* Paving Block Courses & Staggered Herringbone/Brick Joints */}
        {mainPavingRows.map(({ y, xLeft, xRight, rowIdx }) => (
          <g key={rowIdx}>
            <line
              x1={xLeft + 5}
              y1={y}
              x2={xRight - 5}
              y2={y}
              stroke="#C7C2B8"
              strokeWidth="1.2"
            />
            {[0.25, 0.5, 0.75].map((frac, jIdx) => {
              const offset = rowIdx % 2 === 0 ? 0 : 0.12;
              const f = Math.min(frac + offset, 0.88);
              const jx = xLeft + (xRight - xLeft) * f;
              return (
                <line
                  key={jIdx}
                  x1={jx}
                  y1={y}
                  x2={jx}
                  y2={Math.min(y + 24, 598)}
                  stroke="#CEC9BF"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        ))}

        {/* E. Stepping Stones (Jalan Setapak Batu Pipih) -> Zona 2 Flagpole Podium */}
        {steppingStones.map((st, idx) => (
          <g key={idx}>
            <ellipse
              cx={st.cx}
              cy={st.cy + 2.5}
              rx={st.rx + 1}
              ry={st.ry + 0.8}
              fill="#1E3A1E"
              opacity="0.28"
            />
            <ellipse
              cx={st.cx}
              cy={st.cy}
              rx={st.rx}
              ry={st.ry}
              fill="#D6D3D1"
              stroke="#78716C"
              strokeWidth="1.3"
            />
            <ellipse
              cx={st.cx - 2}
              cy={st.cy - 1}
              rx={st.rx * 0.55}
              ry={st.ry * 0.48}
              fill="#F5F5F4"
              opacity="0.65"
            />
          </g>
        ))}

        {/* ================= 2. ZONA 3: LAPANGAN SERBAGUNA REALISTIS (KANAN) ================= */}
        <g id="zona-lapangan-serbaguna">
          {/* Outer Concrete Curb & Drainage Perimeter (Integrated into ground, NOT floating!) */}
          <polygon
            points="504,158 868,158 880,344 498,344"
            fill="#CBD5E1"
            stroke="#64748B"
            strokeWidth="1.8"
          />
          {/* Concrete Curb Front Thickness (3D Edge) */}
          <polygon
            points="498,344 880,344 880,349 498,349"
            fill="#94A3B8"
          />
          {/* Subtle Storm Drainage Grate Strip Along Left Edge */}
          <polygon
            points="506,162 513,162 508,340 501,340"
            fill="#64748B"
            opacity="0.65"
          />

          {/* Painted Terracotta-Orange Concrete/Asphalt Court Perimeter Apron */}
          <polygon
            points="515,163 861,163 872,339 510,339"
            fill="url(#syCourtApron)"
          />

          {/* Main Painted Green Acrylic Concrete Playing Surface */}
          <polygon
            points="531,175 845,175 854,327 527,327"
            fill="url(#syCourtGreen)"
            stroke="#FFFFFF"
            strokeWidth="2.2"
          />

          {/* Subtle Concrete Expansion Joints on Court Slab */}
          <line x1="610" y1="163" x2="608" y2="339" stroke="#0F172A" strokeOpacity="0.08" strokeWidth="1" />
          <line x1="766" y1="163" x2="770" y2="339" stroke="#0F172A" strokeOpacity="0.08" strokeWidth="1" />

          {/* Center Half-Court Line & Jump Circle */}
          <line x1="688" y1="175" x2="690" y2="327" stroke="#FFFFFF" strokeWidth="2" />
          <ellipse
            cx="689"
            cy="251"
            rx="28"
            ry="20"
            fill="url(#syCourtApron)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <ellipse cx="689" cy="251" rx="6" ry="4.5" fill="#FFFFFF" opacity="0.85" />

          {/* Left Free-Throw Key & 3-Point Arc */}
          <polygon
            points="530,224 588,224 587,278 528,278"
            fill="url(#syCourtApron)"
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />
          <path
            d="M 588,224 A 24,27 0 0,1 587,278"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />
          <path
            d="M 530,192 C 596,194 614,220 614,251 C 614,282 595,308 528,310"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />

          {/* Right Free-Throw Key & 3-Point Arc */}
          <polygon
            points="848,224 790,224 792,278 851,278"
            fill="url(#syCourtApron)"
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />
          <path
            d="M 790,224 A 24,27 0 0,0 792,278"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />
          <path
            d="M 846,192 C 782,194 764,220 764,251 C 764,282 783,308 852,310"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />

          {/* Ground Shadows for Both Permanent Iron Basketball Hoops */}
          <path
            d="M 521,256 L 496,268 L 502,274 L 525,260 Z"
            fill="#0F172A"
            opacity="0.22"
          />
          <ellipse cx="542" cy="264" rx="14" ry="7" fill="#0F172A" opacity="0.18" />

          <path
            d="M 860,256 L 824,272 L 830,278 L 864,261 Z"
            fill="#0F172A"
            opacity="0.24"
          />
          <ellipse cx="834" cy="264" rx="15" ry="7.5" fill="#0F172A" opacity="0.2" />

          {/* Left Permanent Iron Basketball Hoop (Tiang Besi Permanen Kiri) */}
          <g>
            {/* Concrete anchor footing */}
            <ellipse cx="520" cy="256" rx="8" ry="5" fill="#94A3B8" stroke="#475569" strokeWidth="1.2" />
            {/* Galvanized iron vertical post & gooseneck arm */}
            <path
              d="M 520,255 L 520,192 L 538,198"
              fill="none"
              stroke="url(#sySteelPost)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Diagonal steel brace */}
            <line x1="520" y1="206" x2="533" y2="197" stroke="#64748B" strokeWidth="2.2" />
            {/* 3D Backboard (Papan Pantul) */}
            <polygon
              points="536,180 544,185 544,215 536,210"
              fill="#F8FAFC"
              stroke="#DC2626"
              strokeWidth="1.6"
            />
            <polygon
              points="538,191 542,194 542,205 538,202"
              fill="none"
              stroke="#DC2626"
              strokeWidth="1.1"
            />
            {/* Orange Iron Rim & Net */}
            <ellipse cx="549" cy="204" rx="6" ry="3.2" fill="none" stroke="#EA580C" strokeWidth="2" />
            <path
              d="M 544,205 L 546,215 L 552,215 L 554,205 M 546,205 L 551,215 M 552,205 L 547,215"
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.9"
            />
          </g>

          {/* Right Permanent Iron Basketball Hoop (Tiang Besi Permanen Kanan) */}
          <g>
            {/* Concrete anchor footing */}
            <ellipse cx="861" cy="256" rx="8.5" ry="5.2" fill="#94A3B8" stroke="#475569" strokeWidth="1.2" />
            {/* Galvanized iron vertical post & gooseneck arm */}
            <path
              d="M 861,255 L 861,190 L 841,197"
              fill="none"
              stroke="url(#sySteelPost)"
              strokeWidth="5.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="861" y1="205" x2="846" y2="196" stroke="#64748B" strokeWidth="2.2" />
            {/* 3D Backboard */}
            <polygon
              points="843,179 834,184 834,215 843,210"
              fill="#F8FAFC"
              stroke="#DC2626"
              strokeWidth="1.6"
            />
            <polygon
              points="841,191 836,194 836,205 841,202"
              fill="none"
              stroke="#DC2626"
              strokeWidth="1.1"
            />
            {/* Orange Iron Rim & Net */}
            <ellipse cx="829" cy="204" rx="6.2" ry="3.3" fill="none" stroke="#EA580C" strokeWidth="2" />
            <path
              d="M 824,205 L 826,215 L 832,215 L 834,205 M 826,205 L 831,215 M 832,205 L 827,215"
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity="0.9"
            />
          </g>
        </g>

        {/* ================= 3. ZONA 5: GEDUNG SD 1 LANTAI & KORIDOR UTAMA (ATAS) ================= */}
        <g id="zona-koridor-sekolah">
          {/* Soft Ground Drop Shadow Below Elevated Corridor */}
          <polygon
            points="44,136 856,136 868,150 34,150"
            fill="#0F172A"
            opacity="0.22"
          />

          {/* Elevated River-Stone & Cement Corridor Foundation Riser (Elevasi Koridor Lebih Tinggi) */}
          <polygon
            points="52,122 848,122 856,138 44,138"
            fill="url(#syFoundationStone)"
            stroke="#334155"
            strokeWidth="1.4"
          />
          {/* Stone masonry joint details along foundation wall */}
          {[110, 175, 240, 305, 515, 580, 645, 710, 775].map((sx, idx) => (
            <line
              key={idx}
              x1={sx}
              y1="124"
              x2={sx}
              y2="137"
              stroke="#475569"
              strokeWidth="1.2"
            />
          ))}
          {/* Concrete Corridor Nosing Lip */}
          <rect x="48" y="120" width="804" height="4" fill="#CBD5E1" />

          {/* 3D Ceramic Tile Corridor Veranda Floor */}
          <polygon
            points="66,98 834,98 848,121 52,121"
            fill="url(#syCorridorTile)"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
          {/* Corridor Tile Grout Grid */}
          <line x1="59" y1="109" x2="841" y2="109" stroke="#D6D3D1" strokeWidth="1" />
          {Array.from({ length: 19 }, (_, idx) => {
            const tx = 86 + idx * 40;
            return (
              <line
                key={idx}
                x1={tx}
                y1="98"
                x2={tx + (tx - 450) * 0.03}
                y2="121"
                stroke="#D6D3D1"
                strokeWidth="1"
              />
            );
          })}

          {/* Main Concrete Stairs to Classroom Corridor (Tangga Semen Kecil Utama @ x=370..470) */}
          <g>
            {/* Cheek walls (pipi tangga semen) */}
            <polygon points="366,118 374,118 370,144 360,144" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.2" />
            <polygon points="466,118 474,118 480,144 470,144" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.2" />
            {/* 3 Stepped Concrete Treads */}
            <polygon points="374,119 466,119 468,127 372,127" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.2" />
            <polygon points="372,127 468,127 470,135 370,135" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
            <polygon points="370,135 470,135 472,143 368,143" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.2" />
          </g>

          {/* Secondary Small Concrete Step on East Corridor Wing (Near Gudang/Perpustakaan) */}
          <g>
            <polygon points="534,121 584,121 587,131 531,131" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.1" />
            <polygon points="531,131 587,131 590,140 528,140" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.1" />
          </g>

          {/* Main 1-Story SD Building Wall (Cream-White Upper + SD School-Green Lower Dado) */}
          <rect
            x="66"
            y="40"
            width="768"
            height="36"
            fill="url(#syWallCream)"
            stroke="#D6C8B0"
            strokeWidth="1"
          />
          <rect x="66" y="76" width="768" height="23" fill="url(#syWallSchoolGreen)" />
          <rect x="66" y="74.5" width="768" height="2.8" fill="#FFFFFF" />
          {/* Deep Roof Eaves Shadow Cast on Top of Wall */}
          <rect x="66" y="40" width="768" height="8" fill="#0F172A" opacity="0.22" />

          {/* Left Wing Windows & Door (KELAS V-A) */}
          {[102, 162].map((wx, idx) => (
            <g key={idx}>
              {/* Bovenlicht ventilation */}
              <rect x={wx} y="47" width="54" height="7" fill="#78350F" />
              <line x1={wx + 2} y1="50.5" x2={wx + 52} y2="50.5" stroke="#FDE68A" strokeWidth="1" />
              {/* Double Glass Window */}
              <rect x={wx} y="56" width="54" height="28" rx="1.5" fill="#7C4D25" />
              <rect x={wx + 3} y="59" width="22" height="22" fill="#BAE6FD" />
              <rect x={wx + 29} y="59" width="22" height="22" fill="#93C5FD" />
              <polygon
                points={`${wx + 6},59 ${wx + 15},59 ${wx + 9},81 ${wx + 3},81`}
                fill="#FFFFFF"
                opacity="0.45"
              />
              <rect x={wx - 2} y="83" width="58" height="3" fill="#92400E" />
            </g>
          ))}

          {/* Kelas V-A Door & Signboard */}
          <rect x="292" y="50" width="38" height="49" rx="1.5" fill="#78350F" />
          <rect x="296" y="54" width="30" height="45" fill="#9A5B25" />
          <rect x="300" y="58" width="22" height="16" fill="#BAE6FD" />
          <circle cx="322" cy="78" r="1.8" fill="#FACC15" />
          <rect x="238" y="50" width="46" height="13" rx="2" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1" />
          <text x="261" y="59" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#FFFFFF">
            KELAS V-A
          </text>
          {/* Wall Bulletin Board */}
          <rect x="240" y="66" width="42" height="18" rx="1.5" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.5" />
          <rect x="244" y="69" width="10" height="11" fill="#93C5FD" />
          <rect x="257" y="69" width="10" height="11" fill="#FCA5A5" />
          <rect x="270" y="69" width="8" height="11" fill="#86EFAC" />

          {/* Center Main Classroom Double-Door Entrance (Aligned with Stairs & "Ke Kelas ↑") */}
          <rect x="384" y="46" width="72" height="53" rx="2" fill="#5C3415" />
          <rect x="398" y="50" width="44" height="49" fill="#FEF3C7" />
          {/* Open Double Wooden Leaves */}
          <polygon points="386,48 400,52 400,97 386,99" fill="#9A5B25" stroke="#4A2910" strokeWidth="1" />
          <polygon points="454,48 440,52 440,97 454,99" fill="#854D1E" stroke="#4A2910" strokeWidth="1" />

          {/* Kelas V-B Plaque & Window */}
          <rect x="500" y="50" width="48" height="13" rx="2" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1" />
          <text x="524" y="59" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#FFFFFF">
            KELAS V-B
          </text>
          <rect x="500" y="66" width="48" height="20" rx="1.5" fill="#7C4D25" />
          <rect x="503" y="69" width="20" height="14" fill="#BAE6FD" />
          <rect x="525" y="69" width="20" height="14" fill="#93C5FD" />

          {/* Right Wing: Ruang Gudang & Perpustakaan Sekolah (Context for Petugas Sekolah Mission) */}
          <rect x="568" y="47" width="46" height="11" rx="2" fill="#334155" stroke="#FFFFFF" strokeWidth="0.9" />
          <text x="591" y="55" textAnchor="middle" fontSize="5.6" fontWeight="900" fill="#F8FAFC">
            R. GUDANG
          </text>
          <rect x="572" y="60" width="38" height="39" rx="1.5" fill="#475569" />
          <rect x="575" y="63" width="32" height="36" fill="#64748B" />
          <line x1="578" y1="70" x2="604" y2="70" stroke="#334155" strokeWidth="1.3" />
          <line x1="578" y1="75" x2="604" y2="75" stroke="#334155" strokeWidth="1.3" />
          <circle cx="601" cy="82" r="1.8" fill="#E2E8F0" />

          <rect x="652" y="49" width="60" height="13" rx="2" fill="#0F766E" stroke="#FFFFFF" strokeWidth="1" />
          <text x="682" y="58" textAnchor="middle" fontSize="6" fontWeight="900" fill="#FFFFFF">
            PERPUSTAKAAN
          </text>
          <rect x="654" y="65" width="56" height="21" rx="1.5" fill="#7C4D25" />
          <rect x="657" y="68" width="24" height="15" fill="#BAE6FD" />
          <rect x="685" y="68" width="22" height="15" fill="#93C5FD" />

          <rect x="730" y="56" width="54" height="28" rx="1.5" fill="#7C4D25" />
          <rect x="733" y="59" width="22" height="22" fill="#BAE6FD" />
          <rect x="759" y="59" width="22" height="22" fill="#93C5FD" />

          {/* Structural Corridor Support Pillars & Umpak Bases */}
          {corridorPillars.map((px, idx) => (
            <g key={idx}>
              {/* Diagonal pillar shadow on corridor tiles */}
              <polygon
                points={`${px},116 ${px + 11},116 ${px + 3},121 ${px - 7},121`}
                fill="#0F172A"
                opacity="0.16"
              />
              {/* Concrete column shaft */}
              <rect
                x={px}
                y="40"
                width="11"
                height="66"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              {/* Classic Indonesian SD red-terracotta/stone pillar base (umpak) */}
              <rect
                x={px - 2}
                y="100"
                width="15"
                height="17"
                rx="1.2"
                fill="#B91C1C"
                stroke="#7F1D1D"
                strokeWidth="0.9"
              />
            </g>
          ))}

          {/* Volumetric 3D Red Terracotta Clay-Tile Roof (Atap Genteng Merah Bervolume) */}
          <polygon
            points="38,42 94,3 806,3 862,42"
            fill="url(#syRoofTerracotta)"
            stroke="#7F1D1D"
            strokeWidth="1.6"
          />
          {/* Horizontal clay-tile overlap courses for 3D roof volume */}
          {[12, 21, 31].map((ry, idx) => {
            const inset = (42 - ry) * 1.35;
            return (
              <line
                key={idx}
                x1={38 + inset}
                y1={ry}
                x2={862 - inset}
                y2={ry}
                stroke="#7F1D1D"
                strokeOpacity="0.28"
                strokeWidth="1.2"
              />
            );
          })}
          {/* Perspective clay-tile rib lines */}
          {Array.from({ length: 23 }, (_, idx) => {
            const xTop = 104 + idx * 31.5;
            const xBot = 58 + idx * 35.6;
            return (
              <line
                key={idx}
                x1={xTop}
                y1="5"
                x2={xBot}
                y2="41"
                stroke="#450A0A"
                strokeOpacity="0.2"
                strokeWidth="1.3"
              />
            );
          })}
          {/* Terracotta Roof Ridge Cap (Bubungan Genteng) & Fascia Board (Lisplang) */}
          <rect x="92" y="1.5" width="716" height="4.5" rx="2" fill="#991B1B" />
          <rect
            x="36"
            y="40"
            width="828"
            height="4.5"
            rx="1.5"
            fill="#FFFBEB"
            stroke="#991B1B"
            strokeWidth="1"
          />

          {/* Central Gable Pediment & School Identity Crest */}
          <polygon
            points="336,41 420,2 504,41"
            fill="#FEF3C7"
            stroke="#991B1B"
            strokeWidth="2"
          />
          <rect
            x="324"
            y="22"
            width="192"
            height="20"
            rx="4"
            fill="#FACC15"
            stroke="#92400E"
            strokeWidth="1.8"
          />
          <text
            x="420"
            y="35.5"
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="900"
            fill="#1E293B"
            letterSpacing="0.7"
          >
            SD NEGERI SAFESTEP
          </text>
        </g>

        {/* Ornamental Flower Borders Along Corridor Front Edge */}
        <FlowerBedCluster x={125} y={147} colors={["#F43F5E", "#FACC15", "#EC4899"]} scale={0.95} />
        <FlowerBedCluster x={205} y={147} colors={["#FB923C", "#FACC15", "#F43F5E"]} scale={0.95} />
        <FlowerBedCluster x={288} y={147} colors={["#EC4899", "#FDE047", "#FB7185"]} scale={0.95} />

        {/* ================= 4. ZONA 2: TIANG BENDERA & RUMPUT UTAMA (KIRI TENGAH) ================= */}
        <g id="zona-tiang-bendera">
          {/* Podium Ground Shadow */}
          <ellipse cx="182" cy="296" rx="58" ry="20" fill="#1E3A1E" opacity="0.28" />

          {/* Tier 1 (Bottom Concrete/Ceramic Step) */}
          <polygon
            points="136,282 236,282 244,294 128,294"
            fill="#E2E8F0"
            stroke="#94A3B8"
            strokeWidth="1.3"
          />
          <rect x="128" y="294" width="116" height="6" rx="1" fill="#94A3B8" />

          {/* Tier 2 (Middle Ceramic Step) */}
          <polygon
            points="149,273 223,273 229,283 143,283"
            fill="#F1F5F9"
            stroke="#94A3B8"
            strokeWidth="1.3"
          />
          <rect x="143" y="283" width="86" height="5" rx="1" fill="#CBD5E1" />

          {/* Tier 3 (Top White Ceramic Pedestal) */}
          <polygon
            points="164,265 208,265 212,273 160,273"
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="1.3"
          />
          <rect x="160" y="273" width="52" height="4.5" rx="1" fill="#94A3B8" />

          {/* Diagonal Flagpole Shadow on Lawn */}
          <line
            x1="186"
            y1="268"
            x2="126"
            y2="296"
            stroke="#1E3A1E"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.22"
          />

          {/* Brass Base Collar & Tapered Galvanized Steel Flagpole */}
          <ellipse cx="186" cy="268" rx="8" ry="3.5" fill="#D97706" stroke="#92400E" strokeWidth="1" />
          <polygon
            points="183.2,268 188.8,268 187.2,148 184.8,148"
            fill="url(#sySteelPost)"
          />
          {/* Halyard Rope */}
          <line x1="189.5" y1="152" x2="189.5" y2="262" stroke="#E2E8F0" strokeWidth="0.9" />
          {/* Golden Finial Orb */}
          <circle cx="186" cy="146" r="4.2" fill="#FACC15" stroke="#B45309" strokeWidth="1.1" />

          {/* Animated Waving Merah Putih Indonesian Flag */}
          <g className="animate-flag-wave">
            <path
              d="M 188,150 C 204,147 218,154 234,150 L 234,164 C 218,168 204,161 188,164 Z"
              fill="#DC2626"
            />
            <path
              d="M 188,164 C 204,161 218,168 234,164 L 234,178 C 218,182 204,175 188,178 Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
          </g>
        </g>

        {/* Left Perimeter Trees & Flower Gardens (Framing Zona 2) */}
        <RealisticSchoolTree cx={76} baseY={252} scale={0.86} />
        <FlowerBedCluster x={108} y={262} colors={["#FACC15", "#F43F5E", "#FB923C"]} scale={0.9} />
        <RealisticSchoolTree cx={68} baseY={398} scale={0.92} />
        <FlowerBedCluster x={106} y={406} colors={["#EC4899", "#FACC15", "#F43F5E"]} scale={0.92} />

        {/* ================= 5. ZONA 4: TAMAN & POJOK BERSANTAI (KANAN BAWAH) ================= */}
        <g id="zona-taman-pojok-bersantai">
          {/* Colorful Park Flower Beds around Garden Path */}
          <FlowerBedCluster x={534} y={432} colors={["#F43F5E", "#FACC15", "#FB923C"]} scale={1.05} />
          <FlowerBedCluster x={690} y={426} colors={["#EC4899", "#FDE047", "#FB7185"]} scale={1} />
          <FlowerBedCluster x={582} y={528} colors={["#FB923C", "#F43F5E", "#FACC15"]} scale={1.05} />
          <FlowerBedCluster x={838} y={526} colors={["#FACC15", "#EC4899", "#F43F5E"]} scale={1} />

          {/* Realistic 3D Wooden Park Bench (Bangku Taman Kayu @ x=562..634, y=428..458) */}
          <g transform="translate(598, 444)">
            {/* Soft bench shadow */}
            <ellipse cx="0" cy="14" rx="40" ry="9" fill="#1E3A1E" opacity="0.26" />
            {/* Cast-iron & concrete side legs */}
            <rect x="-30" y="2" width="5" height="12" rx="1" fill="#334155" />
            <rect x="25" y="2" width="5" height="12" rx="1" fill="#334155" />
            <rect x="-26" y="-13" width="4" height="16" rx="1" fill="#475569" />
            <rect x="22" y="-13" width="4" height="16" rx="1" fill="#475569" />
            {/* Wooden backrest slats */}
            <rect x="-34" y="-13" width="68" height="4.5" rx="1.2" fill="#B45309" stroke="#78350F" strokeWidth="0.9" />
            <rect x="-34" y="-7" width="68" height="4.5" rx="1.2" fill="#D97706" stroke="#78350F" strokeWidth="0.9" />
            {/* 3D angled wooden seat slats */}
            <polygon
              points="-35,0 35,0 38,6 -38,6"
              fill="#D97706"
              stroke="#78350F"
              strokeWidth="1"
            />
            <rect x="-38" y="6" width="76" height="3" rx="1" fill="#92400E" />
            {/* Iron armrests */}
            <path d="M -33,-8 L -36,4" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 33,-8 L 36,4" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Grand Shade Tree with Circular Concrete Seating Ring (Pohon Peneduh + Lingkaran Semen) */}
          <RealisticSchoolTree cx={782} baseY={482} scale={1.08} withCircularBench={true} />
        </g>

        {/* ================= 6. ZONA 1: GERBANG BESI UTAMA & POS SATPAM PERMANEN (KIRI BAWAH) ================= */}
        <g id="zona-gerbang-pos-satpam">
          {/* Permanent Masonry Guardhouse (Pos Satpam Permanen dari Semen & Kaca) */}
          <g transform="translate(52, 422)">
            {/* Soft building ground shadow */}
            <polygon
              points="-6,120 134,120 144,132 -14,132"
              fill="#0F172A"
              opacity="0.24"
            />

            {/* Stone Masonry Plinth Base */}
            <rect
              x="8"
              y="106"
              width="116"
              height="16"
              rx="1.5"
              fill="url(#syFoundationStone)"
              stroke="#334155"
              strokeWidth="1.2"
            />

            {/* Solid Plastered Cement Walls (Cream Upper + SD Green Dado) */}
            <rect
              x="10"
              y="40"
              width="112"
              height="44"
              fill="url(#syWallCream)"
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />
            <rect x="10" y="84" width="112" height="23" fill="url(#syWallSchoolGreen)" />
            <rect x="10" y="82.5" width="112" height="2.5" fill="#FFFFFF" />
            {/* Side 3D wall depth on right side facing main gate */}
            <polygon
              points="122,40 134,47 134,113 122,122"
              fill="#E5DEC9"
              stroke="#94A3B8"
              strokeWidth="1"
            />
            <polygon points="122,84 134,90 134,113 122,107" fill="#3D855F" />

            {/* Guardhouse Door (Left Bay) */}
            <rect x="18" y="54" width="26" height="53" rx="1.5" fill="#5C3415" />
            <rect x="21" y="57" width="20" height="50" fill="#8B5A2B" />
            <rect x="24" y="61" width="14" height="16" fill="#BAE6FD" />
            <circle cx="38" cy="83" r="1.5" fill="#FACC15" />

            {/* Wide Observation Glass Windows (Jendela Kaca Pos Satpam + Meja Jaga di Dalam) */}
            <rect x="50" y="52" width="64" height="32" rx="2" fill="#334155" />
            <rect x="53" y="55" width="27" height="26" fill="#7DD3FC" />
            <rect x="84" y="55" width="27" height="26" fill="#38BDF8" />
            {/* Guard desk & monitor silhouette inside glass */}
            <rect x="58" y="73" width="48" height="8" fill="#78350F" opacity="0.65" />
            {/* Crisp diagonal glass reflections */}
            <polygon points="57,55 67,55 59,81 53,81" fill="#FFFFFF" opacity="0.52" />
            <polygon points="89,55 98,55 90,81 84,81" fill="#FFFFFF" opacity="0.45" />
            {/* Side observation window facing gate */}
            <polygon points="124,55 132,60 132,82 124,78" fill="#7DD3FC" stroke="#334155" strokeWidth="1" />
            {/* Concrete Window Sill */}
            <rect x="48" y="83" width="68" height="3.5" rx="1" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />

            {/* Overhanging Terracotta/Concrete Roof of Pos Satpam */}
            <polygon
              points="0,42 22,18 116,18 140,42"
              fill="url(#syRoofTerracotta)"
              stroke="#7F1D1D"
              strokeWidth="1.5"
            />
            {[26, 34].map((ry, i) => (
              <line key={i} x1={16 - i * 7} y1={ry} x2={124 + i * 7} y2={ry} stroke="#7F1D1D" strokeOpacity="0.3" strokeWidth="1.1" />
            ))}
            <rect x="-2" y="40" width="144" height="4.5" rx="1.2" fill="#F8FAFC" stroke="#64748B" strokeWidth="1" />

            {/* Official POS SATPAM Signboard */}
            <rect
              x="34"
              y="28"
              width="68"
              height="13"
              rx="2.5"
              fill="#0F172A"
              stroke="#38BDF8"
              strokeWidth="1.2"
            />
            <text
              x="68"
              y="37"
              textAnchor="middle"
              fontSize="7"
              fontWeight="900"
              fill="#FFFFFF"
              letterSpacing="0.5"
            >
              POS SATPAM
            </text>
          </g>

          {/* Perimeter Fence & Open Wrought-Iron Main Gate (Pagar Keliling & Gerbang Besi Utama) */}
          {/* 1. Left Perimeter Low Wall + Iron Pickets (x=14..338) */}
          <rect
            x="14"
            y="572"
            width="324"
            height="18"
            fill="#E2E8F0"
            stroke="#64748B"
            strokeWidth="1.2"
          />
          <rect x="14" y="582" width="324" height="8" fill="#B45309" opacity="0.7" />
          {/* Iron fence rail & vertical spear pickets */}
          <line x1="18" y1="554" x2="334" y2="554" stroke="#1E293B" strokeWidth="2.2" />
          <line x1="18" y1="568" x2="334" y2="568" stroke="#1E293B" strokeWidth="2" />
          {Array.from({ length: 24 }, (_, idx) => {
            const fx = 24 + idx * 13;
            return (
              <line
                key={idx}
                x1={fx}
                y1="549"
                x2={fx}
                y2="572"
                stroke="#1E293B"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          {/* Intermediate Brick/Concrete Fence Piers */}
          {[14, 122, 232].map((pierX, idx) => (
            <g key={idx}>
              <rect x={pierX} y="546" width="16" height="45" rx="1" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.2" />
              <rect x={pierX - 2} y="543" width="20" height="4" rx="1" fill="#94A3B8" />
              <rect x={pierX + 2} y="574" width="12" height="14" fill="#C2410C" opacity="0.85" />
            </g>
          ))}

          {/* 2. Right Perimeter Low Wall + Iron Pickets (x=496..886) */}
          <rect
            x="496"
            y="572"
            width="390"
            height="18"
            fill="#E2E8F0"
            stroke="#64748B"
            strokeWidth="1.2"
          />
          <rect x="496" y="582" width="390" height="8" fill="#B45309" opacity="0.7" />
          <line x1="502" y1="554" x2="880" y2="554" stroke="#1E293B" strokeWidth="2.2" />
          <line x1="502" y1="568" x2="880" y2="568" stroke="#1E293B" strokeWidth="2" />
          {Array.from({ length: 29 }, (_, idx) => {
            const fx = 510 + idx * 13;
            return (
              <line
                key={idx}
                x1={fx}
                y1="549"
                x2={fx}
                y2="572"
                stroke="#1E293B"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          {[618, 748, 870].map((pierX, idx) => (
            <g key={idx}>
              <rect x={pierX} y="546" width="16" height="45" rx="1" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.2" />
              <rect x={pierX - 2} y="543" width="20" height="4" rx="1" fill="#94A3B8" />
              <rect x={pierX + 2} y="574" width="12" height="14" fill="#C2410C" opacity="0.85" />
            </g>
          ))}

          {/* 3. Main School Gate Pillars & Open Wrought-Iron Gate Leaves (x=334..502) */}
          {/* Left Gate Pillar */}
          <rect x="332" y="534" width="24" height="58" rx="1.5" fill="#FFFBEB" stroke="#64748B" strokeWidth="1.5" />
          <rect x="329" y="530" width="30" height="6" rx="1.5" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
          <rect x="335" y="568" width="18" height="20" fill="#C2410C" />

          {/* Right Gate Pillar */}
          <rect x="480" y="534" width="24" height="58" rx="1.5" fill="#FFFBEB" stroke="#64748B" strokeWidth="1.5" />
          <rect x="477" y="530" width="30" height="6" rx="1.5" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
          <rect x="483" y="568" width="18" height="20" fill="#C2410C" />

          {/* Open Left Iron Gate Leaf (Swung inward in 3D perspective) */}
          <g>
            <polygon
              points="356,542 384,528 384,568 356,584"
              fill="rgba(15,23,42,0.08)"
              stroke="#1E293B"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {[362, 369, 376].map((gx, i) => {
              const t = (gx - 356) / 28;
              const yTop = 542 - t * 14;
              const yBot = 584 - t * 16;
              return (
                <line key={i} x1={gx} y1={yTop} x2={gx} y2={yBot} stroke="#1E293B" strokeWidth="1.8" />
              );
            })}
          </g>

          {/* Open Right Iron Gate Leaf (Swung inward in 3D perspective) */}
          <g>
            <polygon
              points="480,542 452,528 452,568 480,584"
              fill="rgba(15,23,42,0.08)"
              stroke="#1E293B"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {[458, 465, 472].map((gx, i) => {
              const t = (480 - gx) / 28;
              const yTop = 542 - t * 14;
              const yBot = 584 - t * 16;
              return (
                <line key={i} x1={gx} y1={yTop} x2={gx} y2={yBot} stroke="#1E293B" strokeWidth="1.8" />
              );
            })}
          </g>
        </g>

        {/* ================= 7. WARM MORNING SUNLIGHT AMBIENCE OVERLAY ================= */}
        <rect x="0" y="0" width="900" height="600" fill="url(#syMorningSun)" />
      </svg>
    </div>
  );
}
