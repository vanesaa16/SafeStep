/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type PointerEvent } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

type Direction = "up" | "down" | "left" | "right";

interface DpadProps {
  onMove?: (direction: Direction) => void;
  onPressStart?: (direction: Direction) => void;
  onPressEnd?: () => void;
}

export default function Dpad({ onMove, onPressStart, onPressEnd }: DpadProps) {
  const [activeDir, setActiveDir] = useState<Direction | null>(null);

  const handleStart = (dir: Direction, e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setActiveDir(dir);
    if (onPressStart) {
      onPressStart(dir);
    } else if (onMove) {
      onMove(dir);
    }
  };

  const handleEnd = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (activeDir !== null) {
      setActiveDir(null);
      onPressEnd?.();
    }
  };

  const getBtnClass = (dir: Direction) =>
    `w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center rounded-2xl border-2 transition-all duration-100 cursor-pointer touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
      activeDir === dir
        ? "bg-amber-400 text-slate-950 border-amber-500 scale-95 shadow-inner"
        : "bg-white hover:bg-amber-50 text-slate-800 border-stone-200 shadow-[0_3px_0_#CBD5E1]"
    }`;

  return (
    <div
      id="dpad-controller"
      className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-md select-none touch-none"
      role="group"
      aria-label="Kontrol Arah Jalan"
    >
      <button
        id="dpad-up"
        type="button"
        onPointerDown={(e) => handleStart("up", e)}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
        onPointerLeave={handleEnd}
        className={getBtnClass("up")}
        aria-label="Jalan ke Atas"
      >
        <ArrowUp className="w-6 h-6 stroke-[2.6]" />
      </button>

      <div className="flex items-center gap-4">
        <button
          id="dpad-left"
          type="button"
          onPointerDown={(e) => handleStart("left", e)}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
          onPointerLeave={handleEnd}
          className={getBtnClass("left")}
          aria-label="Jalan ke Kiri"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.6]" />
        </button>

        <div className="w-3.5 h-3.5 rounded-full bg-stone-200 border border-stone-300 shrink-0" />

        <button
          id="dpad-right"
          type="button"
          onPointerDown={(e) => handleStart("right", e)}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
          onPointerLeave={handleEnd}
          className={getBtnClass("right")}
          aria-label="Jalan ke Kanan"
        >
          <ArrowRight className="w-6 h-6 stroke-[2.6]" />
        </button>
      </div>

      <button
        id="dpad-down"
        type="button"
        onPointerDown={(e) => handleStart("down", e)}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
        onPointerLeave={handleEnd}
        className={getBtnClass("down")}
        aria-label="Jalan ke Bawah"
      >
        <ArrowDown className="w-6 h-6 stroke-[2.6]" />
      </button>
    </div>
  );
}
