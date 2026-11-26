/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type FullscreenDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msFullscreenEnabled?: boolean;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

export function isFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as FullscreenDocument;
  const root = document.documentElement as FullscreenElement;

  const hasApi = Boolean(
    root.requestFullscreen ||
      root.webkitRequestFullscreen ||
      root.msRequestFullscreen
  );

  if (!hasApi) return false;

  if (typeof doc.fullscreenEnabled === "boolean") {
    return doc.fullscreenEnabled;
  }
  if (typeof doc.webkitFullscreenEnabled === "boolean") {
    return doc.webkitFullscreenEnabled;
  }
  if (typeof doc.msFullscreenEnabled === "boolean") {
    return doc.msFullscreenEnabled;
  }
  return true;
}

export function isCurrentlyFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as FullscreenDocument;
  return Boolean(
    doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement
  );
}

export async function enterFullscreen(
  target?: HTMLElement | null
): Promise<boolean> {
  if (typeof document === "undefined") return false;
  if (!isFullscreenSupported()) return false;
  if (isCurrentlyFullscreen()) return true;

  const el = (target || document.documentElement) as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: "hide" });
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await Promise.resolve(el.webkitRequestFullscreen());
      return true;
    }
    if (el.msRequestFullscreen) {
      await Promise.resolve(el.msRequestFullscreen());
      return true;
    }
  } catch {
    // Browsers may block requestFullscreen without an active user gesture or inside restricted iframes
    return false;
  }
  return false;
}

export async function exitFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  if (!isCurrentlyFullscreen()) return true;

  const doc = document as FullscreenDocument;
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
      return true;
    }
    if (doc.webkitExitFullscreen) {
      await Promise.resolve(doc.webkitExitFullscreen());
      return true;
    }
    if (doc.msExitFullscreen) {
      await Promise.resolve(doc.msExitFullscreen());
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function toggleFullscreen(
  target?: HTMLElement | null
): Promise<boolean> {
  if (isCurrentlyFullscreen()) {
    await exitFullscreen();
    return false;
  }
  return enterFullscreen(target);
}

export function subscribeFullscreenChange(
  onChange: (isFullscreen: boolean) => void
): () => void {
  if (typeof document === "undefined") return () => {};

  const handleChange = () => {
    onChange(isCurrentlyFullscreen());
  };

  document.addEventListener("fullscreenchange", handleChange);
  document.addEventListener("webkitfullscreenchange", handleChange);
  document.addEventListener("MSFullscreenChange", handleChange);

  return () => {
    document.removeEventListener("fullscreenchange", handleChange);
    document.removeEventListener("webkitfullscreenchange", handleChange);
    document.removeEventListener("MSFullscreenChange", handleChange);
  };
}
