/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-3 z-[80] flex items-center gap-2 rounded-xl bg-amber-600/95 border border-amber-300/80 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-xs pointer-events-none"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Mode Offline — Data & suara tersimpan lokal</span>
    </div>
  );
};

export default OfflineIndicator;
