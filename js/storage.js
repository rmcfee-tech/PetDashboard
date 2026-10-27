// storage.js
// The ONLY module that knows how pet data is persisted. Today that's a
// single JSON file on disk, accessed via the File System Access API where
// supported (Chromium/Android/Windows), with a download+upload fallback
// everywhere else. Swapping this for IndexedDB or a cloud API later means
// rewriting only this file — nothing else in the app touches storage.
//
// localStorage is used here ONLY for small UI preferences (theme, last
// file name) — never for the pet data itself, per the project spec.
//
// Multi-device note: this app has no server, so two devices sharing a
// file (e.g. via a synced OneDrive/Drive/Dropbox folder) only see each
// other's edits when the sync client moves the file between them. To
// avoid one device silently overwriting the other's changes, every write
// checks the file's on-disk modified time against what we last read
// before saving — see checkForExternalChange() below.

import { setState, getState, createEmptyDocument, emit } from "./state.js";

const PREF_KEY = "petDashboard.uiPrefs";
const DEFAULT_FILENAME = "pet-dashboard.json";
const IDB_NAME = "pet-dashboard-handles";
const IDB_STORE = "handles";
const IDB_KEY = "lastFile";

let fileHandle = null;       // FileSystemFileHandle, when supported + granted
let lastKnownModified = null; // ms timestamp of the file content we last read/wrote
let autosaveTimer = null;
const AUTOSAVE_DELAY_MS = 1500;

const supportsFileSystemAccess = typeof window.showSaveFilePicker === "function";

/* ---------------------------------------------------------------------- */
/* UI preferences (localStorage — not pet data)                           */
/* ---------------------------------------------------------------------- */

export function getUiPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY)) || {};
  } catch {
    return {};
  }
}

export function setUiPrefs(patch) {
  const current = getUiPrefs();
  localStorage.setItem(PREF_KEY, JSON.stringify({ ...current, ...patch }));
}

/* ---------------------------------------------------------------------- */
/* IndexedDB: remembers the file handle across restarts so re-opening the */
/* app doesn't require re-picking the file every time (important once     */
/* the file lives in a synced folder you open from multiple devices).     */
/* ---------------------------------------------------------------------- */

function openHandleDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeHandle(handle) {
  try {
    const db = await openHandleDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Could not persist file handle:", err);
  }
}

async function loadStoredHandle() {
  try {
    const db = await openHandleDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------- */
/* Load                                                                    */
/* ---------------------------------------------------------------------- */

/**
 * Called once at boot. Tries, in order: reconnect to a previously-opened
 * file (silently if permission is still granted, or via a "Reconnect"
 * prompt if the browser needs a fresh user gesture to re-grant it), then
 * falls back to the bundled sample data.
 */
export async function loadInitial() {
  if (supportsFileSystemAccess) {
    const stored = await loadStoredHandle();
    if (stored) {
      const permission = await stored.queryPermission({ mode: "readwrite" }).catch(() => "denied");
      if (permission === "granted") {
        const opened = await loadFromHandle(stored);
        if (opened.ok) return { source: "reconnected", name: stored.name };
      } else if (permission === "prompt") {
        // Can't request permission without a user gesture — surface a
        // banner so the person can tap "Reconnect" themselves.
        emit("storage:reconnectAvailable", { name: stored.name, handle: stored });
      }
    }
  }

  const bundled = await tryLoadBundledSample();
  if (bundled) {
    setState(bundled);
    return { source: "sample" };
  }
  setState(createEmptyDocument());
  return { source: "empty" };
}

/** Called by the UI when the person taps "Reconnect" in response to the banner. */
export async function reconnectToHandle(handle) {
  try {
    const permission = await handle.requestPermission({ mode: "readwrite" });
    if (permission !== "granted") return { ok: false, error: "Permission denied" };
    return loadFromHandle(handle);
  } catch (err) {
    console.error("reconnectToHandle failed:", err);
    return { ok: false, error: String(err) };
  }
}

async function loadFromHandle(handle) {
  try {
    const file = await handle.getFile();
    const text = await file.text();
    const json = JSON.parse(text);
    fileHandle = handle;
    lastKnownModified = file.lastModified;
    setState(json);
    setUiPrefs({ lastFileName: handle.name });
    emit("storage:opened", { name: handle.name });
    return { ok: true, name: handle.name };
  } catch (err) {
    console.error("loadFromHandle failed:", err);
    return { ok: false, error: String(err) };
  }
}

async function tryLoadBundledSample() {
  try {
    const res = await fetch("data/sample-pet.json");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------- */
/* Open (user picks an existing file)                                     */
/* ---------------------------------------------------------------------- */

export async function openFile() {
  if (supportsFileSystemAccess) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: "Pet Dashboard JSON", accept: { "application/json": [".json"] } }],
        multiple: false,
      });
      const result = await loadFromHandle(handle);
      if (result.ok) await storeHandle(handle);
      return result;
    } catch (err) {
      if (err?.name === "AbortError") return { ok: false, cancelled: true };
      console.error("openFile failed:", err);
      return { ok: false, error: String(err) };
    }
  }
  return openFileFallback();
}

function openFileFallback() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve({ ok: false, cancelled: true });
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        fileHandle = null; // no persistent handle possible in fallback mode
        lastKnownModified = null;
        setState(json);
        setUiPrefs({ lastFileName: file.name });
        emit("storage:opened", { name: file.name });
        resolve({ ok: true, name: file.name });
      } catch (err) {
        console.error("openFileFallback failed:", err);
        resolve({ ok: false, error: String(err) });
      }
    };
    input.click();
  });
}

/* ---------------------------------------------------------------------- */
/* Save / Save As                                                         */
/* ---------------------------------------------------------------------- */

/**
 * Check whether the file on disk has changed since we last read or wrote
 * it — the signal that another device's sync client dropped in a newer
 * version while we had this one open. Returns true if there's a conflict.
 */
async function checkForExternalChange() {
  if (!fileHandle || lastKnownModified === null) return false;
  try {
    const file = await fileHandle.getFile();
    return file.lastModified !== lastKnownModified;
  } catch {
    // Handle no longer valid (file moved/deleted). Clear it so save falls back to Save As.
    fileHandle = null;
    lastKnownModified = null;
    return false;
  }
}

/**
 * Save to the currently-open file handle, or fall back to Save As. If the
 * file changed externally since we last read it, this refuses to write
 * and instead emits "storage:conflict" so the UI can ask the person to
 * reload the newer version or overwrite it — rather than silently
 * clobbering an edit made on the other device.
 */
export async function save({ force = false } = {}) {
  const data = getState();
  if (!data) return { ok: false, error: "No data to save" };

  if (supportsFileSystemAccess && fileHandle) {
    if (!force && (await checkForExternalChange())) {
      emit("storage:conflict", { name: fileHandle.name });
      return { ok: false, conflict: true };
    }
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      const fresh = await fileHandle.getFile();
      lastKnownModified = fresh.lastModified;
      emit("storage:saved", { name: fileHandle.name });
      return { ok: true, name: fileHandle.name };
    } catch (err) {
      console.error("save failed, falling back to Save As:", err);
      return saveAs();
    }
  }
  return saveAs();
}

/** Always prompt for a location/name. */
export async function saveAs() {
  const data = getState();
  if (!data) return { ok: false, error: "No data to save" };
  const prefs = getUiPrefs();
  const suggestedName = prefs.lastFileName || DEFAULT_FILENAME;

  if (supportsFileSystemAccess) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: "Pet Dashboard JSON", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      fileHandle = handle;
      const fresh = await handle.getFile();
      lastKnownModified = fresh.lastModified;
      await storeHandle(handle);
      setUiPrefs({ lastFileName: handle.name });
      emit("storage:saved", { name: handle.name });
      return { ok: true, name: handle.name };
    } catch (err) {
      if (err?.name === "AbortError") return { ok: false, cancelled: true };
      console.error("saveAs failed:", err);
      return { ok: false, error: String(err) };
    }
  }
  return downloadAsFile(data, suggestedName);
}

function downloadAsFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setUiPrefs({ lastFileName: filename });
  emit("storage:saved", { name: filename });
  return { ok: true, name: filename };
}

/* ---------------------------------------------------------------------- */
/* Conflict resolution                                                     */
/* ---------------------------------------------------------------------- */

/** Re-read the current file from disk, discarding any unsaved local edits. */
export async function reloadFromFile() {
  if (!fileHandle) return { ok: false, error: "No file open" };
  return loadFromHandle(fileHandle);
}

/** Write local state anyway, overwriting whatever changed on disk. */
export async function overwriteAnyway() {
  return save({ force: true });
}

/* ---------------------------------------------------------------------- */
/* Import / Export (explicit aliases — same mechanics, clearer intent      */
/* for the Settings page "Import backup" / "Export backup" actions)        */
/* ---------------------------------------------------------------------- */

export const importFile = openFile;
export const exportFile = saveAs;

/* ---------------------------------------------------------------------- */
/* Autosave                                                                */
/* ---------------------------------------------------------------------- */

/**
 * Schedule a debounced autosave. Only writes silently when we hold a
 * persisted file handle (File System Access API); otherwise autosave is a
 * no-op and the user must use Save/Export explicitly, since we can't write
 * to disk without a handle or a user gesture in the fallback browsers.
 */
export function scheduleAutosave() {
  if (!supportsFileSystemAccess || !fileHandle) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    save();
  }, AUTOSAVE_DELAY_MS);
}

export function hasActiveFileHandle() {
  return Boolean(fileHandle);
}

export function isFileSystemAccessSupported() {
  return supportsFileSystemAccess;
}
