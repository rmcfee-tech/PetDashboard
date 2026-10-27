// ui/photos.js
// A simple grid gallery, not a recordEditor list, since photos need a
// visual grid rather than a row list. Images are embedded as base64 data
// URLs directly in the JSON file — consistent with the "single JSON file,
// no separate asset folder" storage model — so exporting the file always
// takes every photo with it.

import { registerRoute } from "../router.js";
import { updateState, getActivePet } from "../state.js";
import { scheduleAutosave } from "../storage.js";
import { makeId, todayISO, formatDate, escapeHtml, byDateDesc } from "../utils.js";
import { icon } from "./icons.js";
import { showToast } from "./toast.js";

let searchTerm = "";

function render(container) {
  const pet = getActivePet();
  const items = [...(pet.photos.items || [])].sort(byDateDesc);
  const filtered = searchTerm
    ? items.filter((p) => (p.caption || "").toLowerCase().includes(searchTerm.toLowerCase()))
    : items;

  container.innerHTML = `
    <div class="page-heading">
      <h1>Photos</h1>
      <label class="btn btn--primary btn--sm" for="photo-upload" style="cursor:pointer;">${icon("plus", { size: 14 })} Add photo</label>
      <input id="photo-upload" type="file" accept="image/*" class="visually-hidden" />
    </div>
    <input type="search" placeholder="Filter by caption…" value="${escapeHtml(searchTerm)}" id="photo-search" aria-label="Filter photos by caption" style="margin-bottom: var(--space-4);" />
    ${
      filtered.length
        ? `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-3);">
            ${filtered.map((p) => `
              <div class="card" style="padding:0; overflow:hidden;">
                <img src="${p.dataUrl}" alt="${escapeHtml(p.caption || "Pet photo")}" data-view="${p.id}" style="width:100%; aspect-ratio:1; object-fit:cover; cursor:pointer; display:block;" />
                <div style="padding: var(--space-2);">
                  <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); display:flex; justify-content:space-between; align-items:center; gap:4px;">
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(p.caption || formatDate(p.date))}</span>
                    <button class="icon-btn" data-delete="${p.id}" aria-label="Delete photo" style="flex-shrink:0; width:28px; height:28px;">${icon("trash", { size: 13 })}</button>
                  </div>
                </div>
              </div>`).join("")}
          </div>`
        : `<div class="empty-state"><h2>No photos yet</h2><p>Add your first one above.</p></div>`
    }
  `;

  container.querySelector("#photo-search").addEventListener("input", (e) => { searchTerm = e.target.value; render(container); });

  container.querySelector("#photo-upload").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const caption = prompt("Caption (optional):", "") || "";
    updateState((state) => {
      const pet2 = state.pets.find((pp) => pp.id === state.activePetId);
      pet2.photos.items.push({ id: makeId("photo"), date: todayISO(), caption, dataUrl });
    });
    scheduleAutosave();
    showToast("Photo added");
    render(container);
  });

  container.querySelectorAll("[data-view]").forEach((img) =>
    img.addEventListener("click", () => openLightbox(img.src, img.alt))
  );
  container.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm("Delete this photo?")) return;
      updateState((state) => {
        const pet2 = state.pets.find((pp) => pp.id === state.activePetId);
        pet2.photos.items = pet2.photos.items.filter((p) => p.id !== btn.dataset.delete);
      });
      scheduleAutosave();
      render(container);
    })
  );
}

function openLightbox(src, alt) {
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div style="max-width: 90vw; max-height: 85vh;">
      <img src="${src}" alt="${alt}" style="max-width:100%; max-height:85vh; border-radius: var(--radius-md);" />
    </div>`;
  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop || e.target === backdrop.querySelector("img")) close(); });
  backdrop.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  backdrop.setAttribute("tabindex", "-1");
  document.body.appendChild(backdrop);
  backdrop.focus();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

registerRoute("photos", render);
