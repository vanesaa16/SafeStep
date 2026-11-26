/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export class DriveAuthExpiredError extends Error {
  constructor(message = "Sesi akses Google Drive berakhir. Silakan hubungkan ulang akun Google.") {
    super(message);
    this.name = "DriveAuthExpiredError";
  }
}

const DRIVE_FILES_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
export const SAFESTEP_DRIVE_FOLDER_NAME = "SafeStep - Petualangan Keselamatan";

async function driveFetch(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    throw new DriveAuthExpiredError();
  }

  if (!response.ok) {
    let errText = `Google Drive API error (${response.status})`;
    try {
      const errJson = (await response.json()) as { error?: { message?: string } };
      if (errJson?.error?.message) {
        errText = errJson.error.message;
      }
    } catch {
      // Ignore parse error
    }
    throw new Error(errText);
  }

  return response;
}

export async function ensureSafeStepDriveFolder(accessToken: string): Promise<string> {
  const q = encodeURIComponent(
    `name = '${SAFESTEP_DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await driveFetch(
    `${DRIVE_FILES_API}?q=${q}&fields=files(id,name)&pageSize=1`,
    accessToken
  );
  const searchData = (await searchRes.json()) as { files?: Array<{ id: string; name: string }> };
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await driveFetch(`${DRIVE_FILES_API}?fields=id,name`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: SAFESTEP_DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const folder = (await createRes.json()) as { id: string };
  return folder.id;
}

export async function listSafeStepDriveFiles(accessToken: string): Promise<DriveFileItem[]> {
  const folderId = await ensureSafeStepDriveFolder(accessToken);
  const q = encodeURIComponent(
    `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`
  );
  const fields = encodeURIComponent("files(id,name,mimeType,size,modifiedTime,webViewLink)");
  const res = await driveFetch(
    `${DRIVE_FILES_API}?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=50`,
    accessToken
  );
  const data = (await res.json()) as { files?: DriveFileItem[] };
  return Array.isArray(data.files) ? data.files : [];
}

export async function uploadFileToGoogleDrive(
  accessToken: string,
  options: {
    fileName: string;
    content: string | Blob;
    mimeType: string;
    folderId?: string;
    existingFileId?: string;
  }
): Promise<DriveFileItem> {
  const targetFolderId = options.folderId || (await ensureSafeStepDriveFolder(accessToken));
  const boundary = `safestep_drive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const metadata: Record<string, unknown> = {
    name: options.fileName,
    mimeType: options.mimeType,
  };
  if (!options.existingFileId) {
    metadata.parents = [targetFolderId];
  }

  const contentBlob =
    typeof options.content === "string"
      ? new Blob([options.content], { type: options.mimeType })
      : options.content;

  const multipartBody = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\nContent-Type: ${options.mimeType}\r\n\r\n`,
      contentBlob,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const fields = encodeURIComponent("id,name,mimeType,size,modifiedTime,webViewLink");
  const endpoint = options.existingFileId
    ? `${DRIVE_UPLOAD_API}/${encodeURIComponent(options.existingFileId)}?uploadType=multipart&fields=${fields}`
    : `${DRIVE_UPLOAD_API}?uploadType=multipart&fields=${fields}`;

  const res = await driveFetch(endpoint, accessToken, {
    method: options.existingFileId ? "PATCH" : "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  return (await res.json()) as DriveFileItem;
}

export async function downloadDriveFileBlob(
  accessToken: string,
  fileId: string
): Promise<Blob> {
  const res = await driveFetch(
    `${DRIVE_FILES_API}/${encodeURIComponent(fileId)}?alt=media`,
    accessToken
  );
  return res.blob();
}

export async function downloadDriveFileText(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await driveFetch(
    `${DRIVE_FILES_API}/${encodeURIComponent(fileId)}?alt=media`,
    accessToken
  );
  return res.text();
}

export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  await driveFetch(`${DRIVE_FILES_API}/${encodeURIComponent(fileId)}`, accessToken, {
    method: "DELETE",
  });
}
