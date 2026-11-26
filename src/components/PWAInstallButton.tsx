/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Download, Smartphone, Share, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { playUiClickSFX } from "../utils/soundEffects";

interface PWAInstallButtonProps {
  variant?: "home" | "dashboard";
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = "home",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const buttonClasses =
    variant === "dashboard"
      ? "px-4 py-3 bg-sky-400 hover:bg-sky-300 active:scale-95 border-2 border-white rounded-2xl font-extrabold text-xs text-slate-950 flex items-center gap-2 cursor-pointer shadow-md transition-all whitespace-nowrap"
      : "px-3.5 py-1.5 text-xs font-bold text-sky-900 bg-sky-50/90 hover:bg-sky-100 border border-sky-300/80 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          playUiClickSFX();
          void install();
        }}
        className={buttonClasses}
        title="Pasang aplikasi SafeStep agar bisa dibuka langsung saat offline"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install Aplikasi</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            playUiClickSFX();
            setShowIOSGuide(true);
          }}
          className={buttonClasses}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>Install di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-sky-200 text-left text-slate-800 relative">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Tutup panduan instalasi"
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Share className="w-5 h-5" />
                </div>
                <h3 className="text-base font-display font-extrabold text-slate-900">
                  Pasang di iPhone / iPad
                </h3>
              </div>

              <ol className="space-y-2 text-xs text-slate-700 leading-relaxed list-decimal pl-4">
                <li>
                  Ketuk tombol <strong>Bagikan (Share)</strong> di bilah Safari.
                </li>
                <li>
                  Gulir ke bawah dan pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                </li>
                <li>
                  Setelah terpasang, SafeStep dapat dibuka langsung meski tanpa internet.
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-sky-600 hover:bg-sky-700 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default PWAInstallButton;
