// ui/syncBanner.js
// Two small pieces of UI that only matter once someone is sharing a file
// across devices (e.g. a synced folder): a banner offering to reconnect to
// the last-opened file on a fresh page load, and a blocking dialog if this
// device is about to overwrite a change that came from another device.

import { on } from "../state.js";
import { reconnectToHandle, reloadFromFile, overwriteAnyway } from "../storage.js";
import { icon } from "./icons.js";
import { showToast } from "./toast.js";

export function initSyncBanners() {
  on("storage:reconnectAvailable", ({ name, handle }) => showReconnectBanner(name, handle));
  on("storage:conflict", ({ name }) => showConflictDialog(name));
}

function showReconnectBanner(name, handle) {
  if (document.getElementById("reconnect-banner")) return;
  const banner = document.createElement("div");
  banner.id = "reconnect-banner";
  banner.setAttribute("role", "status");
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 350;
    background: var(--color-primary-soft); color: var(--color-text);
    padding: var(--space-3) var(--space-4); display: flex; align-items: center;
    gap: var(--space-3); font-size: var(--font-size-sm); box-shadow: var(--shadow-sm);
  `;
  banner.innerHTML = `
    <span style="flex:1;">Reconnect to <strong>${escapeHtml(name)}</strong> to pick up where you left off (and see edits from other devices).</span>
    <button class="btn btn--primary btn--sm" data-reconnect>Reconnect</button>
    <button class="icon-btn" data-dismiss aria-label="Dismiss">${icon("close", { size: 16 })}</button>
  `;
  document.body.prepend(banner);

  banner.querySelector("[data-dismiss]").addEventListener("click", () => banner.remove());
  banner.querySelector("[data-reconnect]").addEventListener("click", async () => {
    const result = await reconnectToHandle(handle);
    if (result.ok) {
      showToast(`Reconnected to ${result.name}`);
      banner.remove();
      window.dispatchEvent(new Event("hashchange")); // re-render current page with reloaded data
    } else if (!result.cancelled) {
      showToast("Couldn't reconnect — try Settings → Open… instead");
    }
  });
}

function showConflictDialog(name) {
  if (document.getElementById("conflict-dialog")) return;
  const backdrop = document.createElement("div");
  backdrop.id = "conflict-dialog";
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-label="File changed elsewhere">
      <div class="sheet__handle"></div>
      <div class="sheet__header"><h2 class="sheet__title">This file changed elsewhere</h2></div>
      <p class="card__meta"><strong>${escapeHtml(name)}</strong> was updated — probably from another device sharing this file. Saving now would overwrite that change.</p>
      <div class="btn-row" style="flex-direction: column;">
        <button class="btn btn--primary btn--full" data-reload>Reload the latest version</button>
        <button class="btn btn--secondary btn--full" data-overwrite>Overwrite with what's on this device</button>
      </div>
      <p class="field__hint" style="margin-top: var(--space-3);">Reloading discards any edits you've made on this device since it last saved. If you're not sure, reload first and redo your changes.</p>
    </div>`;
  document.body.appendChild(backdrop);

  backdrop.querySelector("[data-reload]").addEventListener("click", async () => {
    const result = await reloadFromFile();
    if (result.ok) {
      showToast("Reloaded the latest version");
      window.dispatchEvent(new Event("hashchange"));
    }
    backdrop.remove();
  });
  backdrop.querySelector("[data-overwrite]").addEventListener("click", async () => {
    const result = await overwriteAnyway();
    if (result.ok) showToast("Saved — overwrote the other device's change");
    backdrop.remove();
  });
}

function escapeHtml(str = "") {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
