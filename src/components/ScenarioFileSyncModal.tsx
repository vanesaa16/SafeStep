/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Cloud,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Scenario } from "../types";
import {
  downloadScenariosAsCsv,
  downloadScenariosAsJson,
  parseAndMergeUploadedScenarioFile,
  ScenarioSyncResult,
} from "../utils/scenarioFileSync";

interface ScenarioFileSyncModalProps {
  isOpen: boolean;
  scenarios: Scenario[];
  isCloudConnected: boolean;
  isStandaloneMode: boolean;
  onClose: () => void;
  onSyncScenarios: (
    nextScenarios: Scenario[]
  ) => void | Promise<{ serverSynced: boolean; cloudSynced: boolean }>;
  onJumpToCatalog?: () => void;
}

export const ScenarioFileSyncModal: React.FC<ScenarioFileSyncModalProps> = ({
  isOpen,
  scenarios,
  isCloudConnected,
  isStandaloneMode,
  onClose,
  onSyncScenarios,
  onJumpToCatalog,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<{
    result: ScenarioSyncResult;
    serverSynced: boolean;
    cloudSynced: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    setErrorMessage(null);
    const filename = downloadScenariosAsCsv(scenarios);
    setDownloadNote(
      `File ${filename} berhasil diunduh. Buka di Excel / Google Sheets untuk merevisi beberapa soal sekaligus.`
    );
  };

  const handleDownloadJson = () => {
    setErrorMessage(null);
    const filename = downloadScenariosAsJson(scenarios);
    setDownloadNote(`File ${filename} berhasil diunduh.`);
  };

  const processUploadedFile = async (file: File) => {
    setErrorMessage(null);
    setDownloadNote(null);
    setSyncSummary(null);
    setIsProcessing(true);

    try {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Ukuran file terlalu besar (maksimal 2 MB).");
      }

      const text = await file.text();
      const parsedResult = parseAndMergeUploadedScenarioFile(file.name, text, scenarios);

      const syncOutcome = await onSyncScenarios(parsedResult.scenarios);
      const serverSynced =
        syncOutcome && typeof syncOutcome === "object" ? syncOutcome.serverSynced : !isStandaloneMode;
      const cloudSynced =
        syncOutcome && typeof syncOutcome === "object" ? syncOutcome.cloudSynced : isCloudConnected;

      setSyncSummary({
        result: parsedResult,
        serverSynced,
        cloudSynced,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal membaca file pertanyaan. Pastikan format sesuai.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processUploadedFile(file);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5 select-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-sync-modal-title"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.16 }}
          className="bg-white rounded-3xl border-2 border-indigo-200 w-full max-w-2xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-5 sm:px-6 py-4 text-white flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 id="file-sync-modal-title" className="text-base sm:text-lg font-black leading-tight">
                  Kelola File Pertanyaan (Unduh & Impor Revisi)
                </h3>
                <p className="text-[11px] sm:text-xs text-indigo-100 font-medium mt-0.5">
                  Revisi banyak soal sekaligus lewat Excel (.CSV) atau JSON, lalu langsung sinkron ke dalam game.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela file pertanyaan"
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Step 1: Download current scenarios */}
            <div className="bg-indigo-50/75 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Langkah 1 · Unduh Template Soal
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-1">
                    Unduh {scenarios.length} Pertanyaan Game Saat Ini
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Edit kolom dialog, pertanyaan, opsi A/B/C, status <strong>BENAR/SALAH</strong>, atau feedback. Jangan ubah kolom <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 text-[11px]">id_skenario</code>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="flex-1 min-w-[190px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Unduh File Excel (.CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="py-2.5 px-4 bg-white hover:bg-slate-50 text-indigo-800 border border-indigo-300 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <FileJson className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>Unduh JSON (.JSON)</span>
                </button>
              </div>

              {downloadNote && (
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{downloadNote}</span>
                </div>
              )}
            </div>

            {/* Step 2: Upload & Auto-Sync */}
            <div className="space-y-2.5">
              <div>
                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Langkah 2 · Masukkan File Revisi
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-1">
                  Unggah File (.CSV / .JSON) untuk Sinkronisasi Otomatis
                </h4>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? "border-purple-500 bg-purple-50"
                    : "border-slate-300 hover:border-purple-400 bg-slate-50/70 hover:bg-purple-50/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                  {isProcessing
                    ? "Membaca & menyinkronkan soal ke game..."
                    : "Klik untuk pilih file atau tarik file (.csv / .json) ke sini"}
                </div>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Mendukung revisi sebagian baris maupun seluruh 20 soal sekaligus. Begitu file valid dimasukkan, perubahan langsung aktif di game!
                </p>
              </div>
            </div>

            {/* Error alert */}
            {errorMessage && (
              <div
                role="alert"
                className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-3.5 text-xs text-rose-900 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-black">File belum bisa diterapkan</div>
                  <p className="font-medium leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Sync Success Summary */}
            {syncSummary && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2.5 text-emerald-950">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="text-sm font-black">
                      {syncSummary.result.updatedCount + syncSummary.result.addedCount > 0
                        ? `Berhasil! ${syncSummary.result.updatedCount} soal diperbarui${
                            syncSummary.result.addedCount > 0
                              ? `, ${syncSummary.result.addedCount} soal baru ditambahkan`
                              : ""
                          } & langsung tersinkron ke game.`
                        : "File berhasil dibaca — seluruh isi soal sudah sama dengan versi aktif di game."}
                    </div>

                    {syncSummary.result.updatedTitles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {syncSummary.result.updatedTitles.slice(0, 10).map((title, idx) => (
                          <span
                            key={`${title}-${idx}`}
                            className="px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800"
                          >
                            {title}
                          </span>
                        ))}
                        {syncSummary.result.updatedTitles.length > 10 && (
                          <span className="px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            +{syncSummary.result.updatedTitles.length - 10} lainnya
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        ✔ Game & Penyimpanan Lokal
                      </span>
                      {!isStandaloneMode && (
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            syncSummary.serverSynced
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {syncSummary.serverSynced
                            ? "✔ Server Tersinkron"
                            : "⚠ Server Offline (Tersimpan Lokal)"}
                        </span>
                      )}
                      {!isStandaloneMode && (
                        <span
                          className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            syncSummary.cloudSynced
                              ? "bg-sky-100 text-sky-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Cloud className="w-3 h-3" />
                          {syncSummary.cloudSynced
                            ? "Cloud Firestore Tersinkron"
                            : "Cloud Firestore belum login"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Catatan: Saat menyalin nama anak dinamis di teks, gunakan kode <code className="font-mono">[Nama Anak]</code>.
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {syncSummary && onJumpToCatalog && (
                <button
                  type="button"
                  onClick={() => {
                    onJumpToCatalog();
                    onClose();
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Lihat Katalog Soal
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScenarioFileSyncModal;
