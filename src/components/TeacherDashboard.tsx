/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import type { User } from "firebase/auth";
import { Scenario, StudentLog } from "../types";
import { 
  School, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Award, 
  BookOpen, 
  Trash2, 
  Edit2, 
  Check, 
  ArrowLeft, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  FileSpreadsheet, 
  Sparkles,
  Info,
  Cloud,
  LogOut,
  Download,
  FileText,
  Upload,
  HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  downloadDiagnosticReportPDF,
  downloadCertificateLandscapePDF,
  computeStudentDiagnosticProfile,
} from "../utils/pdfGenerator";
import { downloadStandaloneHtmlApp, STANDALONE_HTML_FILENAME } from "../utils/standaloneDownloader";
import {
  parseScenarioUploadFile,
  downloadScenarioCsvTemplate,
  downloadScenarioWordTemplate,
  downloadExistingScenariosCsv,
  downloadExistingScenariosWord,
  MAX_FIRESTORE_SCENARIOS,
} from "../utils/scenarioFileParser";
import Npc3DCharacter from "./Npc3DCharacter";
import PWAInstallButton from "./PWAInstallButton";
import GoogleDrivePanel from "./GoogleDrivePanel";
import {
  isStandaloneHtmlMode,
  observeAuthState,
  signInTeacherWithGoogle,
  signOutTeacher,
  subscribeOwnedStudentLogs,
  syncStudentLogToFirestore,
  clearOwnedStudentLogsInFirestore,
  savePublishedScenariosToFirestore,
  FirestoreScenarioSyncResult,
} from "../firebase";
import {
  checkApiBackendAvailable,
  fetchApiJsonWithRetry,
  flushPendingStudentLogs,
} from "../utils/serverSync";

interface TeacherDashboardProps {
  scenarios: Scenario[];
  onSaveModifiedScenarios: (
    newScenarios: Scenario[]
  ) => Promise<FirestoreScenarioSyncResult> | FirestoreScenarioSyncResult | void;
  onResetScenariosDefault: () => void;
  onClose: () => void;
}

export default function TeacherDashboard({
  scenarios,
  onSaveModifiedScenarios,
  onResetScenariosDefault,
  onClose
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'scenarios' | 'student-logs' | 'google-drive'>('analytics');
  const [studentLogs, setStudentLogs] = useState<StudentLog[]>([]);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);
  const [isUploadingScenarios, setIsUploadingScenarios] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);

  const showDownloadToast = useCallback((msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 4000);
  }, []);

  // Merge student log lists by studentName (preserving latest / highest progress)
  const mergeStudentLogs = useCallback((baseLogs: StudentLog[], incomingLogs: StudentLog[]): StudentLog[] => {
    const byName = new Map<string, StudentLog>();
    for (const item of [...baseLogs, ...incomingLogs]) {
      if (!item || !item.studentName) continue;
      const key = item.studentName.trim().toLowerCase();
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, item);
      } else {
        const existingTime = existing.completedAt ? Date.parse(existing.completedAt) || 0 : 0;
        const incomingTime = item.completedAt ? Date.parse(item.completedAt) || 0 : 0;
        if (incomingTime >= existingTime || item.totalPoints > existing.totalPoints) {
          byName.set(key, item);
        }
      }
    }
    return Array.from(byName.values());
  }, []);

  // Track Firebase Auth readiness
  useEffect(() => {
    const unsubscribeAuth = observeAuthState((user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // Load student logs from localStorage and fetch from Express Server
  useEffect(() => {
    const localLogs = localStorage.getItem("safestep_student_logs");
    if (localLogs) {
      try {
        setStudentLogs(JSON.parse(localLogs));
      } catch (_e) {}
    }

    if (isStandaloneHtmlMode) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const fetchServerLogs = async () => {
      await flushPendingStudentLogs();
      const res = await fetchApiJsonWithRetry<StudentLog[]>("/api/student_logs", {}, 1);
      if (!cancelled && res.ok && Array.isArray(res.data)) {
        const serverData = res.data;
        setStudentLogs((prev) => {
          const merged = mergeStudentLogs(prev, serverData);
          localStorage.setItem("safestep_student_logs", JSON.stringify(merged));
          return merged;
        });
      }
    };

    void checkApiBackendAvailable().then((hasBackend) => {
      if (cancelled || !hasBackend) return;
      void fetchServerLogs();
      interval = setInterval(() => {
        void fetchServerLogs();
      }, 5000);
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [mergeStudentLogs]);

  // Attach Firestore real-time listener ONLY when auth is ready and user is authenticated & verified
  useEffect(() => {
    if (!authReady || !authUser || !authUser.emailVerified) return;

    const unsubLogs = subscribeOwnedStudentLogs(authUser, (cloudLogs) => {
      setStudentLogs((prev) => {
        const merged = mergeStudentLogs(prev, cloudLogs);
        localStorage.setItem("safestep_student_logs", JSON.stringify(merged));
        return merged;
      });
    });

    return () => {
      if (unsubLogs) unsubLogs();
    };
  }, [authReady, authUser, mergeStudentLogs]);

  const handleConnectGoogle = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const user = await signInTeacherWithGoogle();
      // Sync existing local logs & custom scenarios to Firestore upon login
      for (const log of studentLogs) {
        await syncStudentLogToFirestore(log);
      }
      if (localStorage.getItem("safestep_custom_scenarios")) {
        await savePublishedScenariosToFirestore(scenarios);
      }
      showDownloadToast(`Cloud Firestore terhubung sebagai ${user.displayName || user.email}!`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes("auth/popup-closed-by-user")) {
        console.error("Google sign-in error:", error);
        showDownloadToast("Gagal masuk ke akun Google. Silakan coba lagi.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await signOutTeacher();
      showDownloadToast("Sesi akun Google berhasil diputuskan.");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleClearLogsConfirmed = async () => {
    setConfirmClearLogs(false);
    localStorage.removeItem("safestep_student_logs");
    setStudentLogs([]);

    if (!isStandaloneHtmlMode) {
      localStorage.removeItem("safestep_pending_student_logs");
      void fetchApiJsonWithRetry("/api/student_logs/clear", { method: "POST" }, 1);

      if (authUser && authUser.emailVerified) {
        clearOwnedStudentLogsInFirestore().catch((err) =>
          console.warn("Could not clear Firestore student logs:", err)
        );
      }
    }
    showDownloadToast("Seluruh rekor nilai siswa telah dikosongkan.");
  };

  const handleDownloadStandaloneHtml = async () => {
    if (isDownloadingHtml) return;
    setIsDownloadingHtml(true);
    try {
      showDownloadToast("Sedang menyiapkan paket aplikasi HTML utuh...");
      await downloadStandaloneHtmlApp(scenarios);
      showDownloadToast(`File ${STANDALONE_HTML_FILENAME} berhasil diunduh!`);
    } catch (err) {
      console.error("Gagal mengunduh HTML mandiri:", err);
      showDownloadToast("Gagal mengunduh file HTML. Silakan coba lagi.");
    } finally {
      setIsDownloadingHtml(false);
    }
  };

  // Safe save changes to Scenario with defensive payload truncation
  const handleEditScenarioClick = (sc: Scenario) => {
    setEditingScenario(JSON.parse(JSON.stringify(sc)));
    setSaveSuccess(false);
  };

  const handleUpdateOption = (index: number, text: string) => {
    if (!editingScenario) return;
    const updatedOptions = [...editingScenario.options];
    updatedOptions[index] = { ...updatedOptions[index], text: text.slice(0, 300) };
    setEditingScenario({ ...editingScenario, options: updatedOptions });
  };

  const handleUpdateFeedback = (index: number, feedback: string) => {
    if (!editingScenario) return;
    const updatedOptions = [...editingScenario.options];
    updatedOptions[index] = { ...updatedOptions[index], feedback: feedback.slice(0, 500) };
    setEditingScenario({ ...editingScenario, options: updatedOptions });
  };

  const handleSaveScenario = async () => {
    if (!editingScenario) return;
    const sanitizedScenario: Scenario = {
      ...editingScenario,
      dialogueText: editingScenario.dialogueText.slice(0, 1000),
      question: editingScenario.question.slice(0, 500),
      options: editingScenario.options.map((opt) => ({
        ...opt,
        text: opt.text.slice(0, 300),
        feedback: opt.feedback.slice(0, 500),
      })),
    };
    const updatedList = scenarios.map(s => s.id === sanitizedScenario.id ? sanitizedScenario : s);
    try {
      const syncResult = await onSaveModifiedScenarios(updatedList);
      if (syncResult && !syncResult.synced && syncResult.reason === "not_admin") {
        showDownloadToast("Tersimpan lokal (akun bukan admin Firestore).");
      }
    } catch (err) {
      console.warn("Scenario sync error:", err);
      showDownloadToast("Perubahan tersimpan lokal, sinkronisasi cloud gagal.");
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setEditingScenario(null);
      setSaveSuccess(false);
    }, 1500);
  };

  const handleUploadScenarioFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isUploadingScenarios) return;

    setIsUploadingScenarios(true);
    setUploadError(null);
    setUploadWarnings([]);

    try {
      const parsed = await parseScenarioUploadFile(file);
      const syncResult = await onSaveModifiedScenarios(parsed.scenarios);
      setUploadWarnings(parsed.warnings);

      if (syncResult && syncResult.synced) {
        showDownloadToast(
          `${parsed.scenarios.length} soal berhasil dimuat & disinkronkan ke Cloud Firestore!`
        );
      } else {
        showDownloadToast(
          `${parsed.scenarios.length} soal berhasil dimuat & diterapkan ke permainan!`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membaca file soal.";
      setUploadError(msg);
    } finally {
      setIsUploadingScenarios(false);
    }
  };

  // Download Class Summary Report as a CSV file
  const handleDownloadCSV = () => {
    if (studentLogs.length === 0) {
      showDownloadToast("Belum ada data murid untuk diunduh.");
      return;
    }
    
    // Create CSV content with UTF-8 BOM so Excel opens school indices with proper Indonesian accents
    let csvContent = "\uFEFF"; 
    csvContent += "ID RAPOR DIAGNOSTIK;ID SERTIFIKAT;NAMA SISWA;SKOR TOTAL;PERSENTASE;MISI SELESAI;BODILY AUTONOMY (%);CYBER SAFETY (%);ASSERTIVE ACTION (%);JUDUL SERTIFIKAT;TANGGAL SIMULASI\r\n";
    
    studentLogs.forEach(log => {
      const diag = computeStudentDiagnosticProfile(log, scenarios);
      const dateFormatted = log.completedAt ? new Date(log.completedAt).toLocaleString("id-ID") : "Sedang Bermain";
      const studentNameEscaped = log.studentName.replace(/"/g, '""');
      const [bodily, cyber, assertive] = diag.indicators;
      
      csvContent += `"${diag.diagnosticReportId}";"${diag.certificateId}";"${studentNameEscaped}";${diag.totalPoints};"${diag.scorePct}%";"${diag.answeredCount}/${diag.totalCurriculumCount}";"${bodily.displayPct}%";"${cyber.displayPct}%";"${assertive.displayPct}%";"${diag.certificateTitle}";"${dateFormatted}"\r\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Diagnostik_Murid_SafeStep_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showDownloadToast("Laporan kelas dalam format Excel (.csv) berhasil diunduh!");
  };

  // Fitur 1: Unduh Rapor Diagnostik (PDF Potret - Rincian 3 Indikator, Grafik Keakuratan & Panduan Orang Tua)
  const handleDownloadDiagnosticReport = async (log: StudentLog) => {
    try {
      showDownloadToast(`Menyiapkan Rapor Diagnostik (PDF Potret) untuk ${log.studentName}...`);
      await downloadDiagnosticReportPDF(log, scenarios);
      showDownloadToast(`Rapor Diagnostik (PDF Potret) ${log.studentName} berhasil diunduh!`);
    } catch (error) {
      console.error("Gagal mengunduh Rapor Diagnostik PDF:", error);
      showDownloadToast("Gagal membuat Rapor Diagnostik PDF. Silakan coba lagi.");
    }
  };

  // Fitur 2: Unduh Sertifikat (PDF Lanskap - Piagam Penghargaan Anak Dinamis)
  const handleDownloadCertificate = async (log: StudentLog) => {
    try {
      showDownloadToast(`Menyiapkan Sertifikat Penghargaan (PDF Lanskap) untuk ${log.studentName}...`);
      await downloadCertificateLandscapePDF(log, scenarios);
      showDownloadToast(`Sertifikat (PDF Lanskap) ${log.studentName} berhasil diunduh!`);
    } catch (error) {
      console.error("Gagal mengunduh Sertifikat PDF:", error);
      showDownloadToast("Gagal membuat Sertifikat PDF. Silakan coba lagi.");
    }
  };

  // Compute analytics
  const totalStudents = studentLogs.length;
  
  const avgPoints = totalStudents > 0 
    ? Math.round(studentLogs.reduce((acc, log) => acc + log.totalPoints, 0) / totalStudents)
    : 0;

  // Accuracy calculation
  let totalSolved = 0;
  let correctSolved = 0;
  
  // Categorize safety domains
  const categoriesTotals: { [key: string]: { total: number; correct: number } } = {
    "Pencegahan Grooming & Batasan Diri": { total: 0, correct: 0 },
    "Anti-Perundungan (Bullying)": { total: 0, correct: 0 },
    "Waspada Orang Asing (Stranger Danger)": { total: 0, correct: 0 },
    "Keselamatan Sosial": { total: 0, correct: 0 },
    "Keamanan Digital (Cyber Safety)": { total: 0, correct: 0 },
    "Keselamatan Fisik": { total: 0, correct: 0 },
    "Keselamatan Di Rumah": { total: 0, correct: 0 },
  };

  studentLogs.forEach(log => {
    log.history.forEach(hist => {
      totalSolved++;
      if (hist.isSolvedCorrectly) {
        correctSolved++;
      }
      const cat = hist.category || "Umum";
      if (!categoriesTotals[cat]) {
        categoriesTotals[cat] = { total: 0, correct: 0 };
      }
      categoriesTotals[cat].total++;
      if (hist.isSolvedCorrectly) {
        categoriesTotals[cat].correct++;
      }
    });
  });

  const overallAccuracy = totalSolved > 0 ? Math.round((correctSolved / totalSolved) * 100) : 0;

  return (
    <div id="teacher-dashboard" className="min-h-screen bg-gradient-to-br from-[#EEF2F6] via-[#E0E7FF] to-[#ECFDF5] text-[#1E293B] flex flex-col font-sans select-none relative">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {downloadSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 z-50 max-w-md text-center"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            <span>{downloadSuccessMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar Dashboard: Dynamic Colorful Child-Friendly Gradient Header */}
      <header className="bg-gradient-to-r from-[#00A896] via-[#4361EE] to-[#7209B7] border-b-4 border-yellow-300 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-lg relative overflow-hidden">
        {/* Playful cloud patterns background overlay */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-white/5 pointer-events-none opacity-20" />
        
        <div className="flex items-center gap-4 z-10">
          <div className="bg-yellow-300 p-3 rounded-2xl border-2 border-white shadow-md animate-bounce">
            <School className="w-8 h-8 text-[#4361EE]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white drop-shadow-md tracking-tight flex items-center gap-2">
              Dashboard Guru & Evaluasi Kelas
            </h2>
            <p className="text-xs text-teal-100 font-bold drop-shadow-sm">
              Rekam jejak pemahaman proteksi diri anak sekolah dasar secara interaktif & berwarna
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 z-10 w-full sm:w-auto justify-end">
          {!isStandaloneHtmlMode && (
            <>
              <PWAInstallButton variant="dashboard" />
              <button
                onClick={handleDownloadStandaloneHtml}
                disabled={isDownloadingHtml}
                className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 border-2 border-white rounded-2xl font-extrabold text-xs text-slate-950 flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-60"
              >
                <Download className="w-4 h-4 text-slate-950" />
                {isDownloadingHtml ? "Menyiapkan..." : "Unduh Aplikasi (.HTML)"}
              </button>
            </>
          )}
          {!isStandaloneHtmlMode && authReady && (
            authUser ? (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 px-3.5 py-2 rounded-2xl text-white text-xs font-bold">
                <Cloud className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="truncate max-w-[160px]">{authUser.email}</span>
                <button
                  onClick={handleDisconnectGoogle}
                  title="Keluar dari sinkronisasi Cloud"
                  className="ml-1 p-1 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isSigningIn}
                className="px-4 py-3 bg-white/95 hover:bg-white active:scale-95 border-2 border-indigo-200 rounded-2xl font-extrabold text-xs text-indigo-900 flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-60"
              >
                <Cloud className="w-4 h-4 text-indigo-600" />
                {isSigningIn ? "Menghubungkan..." : "Sinkronisasi Cloud Guru"}
              </button>
            )
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 border-2 border-white rounded-2xl font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2 cursor-pointer shadow-md transition-all justify-center sm:w-auto w-full focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4 text-slate-950 stroke-[3]" />
            Kembali Ke Menu Utama
          </button>
        </div>
      </header>

      {/* Modern High-Contrast Dashboard Tab Navigation */}
      <div className="bg-white/95 backdrop-blur border-b border-indigo-100 px-6 py-1.5 flex overflow-x-auto gap-3.5 shrink-0 shadow-sm">
        <button
          onClick={() => { setActiveTab('analytics'); setEditingScenario(null); }}
          className={`px-5 py-3.5 rounded-xl font-black text-xs sm:text-sm shrink-0 select-none cursor-pointer flex items-center gap-2 focus:outline-none transition-all ${
            activeTab === 'analytics' 
              ? "bg-indigo-50 border-2 border-indigo-600 text-indigo-800 shadow-sm" 
              : "border-2 border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Statistik Pemahaman Anak
        </button>

        <button
          onClick={() => { setActiveTab('student-logs'); setEditingScenario(null); }}
          className={`px-5 py-3.5 rounded-xl font-black text-xs sm:text-sm shrink-0 select-none cursor-pointer flex items-center gap-2 focus:outline-none transition-all ${
            activeTab === 'student-logs' 
              ? "bg-emerald-50 border-2 border-emerald-600 text-emerald-800 shadow-sm" 
              : "border-2 border-transparent text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4 text-emerald-500" />
          Detail Rapor & Unduh ({totalStudents} Siswa)
        </button>

        <button
          onClick={() => { setActiveTab('scenarios'); setEditingScenario(null); }}
          className={`px-5 py-3.5 rounded-xl font-black text-xs sm:text-sm shrink-0 select-none cursor-pointer flex items-center gap-2 focus:outline-none transition-all ${
            activeTab === 'scenarios' 
              ? "bg-purple-50 border-2 border-purple-600 text-purple-800 shadow-sm" 
              : "border-2 border-transparent text-slate-500 hover:text-purple-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-500" />
          Kustomisasi Soal Misi
        </button>

        {!isStandaloneHtmlMode && (
          <button
            onClick={() => { setActiveTab('google-drive'); setEditingScenario(null); }}
            className={`px-5 py-3.5 rounded-xl font-black text-xs sm:text-sm shrink-0 select-none cursor-pointer flex items-center gap-2 focus:outline-none transition-all ${
              activeTab === 'google-drive' 
                ? "bg-sky-50 border-2 border-sky-600 text-sky-800 shadow-sm" 
                : "border-2 border-transparent text-slate-500 hover:text-sky-600 hover:bg-slate-50"
            }`}
          >
            <HardDrive className="w-4 h-4 text-sky-500" />
            Google Drive
          </button>
        )}
      </div>

      {/* Main Container Viewport */}
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">

        {/* --- TAB 1: ANALYTICS (STATISTIK PEMAHAMAN) --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Overview Metric counts: 4 Beautiful Playful Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] border-2 border-[#0284C7] p-5 rounded-3xl shadow-md relative overflow-hidden transition-all hover:scale-102">
                <div className="absolute -right-3 -bottom-3 text-sky-200 opacity-30">
                  <span className="text-6xl font-black">✔</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-sky-850 uppercase tracking-widest">Siswa Terdaftar</span>
                  <Users className="w-5 h-5 text-sky-700" />
                </div>
                <div className="text-4xl font-extrabold text-sky-950">{totalStudents}</div>
                <p className="text-[10px] text-sky-800 font-bold mt-1">Anak terekam bermain asyik</p>
              </div>

              <div className="bg-gradient-to-br from-[#DCFCE7] to-[#BBF7D0] border-2 border-[#16A34A] p-5 rounded-3xl shadow-md relative overflow-hidden transition-all hover:scale-102">
                <div className="absolute -right-3 -bottom-3 text-emerald-250 opacity-35">
                  <span className="text-6xl font-black">★</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-emerald-850 uppercase tracking-widest">Rata-rata Nilai</span>
                  <Award className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-950">
                  {avgPoints} <span className="text-xs font-black text-[#15803d]">/ 200 Poin</span>
                </div>
                <p className="text-[10px] text-emerald-800 font-bold mt-1">Rapor pengetahuan dasar anak</p>
              </div>

              <div className="bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-2 border-[#D97706] p-5 rounded-3xl shadow-md relative overflow-hidden transition-all hover:scale-102">
                <div className="absolute -right-3 -bottom-3 text-amber-250 opacity-35">
                  <span className="text-6xl font-black">🚨</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-850 uppercase tracking-widest">Rata-rata Akurasi</span>
                  <TrendingUp className="w-5 h-5 text-amber-700" />
                </div>
                <div className="text-4xl font-extrabold text-amber-950">{overallAccuracy}%</div>
                <p className="text-[10px] text-amber-800 font-bold mt-1">Menjawab benar percobaan ke-1</p>
              </div>

              <div className="bg-white border-2 border-dashed border-indigo-200 p-5 rounded-3xl flex flex-col justify-center items-center shadow-inner relative">
                <button
                  onClick={() => {
                    onResetScenariosDefault();
                    showDownloadToast("20 soal misi berhasil dikembalikan ke setelan awal!");
                  }}
                  className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md text-center active:scale-95"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  Mulai Ulang Soal Pabrikan
                </button>
                <span className="text-[8.5px] text-center font-bold text-slate-500 mt-2">
                  Kembalikan 20 misi kuis ke setelan awal
                </span>
              </div>
            </div>

            {/* In depth charts & maps info */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Category comprehension block chart */}
              <div className="bg-white p-6 rounded-3xl border-2 border-indigo-100 shadow-md lg:col-span-3 space-y-4">
                <h3 className="text-base sm:text-lg font-black text-indigo-950 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Keakuratan Respon Menurut Kategori Keselamatan
                </h3>
                <p className="text-xs font-medium text-slate-600">
                  Indikator berikut mendeteksi topik mana yang sudah dipahami anak, atau yang dinilai sangat rawan (membutuhkan sesi bimbingan bersama orang tua).
                </p>

                {totalStudents === 0 ? (
                  <div className="h-68 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <TrendingUp className="w-12 h-12 text-[#94A3B8] animate-pulse" />
                    <span className="text-sm font-black text-slate-500">Belum ada statistik nilai murid</span>
                    <span className="text-[11px] text-slate-400 max-w-xs font-medium">
                      Minta murid bermain di halaman utama, isi nama, dan selesaikan skenario kuis petualangan.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {Object.entries(categoriesTotals).map(([catName, stats]) => {
                      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                      
                      // Progress bar colors corresponding to standard safety indicators
                      let barGradient = "from-rose-500 to-red-600";
                      let bgBadge = "bg-rose-50 border-rose-200 text-rose-700";
                      
                      if (pct >= 80) {
                        barGradient = "from-emerald-400 to-teal-600";
                        bgBadge = "bg-emerald-50 border-emerald-250 text-emerald-700";
                      } else if (pct >= 50) {
                        barGradient = "from-amber-400 to-orange-500";
                        bgBadge = "bg-amber-50 border-amber-250 text-amber-700";
                      }

                      return (
                        <div key={catName} className="space-y-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                            <span className="font-extrabold text-slate-755 truncate pr-2">{catName}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black shrink-0 ${bgBadge}`}>
                              {pct}% Akurasi ({stats.correct}/{stats.total} Soal)
                            </span>
                          </div>
                          
                          {/* Animated Progress Bar */}
                          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex border border-slate-310">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${stats.total > 0 ? pct : 0}%` }}
                              transition={{ duration: 0.8 }}
                              className={`h-full bg-gradient-to-r ${barGradient} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Educator's recommendation details cards */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                
                <div className="bg-gradient-to-br from-[#4F46E5] to-[#7209B7] p-6 rounded-3xl text-white shadow-lg space-y-3.5 relative overflow-hidden">
                  <div className="absolute right-0 top-0 transform translate-x-5 -translate-y-5 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  
                  <h3 className="text-base sm:text-lg font-black text-yellow-300 flex items-center gap-2">
                    <Info className="w-5 h-5 text-yellow-300" />
                    Panduan & Rekomendasi
                  </h3>
                  
                  <div className="space-y-2.5 text-xs font-semibold text-indigo-50 leading-relaxed">
                    <p>
                      Materi simulasi interaktif <strong>SafeStep</strong> didesain ramah anak demi perlindungan maksimal dari kejahatan sosial, digital, dan perundungan.
                    </p>
                    <p>
                      <strong className="text-yellow-250">Aksi Guru:</strong> Lihat statistik diagram disamping. Bila nilai akurasi di bawah 60% (warna merah), berikan bimbingan kognitif lisan di sekolah untuk meningkatkan kepekaan bela diri anak.
                    </p>
                  </div>

                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/20 text-[10.5px]">
                    <span className="block font-black text-yellow-300 mb-1">💡 Tips Penamaan Nilai:</span>
                    Arahkan siswa memasukkan nama lengkap mereka di awal masuk game agar hasil latihan langsung terekam rapi ke dashboard ini.
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center space-y-3">
                  <Award className="w-10 h-10 text-yellow-500 animate-bounce" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Download Rekap Kelas</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Gunakan tombol di bawah untuk mengunduh rekapitulasi skoring semua murid ke file Spreadsheet Excel.</p>
                  </div>
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                    Unduh Rekap Spreadsheet (CSV)
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: STUDENT LOGS (JURNAL HASIL SKORING & DOWNLOADS) --- */}
        {activeTab === 'student-logs' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-indigo-950 flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-600" />
                  Jurnal Evaluasi, Rapor Diagnostik & Sertifikat Murid
                </h3>
                <p className="text-xs font-medium text-slate-600">
                  Unduh terpisah antara <strong>Rapor Diagnostik (PDF Potret)</strong> untuk orang tua/guru dan <strong>Sertifikat Penghargaan (PDF Lanskap)</strong> khusus anak sesuai capaian masing-masing siswa.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {studentLogs.length > 0 && (
                  <>
                    <button
                      onClick={handleDownloadCSV}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer hover:from-emerald-500 hover:to-teal-500 shadow active:scale-95 transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Unduh Seluruh Rekap (CSV)
                    </button>
                    {confirmClearLogs ? (
                      <div className="flex items-center gap-1.5 bg-red-50 border border-red-300 px-2.5 py-1.5 rounded-xl">
                        <span className="text-[11px] font-extrabold text-red-700">Hapus semua?</span>
                        <button
                          onClick={handleClearLogsConfirmed}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-[11px] cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          onClick={() => setConfirmClearLogs(false)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClearLogs(true)}
                        className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Kosongkan Lembar Jurnal
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {studentLogs.length === 0 ? (
              <div className="bg-white py-14 rounded-3xl border-2 border-dashed border-indigo-150 flex flex-col items-center justify-center gap-3 text-center p-6 shadow-sm">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-full animate-pulse">
                  <Users className="w-10 h-10 text-indigo-400" />
                </div>
                <span className="text-base font-black text-indigo-950">Jurnal Nilai Murid Kosong</span>
                <p className="text-xs font-medium text-slate-500 max-w-md leading-relaxed">
                  Belum ada siswa yang mendaftar atau menyelesaikan kuis. Instruksikan siswa untuk membuka game, ketik nama mereka, lalu dekati NPC bersila, aneka telepon / kabel untuk menjawab misi keselamatan.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {studentLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const diag = computeStudentDiagnosticProfile(log, scenarios);

                  let tierTextColor = "text-sky-700";
                  let tierShortLabel = "Petualang SafeStep";
                  if (diag.scorePct >= 80) {
                    tierTextColor = "text-emerald-700";
                    tierShortLabel = "Duta Keselamatan Cilik";
                  } else if (diag.scorePct >= 60) {
                    tierTextColor = "text-teal-700";
                    tierShortLabel = "Pahlawan Keselamatan";
                  }

                  return (
                    <div
                      key={log.id}
                      className="bg-white rounded-3xl border border-indigo-100 hover:border-indigo-300 transition-all shadow-sm overflow-hidden flex flex-col"
                    >
                      {/* Student Row Header */}
                      <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 border-2 border-indigo-300 flex items-center justify-center text-lg font-black text-indigo-700 shadow-inner shrink-0">
                            {log.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                              {log.studentName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-semibold mt-0.5">
                              <span className="font-mono tabular-nums font-bold text-slate-800">
                                {diag.totalPoints}/{diag.maxTotalPoints} Poin ({diag.scorePct}%)
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {diag.answeredCount}/{diag.totalCurriculumCount} Misi
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className={`font-bold ${tierTextColor}`}>
                                {tierShortLabel}
                              </span>
                              <span aria-hidden="true" className="hidden sm:inline">·</span>
                              <span className="hidden sm:inline text-slate-400">
                                {log.completedAt ? new Date(log.completedAt).toLocaleString("id-ID") : "Simulasi Aktif"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Separated Dual Document Output Actions + Detail Expand */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Fitur 1: Unduh Rapor Diagnostik (PDF Potret) */}
                          <button
                            type="button"
                            onClick={() => handleDownloadDiagnosticReport(log)}
                            title="Unduh Rapor Diagnostik (PDF Potret): Skor 3 Indikator, Grafik Keakuratan & Panduan Orang Tua"
                            className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs whitespace-nowrap shrink-0"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>Unduh Rapor Diagnostik (PDF Potret)</span>
                          </button>

                          {/* Fitur 2: Unduh Sertifikat (PDF Lanskap) */}
                          <button
                            type="button"
                            onClick={() => handleDownloadCertificate(log)}
                            title="Unduh Sertifikat Penghargaan Anak (PDF Lanskap)"
                            className="bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs whitespace-nowrap shrink-0"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                            <span>Unduh Sertifikat (PDF Lanskap)</span>
                          </button>

                          {/* View Individual Diagnostic & Transcript Accordion Button */}
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            title={isExpanded ? "Sembunyikan Rincian Diagnostik" : "Lihat Rincian 3 Indikator & Transkrip Jawaban"}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-2 rounded-xl text-slate-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
                          >
                            <span>Rincian</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Detail Panel: Individual 3-Indicator Diagnostic + Parent Guidance + Transcript */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-200 bg-slate-50/60 overflow-hidden"
                          >
                            <div className="p-4 sm:p-6 space-y-5">
                              {/* 3 Core Indicators Breakdown for This Student */}
                              <div className="space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                    01. Rincian Skor 3 Indikator ({log.studentName})
                                  </h5>
                                  <span className="text-[11px] font-mono tabular-nums text-slate-500">
                                    {diag.diagnosticReportId} · {diag.certificateId}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {diag.indicators.map((ind) => {
                                    const barTone =
                                      ind.answeredItems === 0
                                        ? "bg-slate-400"
                                        : ind.displayPct >= 80
                                        ? "bg-emerald-500"
                                        : ind.displayPct >= 60
                                        ? "bg-amber-500"
                                        : "bg-rose-500";
                                    const textTone =
                                      ind.answeredItems === 0
                                        ? "text-slate-600"
                                        : ind.displayPct >= 80
                                        ? "text-emerald-700"
                                        : ind.displayPct >= 60
                                        ? "text-amber-700"
                                        : "text-rose-700";

                                    return (
                                      <div
                                        key={ind.key}
                                        className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <div className="text-xs font-extrabold text-slate-900">
                                              {ind.title}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                              {ind.subtitle}
                                            </div>
                                          </div>
                                          <span className={`font-mono tabular-nums text-base font-black ${textTone}`}>
                                            {ind.displayPct}%
                                          </span>
                                        </div>

                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all ${barTone}`}
                                            style={{ width: `${ind.displayPct}%` }}
                                          />
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                                          <span className="font-mono tabular-nums font-semibold">
                                            {ind.pointsEarned}/{ind.maxPoints} Poin ({ind.correctItems}/{ind.totalItems} Misi)
                                          </span>
                                          <span className={`font-bold ${textTone}`}>
                                            {ind.diagnosticStatus}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Personalized Parent Guidance Preview for This Student */}
                              <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3">
                                <div>
                                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                    02. Ringkasan Diagnostik & Panduan Bimbingan Orang Tua ({log.studentName})
                                  </h5>
                                  <p className="text-xs text-slate-700 leading-relaxed mt-1">
                                    {diag.personalSummaryText}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                                  {diag.parentGuidanceItems.map((g) => (
                                    <div key={g.indicatorTitle} className="space-y-1">
                                      <div className="text-[11px] font-extrabold text-slate-900">
                                        {g.indicatorTitle}
                                      </div>
                                      <p className="text-[11px] text-slate-600 leading-relaxed">
                                        {g.guidance}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Per-Question Transcript */}
                              <div className="space-y-3">
                                <h5 className="text-xs font-black text-indigo-900 tracking-wider uppercase border-b border-indigo-100 pb-1.5">
                                  03. Transkrip Keputusan Simulasi Misi ({log.history.length} Jawaban Terekam)
                                </h5>

                                {log.history.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">
                                    Belum ada rincian jawaban per soal yang terekam pada sesi ini.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {log.history.map((h, hIdx) => (
                                      <div
                                        key={hIdx}
                                        className={`p-4 rounded-2xl border text-xs leading-relaxed flex flex-col gap-2 ${
                                          h.isSolvedCorrectly
                                            ? "bg-white border-emerald-300 text-slate-800"
                                            : "bg-white border-rose-300 text-slate-800"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                          <span className="font-extrabold text-slate-900 truncate text-xs">
                                            {h.scenarioName}
                                          </span>
                                          <span
                                            className={`font-bold text-[10px] shrink-0 ${
                                              h.isSolvedCorrectly ? "text-emerald-700" : "text-rose-700"
                                            }`}
                                          >
                                            {h.isSolvedCorrectly ? "Tepat (+10 Poin)" : "Perlu Bimbingan (0 Poin)"}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                          <span className="font-semibold text-slate-700">{h.category}</span>
                                          <span aria-hidden="true">·</span>
                                          <span>Peta {h.mapName.toUpperCase()}</span>
                                        </div>

                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                          <span className="text-[10px] text-slate-400 block font-semibold">
                                            Pilihan Jawaban Siswa:
                                          </span>
                                          <span className="text-xs font-bold leading-relaxed text-slate-800">
                                            &ldquo;{h.chosenOptionText}&rdquo;
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* --- TAB 3: SCENARIOS LIST / EDITOR (KUSTOMISASI SOAL) --- */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6 animate-fade-in relative">
            
            {/* Playful alert banner */}
            <div className="bg-purple-100 border-2 border-purple-350 p-4 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm text-purple-950">
              <div className="flex items-start gap-3.5">
                <Sparkles className="w-5 h-5 text-purple-650 shrink-0 mt-0.5 animate-bounce" />
                <div className="text-xs">
                  <span className="font-extrabold block text-sm mb-0.5">Custom Kreatif & Upload Bank Soal</span>
                  Bapak / Ibu Guru dapat mengubah naskah dialog secara langsung atau mengunggah daftar soal baru dari file <strong>Word (.docx/.doc)</strong> maupun <strong>Excel/CSV (.csv)</strong> (maks. {MAX_FIRESTORE_SCENARIOS} soal).
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    downloadScenarioWordTemplate();
                    showDownloadToast("Template Word (.doc) berhasil diunduh!");
                  }}
                  className="px-3 py-2 bg-white hover:bg-purple-50 border border-purple-300 rounded-xl font-bold text-xs text-purple-900 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>Template Word</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadScenarioCsvTemplate();
                    showDownloadToast("Template CSV (.csv) berhasil diunduh!");
                  }}
                  className="px-3 py-2 bg-white hover:bg-purple-50 border border-purple-300 rounded-xl font-bold text-xs text-purple-900 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Template CSV</span>
                </button>

                <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingScenarios ? "Memproses..." : "Upload Soal (.docx/.csv)"}</span>
                  <input
                    type="file"
                    accept=".docx,.doc,.csv,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleUploadScenarioFile}
                    disabled={isUploadingScenarios}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {uploadError && (
              <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{uploadError}</div>
              </div>
            )}

            {uploadWarnings.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 p-4 rounded-2xl text-xs space-y-1">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Catatan Impor Soal:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 font-medium">
                  {uploadWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Editing Scenario overlay console */}
            <AnimatePresence>
              {editingScenario && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border-3 border-purple-500 p-6 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-purple-100 to-indigo-100 border border-purple-300 overflow-hidden pt-1 px-0.5 shrink-0 shadow-inner">
                        <Npc3DCharacter
                          npcId={editingScenario.npcId}
                          npcName={editingScenario.npcName}
                          npcType={editingScenario.npcType}
                          variant="mini"
                        />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-purple-900">Ubah Teks Dialog Skenario: {editingScenario.npcName}</h4>
                        <p className="text-[11px] text-slate-500 font-bold">Kategori Safety: {editingScenario.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingScenario(null)}
                      className="text-slate-550 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg active:scale-95 transition-all text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Kembali / Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Column values */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                          Label Identitas Karakter / Tempat di Peta (Netral, Tanpa Spoiler):
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={editingScenario.npcName}
                          onChange={(e) =>
                            setEditingScenario({
                              ...editingScenario,
                              npcName: e.target.value.slice(0, 80),
                            })
                          }
                          placeholder="Contoh: Pak Guru Pengganti, Penjual Warung, Pesan Masuk"
                          className="w-full text-xs px-3 py-2 bg-white border-2 border-slate-200 focus:border-purple-500 rounded-xl outline-none text-slate-900 font-bold shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                          Balon Teks Sapaan Jarak Dekat (3–4m di Peta, Gunakan [Nama Anak] & Tanpa Spoiler):
                        </label>
                        <input
                          type="text"
                          maxLength={220}
                          value={editingScenario.calloutText || ""}
                          onChange={(e) =>
                            setEditingScenario({
                              ...editingScenario,
                              calloutText: e.target.value.slice(0, 220),
                            })
                          }
                          placeholder="Contoh: Halo [Nama Anak]! Sini sebentar yuk, ada sesuatu buatmu!"
                          className="w-full text-xs px-3 py-2 bg-white border-2 border-slate-200 focus:border-purple-500 rounded-xl outline-none text-slate-800 font-semibold shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">Dialog Utama Skenario (Saat Jendela Keputusan Dibuka):</label>
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={editingScenario.dialogueText}
                          onChange={(e) => setEditingScenario({ ...editingScenario, dialogueText: e.target.value.slice(0, 1000) })}
                          className="w-full text-xs p-3 bg-white border-2 border-slate-200 focus:border-purple-500 rounded-2xl outline-none text-slate-800 font-semibold italic leading-relaxed shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">Rumusan Soal / Pertanyaan Tantangan:</label>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={editingScenario.question}
                          onChange={(e) => setEditingScenario({ ...editingScenario, question: e.target.value.slice(0, 500) })}
                          className="w-full text-xs p-3 bg-white border-2 border-slate-200 focus:border-purple-500 rounded-2xl outline-none text-slate-850 font-black leading-relaxed shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Right column values */}
                    <div className="space-y-3">
                      <span className="block text-xs font-extrabold text-[#7209B7] uppercase tracking-wider">Opsi Pilihan Balasan:</span>
                      
                      {editingScenario.options.map((opt, oIdx) => (
                        <div key={opt.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-sans shadow-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            opt.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            Pilihan {opt.id.toUpperCase()} ({opt.isCorrect ? "Respon Tepat & Selamat" : "Respon Kurang Aman & Bahaya"})
                          </span>
                          
                          <input
                            type="text"
                            maxLength={300}
                            value={opt.text}
                            onChange={(e) => handleUpdateOption(oIdx, e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border-2 border-slate-200 focus:border-purple-400 rounded-xl text-xs outline-none text-slate-800"
                            placeholder="Isi teks pilihan balasan anak"
                          />
                          
                          <input
                            type="text"
                            maxLength={500}
                            value={opt.feedback}
                            onChange={(e) => handleUpdateFeedback(oIdx, e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border-2 border-slate-200 focus:border-purple-400 rounded-xl text-[10px] outline-none text-slate-500 italic"
                            placeholder="Peringatan nasehat apabila siswa memilih jawaban ini"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar of editor */}
                  <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                    <div>
                      {saveSuccess && (
                        <div className="text-xs text-emerald-700 font-extrabold flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full animate-bounce">
                          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                          Skenario Soal Tersimpan Sukses!
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingScenario(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs select-none cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveScenario}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer select-none text-white shadow shadow-purple-200 active:scale-95 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List Header content in customization */}
            <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-indigo-950 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Katalog {scenarios.length} Skenario Ujian Keselamatan Anak
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Klik tombol di kartu soal untuk mengedit, atau unduh seluruh {scenarios.length} soal aktif sesuai format template.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (scenarios.length === 0) {
                      showDownloadToast("Belum ada soal untuk diunduh.");
                      return;
                    }
                    downloadExistingScenariosWord(scenarios);
                    showDownloadToast(`Seluruh ${scenarios.length} soal lengkap diunduh (Word .doc)!`);
                  }}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-extrabold text-xs text-indigo-900 flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Unduh Soal Lengkap (Word)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (scenarios.length === 0) {
                      showDownloadToast("Belum ada soal untuk diunduh.");
                      return;
                    }
                    downloadExistingScenariosCsv(scenarios);
                    showDownloadToast(`Seluruh ${scenarios.length} soal lengkap diunduh (CSV)!`);
                  }}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-extrabold text-xs text-emerald-900 flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unduh Soal Lengkap (CSV)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
              {scenarios.map((sc) => {
                const mapColors: { [key: string]: string } = {
                  "school": "border-l-[#10B981]",
                  "class": "border-l-[#6366F1]",
                  "street": "border-l-[#64748B]",
                  "home": "border-l-[#EC4899]"
                };

                return (
                  <div
                    key={sc.id}
                    className={`bg-white rounded-3xl border border-slate-200 border-l-8 ${mapColors[sc.mapId]} hover:border-slate-300 transition-all shadow-sm p-5 flex flex-col justify-between gap-4 relative overflow-hidden`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black">
                        <span className="uppercase tracking-widest text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          {sc.category}
                        </span>
                        <span className="uppercase tracking-wider text-slate-400 font-mono">Peta: {sc.mapId}</span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-100 to-indigo-50 border border-slate-200 overflow-hidden pt-1 px-0.5 shrink-0 shadow-xs">
                          <Npc3DCharacter
                            npcId={sc.npcId}
                            npcName={sc.npcName}
                            npcType={sc.npcType}
                            variant="mini"
                          />
                        </div>
                        <h4 className="text-sm font-black text-[#1E293B] leading-snug">
                          {sc.npcName}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-3">
                        👥 &ldquo;{sc.dialogueText}&rdquo;
                      </p>

                      <p className="text-xs font-extrabold text-slate-800 line-clamp-2">
                        ❓ {sc.question}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-end">
                      <button
                        onClick={() => handleEditScenarioClick(sc)}
                        className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 border border-purple-250 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none text-center active:scale-95 shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-purple-600" />
                        Edit Teks Pelajaran
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* --- TAB 4: GOOGLE DRIVE BACKUP & RESTORE --- */}
        {activeTab === 'google-drive' && (
          <GoogleDrivePanel
            scenarios={scenarios}
            studentLogs={studentLogs}
            onApplyImportedScenarios={async (imported) => {
              await onSaveModifiedScenarios(imported);
            }}
            onNotify={showDownloadToast}
          />
        )}

      </div>
    </div>
  );
}
