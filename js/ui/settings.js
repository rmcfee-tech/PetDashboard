// ui/settings.js
// The one page that must be functional in Stage 2, since it's the surface
// for the storage layer: Save / Save As / Open / Import / Export, plus the
// theme toggle. Everything else here (units, custom categories, etc.) is a
// Stage 4/5 addition on top of this same shell.

import { registerRoute } from "../router.js";
import { save, saveAs, openFile, importFile, exportFile, getUiPrefs, setUiPrefs, isFileSystemAccessSupported, reloadFromFile, hasActiveFileHandle } from "../storage.js";
import { showToast } from "./toast.js";
import { applyTheme, getTheme } from "../theme.js";
import { getActivePet } from "../state.js";
import { EXPORTABLE_DATASETS, exportDataset } from "../dataExport.js";

function render(container) {
  const prefs = getUiPrefs();
  const supported = isFileSystemAccessSupported();
  const theme = getTheme();

  container.innerHTML = `
    <div class="page-heading"><h1>Settings</h1></div>

    <div class="card" style="margin-bottom: var(--space-4);">
      <p class="card__label">Appearance</p>
      <div class="segmented" role="radiogroup" aria-label="Theme" style="margin-top: var(--space-3);">
        <button data-theme-opt="system" class="${theme === "system" ? "is-selected" : ""}">System</button>
        <button data-theme-opt="light" class="${theme === "light" ? "is-selected" : ""}">Light</button>
        <button data-theme-opt="dark" class="${theme === "dark" ? "is-selected" : ""}">Dark</button>
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--space-4);">
      <p class="card__label">Data file</p>
      <p class="card__meta">
        ${prefs.lastFileName ? `Current file: <strong>${prefs.lastFileName}</strong>` : "No file opened yet — using sample data in memory."}
      </p>
      <p class="card__meta">
        ${supported ? "Your browser supports direct file save (autosave enabled once a file is open), and remembers which file you had open between sessions." : "Your browser will download files instead of saving in place — that's expected on non-Chromium browsers."}
      </p>
      <p class="card__meta">
        Sharing this file across two devices via a synced folder (OneDrive, Google Drive, Dropbox)? If the file changes on the other device, you'll get a prompt here before anything gets overwritten. You can also pull the latest version manually any time:
      </p>
      <div class="btn-row" style="flex-wrap: wrap;">
        <button class="btn btn--secondary" data-action="open">Open…</button>
        <button class="btn btn--primary" data-action="save">Save</button>
        <button class="btn btn--secondary" data-action="saveAs">Save As…</button>
        ${hasActiveFileHandle() ? `<button class="btn btn--secondary" data-action="reload">Reload latest</button>` : ""}
      </div>
      <div class="btn-row" style="flex-wrap: wrap;">
        <button class="btn btn--secondary" data-action="import">Import backup</button>
        <button class="btn btn--secondary" data-action="export">Export backup</button>
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--space-4);">
      <p class="card__label">Export data</p>
      <p class="card__meta">Pull out just one dataset — weight history, expenses, training sessions, and so on — as CSV for a spreadsheet or JSON for a script or AI tool. This is separate from the full backup above.</p>
      <div class="field">
        <label class="field__label" for="export-dataset">Dataset</label>
        <select id="export-dataset">
          ${groupedDatasetOptions()}
        </select>
      </div>
      <div class="field">
        <span class="field__label">Format</span>
        <div class="segmented" style="max-width: 240px;">
          <button type="button" data-format="csv" class="is-selected">CSV</button>
          <button type="button" data-format="json">JSON</button>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn--primary" data-export>Export dataset</button>
      </div>
    </div>

    <div class="card">
      <p class="card__label">About</p>
      <p class="card__meta">Pet Dashboard stores everything in one JSON file on your device. No account, no server, no cloud sync — your data never leaves this device unless you export it.</p>
    </div>
  `;

  container.querySelectorAll("[data-theme-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.themeOpt);
      render(container); // re-render to reflect new selected state
    });
  });

  const actions = {
    open: async () => { const r = await openFile(); if (r.ok) { showToast(`Opened ${r.name}`); render(container); } },
    save: async () => { const r = await save(); if (r.ok) showToast(`Saved ${r.name}`); },
    saveAs: async () => { const r = await saveAs(); if (r.ok) { showToast(`Saved as ${r.name}`); render(container); } },
    import: async () => { const r = await importFile(); if (r.ok) { showToast(`Imported ${r.name}`); render(container); } },
    export: async () => { const r = await exportFile(); if (r.ok) showToast(`Exported ${r.name}`); },
    reload: async () => { const r = await reloadFromFile(); if (r.ok) { showToast(`Reloaded ${r.name}`); render(container); } },
  };

  container.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => actions[btn.dataset.action]?.());
  });

  const PREF_KEY = "petDashboard.exportPrefs";
  function getExportPrefs() {
    try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; }
  }
  function setExportPrefs(patch) {
    const current = getExportPrefs();
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...current, ...patch }));
  }
  let selectedFormat = getExportPrefs().exportFormat || "csv";
  // Sync the UI to the persisted selection.
  container.querySelectorAll("[data-format]").forEach((btn) => {
    btn.classList.toggle("is-selected", btn.dataset.format === selectedFormat);
  });
  container.querySelectorAll("[data-format]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedFormat = btn.dataset.format;
      setExportPrefs({ exportFormat: selectedFormat });
      container.querySelectorAll("[data-format]").forEach((b) => b.classList.toggle("is-selected", b === btn));
    });
  });

  container.querySelector("[data-export]").addEventListener("click", () => {
    const datasetId = container.querySelector("#export-dataset").value;
    const pet = getActivePet();
    const { count, label } = exportDataset(pet, datasetId, selectedFormat);
    showToast(count ? `Exported ${count} ${label.toLowerCase()} row${count === 1 ? "" : "s"}` : `${label} is empty — exported anyway`);
  });
}

function groupedDatasetOptions() {
  const groups = {};
  EXPORTABLE_DATASETS.forEach((d) => { (groups[d.group] ||= []).push(d); });
  return Object.entries(groups)
    .map(([group, items]) => `
      <optgroup label="${group}">
        ${items.map((d) => `<option value="${d.id}">${d.label}</option>`).join("")}
      </optgroup>`)
    .join("");
}

registerRoute("settings", render);
