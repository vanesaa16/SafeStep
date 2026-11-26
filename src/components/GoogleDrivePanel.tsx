/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { Scenario, StudentLog } from "../types";
import {
  clearGoogleDriveAccessToken,
  connectGoogleDriveWithPopup,
  getGoogleDriveAccessToken,
  isStandaloneHtmlMode,
} from "../firebase";
import {
  deleteDriveFile,
  downloadDriveFileBlob,
  downloadDriveFileText,
  DriveAuthExpiredError,
  DriveFileItem,
  ensureSafeStepDriveFolder,
  listSafeStepDriveFiles,
  SAFESTEP_DRIVE_FOLDER_NAME,
  uploadFileToGoogleDrive,
} from "../utils/googleDriveService";
import { computeStudentDiagnosticProfile } from "../utils/pdfGenerator";
import { parseScenarioUploadFile } from "../utils/scenarioFileParser";
import { checkApiBackendAvailable } from "../utils/serverSync";
import { STANDALONE_HTML_FILENAME } from "../utils/standaloneDownloader";
import {
  AlertTriangle,
  BookOpen,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FolderOpen,
  HardDrive,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";

interface GoogleDrivePanelProps {
  scenarios: Scenario[];
  studentLogs: StudentLog[];
  onApplyImportedScenarios: (scenarios: Scenario[]) => Promise<void>;
  onNotify: (message: string) => void;
}

type PendingDriveConfirmation =
  | {
      kind: "overwrite";
      title: string;
      description: string;
      confirmLabel: string;
      execute: () => Promise<void>;
    }
  | {
      kind: "delete";
      file: DriveFileItem;
    }
  | {
      kind: "restore";
      file: DriveFileItem;
    };

function formatFileSize(sizeStr?: string): string {
  const bytes = Number(sizeStr);
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function GoogleDrivePanel({
  scenarios,
  studentLogs,
  onApplyImportedScenarios,
  onNotify,
}: GoogleDrivePanelProps) {
  const [accessToken, setAccessToken] = useState<string | null>(() => getGoogleDriveAccessToken());
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isBusyAction, setIsBusyAction] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingDriveConfirmation | null>(null);

  const handleAuthExpired = useCallback(() => {
    clearGoogleDriveAccessToken();
    setAccessToken(null);
    setDriveFiles([]);
    setErrorMessage("Sesi Google Drive Anda telah berakhir. Silakan masuk ulang dengan Google.");
  }, []);

  const refreshFiles = useCallback(
    async (tokenOverride?: string) => {
      const token = tokenOverride || accessToken || getGoogleDriveAccessToken();
      if (!token) return;
      setIsLoadingFiles(true);
      setErrorMessage(null);
      try {
        const files = await listSafeStepDriveFiles(token);
        setDriveFiles(files);
      } catch (err) {
        if (err instanceof DriveAuthExpiredError) {
          handleAuthExpired();
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : "Gagal memuat daftar file dari Google Drive."
          );
        }
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [accessToken, handleAuthExpired]
  );

  useEffect(() => {
    if (accessToken) {
      void refreshFiles(accessToken);
    }
  }, [accessToken, refreshFiles]);

  const handleSignInWithGoogle = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const { user, accessToken: freshToken } = await connectGoogleDriveWithPopup();
      setAccessToken(freshToken);
      onNotify(`Google Drive terhubung (${user.email || user.displayName || "Akun Google"})!`);
      await refreshFiles(freshToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("auth/popup-closed-by-user")) {
        setErrorMessage("Gagal menghubungkan Google Drive. Pastikan popup diizinkan lalu coba lagi.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const runUploadWithOverwriteCheck = async (options: {
    actionKey: string;
    fileName: string;
    mimeType: string;
    buildContent: () => Promise<string | Blob>;
    successMessage: string;
  }) => {
    if (!accessToken) return;
    setErrorMessage(null);

    const existing = driveFiles.find(
      (f) => f.name.toLowerCase() === options.fileName.toLowerCase()
    );

    const executeUpload = async (existingFileId?: string) => {
      setIsBusyAction(options.actionKey);
      try {
        const folderId = await ensureSafeStepDriveFolder(accessToken);
        const content = await options.buildContent();
        await uploadFileToGoogleDrive(accessToken, {
          fileName: options.fileName,
          content,
          mimeType: options.mimeType,
          folderId,
          existingFileId,
        });
        onNotify(options.successMessage);
        await refreshFiles(accessToken);
      } catch (err) {
        if (err instanceof DriveAuthExpiredError) {
          handleAuthExpired();
        } else {
          setErrorMessage(
            err instanceof Error ? err.message : "Gagal mengunggah file ke Google Drive."
          );
        }
      } finally {
        setIsBusyAction(null);
      }
    };

    if (existing) {
      setPendingConfirm({
        kind: "overwrite",
        title: "Timpa File di Google Drive?",
        description: `File "${existing.name}" sudah ada di folder "${SAFESTEP_DRIVE_FOLDER_NAME}". Apakah Anda yakin ingin memperbarui isi file tersebut dengan data terbaru?`,
        confirmLabel: "Ya, Perbarui File",
        execute: () => executeUpload(existing.id),
      });
      return;
    }

    await executeUpload();
  };

  const handleSaveScenariosBackup = () => {
    void runUploadWithOverwriteCheck({
      actionKey: "scenarios",
      fileName: "SafeStep_Soal_Misi_Backup.json",
      mimeType: "application/json",
      buildContent: async () => JSON.stringify(scenarios, null, 2),
      successMessage: `${scenarios.length} soal misi berhasil dicadangkan ke Google Drive!`,
    });
  };

  const handleSaveStudentCsvToDrive = () => {
    if (studentLogs.length === 0) {
      onNotify("Belum ada data nilai siswa untuk disimpan ke Google Drive.");
      return;
    }

    const todaySlug = new Date().toISOString().slice(0, 10);
    void runUploadWithOverwriteCheck({
      actionKey: "csv",
      fileName: `Rekap_Diagnostik_SafeStep_${todaySlug}.csv`,
      mimeType: "text/csv",
      buildContent: async () => {
        let csvContent = "\uFEFF";
        csvContent +=
          "ID RAPOR DIAGNOSTIK;ID SERTIFIKAT;NAMA SISWA;SKOR TOTAL;PERSENTASE;MISI SELESAI;BODILY AUTONOMY (%);CYBER SAFETY (%);ASSERTIVE ACTION (%);JUDUL SERTIFIKAT;TANGGAL SIMULASI\r\n";

        studentLogs.forEach((log) => {
          const diag = computeStudentDiagnosticProfile(log, scenarios);
          const dateFormatted = log.completedAt
            ? new Date(log.completedAt).toLocaleString("id-ID")
            : "Sedang Bermain";
          const studentNameEscaped = log.studentName.replace(/"/g, '""');
          const [bodily, cyber, assertive] = diag.indicators;
          csvContent += `"${diag.diagnosticReportId}";"${diag.certificateId}";"${studentNameEscaped}";${diag.totalPoints};"${diag.scorePct}%";"${diag.answeredCount}/${diag.totalCurriculumCount}";"${bodily.displayPct}%";"${cyber.displayPct}%";"${assertive.displayPct}%";"${diag.certificateTitle}";"${dateFormatted}"\r\n`;
        });
        return csvContent;
      },
      successMessage: `Rekap nilai ${studentLogs.length} siswa berhasil disimpan ke Google Drive!`,
    });
  };

  const handleSaveStandaloneHtmlToDrive = () => {
    void runUploadWithOverwriteCheck({
      actionKey: "html",
      fileName: STANDALONE_HTML_FILENAME,
      mimeType: "text/html",
      buildContent: async () => {
        const hasBackend = await checkApiBackendAvailable();
        if (hasBackend) {
          const res = await fetch("/api/download-standalone-html", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              scenarios: scenarios.slice(0, 30),
              apiBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
            }),
          });
          if (!res.ok) {
            throw new Error(`Gagal menyiapkan HTML mandiri (${res.status})`);
          }
          return await res.text();
        }
        const staticRes = await fetch(`/${STANDALONE_HTML_FILENAME}`, { cache: "no-store" });
        if (!staticRes.ok) {
          throw new Error("File aplikasi HTML mandiri tidak tersedia di server ini.");
        }
        return await staticRes.text();
      },
      successMessage: `Aplikasi HTML utuh (${STANDALONE_HTML_FILENAME}) berhasil disimpan ke Google Drive!`,
    });
  };

  const handleDownloadFromDrive = async (file: DriveFileItem) => {
    if (!accessToken) return;
    setIsBusyAction(`download:${file.id}`);
    setErrorMessage(null);
    try {
      const blob = await downloadDriveFileBlob(accessToken, file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      onNotify(`File "${file.name}" berhasil diunduh dari Google Drive!`);
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) {
        handleAuthExpired();
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Gagal mengunduh file dari Drive.");
      }
    } finally {
      setIsBusyAction(null);
    }
  };

  const executeRestoreScenarios = async (file: DriveFileItem) => {
    if (!accessToken) return;
    setIsBusyAction(`restore:${file.id}`);
    setErrorMessage(null);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".json")) {
        const text = await downloadDriveFileText(accessToken, file.id);
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Format JSON soal tidak valid atau kosong.");
        }
        await onApplyImportedScenarios(parsed as Scenario[]);
        onNotify(`${parsed.length} soal misi berhasil dipulihkan dari Google Drive!`);
      } else {
        const blob = await downloadDriveFileBlob(accessToken, file.id);
        const importedFile = new File([blob], file.name, { type: file.mimeType || blob.type });
        const parsed = await parseScenarioUploadFile(importedFile);
        await onApplyImportedScenarios(parsed.scenarios);
        onNotify(`${parsed.scenarios.length} soal berhasil dimuat dari file Drive "${file.name}"!`);
      }
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) {
        handleAuthExpired();
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Gagal memuat soal dari Drive.");
      }
    } finally {
      setIsBusyAction(null);
    }
  };

  const executeDeleteFile = async (file: DriveFileItem) => {
    if (!accessToken) return;
    setIsBusyAction(`delete:${file.id}`);
    setErrorMessage(null);
    try {
      await deleteDriveFile(accessToken, file.id);
      onNotify(`File "${file.name}" berhasil dihapus dari Google Drive.`);
      await refreshFiles(accessToken);
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) {
        handleAuthExpired();
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Gagal menghapus file dari Drive.");
      }
    } finally {
      setIsBusyAction(null);
    }
  };

  if (isStandaloneHtmlMode) {
    return (
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-sm">
        <HardDrive className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-lg font-black text-slate-800">Google Drive Tidak Tersedia di Mode File Lokal</h3>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Buka aplikasi SafeStep melalui alamat web resmi untuk menghubungkan akun Google Drive dan mencadangkan file secara online.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Modal for Mutating / Destructive Drive Actions */}
      {pendingConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-2xl shrink-0 ${
                  pendingConfirm.kind === "delete"
                    ? "bg-rose-100 text-rose-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  {pendingConfirm.kind === "delete"
                    ? `Hapus "${pendingConfirm.file.name}"?`
                    : pendingConfirm.kind === "restore"
                      ? `Muat Soal dari "${pendingConfirm.file.name}"?`
                      : pendingConfirm.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pendingConfirm.kind === "delete"
                    ? `File "${pendingConfirm.file.name}" akan dihapus permanen dari folder Google Drive Anda. Tindakan ini tidak dapat dibatalkan.`
                    : pendingConfirm.kind === "restore"
                      ? `Soal misi yang aktif saat ini di permainan akan digantikan dengan soal dari file Google Drive "${pendingConfirm.file.name}".`
                      : pendingConfirm.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = pendingConfirm;
                  setPendingConfirm(null);
                  if (action.kind === "delete") {
                    void executeDeleteFile(action.file);
                  } else if (action.kind === "restore") {
                    void executeRestoreScenarios(action.file);
                  } else {
                    void action.execute();
                  }
                }}
                className={`px-4 py-2.5 rounded-xl font-black text-xs text-white cursor-pointer shadow-sm ${
                  pendingConfirm.kind === "delete"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {pendingConfirm.kind === "delete"
                  ? "Ya, Hapus File"
                  : pendingConfirm.kind === "restore"
                    ? "Ya, Terapkan Soal"
                    : pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Auth Card */}
      <div className="bg-white border-2 border-sky-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-100 rounded-2xl border border-sky-200 shrink-0">
            <HardDrive className="w-7 h-7 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Penyimpanan & Cadangan Google Drive
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              Simpan cadangan soal misi, rekap nilai kelas (.CSV), atau paket aplikasi offline (.HTML) langsung ke folder{" "}
              <span className="font-bold text-slate-800">&ldquo;{SAFESTEP_DRIVE_FOLDER_NAME}&rdquo;</span>{" "}
              di Google Drive Anda.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          {!accessToken ? (
            <button
              type="button"
              onClick={handleSignInWithGoogle}
              disabled={isConnecting}
              className="inline-flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 active:scale-95 border border-[#747775] rounded-full shadow-xs text-[#1f1f1f] font-medium text-sm cursor-pointer transition-all disabled:opacity-60"
            >
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5 block shrink-0"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isConnecting ? "Menghubungkan..." : "Sign in with Google"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void refreshFiles()}
              disabled={isLoadingFiles}
              className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl font-extrabold text-xs text-sky-900 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 text-sky-600 ${isLoadingFiles ? "animate-spin" : ""}`} />
              Muat Ulang File Drive
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-xs font-bold flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          {!accessToken && (
            <button
              type="button"
              onClick={handleSignInWithGoogle}
              className="px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-rose-800 font-extrabold cursor-pointer shrink-0"
            >
              Sign in with Google
            </button>
          )}
        </div>
      )}

      {accessToken && (
        <>
          {/* Upload / Backup Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={handleSaveScenariosBackup}
              disabled={Boolean(isBusyAction)}
              className="bg-white hover:bg-purple-50 border-2 border-purple-200 rounded-2xl p-5 text-left transition-all cursor-pointer shadow-xs flex items-start gap-3.5 disabled:opacity-60"
            >
              <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-purple-600" />
                  {isBusyAction === "scenarios" ? "Mengunggah..." : "Simpan Soal Misi (.JSON)"}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cadangkan {scenarios.length} soal aktif ke Drive agar bisa dipulihkan kapan saja.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSaveStudentCsvToDrive}
              disabled={Boolean(isBusyAction)}
              className="bg-white hover:bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 text-left transition-all cursor-pointer shadow-xs flex items-start gap-3.5 disabled:opacity-60"
            >
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  {isBusyAction === "csv" ? "Mengunggah..." : "Simpan Rekap Nilai (.CSV)"}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ekspor rekap diagnostik {studentLogs.length} siswa langsung ke Google Drive.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSaveStandaloneHtmlToDrive}
              disabled={Boolean(isBusyAction)}
              className="bg-white hover:bg-sky-50 border-2 border-sky-200 rounded-2xl p-5 text-left transition-all cursor-pointer shadow-xs flex items-start gap-3.5 disabled:opacity-60"
            >
              <div className="p-2.5 bg-sky-100 rounded-xl text-sky-600 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-sky-600" />
                  {isBusyAction === "html" ? "Mengunggah..." : "Simpan Aplikasi Offline (.HTML)"}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Simpan paket HTML lengkap beserta soal kustom ke Google Drive untuk dibagikan.
                </p>
              </div>
            </button>
          </div>

          {/* File List */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-sky-600" />
                <h4 className="text-sm font-black text-slate-900">
                  File di Folder &ldquo;{SAFESTEP_DRIVE_FOLDER_NAME}&rdquo; ({driveFiles.length})
                </h4>
              </div>
            </div>

            {isLoadingFiles && driveFiles.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-slate-500">
                Memuat file dari Google Drive...
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-slate-500">
                Belum ada file SafeStep tersimpan di Google Drive. Klik salah satu tombol di atas untuk menyimpan cadangan pertama Anda.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {driveFiles.map((file) => {
                  const lowerName = file.name.toLowerCase();
                  const canRestoreScenarios =
                    lowerName.endsWith(".json") ||
                    lowerName.endsWith(".csv") ||
                    lowerName.endsWith(".docx");

                  return (
                    <div
                      key={file.id}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 truncate">
                          {file.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5 flex flex-wrap gap-3">
                          <span>Ukuran: {formatFileSize(file.size)}</span>
                          {file.modifiedTime && (
                            <span>
                              Diperbarui: {new Date(file.modifiedTime).toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {canRestoreScenarios && (
                          <button
                            type="button"
                            onClick={() => setPendingConfirm({ kind: "restore", file })}
                            disabled={Boolean(isBusyAction)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-800 font-extrabold text-xs cursor-pointer transition-colors disabled:opacity-60"
                          >
                            {isBusyAction === `restore:${file.id}` ? "Memuat..." : "Terapkan Soal"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleDownloadFromDrive(file)}
                          disabled={Boolean(isBusyAction)}
                          className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-800 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Unduh
                        </button>

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 font-extrabold text-xs flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Buka
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setPendingConfirm({ kind: "delete", file })}
                          disabled={Boolean(isBusyAction)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-700 font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
