/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Rich 3D Oblique-Perspective Indonesian Afternoon School-Commute Street Scene
 * ("Jalan Raya & Perjalanan Pulang Sekolah")
 *
 * Coordinate alignment (viewBox 900 x 600 === 100% x 100% of 1.5:1 sandbox):
 * - Left Exit ("Ke Halaman Sekolah ←"):   x=8% (72),  y=50% (300)
 * - Right Exit ("Ke Lingkungan Rumah →"): x=92% (828), y=50% (300)
 * - street-npc-1 (Tawaran Tumpangan):      x=45% (405), y=55% (330) -> Beside 3D dark sedan pulled over to curb
 * - street-npc-2 (Pesan HP Nomor Asing):   x=30% (270), y=28% (168) -> Upper 3D sidewalk near Minimarket & Halte
 * - street-npc-3 (Orang Dewasa Mengikuti): x=23% (207), y=71% (426) -> Lower 3D sidewalk near quiet side alley
 * - street-npc-4 (Tawaran dari Penjual):   x=58% (522), y=31% (186) -> In front of 3D Warung + Ice Cream Freezer + Gudang
 * - street-npc-5 (Ajakan Rumah Asing):     x=74% (666), y=73% (438) -> Lower-right 3D sidewalk beside side lane
 */

export default function Street3DScene() {
  // Foreshortened sidewalk paving joints (top sidewalk: y=158..234, bottom sidewalk: y=394..496)
  const upperTileXs = Array.from({ length: 24 }, (_, i) => i * 40);
  const lowerTileXs = Array.from({ length: 22 }, (_, i) => i * 44);
  const curbBlocks = Array.from({ length: 30 }, (_, i) => i * 30);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#333842]">
      <svg
        viewBox="0 0 900 600"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Warm Indonesian Early-Afternoon Sky (13:00 WIB Pulang Sekolah) */}
          <linearGradient id="stSkyAfternoon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60B6F7" />
            <stop offset="55%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#FEF3C7" />
          </linearGradient>

          {/* Warm Sun Halo */}
          <radialGradient id="stSunGlow" cx="18%" cy="16%" r="32%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#FDE68A" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
          </radialGradient>

          {/* Upper 3D Sidewalk Stone Gradient */}
          <linearGradient id="stSidewalkUpper" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D6D3D1" />
            <stop offset="35%" stopColor="#E7E5E4" />
            <stop offset="100%" stopColor="#DFDCD8" />
          </linearGradient>

          {/* Lower 3D Sidewalk Stone Gradient */}
          <linearGradient id="stSidewalkLower" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ECEAE7" />
            <stop offset="55%" stopColor="#E2DFDA" />
            <stop offset="100%" stopColor="#CFCAC3" />
          </linearGradient>

          {/* 3D Two-Lane Asphalt Road Surface */}
          <linearGradient id="stAsphalt3D" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#272C35" />
            <stop offset="14%" stopColor="#383F4B" />
            <stop offset="50%" stopColor="#424A57" />
            <stop offset="86%" stopColor="#353C48" />
            <stop offset="100%" stopColor="#252A33" />
          </linearGradient>

          {/* Terracotta Roof Gradient */}
          <linearGradient id="stTerracottaRoof" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="65%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>

          {/* Warung Wood & Brick Gradients */}
          <linearGradient id="stWoodCounter" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Metallic Dark Car Body Gradient */}
          <linearGradient id="stStrangerSedanBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="45%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* School Shuttle Van Yellow Gradient */}
          <linearGradient id="stSchoolShuttle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="55%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>

          {/* Soft Ambient Shadow */}
          <radialGradient id="stGroundAO" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.42" />
            <stop offset="70%" stopColor="#0F172A" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>

          {/* Afternoon Sunbeam Filter */}
          <linearGradient id="stSunbeamDiag" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ================= 1. AFTERNOON SKY, CLOUDS & DISTANT NEIGHBORHOOD HORIZON ================= */}
        <rect x="0" y="0" width="900" height="162" fill="url(#stSkyAfternoon)" />
        <rect x="0" y="0" width="900" height="162" fill="url(#stSunGlow)" />

        {/* Warm Afternoon Sun */}
        <circle cx="152" cy="28" r="18" fill="#FEF9C3" opacity="0.92" />
        <circle cx="152" cy="28" r="28" fill="#FDE047" opacity="0.24" />

        {/* Soft Layered Afternoon Clouds */}
        <g fill="#FFFFFF" opacity="0.82">
          <ellipse cx="290" cy="28" rx="34" ry="10" />
          <ellipse cx="312" cy="24" rx="24" ry="12" />
          <ellipse cx="272" cy="30" rx="20" ry="8" />

          <ellipse cx="615" cy="22" rx="40" ry="11" />
          <ellipse cx="640" cy="19" rx="26" ry="13" />
          <ellipse cx="592" cy="25" rx="22" ry="8" />

          <ellipse cx="818" cy="32" rx="28" ry="9" />
          <ellipse cx="836" cy="28" rx="18" ry="10" />
        </g>

        {/* Distant Indonesian Neighborhood Silhouette (Roofs, Trees, Mosque Dome) */}
        <g opacity="0.65">
          {/* Distant Lush Tree Line */}
          <path
            d="M 0,132 Q 45,98 95,124 Q 145,95 205,122 Q 260,102 320,124 Q 385,92 448,118 Q 510,96 575,122 Q 645,94 712,120 Q 785,95 850,120 L 900,114 L 900,162 L 0,162 Z"
            fill="#86EFAC"
          />
          {/* Distant Neighborhood Mosque Dome & Minaret Silhouette */}
          <rect x="424" y="72" width="38" height="36" fill="#E2E8F0" />
          <path d="M 421,72 Q 443,44 465,72 Z" fill="#10B981" />
          <line x1="443" y1="46" x2="443" y2="54" stroke="#F59E0B" strokeWidth="1.6" />
          <circle cx="443" cy="44" r="2.2" fill="#F59E0B" />
          {/* Distant Terracotta House Rooftops */}
          <polygon points="355,102 375,84 412,84 422,102" fill="#EA580C" opacity="0.75" />
          <polygon points="670,98 692,80 736,80 752,98" fill="#DC2626" opacity="0.72" />
        </g>

        {/* Overhead PLN Utility Poles & Power Cables Spanning the Street */}
        <g opacity="0.78">
          <path d="M 0,34 Q 210,58 455,30 Q 685,56 900,28" fill="none" stroke="#334155" strokeWidth="1.1" />
          <path d="M 0,41 Q 210,65 455,37 Q 685,63 900,35" fill="none" stroke="#475569" strokeWidth="0.9" />
          {/* Utility Pole Crossbars */}
          <rect x="452" y="22" width="5" height="140" fill="#64748B" />
          <rect x="442" y="26" width="25" height="3" rx="1" fill="#475569" />
          <rect x="444" y="34" width="21" height="2.5" rx="1" fill="#475569" />
        </g>

        {/* ================= 2. UPPER 3D RAISED PEDESTRIAN SIDEWALK (TROTOAR ATAS: y=156..246) ================= */}
        {/* Main Paved Surface */}
        <rect x="0" y="156" width="900" height="78" fill="url(#stSidewalkUpper)" />
        {/* Back Building Wall Contact Shadow */}
        <rect x="0" y="156" width="900" height="9" fill="#0F172A" opacity="0.14" />

        {/* Foreshortened 3D Sidewalk Tile Grid Lines */}
        {upperTileXs.map((tx, idx) => (
          <line
            key={idx}
            x1={tx + 12}
            y1={156}
            x2={tx - 10}
            y2={234}
            stroke="#A8A29E"
            strokeWidth="1"
            opacity="0.55"
          />
        ))}
        <line x1="0" y1="180" x2="900" y2="180" stroke="#A8A29E" strokeWidth="0.9" opacity="0.45" />
        <line x1="0" y1="210" x2="900" y2="210" stroke="#A8A29E" strokeWidth="0.9" opacity="0.45" />

        {/* 3D Yellow Tactile Guiding Strip (Jalur Pemandu Pejalan Kaki Aman) */}
        <rect x="0" y="198" width="900" height="9" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.8" />
        <line x1="0" y1="202.5" x2="900" y2="202.5" stroke="#FEF08A" strokeWidth="1.8" strokeDasharray="6 6" />

        {/* TRUE 3D VERTICAL CURB (KANSTIN HITAM-PUTIH 3D) AT UPPER ROADSIDE (y=232..246) */}
        {/* Curb Top Bevel */}
        <rect x="0" y="231" width="900" height="4" fill="#F8FAFC" />
        {/* 3D Vertical Stone Curb Face (11px thickness) */}
        {curbBlocks.map((cx, idx) => (
          <g key={idx}>
            <rect
              x={cx}
              y={235}
              width="30"
              height="11"
              fill={idx % 2 === 0 ? "#F1F5F9" : "#1E293B"}
              stroke="#0F172A"
              strokeWidth="0.6"
            />
            {/* Top lip of each alternating kanstin block */}
            <rect
              x={cx}
              y={231}
              width="30"
              height="4"
              fill={idx % 2 === 0 ? "#FFFFFF" : "#334155"}
            />
          </g>
        ))}
        {/* Storm Drain Inlets (Mulut Tali Air / Selokan) */}
        <rect x="218" y="237" width="22" height="6" rx="1" fill="#090D16" />
        <rect x="648" y="237" width="22" height="6" rx="1" fill="#090D16" />

        {/* ================= 3. NORTH-SIDE 3D BUILDINGS, SHOPS & LANDMARKS ================= */}

        {/* --- ZONE A (FAR LEFT x=0..158): PAGAR SD NEGERI & ZONA SELAMAT SEKOLAH --- */}
        <g>
          {/* Green Hedge Behind School Fence */}
          <rect x="0" y="96" width="148" height="62" fill="#15803D" />
          <path d="M 0,102 Q 22,84 46,100 Q 72,82 98,98 Q 124,84 148,100 L 148,158 L 0,158 Z" fill="#22C55E" />

          {/* 3D School Perimeter Brick Wall & Iron Fence (Pagar Sekolah) */}
          <rect x="0" y="132" width="144" height="26" fill="#C2410C" stroke="#7C2D12" strokeWidth="1.2" />
          <rect x="0" y="129" width="146" height="4" fill="#E7E5E4" />
          {/* Iron Railings */}
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} x1={8 + i * 9.5} y1="104" x2={8 + i * 9.5} y2="129" stroke="#1E293B" strokeWidth="2" />
          ))}
          <line x1="0" y1="108" x2="140" y2="108" stroke="#1E293B" strokeWidth="2" />

          {/* 3D Brick Gate Pillar */}
          <rect x="134" y="96" width="18" height="64" fill="#EA580C" stroke="#7C2D12" strokeWidth="1.4" />
          <polygon points="152,96 160,91 160,154 152,160" fill="#9A3412" />
          <polygon points="131,96 143,88 155,96" fill="#F5F5F4" stroke="#78716C" strokeWidth="1.2" />

          {/* Green Street Direction Sign: "← GERBANG SD" */}
          <rect x="54" y="64" width="4" height="96" fill="#64748B" />
          <polygon points="14,72 86,72 86,88 14,88 6,80" fill="#15803D" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="48" y="82.5" textAnchor="middle" fontSize="7" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">
            ← GERBANG SD
          </text>

          {/* 3D Yellow Diamond School Crossing Sign (Rambu Anak Sekolah) */}
          <rect x="113" y="88" width="3.5" height="74" fill="#94A3B8" />
          <polygon
            points="114.7,62 131,78.3 114.7,94.6 98.4,78.3"
            fill="#FACC15"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Walking Child Silhouette on Sign */}
          <circle cx="112" cy="73" r="2.3" fill="#1E293B" />
          <path d="M 112,76 L 110,83 M 112,76 L 115,83 M 109,78 L 116,78" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="118.5" cy="75.5" r="1.8" fill="#1E293B" />
          <path d="M 118.5,78 L 117,83 M 118.5,78 L 120.5,83" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* --- ZONE B (MID-LEFT x=174..344): 3D SAFE BRIGHT MINIMARKET ("AMANMART") --- */}
        <g>
          {/* Ground Ambient Shadow */}
          <ellipse cx="264" cy="162" rx="92" ry="10" fill="url(#stGroundAO)" />

          {/* 3D Right Oblique Side Wall of Minimarket (gives true 3D building volume!) */}
          <polygon points="334,48 352,38 352,152 334,160" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.2" />

          {/* Main Minimarket Front Facade */}
          <rect x="176" y="48" width="158" height="112" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />

          {/* 3D Roof Overhang & Iconic Indonesian Minimarket Tri-Stripe Fascia */}
          <polygon points="170,48 186,36 352,36 338,48" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
          <rect x="172" y="46" width="166" height="24" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
          <rect x="172" y="46" width="166" height="7" fill="#DC2626" />
          <rect x="172" y="53" width="166" height="6" fill="#2563EB" />
          <rect x="172" y="59" width="166" height="5" fill="#FACC15" />
          {/* Signboard Title */}
          <rect x="202" y="48" width="106" height="15" rx="3" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="1.2" />
          <text x="255" y="58.5" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#1E3A8A" fontFamily="sans-serif" letterSpacing="0.8">
            TOKO AMANMART
          </text>

          {/* Warm Bright Interior Visible Through Glass Storefront */}
          <rect x="188" y="78" width="134" height="76" fill="#FEF9C3" stroke="#64748B" strokeWidth="1.6" />
          {/* Interior Product Shelves */}
          <rect x="196" y="92" width="38" height="56" fill="#FDE68A" stroke="#D97706" strokeWidth="0.9" />
          <line x1="196" y1="108" x2="234" y2="108" stroke="#B45309" strokeWidth="1.5" />
          <line x1="196" y1="124" x2="234" y2="124" stroke="#B45309" strokeWidth="1.5" />
          {/* Colorful Goods on Shelves */}
          <rect x="200" y="100" width="8" height="7" fill="#EF4444" />
          <rect x="210" y="100" width="8" height="7" fill="#3B82F6" />
          <rect x="220" y="100" width="8" height="7" fill="#10B981" />
          <rect x="200" y="116" width="10" height="7" fill="#F59E0B" />
          <rect x="214" y="116" width="12" height="7" fill="#8B5CF6" />

          {/* Glass Double Automatic Doors */}
          <rect x="244" y="84" width="44" height="70" fill="#E0F2FE" stroke="#475569" strokeWidth="1.5" />
          <line x1="266" y1="84" x2="266" y2="154" stroke="#475569" strokeWidth="1.5" />
          <rect x="261" y="114" width="3" height="12" rx="1" fill="#94A3B8" />
          <rect x="268" y="114" width="3" height="12" rx="1" fill="#94A3B8" />
          {/* Specular Glass Glare */}
          <polygon points="248,86 258,86 248,136" fill="#FFFFFF" opacity="0.55" />

          {/* "BUKA 24 JAM" & CCTV Security Camera Badge (matches sc-street-3 safe haven!) */}
          <rect x="294" y="88" width="24" height="12" rx="2" fill="#10B981" />
          <text x="306" y="96.2" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">
            BUKA
          </text>
          {/* 3D CCTV Camera Under Eaves */}
          <g transform="translate(180, 70)">
            <line x1="0" y1="4" x2="8" y2="8" stroke="#334155" strokeWidth="2" />
            <rect x="6" y="4" width="11" height="6" rx="2" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1" />
            <circle cx="16.5" cy="7" r="2" fill="#0F172A" />
          </g>

          {/* 3D Tiled Front Step */}
          <polygon points="236,154 296,154 302,163 230,163" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
        </g>

        {/* --- ZONE C (CENTER-LEFT x=362..456): 3D SHADED BUS/PICKUP BENCH & STREET TREE --- */}
        <g>
          {/* 3D Covered Sidewalk Waiting Bench (Halte Tunggu Teduh) */}
          <ellipse cx="404" cy="166" rx="38" ry="7" fill="url(#stGroundAO)" />
          {/* Back Steel Posts */}
          <rect x="374" y="110" width="4" height="54" fill="#334155" />
          <rect x="430" y="110" width="4" height="54" fill="#334155" />
          {/* Translucent Blue Shelter Back Panel */}
          <rect x="378" y="116" width="52" height="34" fill="#BAE6FD" opacity="0.55" stroke="#0284C7" strokeWidth="1" />
          {/* 3D Slanted Shelter Canopy Roof */}
          <polygon points="366,112 378,100 442,100 436,112" fill="#0284C7" stroke="#075985" strokeWidth="1.2" />
          <rect x="366" y="111" width="70" height="3.5" rx="1" fill="#38BDF8" />
          {/* 3D Wooden Slatted Bench */}
          <polygon points="378,146 430,146 434,152 374,152" fill="#D97706" stroke="#78350F" strokeWidth="1" />
          <rect x="380" y="152" width="4" height="11" fill="#334155" />
          <rect x="424" y="152" width="4" height="11" fill="#334155" />

          {/* Lush 3D Shade Tree Behind Sidewalk */}
          <StreetTree3D x={464} y={158} scale={0.95} />
        </g>

        {/* --- ZONE D (CENTER-RIGHT x=494..678): 3D WARUNG JAJAN + ICE CREAM FREEZER + GUDANG BELAKANG --- */}
        <g>
          {/* Ground Shadow */}
          <ellipse cx="586" cy="168" rx="95" ry="12" fill="url(#stGroundAO)" />

          {/* 3D Attached Side/Back Storage Shed ("Gudang Belakang" — matches sc-street-4!) */}
          <polygon points="632,76 672,66 672,154 632,162" fill="#78716C" stroke="#44403C" strokeWidth="1.3" />
          <polygon points="628,76 642,62 678,62 672,76" fill="#57534E" stroke="#292524" strokeWidth="1.1" />
          {/* Half-Ajar Dark Gudang Door */}
          <rect x="642" y="96" width="22" height="58" fill="#1C1917" stroke="#44403C" strokeWidth="1.2" />
          <polygon points="642,96 654,99 654,152 642,154" fill="#78350F" stroke="#292524" strokeWidth="1" />
          <rect x="638" y="83" width="30" height="9" rx="1.5" fill="#FEF2F2" stroke="#991B1B" strokeWidth="0.8" />
          <text x="653" y="89.5" textAnchor="middle" fontSize="5" fontWeight="900" fill="#991B1B" fontFamily="sans-serif">
            GUDANG
          </text>

          {/* Main 3D Warung Building Structure */}
          {/* 3D Right Side Wall */}
          <polygon points="624,62 638,52 638,158 624,166" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />
          {/* Warung Front Interior Back Wall */}
          <rect x="500" y="64" width="124" height="102" fill="#FEF3C7" stroke="#78350F" strokeWidth="1.5" />
          {/* Interior Dark Recess Behind Counter */}
          <rect x="508" y="76" width="108" height="46" fill="#451A03" opacity="0.82" />

          {/* Hanging Colorful Snack Sachets (Jajanan Renteng Khas Warung) */}
          {[516, 530, 544, 594, 606].map((sx, idx) => (
            <g key={idx}>
              <line x1={sx + 4} y1="76" x2={sx + 4} y2="112" stroke="#FDE047" strokeWidth="1" />
              <rect x={sx} y="80" width="8" height="9" rx="1" fill={idx % 2 === 0 ? "#EF4444" : "#3B82F6"} />
              <rect x={sx} y="91" width="8" height="9" rx="1" fill={idx % 2 === 0 ? "#10B981" : "#F59E0B"} />
              <rect x={sx} y="102" width="8" height="9" rx="1" fill={idx % 2 === 0 ? "#EC4899" : "#8B5CF6"} />
            </g>
          ))}

          {/* Glass Kerupuk & Biscuit Jars on Counter */}
          <rect x="558" y="106" width="12" height="16" rx="2" fill="#E0F2FE" stroke="#475569" strokeWidth="1" />
          <rect x="559" y="103" width="10" height="3" rx="1" fill="#DC2626" />
          <circle cx="564" cy="116" r="3.5" fill="#FDE047" />

          <rect x="574" y="108" width="12" height="14" rx="2" fill="#E0F2FE" stroke="#475569" strokeWidth="1" />
          <rect x="575" y="105" width="10" height="3" rx="1" fill="#2563EB" />
          <circle cx="580" cy="116" r="3.5" fill="#D97706" />

          {/* 3D Wooden Warung Front Counter */}
          <polygon points="496,122 628,122 632,129 492,129" fill="#FBBF24" stroke="#78350F" strokeWidth="1.2" />
          <rect x="500" y="129" width="124" height="37" fill="url(#stWoodCounter)" stroke="#451A03" strokeWidth="1.4" />
          {/* Wooden Vertical Planks on Counter */}
          {[520, 540, 560, 580, 600].map((px, i) => (
            <line key={i} x1={px} y1="129" x2={px} y2="166" stroke="#451A03" strokeWidth="1" opacity="0.5" />
          ))}

          {/* 3D Sliding-Lid Ice Cream Chest Freezer ("ES KRIM" — matches sc-street-4!) */}
          <g transform="translate(486, 128)">
            <polygon points="0,8 48,8 52,15 -4,15" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.2" />
            <rect x="-4" y="15" width="56" height="28" rx="2" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.3" />
            <rect x="-4" y="15" width="56" height="7" fill="#EF4444" />
            {/* Ice Cream Cone Graphic & Label */}
            <polygon points="8,30 14,30 11,39" fill="#D97706" />
            <circle cx="11" cy="28" r="3.8" fill="#F472B6" />
            <text x="30" y="34" textAnchor="middle" fontSize="6.2" fontWeight="900" fill="#0369A1" fontFamily="sans-serif">
              ES KRIM
            </text>
          </g>

          {/* 3D Striped Front Awning (Kanopi Belang Warung) */}
          <polygon points="488,78 500,64 626,64 636,78" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.2" />
          {[506, 534, 562, 590].map((ax, i) => (
            <polygon
              key={i}
              points={`${ax},78 ${ax + 8},64 ${ax + 20},64 ${ax + 14},78`}
              fill="#FEF2F2"
            />
          ))}

          {/* 3D Pitched Terracotta Roof of Warung + Signboard */}
          <polygon points="486,64 516,34 612,34 640,64" fill="url(#stTerracottaRoof)" stroke="#7C2D12" strokeWidth="1.6" />
          <rect x="518" y="43" width="90" height="16" rx="3" fill="#FEF9C3" stroke="#78350F" strokeWidth="1.4" />
          <text x="563" y="53.8" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#78350F" fontFamily="sans-serif" letterSpacing="0.5">
            WARUNG JAJAN
          </text>
        </g>

        {/* --- ZONE E (FAR RIGHT x=704..900): 3D GAPURA KOMPLEKS RUMAH AMAN & COZY HOUSES --- */}
        <g>
          {/* Cozy Indonesian Neighborhood House in Background Right */}
          <polygon points="738,68 776,40 864,40 894,68" fill="url(#stTerracottaRoof)" stroke="#7C2D12" strokeWidth="1.4" />
          <rect x="748" y="68" width="136" height="90" fill="#FFFBEB" stroke="#D6D3D1" strokeWidth="1.2" />
          {/* House Windows */}
          <rect x="768" y="84" width="32" height="32" rx="2" fill="#BAE6FD" stroke="#78350F" strokeWidth="2" />
          <line x1="784" y1="84" x2="784" y2="116" stroke="#78350F" strokeWidth="1.5" />
          <rect x="832" y="84" width="32" height="32" rx="2" fill="#BAE6FD" stroke="#78350F" strokeWidth="2" />
          {/* Low Residential Garden Wall & Pink Bougainvillea Flowers */}
          <rect x="742" y="130" width="158" height="28" fill="#E7E5E4" stroke="#A8A29E" strokeWidth="1.2" />
          <g fill="#16A34A">
            <circle cx="760" cy="126" r="11" />
            <circle cx="778" cy="124" r="13" />
            <circle cx="852" cy="125" r="12" />
            <circle cx="872" cy="126" r="11" />
          </g>
          <g fill="#EC4899">
            <circle cx="757" cy="123" r="3" />
            <circle cx="776" cy="120" r="3.5" />
            <circle cx="783" cy="126" r="2.8" />
            <circle cx="850" cy="121" r="3.2" />
            <circle cx="870" cy="123" r="3" />
          </g>

          {/* 3D Indonesian Residential Complex Gateway Arch ("GAPURA RT 04 / GRIYA AMAN") */}
          {/* Left & Right 3D Red-White Brick Pillars */}
          <rect x="794" y="86" width="14" height="78" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.2" />
          <rect x="794" y="122" width="14" height="22" fill="#FFFFFF" />
          <polygon points="808,86 814,82 814,158 808,164" fill="#991B1B" />

          <rect x="880" y="86" width="14" height="78" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.2" />
          <rect x="880" y="122" width="14" height="22" fill="#FFFFFF" />

          {/* Gapura Overhead Arch Beam */}
          <polygon points="786,86 798,70 890,70 900,86" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1.4" />
          <text x="844" y="81" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#FEF08A" fontFamily="sans-serif" letterSpacing="0.5">
            GRIYA AMAN · RT 04
          </text>

          {/* Green Street Direction Sign: "KOMPLEKS RUMAH →" */}
          <rect x="720" y="82" width="3.5" height="82" fill="#64748B" />
          <polygon points="682,74 758,74 766,82 758,90 682,90" fill="#15803D" stroke="#FFFFFF" strokeWidth="1.4" />
          <text x="721" y="84.5" textAnchor="middle" fontSize="6.6" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">
            RUMAH AMAN →
          </text>
        </g>

        {/* ================= 4. 3D TWO-LANE ASPHALT ROAD & SCHOOL COMMUTE TRAFFIC (y=246..390) ================= */}
        <rect x="0" y="246" width="900" height="144" fill="url(#stAsphalt3D)" />

        {/* Curb Drop-Shadow Along Top Edge of Asphalt */}
        <rect x="0" y="246" width="900" height="8" fill="#090D16" opacity="0.38" />
        {/* Subtle Tire Wear Tracks Along Both Lanes */}
        <rect x="0" y="268" width="900" height="28" fill="#1E293B" opacity="0.22" />
        <rect x="0" y="336" width="900" height="30" fill="#1E293B" opacity="0.22" />

        {/* Left School-Zone Red Thermoplastic ZoSS Patch (Zona Selamat Sekolah) */}
        <polygon points="88,248 202,248 188,388 74,388" fill="#B91C1C" opacity="0.65" />
        <line x1="88" y1="248" x2="74" y2="388" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="7 5" opacity="0.85" />
        <line x1="202" y1="248" x2="188" y2="388" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="7 5" opacity="0.85" />
        <text
          x="139"
          y="292"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#FEF2F2"
          opacity="0.72"
          fontFamily="sans-serif"
          letterSpacing="1.2"
        >
          ZONA SEKOLAH
        </text>

        {/* Center Yellow Dashed Median Divider (split cleanly around the 3D Zebra Crosswalk) */}
        <line
          x1="16"
          y1="316"
          x2="458"
          y2="316"
          stroke="#FACC15"
          strokeWidth="3.5"
          strokeDasharray="24 18"
        />
        <line
          x1="556"
          y1="316"
          x2="884"
          y2="316"
          stroke="#FACC15"
          strokeWidth="3.5"
          strokeDasharray="24 18"
        />

        {/* Crisp Perspective Directional Road Arrows */}
        <g fill="#E2E8F0" opacity="0.48">
          {/* Upper lane heading left */}
          <polygon points="246,282 262,275 262,280 288,280 288,284 262,284 262,289" />
          {/* Lower lane heading right */}
          <polygon points="648,354 632,347 632,352 606,352 606,356 632,356 632,361" />
        </g>

        {/* 3D PERSPECTIVE ZEBRA CROSSWALK (Connecting Upper & Lower Sidewalks at x=470..544) */}
        <g>
          {/* Stop Lines */}
          <line x1="458" y1="320" x2="454" y2="386" stroke="#F8FAFC" strokeWidth="3.5" opacity="0.9" />
          <line x1="556" y1="250" x2="552" y2="312" stroke="#F8FAFC" strokeWidth="3.5" opacity="0.9" />
          {[253, 275, 297, 319, 341, 363].map((zy, idx) => {
            const shift = idx * 1.8;
            return (
              <g key={idx}>
                {/* Subtle 3D Paint Thickness Shadow */}
                <polygon
                  points={`${474 - shift},${zy + 2} ${540 - shift},${zy + 2} ${538 - shift},${zy + 14} ${472 - shift},${zy + 14}`}
                  fill="#0F172A"
                  opacity="0.35"
                />
                {/* Crisp White Thermoplastic Zebra Stripe */}
                <polygon
                  points={`${474 - shift},${zy} ${540 - shift},${zy} ${538 - shift},${zy + 12} ${472 - shift},${zy + 12}`}
                  fill="#F8FAFC"
                />
              </g>
            );
          })}
        </g>

        {/* 3D Pedestrian Crossing Traffic Signal (Lampu Penyeberangan Anak) at Upper Crosswalk Corner */}
        <g transform="translate(454, 174)">
          <ellipse cx="4" cy="62" rx="8" ry="3" fill="rgba(0,0,0,0.28)" />
          <rect x="2" y="14" width="4" height="48" fill="#475569" />
          <rect x="-4" y="0" width="16" height="28" rx="3" fill="#1E293B" stroke="#94A3B8" strokeWidth="1" />
          <circle cx="4" cy="8" r="4" fill="#EF4444" opacity="0.35" />
          <circle cx="4" cy="19" r="4" fill="#22C55E" />
          <circle cx="4" cy="19" r="6.5" fill="#4ADE80" opacity="0.28" />
        </g>

        {/* --- 3D VEHICLE 1 (UPPER LANE x=654..768, y=236..292): JEMPUTAN SEKOLAH / YELLOW SCHOOL VAN --- */}
        <g transform="translate(656, 232)">
          {/* Ground Shadow */}
          <ellipse cx="56" cy="56" rx="58" ry="9" fill="#090D16" opacity="0.48" />

          {/* 3D Van Roof & Roof Rack */}
          <polygon points="18,8 94,8 104,20 8,20" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
          {/* Main 3D Van Body Facing Left */}
          <path
            d="M 4,34 L 10,18 Q 14,10 22,10 L 96,10 Q 104,10 106,20 L 108,46 Q 108,51 102,51 L 8,51 Q 2,51 2,44 Z"
            fill="url(#stSchoolShuttle)"
            stroke="#854D0E"
            strokeWidth="1.4"
          />
          {/* Blue School Stripe Along Beltline */}
          <rect x="4" y="35" width="103" height="6" fill="#0284C7" />
          <text x="58" y="39.8" textAnchor="middle" fontSize="5" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif" letterSpacing="0.5">
            JEMPUTAN SEKOLAH
          </text>

          {/* 3D Windshield & Passenger Windows */}
          <polygon points="11,19 24,13 24,31 7,31" fill="#BAE6FD" stroke="#1E293B" strokeWidth="1.1" />
          <rect x="28" y="14" width="22" height="17" rx="2" fill="#E0F2FE" stroke="#1E293B" strokeWidth="1.1" />
          <rect x="54" y="14" width="22" height="17" rx="2" fill="#E0F2FE" stroke="#1E293B" strokeWidth="1.1" />
          <rect x="80" y="14" width="20" height="17" rx="2" fill="#BAE6FD" stroke="#1E293B" strokeWidth="1.1" />
          {/* Window Glare */}
          <polygon points="30,15 38,15 32,30 28,30" fill="#FFFFFF" opacity="0.55" />

          {/* Headlight & Taillight */}
          <rect x="2" y="38" width="4" height="6" rx="1" fill="#FEF9C3" />
          <rect x="104" y="37" width="4" height="7" rx="1" fill="#EF4444" />

          {/* 3D Wheels & Hubcaps */}
          <circle cx="24" cy="51" r="9" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <circle cx="24" cy="51" r="4.2" fill="#CBD5E1" />
          <circle cx="86" cy="51" r="9" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <circle cx="86" cy="51" r="4.2" fill="#CBD5E1" />
        </g>

        {/* --- 3D VEHICLE 2 (PULLED OVER AT CURB BESIDE street-npc-1: x=278..408, y=316..378) --- */}
        <g transform="translate(278, 314)">
          {/* Ground Shadow Under Pulled-Over Stranger Car */}
          <ellipse cx="66" cy="58" rx="68" ry="10" fill="#090D16" opacity="0.55" />

          {/* 3D Metallic Dark Sedan Roof & Pillars (Facing Right toward the child!) */}
          <polygon points="26,8 84,8 104,23 14,23" fill="#475569" stroke="#0F172A" strokeWidth="1.2" />

          {/* Main 3D Sculpted Sedan Chassis */}
          <path
            d="M 6,26 L 16,22 L 28,9 L 84,9 L 104,23 L 124,27 Q 130,29 130,37 L 130,49 Q 130,54 123,54 L 9,54 Q 3,54 3,47 L 3,33 Q 3,27 6,26 Z"
            fill="url(#stStrangerSedanBody)"
            stroke="#090D16"
            strokeWidth="1.5"
          />

          {/* Metallic Specular Shoulder Line */}
          <line x1="8" y1="30" x2="124" y2="31" stroke="#64748B" strokeWidth="1.2" opacity="0.75" />

          {/* Rear Dark-Tinted Window */}
          <polygon points="30,12 55,12 55,25 19,25" fill="#0F172A" stroke="#475569" strokeWidth="1" />
          {/* Front Passenger Window HALF-ROLLED DOWN (Stranger calling out to child!) */}
          <polygon points="59,12 82,12 98,25 59,25" fill="#090D16" stroke="#475569" strokeWidth="1" />
          {/* Half-lowered glass pane with reflection */}
          <polygon points="59,18 90,18 98,25 59,25" fill="#38BDF8" opacity="0.38" />
          <line x1="59" y1="18" x2="90" y2="18" stroke="#BAE6FD" strokeWidth="1.2" />

          {/* 3D Side Mirror & Chrome Door Handles */}
          <ellipse cx="97" cy="25" rx="4.5" ry="3" fill="#1E293B" stroke="#94A3B8" strokeWidth="0.9" />
          <rect x="36" y="31" width="8" height="2" rx="1" fill="#94A3B8" />
          <rect x="64" y="31" width="8" height="2" rx="1" fill="#94A3B8" />

          {/* Headlights, Grille & Blinking Amber Hazard Lights (Menepi ke Trotoar!) */}
          <polygon points="122,31 129,33 129,40 121,39" fill="#FEF08A" />
          <circle cx="125" cy="43" r="3.5" fill="#F59E0B" className="animate-street-hazard" />
          <circle cx="125" cy="43" r="7" fill="#F59E0B" opacity="0.3" className="animate-street-hazard" />
          {/* Rear Taillight & Hazard */}
          <rect x="3" y="31" width="4.5" height="8" rx="1" fill="#EF4444" />
          <circle cx="5.5" cy="42" r="2.8" fill="#F59E0B" className="animate-street-hazard" />

          {/* Indonesian Front/Side License Plate Badge */}
          <rect x="108" y="45" width="18" height="6" rx="1" fill="#F8FAFC" stroke="#0F172A" strokeWidth="0.8" />
          <text x="117" y="49.5" textAnchor="middle" fontSize="3.8" fontWeight="900" fill="#0F172A" fontFamily="monospace">
            B 1605
          </text>

          {/* 3D Alloy Wheels */}
          <circle cx="28" cy="53" r="10.5" fill="#090D16" stroke="#334155" strokeWidth="1.6" />
          <circle cx="28" cy="53" r="5.2" fill="#94A3B8" />
          <circle cx="28" cy="53" r="2" fill="#1E293B" />

          <circle cx="102" cy="53" r="10.5" fill="#090D16" stroke="#334155" strokeWidth="1.6" />
          <circle cx="102" cy="53" r="5.2" fill="#94A3B8" />
          <circle cx="102" cy="53" r="2" fill="#1E293B" />

          {/* Subtle Contextual Tag on Curbside */}
          <rect x="34" y="38" width="52" height="10" rx="3" fill="#0F172A" opacity="0.82" />
          <text x="60" y="45" textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#FDE047" fontFamily="sans-serif">
            MOBIL MENEPI
          </text>
        </g>

        {/* ================= 5. LOWER 3D RAISED PEDESTRIAN SIDEWALK (TROTOAR BAWAH: y=386..498) ================= */}
        {/* 3D Curb Stepping UP from Road (Kanstin Depan Bawah) */}
        {curbBlocks.map((cx, idx) => (
          <g key={idx}>
            <rect
              x={cx}
              y={386}
              width="30"
              height="6"
              fill={idx % 2 === 0 ? "#FFFFFF" : "#1E293B"}
              stroke="#0F172A"
              strokeWidth="0.5"
            />
            <rect
              x={cx}
              y={392}
              width="30"
              height="4"
              fill={idx % 2 === 0 ? "#CBD5E1" : "#0F172A"}
            />
          </g>
        ))}

        {/* Lower Sidewalk Main Paved Surface */}
        <rect x="0" y="396" width="900" height="102" fill="url(#stSidewalkLower)" />

        {/* Foreshortened 3D Lower Sidewalk Tile Joints (widening toward viewer) */}
        {lowerTileXs.map((tx, idx) => (
          <line
            key={idx}
            x1={tx + 8}
            y1={396}
            x2={tx - 18}
            y2={498}
            stroke="#A8A29E"
            strokeWidth="1.1"
            opacity="0.55"
          />
        ))}
        <line x1="0" y1="426" x2="900" y2="426" stroke="#A8A29E" strokeWidth="1" opacity="0.45" />
        <line x1="0" y1="464" x2="900" y2="464" stroke="#A8A29E" strokeWidth="1" opacity="0.45" />

        {/* Lower 3D Yellow Tactile Guiding Strip */}
        <rect x="0" y="438" width="900" height="10" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.8" />
        <line x1="0" y1="443" x2="900" y2="443" stroke="#FEF08A" strokeWidth="2" strokeDasharray="7 7" />

        {/* --- 3D INDONESIAN GEROBAK BAKSO / JAJANAN SORE ON LOWER SIDEWALK (x=318..400, y=412..486) --- */}
        <g transform="translate(320, 408)">
          {/* Cart Ground Shadow */}
          <ellipse cx="42" cy="74" rx="44" ry="8" fill="url(#stGroundAO)" />

          {/* Wooden Push Handles */}
          <line x1="-8" y1="42" x2="6" y2="42" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />

          {/* 3D Classic Blue & Wood Gerobak Body */}
          <polygon points="4,36 74,36 78,42 0,42" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1.1" />
          <rect x="4" y="42" width="70" height="24" rx="2" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.3" />
          <rect x="8" y="46" width="62" height="16" rx="1" fill="#3B82F6" />
          <text x="39" y="56.5" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#FEF08A" fontFamily="sans-serif" letterSpacing="0.5">
            BAKSO MALANG
          </text>

          {/* Upper Glass Cabinet & Steaming Bakso Dandang Pot */}
          <rect x="8" y="14" width="60" height="24" fill="#E0F2FE" opacity="0.85" stroke="#92400E" strokeWidth="1.5" />
          <line x1="38" y1="14" x2="38" y2="38" stroke="#92400E" strokeWidth="1.2" />
          {/* Aluminum Steamer Pot */}
          <rect x="14" y="23" width="18" height="14" rx="1.5" fill="#CBD5E1" stroke="#475569" strokeWidth="1" />
          <ellipse cx="23" cy="23" rx="9.5" ry="2.5" fill="#E2E8F0" stroke="#475569" strokeWidth="0.9" />
          {/* Rising Warm Steam */}
          <path d="M 20,19 Q 18,14 21,10" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" className="animate-street-steam" />
          <path d="M 26,20 Q 28,15 25,11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" className="animate-street-steam" />
          {/* Red & Black Sauce Bottles */}
          <rect x="45" y="27" width="4.5" height="10" rx="1" fill="#EF4444" />
          <rect x="52" y="27" width="4.5" height="10" rx="1" fill="#1E293B" />

          {/* Small Gerobak Roof Canopy */}
          <polygon points="2,14 10,6 66,6 74,14" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />

          {/* 3D Spoked Cart Wheel & Wooden Support Leg */}
          <rect x="60" y="64" width="4" height="11" fill="#78350F" />
          <circle cx="26" cy="68" r="10" fill="#1C1917" stroke="#78350F" strokeWidth="2" />
          <circle cx="26" cy="68" r="3" fill="#D97706" />
          <line x1="26" y1="58" x2="26" y2="78" stroke="#A8A29E" strokeWidth="1" />
          <line x1="16" y1="68" x2="36" y2="68" stroke="#A8A29E" strokeWidth="1" />
        </g>

        {/* ================= 6. FOREGROUND NEIGHBORHOOD WALLS, SIDE ALLEYS & TREES (y=496..600) ================= */}
        {/* Base Grassy / Planter Strip */}
        <rect x="0" y="498" width="900" height="102" fill="#65A30D" />
        <rect x="0" y="498" width="900" height="8" fill="#3F6212" opacity="0.35" />

        {/* --- LEFT FOREGROUND (x=118..236): SHADOWY NARROW ALLEY ("GANG SEPI" behind street-npc-3 at 207,426) --- */}
        <g>
          {/* Receding Dark Side Alley Floor */}
          <polygon points="150,498 228,498 248,600 124,600" fill="#57534E" stroke="#292524" strokeWidth="1.5" />
          <polygon points="150,498 182,498 168,600 124,600" fill="#1C1917" opacity="0.38" />
          {/* Weathered Brick Alley Walls Left & Right */}
          <polygon points="116,476 150,498 124,600 96,600" fill="#9A3412" stroke="#431407" strokeWidth="1.2" />
          <polygon points="228,498 258,478 274,600 248,600" fill="#78716C" stroke="#292524" strokeWidth="1.2" />
          <rect x="156" y="506" width="66" height="12" rx="3" fill="#1E293B" opacity="0.85" />
          <text x="189" y="514.2" textAnchor="middle" fontSize="6" fontWeight="900" fill="#CBD5E1" fontFamily="sans-serif">
            GANG SEPI
          </text>
        </g>

        {/* --- CENTER FOREGROUND (x=274..616): 3D NEIGHBORHOOD GARDEN FENCE & TROPICAL SHRUBS --- */}
        <g>
          {/* 3D Stone Planter Wall */}
          <rect x="276" y="502" width="338" height="24" rx="2" fill="#E7E5E4" stroke="#78716C" strokeWidth="1.2" />
          <rect x="274" y="498" width="342" height="6" rx="1" fill="#F5F5F4" stroke="#A8A29E" strokeWidth="1" />
          {/* Decorative Tropical Bushes & Flowers */}
          {[305, 360, 425, 490, 555, 595].map((bx, idx) => (
            <g key={idx}>
              <circle cx={bx} cy={548} r="22" fill="#15803D" />
              <circle cx={bx - 8} cy={544} r="16" fill="#22C55E" />
              <circle cx={bx + 9} cy={546} r="15" fill="#4ADE80" />
              <circle cx={bx - 4} cy={540} r="3" fill={idx % 2 === 0 ? "#F43F5E" : "#FACC15"} />
              <circle cx={bx + 7} cy={544} r="2.8" fill={idx % 2 === 0 ? "#FACC15" : "#FB7185"} />
            </g>
          ))}
        </g>

        {/* --- RIGHT FOREGROUND (x=626..766): MYSTERY TURN-OFF LANE & STRANGER HOUSE GATE (beside street-npc-5 at 666,438) --- */}
        <g>
          {/* Side Lane Turning South */}
          <polygon points="642,498 738,498 764,600 618,600" fill="#78716C" stroke="#44403C" strokeWidth="1.4" />
          {/* Closed Tall Dark Iron Gate Across the Side Alley */}
          <rect x="634" y="528" width="114" height="48" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={644 + i * 11.5} y1="528" x2={644 + i * 11.5} y2="576" stroke="#64748B" strokeWidth="2" />
          ))}
          {/* Brick Gate Posts */}
          <rect x="622" y="518" width="16" height="64" fill="#7C2D12" stroke="#431407" strokeWidth="1.2" />
          <rect x="744" y="518" width="16" height="64" fill="#7C2D12" stroke="#431407" strokeWidth="1.2" />
          <rect x="650" y="544" width="82" height="13" rx="3" fill="#0F172A" stroke="#F59E0B" strokeWidth="0.9" />
          <text x="691" y="552.8" textAnchor="middle" fontSize="5.8" fontWeight="900" fill="#FDE047" fontFamily="sans-serif">
            RUMAH BELUM DIKENAL
          </text>
        </g>

        {/* --- FOREGROUND 3D SHADE TREES & STREETLAMPS --- */}
        <StreetTree3D x={54} y={512} scale={1.1} />
        <StreetTree3D x={838} y={516} scale={1.12} />

        {/* Ornamental 3D Streetlight Posts (Lampu PJU) */}
        <StreetLamp3D x={164} y={232} />
        <StreetLamp3D x={690} y={232} />
        <StreetLamp3D x={568} y={492} />

        {/* ================= 7. WARM AFTERNOON SUNBEAM WASH ================= */}
        <polygon points="0,0 260,0 520,600 120,600" fill="url(#stSunbeamDiag)" />
      </svg>
    </div>
  );
}

function StreetTree3D({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Cast Afternoon Shadow on Ground */}
      <ellipse cx="10" cy="4" rx="34" ry="10" fill="#0F172A" opacity="0.26" />

      {/* 3D Tree Planter Ring */}
      <ellipse cx="0" cy="2" rx="16" ry="5.5" fill="#78716C" stroke="#44403C" strokeWidth="1.2" />
      <ellipse cx="0" cy="1" rx="12" ry="3.5" fill="#451A03" />

      {/* Volumetric 3D Wooden Trunk & Branches */}
      <path
        d="M -5,2 C -5,-18 -6,-36 -4,-52 L 4,-52 C 6,-36 5,-18 5,2 Z"
        fill="#78350F"
        stroke="#451A03"
        strokeWidth="1.2"
      />
      <path d="M -2,-42 L -14,-56" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 2,-44 L 15,-58" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />

      {/* Layered 3D Leafy Canopy with Sunlight Highlights */}
      <g className="animate-street-canopy">
        {/* Deep Underside Canopy Shadow */}
        <ellipse cx="2" cy="-54" rx="34" ry="20" fill="#14532D" />
        {/* Mid Green Volume */}
        <circle cx="-18" cy="-60" r="19" fill="#15803D" />
        <circle cx="18" cy="-60" r="19" fill="#15803D" />
        <circle cx="0" cy="-72" r="23" fill="#16A34A" />
        {/* Warm Sunlit Top Clusters */}
        <circle cx="-10" cy="-74" r="15" fill="#22C55E" />
        <circle cx="10" cy="-70" r="14" fill="#22C55E" />
        <ellipse cx="-6" cy="-82" rx="13" ry="8" fill="#86EFAC" opacity="0.75" />
      </g>
    </g>
  );
}

function StreetLamp3D({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="2" rx="8" ry="3" fill="rgba(0,0,0,0.28)" />
      {/* Base Pedestal */}
      <rect x="-4" y="-8" width="8" height="10" rx="1.5" fill="#334155" stroke="#0F172A" strokeWidth="1" />
      {/* Tall Metallic Pole */}
      <rect x="-2" y="-68" width="4" height="60" fill="#64748B" />
      {/* Curved Lamp Arm & Warm Lantern Head */}
      <path d="M 0,-68 Q 0,-78 14,-78" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="16" cy="-77" rx="7" ry="3.5" fill="#334155" />
      <ellipse cx="16" cy="-75.5" rx="5" ry="2" fill="#FEF9C3" />
    </g>
  );
}
