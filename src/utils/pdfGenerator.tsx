import jsPDF from "jspdf";
import { PlayerHistory, Scenario, StudentLog } from "../types";
import { DEFAULT_SCENARIOS } from "../data/scenarios";

export type IndicatorKey = "bodily_autonomy" | "cyber_safety" | "assertive_action";

export interface IndicatorDiagnostic {
  key: IndicatorKey;
  title: string;
  subtitle: string;
  totalItems: number;
  answeredItems: number;
  correctItems: number;
  pointsEarned: number;
  maxPoints: number;
  accuracyPct: number; // accuracy among answered scenarios in this indicator
  masteryPct: number; // mastery across total curriculum scenarios in this indicator
  displayPct: number; // primary diagnostic percentage for this student
  diagnosticStatus: string; // For Portrait Parent/Teacher Diagnostic Report
  positiveBadgeLabel: string; // Positive, encouraging label for Landscape Child Certificate (never "Gagal/Rawan")
  passedTopics: string[];
  missedTopics: string[];
}

export interface MapAccuracyStat {
  mapId: string;
  label: string;
  totalItems: number;
  answeredItems: number;
  correctItems: number;
  accuracyPct: number;
}

export interface StudentDiagnosticProfile {
  studentName: string;
  totalPoints: number;
  maxTotalPoints: number;
  scorePct: number;
  answeredCount: number;
  totalCurriculumCount: number;
  correctCount: number;
  attemptAccuracyPct: number;
  diagnosticGradeLabel: string;
  certificateTitle: string;
  certificateTierCode: "DUTA" | "PAHLAWAN" | "PETUALANG";
  certificateId: string;
  diagnosticReportId: string;
  formattedDate: string;
  formattedShortDate: string;
  indicators: [IndicatorDiagnostic, IndicatorDiagnostic, IndicatorDiagnostic];
  strongestIndicator: IndicatorDiagnostic;
  weakestIndicator: IndicatorDiagnostic;
  mapStats: MapAccuracyStat[];
  personalSummaryText: string;
  parentGuidanceItems: {
    indicatorTitle: string;
    statusTag: string;
    guidance: string;
  }[];
  certificateNarrative: string;
}

// Explicit scenario-to-indicator mapping for all 20 default SafeStep scenarios
const SCENARIO_INDICATOR_MAP: Record<string, IndicatorKey> = {
  // Bodily Autonomy (6 scenarios — personal body boundaries, isolated rooms, secret gifts/touch)
  "sc-school-2": "bodily_autonomy",
  "sc-school-3": "bodily_autonomy",
  "sc-class-1": "bodily_autonomy",
  "sc-home-1": "bodily_autonomy",
  "sc-home-3": "bodily_autonomy",
  "sc-home-4": "bodily_autonomy",

  // Cyber Safety (6 scenarios — hidden screen content, stranger video calls, unauthorized photos, unknown chats/calls)
  "sc-class-2": "cyber_safety",
  "sc-class-3": "cyber_safety",
  "sc-class-5": "cyber_safety",
  "sc-street-2": "cyber_safety",
  "sc-home-2": "cyber_safety",
  "sc-home-5": "cyber_safety",

  // Assertive Action (8 scenarios — refusing strangers, anti-bullying, seeking crowded safe places, peer safety)
  "sc-school-1": "assertive_action",
  "sc-school-4": "assertive_action",
  "sc-school-5": "assertive_action",
  "sc-class-4": "assertive_action",
  "sc-street-1": "assertive_action",
  "sc-street-3": "assertive_action",
  "sc-street-4": "assertive_action",
  "sc-street-5": "assertive_action",
};

// Concise, parent-readable topic descriptions per scenario ID so personalized reports cite concrete situations
const SCENARIO_TOPIC_SUMMARY: Record<string, string> = {
  "sc-school-1": "menolak penjemput asing tanpa konfirmasi guru",
  "sc-school-2": "menolak ajakan ke gudang sepi sendirian",
  "sc-school-3": "menjaga batas area privat tubuh dari sentuhan teman",
  "sc-school-4": "menolak iming-iming hadiah rahasia di parkiran",
  "sc-school-5": "melawan ancaman perundungan (bullying) dan melapor",
  "sc-class-1": "menolak dikunci berdua saja di ruang tertutup",
  "sc-class-2": "menolak tontonan tersembunyi di HP teman",
  "sc-class-3": "menutup ajakan video call privat mencurigakan di laptop",
  "sc-class-5": "melaporkan pemotretan tanpa izin dari luar kelas",
  "sc-class-4": "menolak ajakan teman ke tempat tersembunyi",
  "sc-street-1": "menolak tumpangan mobil orang tak dikenal",
  "sc-street-2": "memblokir dan melaporkan chat nomor asing",
  "sc-street-3": "mencari perlindungan di tempat ramai saat diikuti",
  "sc-street-4": "menolak jajanan gratis bersyarat masuk ke ruang belakang",
  "sc-street-5": "menolak mampir ke rumah kenalan asing tanpa izin orang tua",
  "sc-home-1": "melindungi tubuh privat dan menolak 'rahasia berdua' kerabat",
  "sc-home-2": "melaporkan permintaan video call akun asing di tablet",
  "sc-home-3": "mematikan tayangan tidak pantas dan melapor ke orang tua",
  "sc-home-4": "menolak hadiah bersyarat rahasia dari kerabat",
  "sc-home-5": "memverifikasi telepon darurat nomor asing langsung ke orang tua",
};

function classifyScenarioIndicator(scenarioId: string, category: string): IndicatorKey {
  if (SCENARIO_INDICATOR_MAP[scenarioId]) {
    return SCENARIO_INDICATOR_MAP[scenarioId];
  }
  const lower = (category || "").toLowerCase();
  if (
    lower.includes("grooming") ||
    lower.includes("batasan") ||
    lower.includes("otonomi") ||
    lower.includes("tubuh")
  ) {
    return "bodily_autonomy";
  }
  if (
    lower.includes("digital") ||
    lower.includes("cyber") ||
    lower.includes("siber") ||
    lower.includes("citra") ||
    lower.includes("privasi")
  ) {
    return "cyber_safety";
  }
  return "assertive_action";
}

function normalizeMapKey(rawMap: string, scenarioId: string): "school" | "class" | "street" | "home" {
  const m = (rawMap || "").toLowerCase();
  if (m.includes("school") || m.includes("sekolah") || scenarioId.includes("-school-")) return "school";
  if (m.includes("class") || m.includes("kelas") || scenarioId.includes("-class-")) return "class";
  if (m.includes("street") || m.includes("jalan") || scenarioId.includes("-street-")) return "street";
  return "home";
}

function sanitizeAsciiPdfText(input: string): string {
  if (!input) return "";
  return input
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates a human-readable, unambiguous 6-character uppercase alphanumeric entropy hash
 * (e.g., "1LHRRZ", "8K4P2M") using dual 32-bit FNV/Murmur mixing passes.
 */
function generateDeterministicHash(seed: string): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i * 31);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h2 = (h2 ^ (h2 >>> 13)) >>> 0;

  let out = "";
  let mixA = h1;
  let mixB = h2;
  for (let idx = 0; idx < 6; idx++) {
    const combined = ((idx % 2 === 0 ? mixA : mixB) ^ (idx * 0x45d9f3b)) >>> 0;
    out += alphabet[combined % alphabet.length];
    mixA = ((mixA >>> 5) | (mixA << 27)) >>> 0;
    mixB = ((mixB >>> 6) | (mixB << 26)) >>> 0;
  }
  return out;
}

/**
 * Computes an individualized diagnostic profile for a specific student based on their actual gameplay history.
 */
export function computeStudentDiagnosticProfile(
  log: StudentLog,
  scenarios: Scenario[] = DEFAULT_SCENARIOS
): StudentDiagnosticProfile {
  const activeScenarios = scenarios.length > 0 ? scenarios : DEFAULT_SCENARIOS;
  const totalCurriculumCount = activeScenarios.length;
  const maxTotalPoints = totalCurriculumCount * 10;

  // Deduplicate student history by scenarioId (keeping latest entry)
  const historyByScenario = new Map<string, PlayerHistory>();
  for (const item of log.history || []) {
    if (!item) continue;
    const key = item.scenarioId || item.scenarioName;
    if (key) {
      historyByScenario.set(key, item);
    }
  }

  const dedupedHistory = Array.from(historyByScenario.values());
  const hasDetailedHistory = dedupedHistory.length > 0;

  // Count curriculum totals per indicator
  const catalogCounts: Record<IndicatorKey, number> = {
    bodily_autonomy: 0,
    cyber_safety: 0,
    assertive_action: 0,
  };
  for (const sc of activeScenarios) {
    const key = classifyScenarioIndicator(sc.id, sc.category);
    catalogCounts[key]++;
  }

  const rawStats: Record<
    IndicatorKey,
    { answered: number; correct: number; passedTopics: string[]; missedTopics: string[] }
  > = {
    bodily_autonomy: { answered: 0, correct: 0, passedTopics: [], missedTopics: [] },
    cyber_safety: { answered: 0, correct: 0, passedTopics: [], missedTopics: [] },
    assertive_action: { answered: 0, correct: 0, passedTopics: [], missedTopics: [] },
  };

  const mapRaw: Record<
    "school" | "class" | "street" | "home",
    { total: number; answered: number; correct: number }
  > = {
    school: { total: 0, answered: 0, correct: 0 },
    class: { total: 0, answered: 0, correct: 0 },
    street: { total: 0, answered: 0, correct: 0 },
    home: { total: 0, answered: 0, correct: 0 },
  };

  for (const sc of activeScenarios) {
    const mKey = normalizeMapKey(sc.mapId, sc.id);
    mapRaw[mKey].total++;
  }

  if (hasDetailedHistory) {
    for (const h of dedupedHistory) {
      const indKey = classifyScenarioIndicator(h.scenarioId, h.category);
      rawStats[indKey].answered++;
      const readableTopic =
        SCENARIO_TOPIC_SUMMARY[h.scenarioId] ||
        sanitizeAsciiPdfText(h.scenarioName || "skenario interaksi");

      if (h.isSolvedCorrectly) {
        rawStats[indKey].correct++;
        rawStats[indKey].passedTopics.push(readableTopic);
      } else {
        rawStats[indKey].missedTopics.push(readableTopic);
      }

      const mKey = normalizeMapKey(h.mapName, h.scenarioId);
      mapRaw[mKey].answered++;
      if (h.isSolvedCorrectly) {
        mapRaw[mKey].correct++;
      }
    }
  } else if (log.completedScenariosCount > 0) {
    // Proportional fallback ONLY if legacy log has no history items
    const totalCorrectFallback = Math.min(
      log.completedScenariosCount,
      Math.round(log.totalPoints / 10)
    );
    const keys: IndicatorKey[] = ["bodily_autonomy", "cyber_safety", "assertive_action"];
    let remAnswered = log.completedScenariosCount;
    let remCorrect = totalCorrectFallback;

    keys.forEach((k, idx) => {
      const weight = catalogCounts[k] / Math.max(1, totalCurriculumCount);
      const ans =
        idx === keys.length - 1
          ? remAnswered
          : Math.min(catalogCounts[k], Math.round(log.completedScenariosCount * weight));
      const cor =
        idx === keys.length - 1
          ? remCorrect
          : Math.min(ans, Math.round(totalCorrectFallback * weight));
      rawStats[k].answered = Math.max(0, ans);
      rawStats[k].correct = Math.max(0, Math.min(ans, cor));
      remAnswered -= rawStats[k].answered;
      remCorrect -= rawStats[k].correct;
    });
  }

  const indicatorMeta: { key: IndicatorKey; title: string; subtitle: string }[] = [
    {
      key: "bodily_autonomy",
      title: "Bodily Autonomy",
      subtitle: "Otonomi Tubuh & Batasan Privat",
    },
    {
      key: "cyber_safety",
      title: "Cyber Safety",
      subtitle: "Keamanan Siber & Privasi Digital",
    },
    {
      key: "assertive_action",
      title: "Assertive Action",
      subtitle: "Tindakan Asertif & Proteksi Diri",
    },
  ];

  const indicators = indicatorMeta.map((meta) => {
    const totalItems = Math.max(1, catalogCounts[meta.key]);
    const answeredItems = rawStats[meta.key].answered;
    const correctItems = rawStats[meta.key].correct;
    const pointsEarned = correctItems * 10;
    const maxPoints = totalItems * 10;
    const accuracyPct =
      answeredItems > 0 ? Math.round((correctItems / answeredItems) * 100) : 0;
    const masteryPct = Math.round((correctItems / totalItems) * 100);
    // Primary diagnostic percentage reflects accuracy on answered items when partial, or full mastery when completed
    const displayPct =
      answeredItems >= totalItems ? masteryPct : answeredItems > 0 ? accuracyPct : 0;

    let diagnosticStatus = "Belum Dijajaki";
    if (answeredItems > 0) {
      if (displayPct >= 80) diagnosticStatus = "Tangguh & Mandiri";
      else if (displayPct >= 60) diagnosticStatus = "Cukup Waspada";
      else diagnosticStatus = "Perlu Penguatan";
    }

    // Positive-only labels for Child Landscape Certificate (strictly no negative/failure labels)
    let positiveBadgeLabel = "Siap Berpetualang";
    if (answeredItems > 0) {
      if (displayPct >= 80) positiveBadgeLabel = "Sangat Mahir";
      else if (displayPct >= 60) positiveBadgeLabel = "Terampil & Siaga";
      else positiveBadgeLabel = "Aktif Berlatih";
    }

    return {
      key: meta.key,
      title: meta.title,
      subtitle: meta.subtitle,
      totalItems,
      answeredItems,
      correctItems,
      pointsEarned,
      maxPoints,
      accuracyPct,
      masteryPct,
      displayPct,
      diagnosticStatus,
      positiveBadgeLabel,
      passedTopics: rawStats[meta.key].passedTopics,
      missedTopics: rawStats[meta.key].missedTopics,
    } satisfies IndicatorDiagnostic;
  }) as [IndicatorDiagnostic, IndicatorDiagnostic, IndicatorDiagnostic];

  const answeredCount = hasDetailedHistory
    ? dedupedHistory.length
    : log.completedScenariosCount;
  const correctCount = hasDetailedHistory
    ? dedupedHistory.filter((h) => h.isSolvedCorrectly).length
    : Math.round(log.totalPoints / 10);

  const effectiveTotalPoints = Math.min(maxTotalPoints, Math.max(0, log.totalPoints));
  const scorePct = Math.min(
    100,
    Math.round((effectiveTotalPoints / Math.max(1, maxTotalPoints)) * 100)
  );
  const attemptAccuracyPct =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Dynamic Certificate Title Logic (exact thresholds from specification):
  // >= 80% -> "PIAGAM APRESIASI: DUTA KESELAMATAN CILIK"
  // 60-79% -> "SERTIFIKAT KELULUSAN: PAHLAWAN KESELAMATAN"
  // < 60%  -> "SERTIFIKAT PARTISIPASI: PETUALANG SAFESTEP"
  let certificateTitle = "SERTIFIKAT PARTISIPASI: PETUALANG SAFESTEP";
  let certificateTierCode: "DUTA" | "PAHLAWAN" | "PETUALANG" = "PETUALANG";
  let diagnosticGradeLabel = "PERLU PENDAMPINGAN TERARAH (KATEGORI C)";

  if (scorePct >= 80) {
    certificateTitle = "PIAGAM APRESIASI: DUTA KESELAMATAN CILIK";
    certificateTierCode = "DUTA";
    diagnosticGradeLabel = "AMAN & PROTEKTIF (KATEGORI A)";
  } else if (scorePct >= 60) {
    certificateTitle = "SERTIFIKAT KELULUSAN: PAHLAWAN KESELAMATAN";
    certificateTierCode = "PAHLAWAN";
    diagnosticGradeLabel = "CUKUP WASPADA (KATEGORI B)";
  }

  // Sort indicators to identify strongest and weakest areas for personalized feedback
  const sortedByPerf = [...indicators].sort((a, b) => {
    if (b.displayPct !== a.displayPct) return b.displayPct - a.displayPct;
    return b.correctItems - a.correctItems;
  });
  const strongestIndicator = sortedByPerf[0];
  const weakestIndicator = sortedByPerf[sortedByPerf.length - 1];

  const dateObj = log.completedAt ? new Date(log.completedAt) : new Date();
  const safeDate = Number.isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const yearStr = String(safeDate.getFullYear());
  const formattedDate = safeDate.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedShortDate = safeDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const cleanName = sanitizeAsciiPdfText(log.studentName) || "Siswa SafeStep";
  const uniqueCode = generateDeterministicHash(
    `${log.id}|${cleanName}|${effectiveTotalPoints}|${answeredCount}`
  );
  const certificateId = `CERT-SS-${yearStr}-${certificateTierCode}-${uniqueCode}`;
  const diagnosticReportId = `DIAG-SS-${yearStr}-${uniqueCode}`;

  const mapStats: MapAccuracyStat[] = [
    {
      mapId: "school",
      label: "Halaman Sekolah",
      totalItems: mapRaw.school.total,
      answeredItems: mapRaw.school.answered,
      correctItems: mapRaw.school.correct,
      accuracyPct:
        mapRaw.school.answered > 0
          ? Math.round((mapRaw.school.correct / mapRaw.school.answered) * 100)
          : 0,
    },
    {
      mapId: "class",
      label: "Ruang Kelas",
      totalItems: mapRaw.class.total,
      answeredItems: mapRaw.class.answered,
      correctItems: mapRaw.class.correct,
      accuracyPct:
        mapRaw.class.answered > 0
          ? Math.round((mapRaw.class.correct / mapRaw.class.answered) * 100)
          : 0,
    },
    {
      mapId: "street",
      label: "Jalan Pulang",
      totalItems: mapRaw.street.total,
      answeredItems: mapRaw.street.answered,
      correctItems: mapRaw.street.correct,
      accuracyPct:
        mapRaw.street.answered > 0
          ? Math.round((mapRaw.street.correct / mapRaw.street.answered) * 100)
          : 0,
    },
    {
      mapId: "home",
      label: "Area Rumah",
      totalItems: mapRaw.home.total,
      answeredItems: mapRaw.home.answered,
      correctItems: mapRaw.home.correct,
      accuracyPct:
        mapRaw.home.answered > 0
          ? Math.round((mapRaw.home.correct / mapRaw.home.answered) * 100)
          : 0,
    },
  ];

  // Collect concrete passed & missed examples across all indicators for personalized diagnostic prose
  const allPassedTopics = indicators.flatMap((i) => i.passedTopics);
  const allMissedTopics = indicators.flatMap((i) => i.missedTopics);

  let personalSummaryText = "";
  if (answeredCount === 0) {
    personalSummaryText = `Ananda ${cleanName} baru memulai registrasi simulasi dan belum menyelesaikan skenario uji. Dampingi ananda menjelajahi keempat peta SafeStep agar profil keakuratan 3 indikator terekam secara menyeluruh.`;
  } else {
    const strengthSample =
      allPassedTopics.length > 0
        ? ` (terbukti tepat saat ${allPassedTopics.slice(0, 2).join(" serta ")})`
        : "";
    const missedSample =
      allMissedTopics.length > 0
        ? ` Perhatian khusus diperlukan pada indikator ${weakestIndicator.title} (${weakestIndicator.displayPct}%), terutama terkait situasi ${allMissedTopics.slice(0, 2).join(" dan ")}.`
        : answeredCount < totalCurriculumCount
        ? ` Seluruh ${answeredCount} misi yang dikerjakan dijawab 100% tepat; lanjutkan ${totalCurriculumCount - answeredCount} skenario tersisa untuk melengkapi pemetaan.`
        : ` Ananda berhasil menjawab seluruh ${totalCurriculumCount} skenario tanpa celah kesalahan di semua lokasi.`;

    personalSummaryText = `Berdasarkan hasil aktual ${cleanName} (${effectiveTotalPoints}/${maxTotalPoints} poin, akurasi jawaban ${attemptAccuracyPct}% dari ${answeredCount} misi), kompetensi terkuat berada pada ${strongestIndicator.title} (${strongestIndicator.displayPct}%)${strengthSample}.${missedSample}`;
  }

  // Build 3 personalized parent guidance items tailored to each indicator's exact result for this child
  const [bodilyInd, cyberInd, assertiveInd] = indicators;

  const bodilyGuidance =
    bodilyInd.answeredItems === 0
      ? `Ananda ${cleanName} belum mengerjakan skenario Bodily Autonomy. Mulailah diskusi ringan di rumah mengenai bagian tubuh pribadi (zona pakaian dalam) yang tidak boleh disentuh orang lain.`
      : bodilyInd.missedTopics.length > 0
      ? `Latih kembali situasi ${bodilyInd.missedTopics[0]}. Tegaskan kepada ${cleanName} bahwa tidak boleh ada 'rahasia berdua' atau ajakan menyendiri di ruang tertutup meski dari orang yang dikenal, dan segera lapor ke orang tua.`
      : bodilyInd.displayPct >= 80
      ? `${cleanName} telah memahami batasan tubuh privat dengan sangat baik (${bodilyInd.correctItems}/${bodilyInd.answeredItems} tepat). Pertahankan kebiasaan obrolan terbuka 10 menit setiap hari agar ananda selalu nyaman bercerita tanpa rasa takut.`
      : `Perkuat keberanian ${cleanName} berkata 'TIDAK BOLEH!' melalui bermain peran sederhana tentang menolak hadiah bersyarat rahasia dan menjaga ruang pribadi di sekolah maupun di rumah.`;

  const cyberGuidance =
    cyberInd.answeredItems === 0
      ? `Ananda ${cleanName} belum menjajaki misi Cyber Safety. Dampingi pengenalan aturan dasar gawai: tidak membalas nomor asing dan tidak menyalakan kamera untuk kenalan internet.`
      : cyberInd.missedTopics.length > 0
      ? `Evaluasi menunjukkan celah pada situasi ${cyberInd.missedTopics[0]}. Sepakati aturan bersama ${cleanName}: jangan pernah membalas chat/video call akun asing secara sembunyi-sembunyi, segera tunjukkan layar gawai kepada Ayah/Ibu.`
      : cyberInd.displayPct >= 80
      ? `${cleanName} sangat sigap menghadapi risiko digital (${cyberInd.correctItems}/${cyberInd.answeredItems} tepat). Teruskan kebiasaan menggunakan gawai di ruang keluarga terbuka serta apresiasi sikap jujurnya saat melapor.`
      : `Dampingi ${cleanName} mengatur privasi akun belajar/permainan dan latih kebiasaan memvalidasi ulang telepon atau pesan mencurigakan langsung kepada orang tua.`;

  const assertiveGuidance =
    assertiveInd.answeredItems === 0
      ? `Ananda ${cleanName} belum mencoba skenario Assertive Action. Praktikkan simulasi kata sandi keluarga untuk penjemputan di sekolah dan cara mencari bantuan di tempat ramai.`
      : assertiveInd.missedTopics.length > 0
      ? `Fokuskan latihan pada keberanian ${assertiveInd.missedTopics[0]}. Buat 'Kata Sandi Keluarga' khusus penjemputan dan latih ${cleanName} menjaga jarak fisik minimal 3 langkah serta lari menuju guru/satpam/toko ramai.`
      : assertiveInd.displayPct >= 80
      ? `${cleanName} menunjukkan ketegasan luar biasa dalam menolak bujukan asing & perundungan (${assertiveInd.correctItems}/${assertiveInd.answeredItems} tepat). Berikan pujian atas keberaniannya melindungi diri dan teman sebaya.`
      : `Bantu ${cleanName} melatih suara penolakan yang lantang saat menghadapi tekanan teman atau orang tak dikenal agar tidak sungkan mencari pertolongan orang dewasa terpercaya.`;

  const parentGuidanceItems = [
    {
      indicatorTitle: "1. Bodily Autonomy (Otonomi Tubuh)",
      statusTag: `${bodilyInd.pointsEarned}/${bodilyInd.maxPoints} Poin · ${bodilyInd.diagnosticStatus}`,
      guidance: bodilyGuidance,
    },
    {
      indicatorTitle: "2. Cyber Safety (Keamanan Siber)",
      statusTag: `${cyberInd.pointsEarned}/${cyberInd.maxPoints} Poin · ${cyberInd.diagnosticStatus}`,
      guidance: cyberGuidance,
    },
    {
      indicatorTitle: "3. Assertive Action (Tindakan Asertif)",
      statusTag: `${assertiveInd.pointsEarned}/${assertiveInd.maxPoints} Poin · ${assertiveInd.diagnosticStatus}`,
      guidance: assertiveGuidance,
    },
  ];

  // Build individualized, qualitative, score-free Certificate Citation based on child's real results
  // (All numerical scores & point statistics are kept strictly in the Portrait Diagnostic Report)
  const indIndonesianMap: Record<IndicatorKey, string> = {
    bodily_autonomy: "menjaga batasan dan kehormatan ruang pribadi tubuh",
    cyber_safety: "bijak serta waspada menghadapi interaksi di dunia digital",
    assertive_action: "berani bersikap tegas menolak ajakan berisiko serta melapor kepada orang dewasa terpercaya",
  };

  const demonstratedStrengths = indicators
    .filter((i) => i.correctItems > 0)
    .sort((a, b) => b.displayPct - a.displayPct)
    .map((i) => indIndonesianMap[i.key]);

  let certificateNarrative = "";
  if (scorePct >= 80) {
    const highlightPhrase =
      demonstratedStrengths.length >= 2
        ? `${demonstratedStrengths[0]} maupun ${demonstratedStrengths[1]}`
        : indIndonesianMap[strongestIndicator.key];
    certificateNarrative = `Sebagai bentuk apresiasi tertinggi atas ketangguhan, kepekaan, dan kemandirian yang luar biasa dalam Petualangan Edukasi Perlindungan Diri SafeStep. Ananda ${cleanName} telah menjadi teladan Duta Keselamatan Cilik dalam ${highlightPhrase}, serta konsisten mengutamakan keselamatan diri di lingkungan sekolah, perjalanan, maupun rumah.`;
  } else if (scorePct >= 60) {
    const highlightPhrase =
      demonstratedStrengths.length > 0
        ? `khususnya dalam kemampuannya ${demonstratedStrengths[0]}`
        : `dalam mempelajari langkah-langkah perlindungan diri sehari-hari`;
    certificateNarrative = `Atas keberhasilan menuntaskan simulasi Petualangan Edukasi Perlindungan Diri SafeStep dengan penuh keberanian dan tanggung jawab, ${highlightPhrase}. Ananda ${cleanName} telah menunjukkan kesiapan menjadi Pahlawan Keselamatan yang peduli pada keamanan diri sendiri serta berani meminta bantuan orang tua dan guru.`;
  } else {
    const positiveFocusPhrase =
      demonstratedStrengths.length > 0
        ? `serta menunjukkan langkah awal yang baik dalam ${demonstratedStrengths[0]}`
        : `serta menunjukkan semangat belajar yang positif dalam mengenal batas keamanan diri, etika ruang digital, dan keberanian berkomunikasi`;
    certificateNarrative = `Atas partisipasi aktif, rasa ingin tahu, dan keberanian mengikuti Petualangan Edukasi Perlindungan Diri SafeStep ${positiveFocusPhrase}. Semoga piagam ini menjadi penyemangat bagi Ananda ${cleanName} untuk terus tumbuh menjadi anak yang percaya diri, terlindungi, dan selalu terbuka kepada orang tua maupun guru.`;
  }

  return {
    studentName: cleanName,
    totalPoints: effectiveTotalPoints,
    maxTotalPoints,
    scorePct,
    answeredCount,
    totalCurriculumCount,
    correctCount,
    attemptAccuracyPct,
    diagnosticGradeLabel,
    certificateTitle,
    certificateTierCode,
    certificateId,
    diagnosticReportId,
    formattedDate,
    formattedShortDate,
    indicators,
    strongestIndicator,
    weakestIndicator,
    mapStats,
    personalSummaryText,
    parentGuidanceItems,
    certificateNarrative,
  };
}

/**
 * Helper to draw a fluid cubic bezier curve in jsPDF representing physical pen ink.
 */
function drawInkCurve(
  pdf: jsPDF,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  steps = 22
) {
  let prevX = x0;
  let prevY = y0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * x0 +
      3 * mt * mt * t * x1 +
      3 * mt * t * t * x2 +
      t * t * t * x3;
    const y =
      mt * mt * mt * y0 +
      3 * mt * mt * t * y1 +
      3 * mt * t * t * y2 +
      t * t * t * y3;
    pdf.line(prevX, prevY, x, y);
    prevX = x;
    prevY = y;
  }
}

/**
 * Draws the authentic hand-drawn signature of Ms. Vanesa, parameterized cleanly
 * so it can be positioned and scaled accurately in the bottom-right corner of both Portrait and Landscape PDFs.
 */
function drawMsVanesaSignature(
  pdf: jsPDF,
  centerX: number,
  baselineY: number,
  scale = 1
) {
  const origCx = 162;
  const origBaseY = 273;
  const ySignOffset = -3.5;

  const tx = (x: number) => centerX + (x - origCx) * scale;
  const ty = (y: number) => baselineY + (y - origBaseY) * scale;

  pdf.setDrawColor(26, 54, 138); // Ballpoint royal ink blue
  pdf.setLineWidth(0.8 * Math.max(0.68, scale));

  drawInkCurve(
    pdf,
    tx(142),
    ty(258 - ySignOffset),
    tx(133),
    ty(248 - ySignOffset),
    tx(136),
    ty(262 - ySignOffset),
    tx(148),
    ty(267 - ySignOffset)
  );
  drawInkCurve(
    pdf,
    tx(148),
    ty(267 - ySignOffset),
    tx(154),
    ty(270 - ySignOffset),
    tx(153),
    ty(238 - ySignOffset),
    tx(145),
    ty(242 - ySignOffset)
  );
  drawInkCurve(
    pdf,
    tx(145),
    ty(242 - ySignOffset),
    tx(140),
    ty(245 - ySignOffset),
    tx(146),
    ty(261 - ySignOffset),
    tx(149),
    ty(263 - ySignOffset)
  );

  const detailedSignCurves = [
    { x0: 149, y0: 263 - ySignOffset, x1: 152, y1: 265 - ySignOffset, x2: 154, y2: 246 - ySignOffset, x3: 155, y3: 245 - ySignOffset },
    { x0: 155, y0: 245 - ySignOffset, x1: 156, y1: 244 - ySignOffset, x2: 157, y2: 258 - ySignOffset, x3: 158, y3: 262 - ySignOffset },
    { x0: 158, y0: 262 - ySignOffset, x1: 159, y1: 264 - ySignOffset, x2: 161, y2: 247 - ySignOffset, x3: 163, y3: 247 - ySignOffset },
    { x0: 163, y0: 247 - ySignOffset, x1: 164, y1: 247 - ySignOffset, x2: 163, y2: 260 - ySignOffset, x3: 164, y3: 262 - ySignOffset },
    { x0: 164, y0: 262 - ySignOffset, x1: 165, y1: 264 - ySignOffset, x2: 167, y2: 250 - ySignOffset, x3: 169, y3: 249 - ySignOffset },
    { x0: 169, y0: 249 - ySignOffset, x1: 171, y1: 248 - ySignOffset, x2: 168, y2: 261 - ySignOffset, x3: 170, y3: 263 - ySignOffset },
    { x0: 170, y0: 263 - ySignOffset, x1: 172, y1: 264 - ySignOffset, x2: 174, y2: 252 - ySignOffset, x3: 175, y3: 251 - ySignOffset },
    { x0: 175, y0: 251 - ySignOffset, x1: 176, y1: 250 - ySignOffset, x2: 173, y2: 262 - ySignOffset, x3: 175, y3: 264 - ySignOffset },
    { x0: 175, y0: 264 - ySignOffset, x1: 178, y1: 265 - ySignOffset, x2: 184, y2: 236 - ySignOffset, x3: 179, y3: 236 - ySignOffset },
    { x0: 179, y0: 236 - ySignOffset, x1: 174, y1: 236 - ySignOffset, x2: 177, y2: 262 - ySignOffset, x3: 181, y3: 264 - ySignOffset },
    { x0: 181, y0: 264 - ySignOffset, x1: 184, y1: 265 - ySignOffset, x2: 187, y2: 250 - ySignOffset, x3: 191, y3: 250 - ySignOffset },
  ];

  for (const c of detailedSignCurves) {
    drawInkCurve(
      pdf,
      tx(c.x0),
      ty(c.y0),
      tx(c.x1),
      ty(c.y1),
      tx(c.x2),
      ty(c.y2),
      tx(c.x3),
      ty(c.y3)
    );
  }

  pdf.setLineWidth(0.38 * Math.max(0.68, scale));
  pdf.line(tx(144), ty(267 - ySignOffset), tx(187), ty(263 - ySignOffset));

  pdf.setFillColor(26, 54, 138);
  pdf.circle(tx(192), ty(250 - ySignOffset), 0.42 * scale, "F");
  pdf.circle(tx(182), ty(235 - ySignOffset), 0.28 * scale, "F");
  pdf.circle(tx(184), ty(236 - ySignOffset), 0.28 * scale, "F");
}

/**
 * Helper to draw a clean 5-pointed vector golden star in jsPDF without unicode symbols.
 */
function drawVectorStar(
  pdf: jsPDF,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  fillRgb: [number, number, number] = [251, 191, 36]
) {
  const spikes = 5;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  pdf.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(0.2);

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < spikes; i++) {
    pts.push({
      x: cx + Math.cos(rot) * rOuter,
      y: cy + Math.sin(rot) * rOuter,
    });
    rot += step;
    pts.push({
      x: cx + Math.cos(rot) * rInner,
      y: cy + Math.sin(rot) * rInner,
    });
    rot += step;
  }

  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    pdf.triangle(cx, cy, pts[i].x, pts[i].y, next.x, next.y, "F");
  }
}

/**
 * Helper to draw a vector shield emblem for the SafeStep header/crest.
 */
function drawSafeStepCrest(pdf: jsPDF, cx: number, cy: number, size: number) {
  pdf.setFillColor(15, 23, 42);
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(0.6);

  // Shield upper body + lower triangle
  const halfW = size * 0.85;
  const topY = cy - size * 0.85;
  const midY = cy + size * 0.1;
  const botY = cy + size * 0.98;

  pdf.rect(cx - halfW, topY, halfW * 2, midY - topY, "F");
  pdf.triangle(cx - halfW, midY, cx + halfW, midY, cx, botY, "F");

  // Gold shield border outline
  pdf.line(cx - halfW, topY, cx + halfW, topY);
  pdf.line(cx - halfW, topY, cx - halfW, midY);
  pdf.line(cx + halfW, topY, cx + halfW, midY);
  pdf.line(cx - halfW, midY, cx, botY);
  pdf.line(cx + halfW, midY, cx, botY);

  drawVectorStar(pdf, cx, cy - size * 0.08, size * 0.45, size * 0.2);
}

function getIndicatorColors(pct: number, answered: number): {
  fill: [number, number, number];
  softBg: [number, number, number];
  border: [number, number, number];
  text: [number, number, number];
} {
  if (answered === 0) {
    return {
      fill: [148, 163, 184],
      softBg: [248, 250, 252],
      border: [203, 213, 225],
      text: [71, 85, 105],
    };
  }
  if (pct >= 80) {
    return {
      fill: [16, 185, 129], // Emerald 500
      softBg: [236, 253, 245],
      border: [110, 231, 183],
      text: [6, 95, 70],
    };
  }
  if (pct >= 60) {
    return {
      fill: [245, 158, 11], // Amber 500
      softBg: [255, 251, 235],
      border: [252, 211, 77],
      text: [146, 64, 14],
    };
  }
  return {
    fill: [225, 29, 72], // Rose 600
    softBg: [255, 241, 242],
    border: [253, 164, 175],
    text: [159, 18, 57],
  };
}

/**
 * FITUR 1: Unduh Rapor Diagnostik (PDF Potret - A4 Portrait 210mm x 297mm)
 * Dedicated exclusively to:
 * 1) Rincian skor 3 indikator (Bodily Autonomy, Cyber Safety, Assertive Action)
 * 2) Grafik keakuratan (Indikator & Pemetaan Lokasi)
 * 3) Panduan bimbingan orang tua yang dipersonalisasi sesuai hasil masing-masing anak.
 */
export async function downloadDiagnosticReportPDF(
  log: StudentLog,
  scenarios: Scenario[] = DEFAULT_SCENARIOS
) {
  const profile = computeStudentDiagnosticProfile(log, scenarios);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const width = 210;
  const height = 297;

  // Clean Page Framing
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, width, height, "F");

  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(1.2);
  pdf.rect(9, 9, width - 18, height - 18);

  pdf.setDrawColor(13, 148, 136);
  pdf.setLineWidth(0.35);
  pdf.rect(11, 11, width - 22, height - 22);

  // ================= HEADER =================
  drawSafeStepCrest(pdf, 21, 23.5, 4.8);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 148, 136);
  pdf.setFontSize(8);
  pdf.text("SAFESTEP KIDS ACADEMY · LAPORAN DIAGNOSTIK PENDIDIK & ORANG TUA", 29, 18.5);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(15);
  pdf.text("RAPOR DIAGNOSTIK KESELAMATAN ANAK", 29, 25);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8);
  pdf.text(
    "Evaluasi Individual 3 Indikator Utama, Grafik Keakuratan, dan Panduan Pendampingan Keluarga",
    29,
    30
  );

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(15, 34, width - 15, 34);

  // ================= STUDENT IDENTITY & SUMMARY CARD (y = 37..67) =================
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(15, 37, width - 30, 29, 2.2, 2.2, "FD");

  // Left Column Labels & Values
  pdf.setFontSize(8);
  const leftLabels = [
    ["Nama Siswa", profile.studentName.toUpperCase()],
    ["Tanggal Evaluasi", profile.formattedDate],
    ["Kode Diagnostik", profile.diagnosticReportId],
    ["Cakupan Simulasi", `${profile.answeredCount} dari ${profile.totalCurriculumCount} Skenario`],
  ];

  leftLabels.forEach(([lbl, val], idx) => {
    const rowY = 43 + idx * 5.8;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${lbl}`, 19, rowY);
    pdf.text(":", 46, rowY);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text(val, 49, rowY);
  });

  // Vertical Divider
  pdf.setDrawColor(226, 232, 240);
  pdf.line(106, 40, 106, 63);

  // Right Column Labels & Values
  const gradeTone = getIndicatorColors(profile.scorePct, profile.answeredCount);
  const rightRows: { label: string; value: string; color: [number, number, number] }[] = [
    {
      label: "Skor Total",
      value: `${profile.totalPoints} / ${profile.maxTotalPoints} Poin (${profile.scorePct}%)`,
      color: [15, 23, 42],
    },
    {
      label: "Akurasi Jawaban",
      value: `${profile.attemptAccuracyPct}% (${profile.correctCount}/${profile.answeredCount || 0} Tepat)`,
      color: [37, 99, 235],
    },
    {
      label: "Aspek Terkuat",
      value: `${profile.strongestIndicator.title} (${profile.strongestIndicator.displayPct}%)`,
      color: [6, 95, 70],
    },
    {
      label: "Status Kesiapan",
      value: profile.diagnosticGradeLabel,
      color: gradeTone.text,
    },
  ];

  rightRows.forEach((row, idx) => {
    const rowY = 43 + idx * 5.8;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.text(row.label, 110, rowY);
    pdf.text(":", 136, rowY);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(row.color[0], row.color[1], row.color[2]);
    const clippedVal = pdf.splitTextToSize(row.value, 55)[0] || row.value;
    pdf.text(clippedVal, 139, rowY);
  });

  // ================= SECTION 01: RINCIAN SKOR 3 INDIKATOR (y = 71..118) =================
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(9);
  pdf.text("01. RINCIAN SKOR 3 INDIKATOR KOMPETENSI", 15, 72.5);

  const cardWidth = 57.5;
  const cardGap = 3.75;
  const cardTop = 75.5;
  const cardHeight = 41.5;

  profile.indicators.forEach((ind, idx) => {
    const cardX = 15 + idx * (cardWidth + cardGap);
    const palette = getIndicatorColors(ind.displayPct, ind.answeredItems);

    pdf.setFillColor(palette.softBg[0], palette.softBg[1], palette.softBg[2]);
    pdf.setDrawColor(palette.border[0], palette.border[1], palette.border[2]);
    pdf.setLineWidth(0.45);
    pdf.roundedRect(cardX, cardTop, cardWidth, cardHeight, 2.2, 2.2, "FD");

    // Indicator Title
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8.5);
    pdf.text(ind.title.toUpperCase(), cardX + 3.5, cardTop + 6);

    // Indonesian Subtitle
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(6.7);
    pdf.text(ind.subtitle, cardX + 3.5, cardTop + 10.2);

    // Big Percentage & Points Readout
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
    pdf.setFontSize(16);
    pdf.text(`${ind.displayPct}%`, cardX + 3.5, cardTop + 20);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(7.5);
    pdf.text(
      `${ind.pointsEarned}/${ind.maxPoints} Poin`,
      cardX + cardWidth - 3.5,
      cardTop + 19.5,
      { align: "right" }
    );

    // Mini Horizontal Progress Bar inside card
    const barX = cardX + 3.5;
    const barY = cardTop + 23.2;
    const barW = cardWidth - 7;
    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(barX, barY, barW, 2.6, 1.2, 1.2, "F");

    if (ind.displayPct > 0) {
      const fillW = Math.max(2.4, (barW * Math.min(100, ind.displayPct)) / 100);
      pdf.setFillColor(palette.fill[0], palette.fill[1], palette.fill[2]);
      pdf.roundedRect(barX, barY, fillW, 2.6, 1.2, 1.2, "F");
    }

    // Accuracy detail & Diagnostic status
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(6.8);
    pdf.text(
      `Ketepatan: ${ind.correctItems} benar dari ${ind.answeredItems}/${ind.totalItems} misi`,
      cardX + 3.5,
      cardTop + 31.2
    );

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
    pdf.setFontSize(7.2);
    pdf.text(`Status: ${ind.diagnosticStatus}`, cardX + 3.5, cardTop + 36.8);
  });

  // ================= SECTION 02: GRAFIK KEAKURATAN (y = 122..175) =================
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(9);
  pdf.text("02. GRAFIK KEAKURATAN INDIKATOR & PEMETAAN LOKASI", 15, 123);

  const chartBoxTop = 125.5;
  const chartBoxH = 48.5;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(15, chartBoxTop, width - 30, chartBoxH, 2.2, 2.2, "FD");

  // Left Sub-Chart: Horizontal Bar Chart for 3 Indicators + Overall Score
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(7.6);
  pdf.text("Grafik Keakuratan 3 Indikator (%)", 19, chartBoxTop + 5.8);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(6.4);
  pdf.text("Garis putus = Batas Aman (80%)", 123, chartBoxTop + 5.8, { align: "right" });

  const trackStartX = 53;
  const trackWidth = 56;
  const chartRows = [
    {
      label: "Bodily Autonomy",
      pct: profile.indicators[0].displayPct,
      answered: profile.indicators[0].answeredItems,
    },
    {
      label: "Cyber Safety",
      pct: profile.indicators[1].displayPct,
      answered: profile.indicators[1].answeredItems,
    },
    {
      label: "Assertive Action",
      pct: profile.indicators[2].displayPct,
      answered: profile.indicators[2].answeredItems,
    },
    {
      label: "Capaian Kumulatif",
      pct: profile.scorePct,
      answered: profile.answeredCount,
    },
  ];

  // Background subtle vertical grid lines (0%, 50%, 80%, 100%)
  const gridTicks = [0, 50, 80, 100];
  gridTicks.forEach((tick) => {
    const gx = trackStartX + (trackWidth * tick) / 100;
    if (tick === 80) {
      pdf.setDrawColor(13, 148, 136);
      pdf.setLineWidth(0.35);
      // Dashed vertical target line at 80%
      for (let segY = chartBoxTop + 8.5; segY < chartBoxTop + 41; segY += 2.2) {
        pdf.line(gx, segY, gx, Math.min(segY + 1.2, chartBoxTop + 41));
      }
    } else {
      pdf.setDrawColor(241, 245, 249);
      pdf.setLineWidth(0.25);
      pdf.line(gx, chartBoxTop + 8.5, gx, chartBoxTop + 41);
    }
    pdf.setFont("helvetica", tick === 80 ? "bold" : "normal");
    pdf.setTextColor(tick === 80 ? 13 : 148, tick === 80 ? 148 : 163, tick === 80 ? 136 : 184);
    pdf.setFontSize(6);
    pdf.text(`${tick}%`, gx, chartBoxTop + 45.2, { align: "center" });
  });

  chartRows.forEach((r, idx) => {
    const rowY = chartBoxTop + 12.5 + idx * 7.8;
    const tone = getIndicatorColors(r.pct, r.answered);

    pdf.setFont("helvetica", idx === 3 ? "bold" : "normal");
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(7.2);
    pdf.text(r.label, 19, rowY + 2.6);

    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(trackStartX, rowY, trackWidth, 3.6, 1.4, 1.4, "F");

    if (r.pct > 0) {
      const wFill = Math.max(2.2, (trackWidth * Math.min(100, r.pct)) / 100);
      pdf.setFillColor(tone.fill[0], tone.fill[1], tone.fill[2]);
      pdf.roundedRect(trackStartX, rowY, wFill, 3.6, 1.4, 1.4, "F");
    }

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(tone.text[0], tone.text[1], tone.text[2]);
    pdf.setFontSize(7.2);
    pdf.text(`${r.pct}%`, trackStartX + trackWidth + 13.5, rowY + 2.8, { align: "right" });
  });

  // Vertical Separator inside chart card
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(127.5, chartBoxTop + 4, 127.5, chartBoxTop + chartBoxH - 4);

  // Right Sub-Chart: Per-Map Environment Accuracy
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(7.6);
  pdf.text("Akurasi per Area Peta", 131.5, chartBoxTop + 5.8);

  profile.mapStats.forEach((m, idx) => {
    const rowY = chartBoxTop + 12.5 + idx * 8.2;
    const mTone = getIndicatorColors(m.accuracyPct, m.answeredItems);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(6.8);
    pdf.text(m.label, 131.5, rowY + 2.2);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(mTone.text[0], mTone.text[1], mTone.text[2]);
    pdf.setFontSize(6.6);
    pdf.text(
      m.answeredItems > 0 ? `${m.correctItems}/${m.answeredItems} (${m.accuracyPct}%)` : "Belum diuji",
      191,
      rowY + 2.2,
      { align: "right" }
    );

    const miniX = 131.5;
    const miniW = 59.5;
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(miniX, rowY + 3.6, miniW, 2.2, 1, 1, "F");

    if (m.answeredItems > 0 && m.accuracyPct > 0) {
      const mFill = Math.max(2, (miniW * Math.min(100, m.accuracyPct)) / 100);
      pdf.setFillColor(mTone.fill[0], mTone.fill[1], mTone.fill[2]);
      pdf.roundedRect(miniX, rowY + 3.6, mFill, 2.2, 1, 1, "F");
    }
  });

  // ================= SECTION 03: PANDUAN BIMBINGAN ORANG TUA (y = 179..252) =================
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(9);
  pdf.text(
    `03. TEMUAN INDIVIDUAL & PANDUAN BIMBINGAN ORANG TUA (${profile.studentName.toUpperCase()})`,
    15,
    179.5
  );

  const guideTop = 182;
  const guideHeight = 70;
  pdf.setFillColor(255, 253, 247);
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(15, guideTop, width - 30, guideHeight, 2.2, 2.2, "FD");

  // Personalized Summary Paragraph
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(146, 64, 14);
  pdf.setFontSize(7.4);
  pdf.text("Ringkasan Diagnostik Individual:", 19, guideTop + 5.2);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(7.1);
  const summaryLines = pdf.splitTextToSize(profile.personalSummaryText, width - 38).slice(0, 3);
  let curY = guideTop + 9.2;
  summaryLines.forEach((ln: string) => {
    pdf.text(ln, 19, curY);
    curY += 3.3;
  });

  pdf.setDrawColor(245, 228, 181);
  pdf.setLineWidth(0.25);
  pdf.line(19, curY + 0.6, width - 19, curY + 0.6);
  curY += 4.4;

  // 3 Personalized Guidance Action Blocks
  profile.parentGuidanceItems.forEach((item) => {
    if (curY > guideTop + guideHeight - 7) return;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(7.3);
    pdf.text(item.indicatorTitle, 19, curY);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(13, 148, 136);
    pdf.setFontSize(6.8);
    pdf.text(item.statusTag, width - 19, curY, { align: "right" });

    curY += 3.5;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(6.95);
    const lines = pdf.splitTextToSize(item.guidance, width - 38).slice(0, 3);
    lines.forEach((ln: string) => {
      if (curY <= guideTop + guideHeight - 2.5) {
        pdf.text(ln, 19, curY);
        curY += 3.15;
      }
    });
    curY += 1.6;
  });

  // ================= FOOTER & EDUCATOR VALIDATION (y = 254..285) =================
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.35);
  pdf.line(15, 254.5, width - 15, 254.5);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(7.5);
  pdf.text("DOKUMEN DIAGNOSTIK WALI MURID & GURU", 16, 260);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(7);
  pdf.text(
    "Laporan ini disusun secara otomatis dari rekam keputusan aktual siswa di setiap skenario.",
    16,
    264.5
  );
  pdf.text(`ID Validasi Diagnostik: ${profile.diagnosticReportId}`, 16, 269);
  pdf.text(`Tanggal Cetak: ${profile.formattedShortDate}`, 16, 273.5);
  pdf.text("Gunakan panduan di atas sebagai bahan diskusi hangat bersama anak di rumah.", 16, 278);

  // Center Official Diagnostic Stamp
  pdf.setDrawColor(13, 148, 136);
  pdf.setLineWidth(0.45);
  pdf.circle(117, 269.5, 8.8, "D");
  pdf.circle(117, 269.5, 7.5, "D");
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 148, 136);
  pdf.setFontSize(4.6);
  pdf.text("SAFESTEP", 117, 267.8, { align: "center" });
  pdf.text("DIAGNOSTIC", 117, 270.4, { align: "center" });
  pdf.setFontSize(3.9);
  pdf.text("VERIFIED", 117, 272.8, { align: "center" });

  // Bottom-Right Ms. Vanesa Signature
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(7.5);
  pdf.text("Pendidik & Evaluator,", 166, 259, { align: "center" });

  drawMsVanesaSignature(pdf, 166, 278.5, 0.54);

  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.3);
  pdf.line(144, 279.5, 188, 279.5);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(8.8);
  pdf.text("Ms. Vanesa", 166, 283.5, { align: "center" });

  const sanitizedName = profile.studentName.replace(/[^a-zA-Z0-9]+/g, "_");
  pdf.save(`Rapor_Diagnostik_SafeStep_${sanitizedName}.pdf`);
}

/**
 * FITUR 2: Unduh Sertifikat (PDF Lanskap - A4 Landscape 297mm x 210mm)
 * Clean, frame-worthy ceremonial award certificate WITHOUT numerical score boxes or point statistics
 * (all numerical scores & diagnostics are isolated exclusively in the Portrait Diagnostic Report):
 * - Score >= 80%: "PIAGAM APRESIASI: DUTA KESELAMATAN CILIK"
 * - Score 60-79%: "SERTIFIKAT KELULUSAN: PAHLAWAN KESELAMATAN"
 * - Score < 60% : "SERTIFIKAT PARTISIPASI: PETUALANG SAFESTEP" (zero "Gagal/Rawan" wording)
 * Includes dynamic student name, structured unique ID (CERT-SS-YYYY-CATEGORY-HASH6), and Ms. Vanesa's signature in bottom-right corner.
 */
export async function downloadCertificateLandscapePDF(
  log: StudentLog,
  scenarios: Scenario[] = DEFAULT_SCENARIOS
) {
  const profile = computeStudentDiagnosticProfile(log, scenarios);

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = 297;
  const height = 210;

  // Tier Accent Colors (clean, dignified & celebratory across all tiers)
  let primaryAccent: [number, number, number] = [15, 23, 42]; // Royal Navy
  let ribbonAccent: [number, number, number] = [180, 83, 9]; // Warm Gold-Amber
  let starCount = 3;

  if (profile.scorePct >= 80) {
    primaryAccent = [15, 23, 42];
    ribbonAccent = [180, 83, 9];
    starCount = profile.scorePct >= 90 ? 5 : 4;
  } else if (profile.scorePct >= 60) {
    primaryAccent = [15, 23, 42];
    ribbonAccent = [13, 148, 136]; // Deep Teal
    starCount = 4;
  } else {
    primaryAccent = [30, 41, 59];
    ribbonAccent = [37, 99, 235]; // Encouraging Royal Blue
    starCount = 3;
  }

  // Warm Ceremonial Ivory Paper Canvas
  pdf.setFillColor(255, 253, 247);
  pdf.rect(0, 0, width, height, "F");

  // Outer Royal Frame
  pdf.setDrawColor(primaryAccent[0], primaryAccent[1], primaryAccent[2]);
  pdf.setLineWidth(1.8);
  pdf.rect(8, 8, width - 16, height - 16);

  // Inner Gold Ceremonial Frame
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(0.65);
  pdf.rect(11.5, 11.5, width - 23, height - 23);

  // Fine Inner Hairline
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.28);
  pdf.rect(13.5, 13.5, width - 27, height - 27);

  // Elegant Geometric Corner Flourishes
  const drawCornerOrnament = (cx: number, cy: number, dx: number, dy: number) => {
    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(1.0);
    pdf.line(cx, cy, cx + dx * 12, cy);
    pdf.line(cx, cy, cx, cy + dy * 12);
    pdf.setFillColor(217, 119, 6);
    pdf.circle(cx + dx * 3.2, cy + dy * 3.2, 0.9, "F");
  };
  drawCornerOrnament(15.5, 15.5, 1, 1);
  drawCornerOrnament(width - 15.5, 15.5, -1, 1);
  drawCornerOrnament(15.5, height - 15.5, 1, -1);
  drawCornerOrnament(width - 15.5, height - 15.5, -1, -1);

  // ================= TOP CREST & ACADEMY KICKER =================
  drawSafeStepCrest(pdf, width / 2, 25, 5.6);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8.5);
  pdf.text(
    "SAFESTEP KIDS ACADEMY · PROGRAM EDUKASI PERLINDUNGAN & KESELAMATAN ANAK",
    width / 2,
    36.5,
    { align: "center" }
  );

  // ================= DYNAMIC CERTIFICATE MAIN TITLE =================
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(ribbonAccent[0], ribbonAccent[1], ribbonAccent[2]);
  pdf.setFontSize(19.5);
  pdf.text(profile.certificateTitle, width / 2, 46.5, { align: "center" });

  // Decorative Divider with Gold Center Diamond
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(0.45);
  pdf.line(82, 53, width / 2 - 4.5, 53);
  pdf.line(width / 2 + 4.5, 53, width - 82, 53);
  pdf.setFillColor(217, 119, 6);
  pdf.triangle(width / 2, 51.4, width / 2 - 2.2, 53, width / 2 + 2.2, 53, "F");
  pdf.triangle(width / 2, 54.6, width / 2 - 2.2, 53, width / 2 + 2.2, 53, "F");

  // ================= RECIPIENT STUDENT NAME (FOCAL ANCHOR) =================
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(10);
  pdf.text("Piagam penghargaan ini diberikan dengan penuh kebanggaan kepada:", width / 2, 63.5, {
    align: "center",
  });

  const displayStudentName = profile.studentName.toUpperCase();
  const nameFontSize =
    displayStudentName.length > 30 ? 20 : displayStudentName.length > 22 ? 23.5 : 27;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(primaryAccent[0], primaryAccent[1], primaryAccent[2]);
  pdf.setFontSize(nameFontSize);
  pdf.text(displayStudentName, width / 2, 78, { align: "center" });

  // Subtle Gold Name Underline
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(0.55);
  pdf.line(72, 82.5, width - 72, 82.5);

  // Centered Gold Vector Stars Row
  const starSpacing = 10.5;
  const startStarX = width / 2 - ((starCount - 1) * starSpacing) / 2;
  for (let i = 0; i < starCount; i++) {
    const sx = startStarX + i * starSpacing;
    const isMiddle = starCount % 2 === 1 && i === Math.floor(starCount / 2);
    drawVectorStar(pdf, sx, 90.5, isMiddle ? 3.8 : 3.1, isMiddle ? 1.65 : 1.38);
  }

  // ================= CLEAN QUALITATIVE APPRECIATION CITATION =================
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(10);
  const certLines = pdf.splitTextToSize(profile.certificateNarrative, 212).slice(0, 4);
  let narrativeY = 102.5;
  certLines.forEach((line: string) => {
    pdf.text(line, width / 2, narrativeY, { align: "center" });
    narrativeY += 5.3;
  });

  // Clean Editorial Motto Strip (Zero Numerical Score Boxes)
  const mottoY = 132.5;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(66, mottoY - 5, width - 66, mottoY - 5);

  pdf.setFont("helvetica", "oblique");
  pdf.setTextColor(ribbonAccent[0], ribbonAccent[1], ribbonAccent[2]);
  pdf.setFontSize(8.8);
  pdf.text(
    '"Tubuhku Berharga · Langkahku Terjaga · Berani Bersuara Demi Keselamatan Bersama"',
    width / 2,
    mottoY,
    { align: "center" }
  );

  pdf.line(66, mottoY + 4, width - 66, mottoY + 4);

  // ================= BOTTOM VALIDATION, SEAL & RIGHT-CORNER SIGNATURE =================
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.35);
  pdf.line(26, 146.5, width - 26, 146.5);

  // Bottom-Left Certificate Identity Block (Clean, Human-Readable ID, No Score Numbers)
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(8.2);
  pdf.text("REGISTRASI KEASLIAN PIAGAM", 28, 156);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(7.8);
  pdf.text("ID Sertifikat", 28, 162.8);
  pdf.text(":", 57, 162.8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text(profile.certificateId, 60, 162.8);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.text("Tanggal Terbit", 28, 168.8);
  pdf.text(":", 57, 168.8);
  pdf.text(profile.formattedShortDate, 60, 168.8);

  pdf.text("Penyelenggara", 28, 174.8);
  pdf.text(":", 57, 174.8);
  pdf.text("SafeStep Kids Academy", 60, 174.8);

  // Bottom-Center Gold Ceremonial Seal & Ribbons
  const sealCx = width / 2;
  const sealCy = 168.5;

  // Twin Ribbon Tails beneath seal
  pdf.setFillColor(ribbonAccent[0], ribbonAccent[1], ribbonAccent[2]);
  pdf.triangle(sealCx - 6, sealCy + 8, sealCx - 1, sealCy + 8, sealCx - 8, sealCy + 21, "F");
  pdf.triangle(sealCx + 1, sealCy + 8, sealCx + 6, sealCy + 8, sealCx + 8, sealCy + 21, "F");

  pdf.setFillColor(254, 243, 199);
  pdf.setDrawColor(217, 119, 6);
  pdf.setLineWidth(0.8);
  pdf.circle(sealCx, sealCy, 11.5, "FD");
  pdf.setLineWidth(0.35);
  pdf.circle(sealCx, sealCy, 9.6, "D");

  drawVectorStar(pdf, sealCx, sealCy - 3.2, 3.1, 1.35);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(146, 64, 14);
  pdf.setFontSize(5.2);
  pdf.text("SAFESTEP", sealCx, sealCy + 3.2, { align: "center" });
  pdf.setFontSize(4.3);
  pdf.text("OFFICIAL AWARD", sealCx, sealCy + 6.2, { align: "center" });

  // Bottom-Right Signature Block (Pojok Kanan Bawah - Ms. Vanesa)
  const signCenterX = 241;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(8.2);
  pdf.text("Disahkan oleh,", signCenterX, 155, { align: "center" });

  drawMsVanesaSignature(pdf, signCenterX, 181.5, 0.72);

  pdf.setDrawColor(148, 163, 184);
  pdf.setLineWidth(0.35);
  pdf.line(signCenterX - 28, 182.5, signCenterX + 28, 182.5);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.text("Ms. Vanesa", signCenterX, 187.2, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(7.4);
  pdf.text("Pendidik & Pembina SafeStep", signCenterX, 191.2, { align: "center" });

  const sanitizedName = profile.studentName.replace(/[^a-zA-Z0-9]+/g, "_");
  pdf.save(`Sertifikat_SafeStep_${sanitizedName}.pdf`);
}

// Backward-compatible alias pointing to Diagnostic Report PDF
export const downloadStudentReportPDF = downloadDiagnosticReportPDF;
