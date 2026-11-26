/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Scenario } from "../types";
import { checkApiBackendAvailable } from "./serverSync";

export const STANDALONE_HTML_FILENAME = "SafeStep-Petualangan-Keselamatan.html";
export const SHORT_HTML_FILENAME = "SafeStep-Singkat.html";

function escapeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function injectInitialScenariosIntoHtml(
  htmlContent: string,
  customScenarios?: Scenario[]
): string {
  if (!Array.isArray(customScenarios) || customScenarios.length === 0) {
    return htmlContent;
  }

  const cleanedHtml = htmlContent.replace(
    /<script>window\.__SAFESTEP_INITIAL_SCENARIOS__\s*=[\s\S]*?<\/script>\s*/i,
    ""
  );
  const injectionScript = `<script>window.__SAFESTEP_INITIAL_SCENARIOS__ = ${escapeJsonForInlineScript(
    customScenarios.slice(0, 30)
  )};</script>`;

  if (cleanedHtml.includes("<head>")) {
    return cleanedHtml.replace("<head>", `<head>\n    ${injectionScript}`);
  }
  return `${injectionScript}\n${cleanedHtml}`;
}

function saveHtmlBlob(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 2000);
}

async function triggerHtmlDownload(endpoint: string, filename: string): Promise<void> {
  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Gagal mengunduh file HTML (${response.status})`);
  }

  const htmlContent = await response.text();
  if (!htmlContent || !htmlContent.toLowerCase().includes("<!doctype html")) {
    throw new Error("Isi file HTML tidak valid.");
  }

  saveHtmlBlob(htmlContent, filename);
}

export async function downloadStandaloneHtmlApp(customScenarios?: Scenario[]): Promise<void> {
  const hasBackend = await checkApiBackendAvailable();

  if (hasBackend) {
    const response = await fetch("/api/download-standalone-html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        scenarios: Array.isArray(customScenarios) ? customScenarios.slice(0, 30) : [],
        apiBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
      }),
    });

    if (!response.ok) {
      throw new Error(`Gagal mengunduh file HTML (${response.status})`);
    }

    const htmlContent = await response.text();
    if (!htmlContent || !htmlContent.toLowerCase().includes("<!doctype html")) {
      throw new Error("Isi file HTML tidak valid.");
    }

    saveHtmlBlob(htmlContent, STANDALONE_HTML_FILENAME);
    return;
  }

  // Static hosting fallback (e.g. Netlify): fetch static standalone HTML bundle & bake active scenarios client-side
  const staticResponse = await fetch(`/${STANDALONE_HTML_FILENAME}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!staticResponse.ok) {
    throw new Error(`File aplikasi mandiri tidak tersedia (${staticResponse.status})`);
  }

  const rawHtml = await staticResponse.text();
  if (
    !rawHtml ||
    !rawHtml.toLowerCase().includes("<!doctype html") ||
    !rawHtml.includes("__SAFESTEP_STANDALONE__")
  ) {
    throw new Error("Isi file HTML mandiri tidak valid.");
  }

  const bakedHtml = injectInitialScenariosIntoHtml(rawHtml, customScenarios);
  saveHtmlBlob(bakedHtml, STANDALONE_HTML_FILENAME);
}

export async function downloadShortHtmlApp(): Promise<void> {
  return triggerHtmlDownload("/api/download-short-html", SHORT_HTML_FILENAME);
}
