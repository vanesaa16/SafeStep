/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Rich 1-Point 3D Perspective Modern Indonesian Student's Family Home Scene
 * ("Lingkungan Rumah Modern & Ruang Keluarga Siswa")
 *
 * Coordinate alignment (viewBox 900 x 600 === 100% x 100% of 1.5:1 sandbox):
 * - Left Exit ("Ke Jalan Raya ←"):               x=8% (72),  y=50% (300) -> 3D Front Terrace & Open Modern Main Door
 * - home-npc-1 (Tamu Dewasa Mencurigakan):       x=74% (666), y=35% (210) -> Guest seating / side patio glass nook
 * - home-npc-2 (Chat Media Sosial Mencurigakan): x=38% (342), y=70% (420) -> Beside 3D rounded coffee table + glowing tablet
 * - home-npc-3 (Tontonan Tidak Pantas):          x=50% (450), y=56% (336) -> Facing 3D fluted-wood Smart LED TV wall
 * - home-npc-4 (Rayuan Hadiah dari Kerabat):     x=22% (198), y=62% (372) -> Near 3D modern staircase & Scandinavian sofa
 * - home-npc-5 (Telepon Nomor Tidak Dikenal):    x=60% (540), y=78% (468) -> Beside 3D home phone stand & emergency numbers
 * - Right Wall Student Zone (x=748..888):        3D Study Desk, Buku PR, Jadwal Pelajaran, Piala, Rak Tas & Topi SD
 */

export default function Home3DScene() {
  // 1-point perspective wood floor plank lines fanning from back wall (x=96..804, y=194) to foreground (x=-70..970, y=600)
  const plankCount = 18;
  const plankLines = Array.from({ length: plankCount + 1 }, (_, i) => {
    const t = i / plankCount;
    const xTop = 96 + t * (804 - 96);
    const xBot = -70 + t * (970 - -70);
    return { xTop, xBot };
  });

  const floorCourseYs = [218, 246, 278, 315, 358, 408, 466, 532];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#F8F6F1]">
      <svg
        viewBox="0 0 900 600"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Modern Warm Off-White Wall Gradients */}
          <linearGradient id="hmBackWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FAF8F5" />
            <stop offset="100%" stopColor="#EFECE6" />
          </linearGradient>

          <linearGradient id="hmSideWallLeft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E5E0D8" />
            <stop offset="100%" stopColor="#F3F0EA" />
          </linearGradient>

          <linearGradient id="hmSideWallRight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F3F0EA" />
            <stop offset="100%" stopColor="#E2DDD3" />
          </linearGradient>

          {/* Warm Honey-Oak 3D Parquet / Vinyl Floor */}
          <linearGradient id="hmOakFloor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DFC39D" />
            <stop offset="45%" stopColor="#E8CFAF" />
            <stop offset="100%" stopColor="#D3B186" />
          </linearGradient>

          {/* Modern WPC Fluted Wood Backdrop */}
          <linearGradient id="hmWoodSlat" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8C5A32" />
            <stop offset="50%" stopColor="#A66E40" />
            <stop offset="100%" stopColor="#7C4E29" />
          </linearGradient>

          {/* Smart LED TV Screen Sky Gradient */}
          <linearGradient id="hmTvScreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="55%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Soft Scandinavian Sofa Fabric */}
          <linearGradient id="hmSofaFabric" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="65%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Cozy Sage-Cream Geometric Living Room Rug */}
          <linearGradient id="hmModernRug" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ECFDF5" />
            <stop offset="55%" stopColor="#D1FAE5" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>

          {/* Warm Afternoon Window Sunbeam */}
          <linearGradient id="hmSunbeam" x1="20%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#FEF9C3" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Soft Ambient Furniture Shadow */}
          <radialGradient id="hmSoftAO" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1C1917" stopOpacity="0.32" />
            <stop offset="70%" stopColor="#1C1917" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1C1917" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ================= 1. 3D CEILING WITH RECESSED WARM LED DOWNLIGHTS ================= */}
        <polygon points="0,0 900,0 804,26 96,26" fill="#FFFFFF" stroke="#E7E5E4" strokeWidth="1" />
        {/* Warm Cove Ceiling Strip */}
        <line x1="98" y1="25" x2="802" y2="25" stroke="#FDE68A" strokeWidth="2.5" opacity="0.85" />
        {/* Recessed Modern Downlights */}
        {[210, 370, 530, 690].map((lx, idx) => (
          <g key={idx}>
            <ellipse cx={lx} cy={13} rx="12" ry="4" fill="#FEF3C7" stroke="#CBD5E1" strokeWidth="1" />
            <ellipse cx={lx} cy={13} rx="7" ry="2" fill="#FDE047" />
          </g>
        ))}

        {/* ================= 2. 3D ROOM WALLS (BACK WALL + LEFT & RIGHT PERSPECTIVE WALLS) ================= */}
        {/* Back Feature Wall (x=96..804, y=26..194) */}
        <rect x="96" y="26" width="708" height="168" fill="url(#hmBackWall)" />
        {/* Modern Wood Baseboard on Back Wall */}
        <rect x="96" y="187" width="708" height="7" fill="#B4845C" />

        {/* Left 3D Perspective Wall (x=0..96) */}
        <polygon points="0,0 96,26 96,194 0,600" fill="url(#hmSideWallLeft)" stroke="#D6D3D1" strokeWidth="1" />
        {/* Left Wall Baseboard */}
        <polygon points="0,582 96,187 96,194 0,600" fill="#9A6B45" />

        {/* Right 3D Perspective Wall (x=804..900) */}
        <polygon points="804,26 900,0 900,600 804,194" fill="url(#hmSideWallRight)" stroke="#D6D3D1" strokeWidth="1" />
        {/* Right Wall Baseboard */}
        <polygon points="804,187 900,582 900,600 804,194" fill="#9A6B45" />

        {/* ================= 3. 3D PERSPECTIVE HONEY-OAK PARQUET FLOOR (y=194..600) ================= */}
        <polygon points="96,194 804,194 900,600 0,600" fill="url(#hmOakFloor)" />
        {/* Wall-Floor Ambient Contact Shadow */}
        <polygon points="96,194 804,194 812,208 88,208" fill="#451A03" opacity="0.14" />

        {/* Perspective Wood Plank Grooves */}
        {plankLines.map((ln, idx) => (
          <line
            key={idx}
            x1={ln.xTop}
            y1={194}
            x2={ln.xBot}
            y2={600}
            stroke="#9A6B45"
            strokeWidth="0.9"
            opacity="0.32"
          />
        ))}
        {floorCourseYs.map((fy, idx) => {
          const t = (fy - 194) / (600 - 194);
          const xl = 96 * (1 - t);
          const xr = 804 + (900 - 804) * t;
          return (
            <line
              key={idx}
              x1={xl}
              y1={fy}
              x2={xr}
              y2={fy}
              stroke="#9A6B45"
              strokeWidth="0.8"
              opacity="0.22"
            />
          );
        })}

        {/* ================= 4. BACK WALL ARCHITECTURE & MODERN FAMILY HOME ELEMENTS ================= */}

        {/* --- 4A. LEFT-BACK: 3D MODERN WOOD & GLASS STAIRCASE WITH SAFETY BABY GATE (x=108..208) --- */}
        <g>
          {/* Recessed Stairwell Alcove */}
          <rect x="108" y="46" width="94" height="148" fill="#E7E2D8" stroke="#C7BFAf" strokeWidth="1.2" />
          {/* Ascending 3D Oak Stair Treads */}
          {[0, 1, 2, 3, 4, 5, 6].map((step) => {
            const sy = 176 - step * 16;
            const sx = 114 + step * 5;
            return (
              <g key={step}>
                <rect x={sx} y={sy} width={82 - step * 4} height="7" fill="#C68B59" stroke="#7C4D25" strokeWidth="0.8" />
                <rect x={sx} y={sy + 7} width={82 - step * 4} height="9" fill="#F5F5F4" />
              </g>
            );
          })}
          {/* Modern Tempered Glass & Wooden Handrail */}
          <polygon points="116,184 156,82 198,82 198,184" fill="#BAE6FD" opacity="0.24" />
          <line x1="114" y1="156" x2="160" y2="68" stroke="#8C5A32" strokeWidth="3.5" strokeLinecap="round" />

          {/* Child Safety Stair Gate (Pagar Pengaman Tangga) */}
          <rect x="110" y="158" width="88" height="34" rx="2" fill="#FFFFFF" fillOpacity="0.65" stroke="#9A6B45" strokeWidth="2" />
          {[122, 134, 146, 158, 170, 182].map((gx, i) => (
            <line key={i} x1={gx} y1="158" x2={gx} y2="192" stroke="#9A6B45" strokeWidth="1.6" />
          ))}
          <rect x="178" y="168" width="8" height="8" rx="1.5" fill="#10B981" />
        </g>

        {/* --- 4B. PANORAMIC MODERN WINDOW LOOKING OUT TO FRONT YARD & KID'S BICYCLE (x=222..382) --- */}
        <g>
          {/* Deep 3D Aluminum Window Frame */}
          <rect x="222" y="52" width="160" height="106" rx="3" fill="#1E293B" />
          {/* Outdoor Front Yard Scene Visible Through Window (Lingkungan Halaman Rumah!) */}
          <rect x="228" y="58" width="148" height="94" fill="#BAE6FD" />
          {/* Sunny Sky & Clouds Outside */}
          <circle cx="256" cy="74" r="9" fill="#FEF08A" />
          <ellipse cx="322" cy="72" rx="18" ry="6" fill="#FFFFFF" opacity="0.85" />
          {/* Distant Neighbor's Modern Roof */}
          <polygon points="295,104 316,88 364,88 376,104" fill="#EA580C" opacity="0.78" />
          {/* Green Front Lawn & Minimalist White House Fence */}
          <rect x="228" y="114" width="148" height="38" fill="#4ADE80" />
          <rect x="228" y="106" width="148" height="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={234 + i * 12} y1="104" x2={234 + i * 12} y2="118" stroke="#64748B" strokeWidth="1.2" />
          ))}
          {/* Kid's Red/Blue Bicycle Parked on Front Porch Outside Window! */}
          <g transform="translate(254, 122)">
            <circle cx="8" cy="18" r="6.5" fill="none" stroke="#1E293B" strokeWidth="1.8" />
            <circle cx="28" cy="18" r="6.5" fill="none" stroke="#1E293B" strokeWidth="1.8" />
            <path d="M 8,18 L 16,10 L 26,10 L 28,18 M 16,10 L 18,18" stroke="#EF4444" strokeWidth="2" fill="none" />
            <path d="M 25,6 L 28,10" stroke="#334155" strokeWidth="1.6" />
          </g>
          {/* Window Mullions & Sheer Modern Curtain Drapes */}
          <line x1="302" y1="58" x2="302" y2="152" stroke="#1E293B" strokeWidth="3" />
          <polygon points="228,58 246,58 238,152 228,152" fill="#FFFFFF" opacity="0.65" />
          <polygon points="358,58 376,58 376,152 366,152" fill="#FFFFFF" opacity="0.65" />
          {/* 3D Wooden Window Sill */}
          <rect x="218" y="156" width="168" height="5" rx="1.5" fill="#C68B59" />
        </g>

        {/* --- 4C. CENTER FEATURE WALL: WPC FLUTED WOOD PANEL, SMART LED TV & FLOATING CREDENZA (x=402..602) --- */}
        <g>
          {/* Modern AC Split Unit High on Wall */}
          <g transform="translate(454, 30)">
            <rect x="0" y="0" width="96" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
            <line x1="8" y1="15" x2="88" y2="15" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="84" cy="8" r="2" fill="#10B981" />
          </g>

          {/* Fluted Wood-Slat Panel (WPC Modern Living Room Backdrop) */}
          <rect x="406" y="58" width="192" height="132" rx="2" fill="url(#hmWoodSlat)" stroke="#5C3618" strokeWidth="1.2" />
          {Array.from({ length: 23 }, (_, i) => (
            <line
              key={i}
              x1={414 + i * 8}
              y1="58"
              x2={414 + i * 8}
              y2="190"
              stroke="#4A2B12"
              strokeWidth="1.6"
              opacity="0.55"
            />
          ))}

          {/* Ultra-Thin 3D Smart LED TV (aligned with home-npc-3 at 50%, 56%) */}
          <rect x="434" y="72" width="136" height="78" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="439" y="77" width="126" height="68" fill="url(#hmTvScreen)" />
          {/* Family Educational / Nature Channel Graphic on TV */}
          <circle cx="460" cy="92" r="8" fill="#FDE047" opacity="0.9" />
          <path d="M 439,132 Q 472,106 504,128 Q 536,104 565,126 L 565,145 L 439,145 Z" fill="#22C55E" opacity="0.85" />
          <rect x="445" y="82" width="44" height="10" rx="2" fill="#0F172A" opacity="0.65" />
          <text x="467" y="89" textAnchor="middle" fontSize="5.2" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">
            SIARAN KELUARGA
          </text>
          {/* TV Glare */}
          <polygon points="442,79 468,79 450,143 442,143" fill="#FFFFFF" opacity="0.16" />

          {/* 3D Floating Minimalist TV Console / Credenza */}
          <ellipse cx="502" cy="206" rx="98" ry="8" fill="url(#hmSoftAO)" />
          <polygon points="408,162 596,162 604,170 400,170" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="400" y="170" width="204" height="26" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="468" y1="170" x2="468" y2="196" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="536" y1="170" x2="536" y2="196" stroke="#CBD5E1" strokeWidth="1.2" />
          <rect x="490" y="176" width="24" height="3" rx="1" fill="#94A3B8" />
          {/* Wi-Fi Router, Remote Control & Neat Children's Books on Console */}
          <rect x="418" y="159" width="18" height="5" rx="1" fill="#1E293B" />
          <line x1="422" y1="159" x2="420" y2="152" stroke="#1E293B" strokeWidth="1.2" />
          <line x1="432" y1="159" x2="434" y2="152" stroke="#1E293B" strokeWidth="1.2" />
          {/* TV Remote */}
          <rect x="488" y="164" width="14" height="4" rx="1" fill="#334155" />
          {/* Stacked Storybooks */}
          <rect x="556" y="158" width="26" height="4" rx="1" fill="#3B82F6" />
          <rect x="558" y="154" width="22" height="4" rx="1" fill="#F59E0B" />
        </g>

        {/* --- 4D. RIGHT-BACK: FAMILY PORTRAITS, WALL CLOCK & GUEST NOOK (x=618..792, near home-npc-1 at 666,210) --- */}
        <g>
          {/* Modern Minimalist Round Wall Clock */}
          <circle cx="644" cy="64" r="14" fill="#FFFFFF" stroke="#C68B59" strokeWidth="2.5" />
          <line x1="644" y1="64" x2="644" y2="55" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="644" y1="64" x2="651" y2="66" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />

          {/* Framed Happy Family Portrait & Student Achievement Frame */}
          <rect x="622" y="88" width="44" height="54" rx="2" fill="#FFFFFF" stroke="#8C5A32" strokeWidth="2.5" />
          <rect x="627" y="93" width="34" height="36" fill="#E0F2FE" />
          {/* Stylized Parents + Kid Silhouette */}
          <circle cx="636" cy="106" r="4" fill="#F59E0B" />
          <path d="M 630,126 Q 636,112 642,126 Z" fill="#2563EB" />
          <circle cx="652" cy="107" r="3.8" fill="#EC4899" />
          <path d="M 646,126 Q 652,113 658,126 Z" fill="#E11D48" />
          <circle cx="644" cy="114" r="3.2" fill="#10B981" />
          <path d="M 639,128 Q 644,119 649,128 Z" fill="#EF4444" />
          <text x="644" y="137" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#57534E" fontFamily="sans-serif">
            KELUARGA KITA
          </text>

          {/* Student Certificate / Piagam Juara */}
          <rect x="674" y="96" width="34" height="42" rx="2" fill="#FEFCE8" stroke="#CA8A04" strokeWidth="2" />
          <circle cx="691" cy="112" r="5" fill="#FACC15" />
          <line x1="681" y1="124" x2="701" y2="124" stroke="#A16207" strokeWidth="1.2" />
          <line x1="684" y1="129" x2="698" y2="129" stroke="#A16207" strokeWidth="1" />

          {/* 3D Modern Accent Guest Chair & Tall Monstera Plant in Back-Right Corner */}
          <g transform="translate(722, 136)">
            <ellipse cx="32" cy="64" rx="30" ry="7" fill="url(#hmSoftAO)" />
            {/* Chair Legs */}
            <line x1="14" y1="48" x2="10" y2="62" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="50" y1="48" x2="54" y2="62" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
            {/* Rounded Mustard-Amber Modern Armchair */}
            <rect x="10" y="14" width="44" height="32" rx="10" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
            <rect x="6" y="32" width="52" height="16" rx="6" fill="#FBBF24" stroke="#B45309" strokeWidth="1.2" />
          </g>

          {/* Tall Potted Indoor Monstera Plant */}
          <g transform="translate(782, 146)">
            <polygon points="-8,30 8,30 6,48 -6,48" fill="#F5F5F4" stroke="#A8A29E" strokeWidth="1.2" />
            <ellipse cx="-8" cy="14" rx="8" ry="12" transform="rotate(-24 -8 14)" fill="#15803D" />
            <ellipse cx="7" cy="12" rx="8" ry="13" transform="rotate(20 7 12)" fill="#16A34A" />
            <ellipse cx="0" cy="4" rx="7" ry="13" fill="#22C55E" />
          </g>
        </g>

        {/* ================= 5. LEFT 3D WALL: MODERN FRONT DOORWAY, TERRACE, KEY BOARD & SHOE CABINET ================= */}
        {/* Aligned directly with Left Exit ("Ke Jalan Raya ←" at x=72, y=300) */}
        <g>
          {/* Open 3D Modern Teak-and-Glass Main Entrance Doorway on Left Perspective Wall */}
          <polygon points="16,222 76,174 76,348 16,422" fill="#5C3618" stroke="#3E230E" strokeWidth="2" />
          {/* Sunlit Front Terrace / Porch Visible Outside Open Door! */}
          <polygon points="22,228 72,182 72,344 22,412" fill="#E0F2FE" />
          {/* Outdoor Terrace Stone Floor & Green Yard Strip */}
          <polygon points="22,332 72,298 72,344 22,412" fill="#D6D3D1" />
          <polygon points="22,306 72,278 72,298 22,332" fill="#4ADE80" />
          {/* Open 3D Teak Door Leaf Swung Inward */}
          <polygon points="72,182 94,196 94,354 72,344" fill="#9A6030" stroke="#4A2B12" strokeWidth="1.3" />
          {/* Frosted Vertical Glass Lite on Modern Door */}
          <polygon points="78,200 88,207 88,332 78,325" fill="#BAE6FD" opacity="0.7" />
          {/* Modern Door Handle */}
          <rect x="89" y="268" width="2.5" height="16" rx="1" fill="#E2E8F0" />

          {/* 3D Coir Welcome Mat at Front Door Threshold */}
          <polygon
            points="58,348 118,348 104,408 40,408"
            fill="#C68B59"
            stroke="#7C4D25"
            strokeWidth="1.5"
          />
          <polygon points="63,354 112,354 100,401 48,401" fill="#D9A066" />

          {/* Wall-Mounted Key Holder ("Gantungan Kunci Rumah") Above Shoe Cabinet */}
          <polygon points="18,418 52,380 52,404 18,444" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.2" />
          <circle cx="28" cy="422" r="2.2" fill="#F59E0B" />
          <circle cx="38" cy="410" r="2.2" fill="#94A3B8" />

          {/* 3D Modern Minimalist Shoe Cabinet (Rak Sepatu Pintu Depan) on Lower-Left */}
          <g>
            <ellipse cx="52" cy="542" rx="44" ry="10" fill="url(#hmSoftAO)" />
            <polygon points="10,486 58,442 84,442 42,486" fill="#E7CFAF" stroke="#8C5A32" strokeWidth="1.2" />
            <polygon points="42,486 84,442 84,514 42,562" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
            <rect x="10" y="486" width="32" height="76" fill="#C68B59" stroke="#8C5A32" strokeWidth="1.2" />
            {/* Student's Black-and-White School Shoes Neatly Stored on Top! */}
            <ellipse cx="52" cy="462" rx="7" ry="3.5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="0.9" />
            <ellipse cx="64" cy="454" rx="7" ry="3.5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="0.9" />
          </g>
        </g>

        {/* ================= 6. LIVING ROOM CENTERPIECE: 3D RUG, SCANDINAVIAN SOFA & COFFEE TABLE WITH TABLET ================= */}

        {/* 3D Perspective Soft Geometric Rug (Karpet Ruang Keluarga) */}
        <polygon
          points="204,286 516,286 548,448 166,448"
          fill="url(#hmModernRug)"
          stroke="#6EE7B7"
          strokeWidth="2"
        />
        <polygon
          points="218,298 502,298 530,434 184,434"
          fill="none"
          stroke="#34D399"
          strokeWidth="1.2"
          strokeDasharray="8 6"
        />

        {/* 3D Scandinavian L-Shaped Family Sofa (x=222..398, y=252..340, beside home-npc-4) */}
        <g>
          <ellipse cx="312" cy="340" rx="96" ry="12" fill="url(#hmSoftAO)" />
          {/* Wooden Tapered Legs */}
          <rect x="232" y="328" width="5" height="10" rx="1" fill="#8C5A32" />
          <rect x="382" y="328" width="5" height="10" rx="1" fill="#8C5A32" />
          {/* Sofa Backrest */}
          <rect x="226" y="254" width="168" height="38" rx="10" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Three Plush Back Cushions */}
          <rect x="234" y="260" width="48" height="30" rx="7" fill="url(#hmSofaFabric)" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="286" y="260" width="48" height="30" rx="7" fill="url(#hmSofaFabric)" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="338" y="260" width="48" height="30" rx="7" fill="url(#hmSofaFabric)" stroke="#CBD5E1" strokeWidth="1" />
          {/* 3D Seat Base & Chaise Extension */}
          <polygon points="224,290 396,290 404,312 218,312" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.1" />
          <rect x="218" y="312" width="186" height="19" rx="5" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Left & Right Rounded Armrests */}
          <rect x="216" y="274" width="14" height="54" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
          <rect x="392" y="274" width="14" height="54" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Cheerful Throw Pillows */}
          <rect x="238" y="274" width="18" height="18" rx="4" transform="rotate(-10 247 283)" fill="#FDA4AF" />
          <rect x="364" y="274" width="18" height="18" rx="4" transform="rotate(12 373 283)" fill="#FDE047" />
        </g>

        {/* 3D Rounded-Corner Safe Wooden Coffee Table + Glowing Tablet (beside home-npc-2 at 342,420) */}
        <g transform="translate(262, 362)">
          <ellipse cx="64" cy="54" rx="68" ry="12" fill="url(#hmSoftAO)" />
          {/* Angled Wooden Table Legs */}
          <line x1="20" y1="30" x2="14" y2="52" stroke="#7C4D25" strokeWidth="4" strokeLinecap="round" />
          <line x1="108" y1="30" x2="114" y2="52" stroke="#7C4D25" strokeWidth="4" strokeLinecap="round" />
          <line x1="34" y1="30" x2="32" y2="46" stroke="#5C3618" strokeWidth="3" strokeLinecap="round" />
          <line x1="94" y1="30" x2="96" y2="46" stroke="#5C3618" strokeWidth="3" strokeLinecap="round" />

          {/* Child-Safe Rounded Oval/Capsule Solid Oak Tabletop */}
          <rect x="4" y="10" width="120" height="28" rx="14" fill="#B47B48" stroke="#7C4D25" strokeWidth="1.2" />
          <rect x="4" y="6" width="120" height="26" rx="13" fill="#E6B88A" stroke="#9A6030" strokeWidth="1.3" />

          {/* Afternoon Glass of Milk & Plate of Biscuits for the Student */}
          <ellipse cx="32" cy="19" rx="12" ry="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
          <circle cx="29" cy="18" r="2.5" fill="#D97706" />
          <circle cx="35" cy="19" r="2.5" fill="#D97706" />
          <rect x="48" y="9" width="7" height="11" rx="2" fill="#F8FAFC" stroke="#93C5FD" strokeWidth="1" />

          {/* Glowing 3D Tablet on Stand Showing Incoming Stranger Chat (matches sc-home-2!) */}
          <g transform="translate(74, 2)">
            {/* Pulse Aura */}
            <circle cx="14" cy="12" r="14" fill="#38BDF8" opacity="0.25" className="animate-home-ring" />
            {/* Tablet Stand & Bezel */}
            <polygon points="4,20 26,20 22,5 8,5" fill="#1E293B" stroke="#0F172A" strokeWidth="1.2" />
            <polygon points="6,18 24,18 21,7 9,7" fill="#38BDF8" />
            {/* Chat Bubbles on Screen */}
            <rect x="10" y="9" width="9" height="3" rx="1" fill="#FFFFFF" />
            <rect x="9" y="13.5" width="11" height="3" rx="1" fill="#FDE047" />
          </g>
        </g>

        {/* ================= 7. TELEPHONE & EMERGENCY CONTACT CREDENZA (beside home-npc-5 at 540,468) ================= */}
        <g transform="translate(604, 444)">
          <ellipse cx="42" cy="68" rx="48" ry="10" fill="url(#hmSoftAO)" />
          {/* 3D Side Table / Credenza */}
          <polygon points="6,14 78,14 84,26 0,26" fill="#F5F5F4" stroke="#CBD5E1" strokeWidth="1.2" />
          <rect x="2" y="26" width="80" height="34" rx="3" fill="#C68B59" stroke="#7C4D25" strokeWidth="1.3" />
          <line x1="42" y1="26" x2="42" y2="60" stroke="#7C4D25" strokeWidth="1.2" />
          <circle cx="36" cy="43" r="2" fill="#FEF3C7" />
          <circle cx="48" cy="43" r="2" fill="#FEF3C7" />
          <rect x="8" y="60" width="5" height="8" fill="#5C3618" />
          <rect x="71" y="60" width="5" height="8" fill="#5C3618" />

          {/* Ringing 3D Cordless Home Phone on Dock (matches sc-home-5!) */}
          <circle cx="24" cy="12" r="13" fill="#F43F5E" opacity="0.24" className="animate-home-ring" />
          <rect x="14" y="13" width="20" height="7" rx="2" fill="#1E293B" />
          <rect x="18" y="3" width="12" height="14" rx="3" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
          <rect x="20" y="5" width="8" height="6" rx="1" fill="#38BDF8" />

          {/* Framed "NOMOR DARURAT ORANG TUA" Card Beside Phone */}
          <polygon points="48,6 74,6 76,21 46,21" fill="#FEF2F2" stroke="#EF4444" strokeWidth="1.2" />
          <text x="61" y="12.5" textAnchor="middle" fontSize="4.2" fontWeight="900" fill="#B91C1C" fontFamily="sans-serif">
            TELP AYAH/IBU
          </text>
          <line x1="51" y1="15.5" x2="71" y2="15.5" stroke="#EF4444" strokeWidth="1" />
          <line x1="51" y1="18" x2="67" y2="18" stroke="#EF4444" strokeWidth="1" />
        </g>

        {/* ================= 8. RIGHT 3D WALL: DEDICATED STUDENT STUDY CORNER ("ZONA BELAJAR SISWA SD") ================= */}
        <g>
          {/* Wall Pegboard / Jadwal Pelajaran & Aturan Rumah Aman on Right 3D Wall */}
          <polygon
            points="816,184 876,248 876,326 816,252"
            fill="#FEF3C7"
            stroke="#D97706"
            strokeWidth="1.6"
          />
          {/* Pinned Notes: Jadwal Pelajaran, PR, Kata Sandi Keluarga */}
          <polygon points="824,202 846,226 846,252 824,226" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="0.9" />
          <polygon points="850,232 870,254 870,282 850,258" fill="#DCFCE7" stroke="#4ADE80" strokeWidth="0.9" />
          <circle cx="835" cy="211" r="2.2" fill="#EF4444" />
          <circle cx="860" cy="240" r="2.2" fill="#2563EB" />

          {/* 3D Standing Wooden Coat/Backpack Rack with Student's Red-White SD Cap & School Bag! */}
          <g transform="translate(768, 224)">
            <ellipse cx="14" cy="72" rx="18" ry="5" fill="url(#hmSoftAO)" />
            <line x1="14" y1="8" x2="14" y2="70" stroke="#8C5A32" strokeWidth="4" strokeLinecap="round" />
            <line x1="4" y1="72" x2="24" y2="72" stroke="#8C5A32" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="6" y1="16" x2="14" y2="22" stroke="#8C5A32" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="22" y1="14" x2="14" y2="20" stroke="#8C5A32" strokeWidth="2.5" strokeLinecap="round" />
            {/* Student's Red SD Hat (Topi Merah Putih SD) */}
            <ellipse cx="6" cy="14" rx="7" ry="4.5" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
            <rect x="3" y="12" width="6" height="3" fill="#FFFFFF" />
            {/* Student's School Backpack Hung Neatly After Coming Home */}
            <rect x="15" y="26" width="18" height="22" rx="5" fill="#2563EB" stroke="#1E3A8A" strokeWidth="1.2" />
            <rect x="18" y="34" width="12" height="9" rx="2" fill="#60A5FA" />
          </g>

          {/* 3D Modern Student Study Desk & Bookshelf (Meja Belajar Siswa) at x=754..882, y=316..464 */}
          <g>
            <ellipse cx="816" cy="442" rx="64" ry="14" fill="url(#hmSoftAO)" />

            {/* Desk Frame & Drawer Unit */}
            <polygon points="766,348 836,348 866,412 784,412" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.3" />
            {/* 3D Desk Front & Drawer Pedestal */}
            <rect x="784" y="412" width="82" height="34" rx="2" fill="#C68B59" stroke="#7C4D25" strokeWidth="1.3" />
            <line x1="784" y1="428" x2="866" y2="428" stroke="#7C4D25" strokeWidth="1.1" />
            <rect x="818" y="418" width="14" height="2.5" rx="1" fill="#F8FAFC" />
            <rect x="818" y="434" width="14" height="2.5" rx="1" fill="#F8FAFC" />
            {/* Left Desk Legs */}
            <line x1="768" y1="350" x2="768" y2="404" stroke="#7C4D25" strokeWidth="3.5" />

            {/* Open Homework Notebook (Buku PR SD), Pencil Cup & Modern LED Study Lamp on Desk */}
            <polygon points="784,368 820,368 826,386 788,386" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
            <line x1="804" y1="368" x2="807" y2="386" stroke="#CBD5E1" strokeWidth="1" />
            {/* Colorful Pencil Holder */}
            <rect x="828" y="354" width="10" height="13" rx="2" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
            <line x1="831" y1="354" x2="830" y2="347" stroke="#EF4444" strokeWidth="1.8" />
            <line x1="835" y1="354" x2="836" y2="346" stroke="#2563EB" strokeWidth="1.8" />

            {/* Sleek White Modern LED Study Lamp */}
            <ellipse cx="804" cy="354" rx="7" ry="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            <path d="M 804,354 Q 800,334 816,330" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="819" cy="330" rx="8" ry="3" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
            <polygon points="812,332 826,332 834,366 798,366" fill="#FEF08A" opacity="0.22" />

            {/* 3D Ergonomic Rolling Student Study Chair Tucked Beside Desk */}
            <g transform="translate(736, 376)">
              <ellipse cx="24" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.2)" />
              <line x1="24" y1="36" x2="24" y2="50" stroke="#475569" strokeWidth="3" />
              <line x1="12" y1="51" x2="36" y2="51" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="53" r="2.2" fill="#1E293B" />
              <circle cx="36" cy="53" r="2.2" fill="#1E293B" />
              <rect x="8" y="26" width="32" height="10" rx="4" fill="#0EA5E9" stroke="#0369A1" strokeWidth="1.1" />
              <rect x="6" y="6" width="12" height="24" rx="5" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.1" />
            </g>

            {/* Label Tag for Student's Study Corner */}
            <rect x="772" y="454" width="94" height="14" rx="4" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
            <text x="819" y="463" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#1E40AF" fontFamily="sans-serif">
              SUDUT BELAJAR SISWA
            </text>
          </g>

          {/* Foreground Right: 3D Low Toy & Storybook Organizer Rack */}
          <g transform="translate(766, 488)">
            <polygon points="0,0 96,0 104,12 -4,12" fill="#F5F5F4" stroke="#CBD5E1" strokeWidth="1.1" />
            <rect x="-4" y="12" width="108" height="44" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.3" />
            {/* Colorful Pastel Storage Bins */}
            <rect x="4" y="18" width="28" height="32" rx="3" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="1" />
            <rect x="36" y="18" width="28" height="32" rx="3" fill="#FDE68A" stroke="#FBBF24" strokeWidth="1" />
            <rect x="68" y="18" width="28" height="32" rx="3" fill="#BBF7D0" stroke="#4ADE80" strokeWidth="1" />
          </g>
        </g>

        {/* ================= 9. CHILD-SAFE COVERED POWER OUTLET & VOLUMETRIC WINDOW SUNBEAMS ================= */}
        {/* Child-Safe Covered Wall Socket on Back Wall Baseboard */}
        <rect x="390" y="176" width="10" height="8" rx="1.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
        <circle cx="395" cy="180" r="1.5" fill="#10B981" />

        {/* Warm Afternoon Sunbeam Projected from Panoramic Front Yard Window Across the Oak Floor */}
        <polygon points="228,152 376,152 462,438 164,438" fill="url(#hmSunbeam)" />
      </svg>
    </div>
  );
}
