// ui/recordEditor.js
// Every Health subsection (vaccinations, medications, weight history, vet
// visits, etc.) shares the same underlying shape: a dated record with some
// type-specific fields, notes, and optional attachments. Rather than build
// 13 near-identical list+form UIs, this module renders any of them from a
// small schema. Grooming, Training, and Expenses reuse this in Stage 4.

import { icon } from "./icons.js";
import { updateState, getActivePet } from "../state.js";
import { scheduleAutosave } from "../storage.js";
import { makeId, todayISO, formatDate, byDateDesc, escapeHtml } from "../utils.js";
import { showToast } from "./toast.js";

/**
 * @param {HTMLElement} container
 * @param {Object} config
 * @param {string} config.title - section title, used in placeholders/search label
 * @param {string[]} config.path - path from pet object to the array, e.g. ["health","vaccinations"]
 * @param {Array}  config.fields - type-specific fields: {key,label,type,options,unit,required}
 *   type is one of: text | textarea | number | date | select
 * @param {string} [config.addLabel]
 * @param {string} [config.emptyLabel]
 * @param {string} [config.icon] - icon name for list row markers
 */
export function renderRecordSection(container, config) {
  const {
    title, path, fields,
    addLabel = "Add", emptyLabel = "Nothing logged yet.", icon: iconName = "heart",
  } = config;
  let searchTerm = "";
  let showAll = false;
  const PAGE_SIZE = 100;

  function getParentAndKey() {
    const pet = getActivePet();
    let obj = pet;
    for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
    return { parent: obj, key: path[path.length - 1] };
  }

  function draw() {
    const { parent, key } = getParentAndKey();
    const records = parent?.[key] || [];
    const filtered = searchTerm
      ? records.filter((r) => JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase()))
      : records;
    const sorted = [...filtered].sort(byDateDesc);
    const isPaginated = !searchTerm && !showAll && sorted.length > PAGE_SIZE;
    const visible = isPaginated ? sorted.slice(0, PAGE_SIZE) : sorted;

    // Preserve search input focus across re-renders.
    const searchEl = container.querySelector(".record-search");
    const wasSearching = !!searchTerm;
    const searchFocused = document.activeElement === searchEl;

    container.innerHTML = `
      <div class="record-toolbar" style="display:flex; gap: var(--space-2); margin-bottom: var(--space-3);">
        <input type="search" class="record-search" placeholder="Search ${escapeHtml(title.toLowerCase())}…"
          value="${escapeHtml(searchTerm)}" aria-label="Search ${escapeHtml(title)}" style="flex:1;" />
        <button class="btn btn--primary btn--sm" data-add>${icon(iconName === "plus" ? "plus" : "plus", { size: 16 })} ${escapeHtml(addLabel)}</button>
      </div>
      ${
        visible.length
          ? `<div class="card" style="padding:0;">${visible.map((r) => rowHtml(r)).join("")}</div>`
          : `<p class="card__meta" style="padding: var(--space-3) 0;">${escapeHtml(emptyLabel)}</p>`
      }
      ${
        isPaginated
          ? `<p class="card__meta" style="text-align:center; padding: var(--space-3) 0;">
              Showing the ${PAGE_SIZE} most recent of ${sorted.length}.
              <button class="btn btn--secondary btn--sm" data-show-all style="margin-left: var(--space-2);">Show all</button>
            </p>`
          : ""
      }
    `;

    // Re-attach search listener; restore focus if the user was typing.
    const newSearch = container.querySelector(".record-search");
    if (newSearch) {
      newSearch.addEventListener("input", (e) => {
        searchTerm = e.target.value;
        draw();
      });
      if (searchFocused && wasSearching) {
        newSearch.focus();
        // Place cursor at end of existing text.
        newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
      }
    }
    container.querySelector("[data-show-all]")?.addEventListener("click", () => {
      showAll = true;
      draw();
    });
    container.querySelector("[data-add]").addEventListener("click", () => openForm(null));
    container.querySelectorAll("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () => openForm(btn.dataset.edit))
    );
    container.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", () => handleDelete(btn.dataset.delete))
    );
  }

  function rowHtml(record) {
    const primaryField = fields[0];
    const secondaryField = fields[1];
    const primary = primaryField ? formatFieldValue(record[primaryField.key], primaryField) : "";
    const secondary = secondaryField ? formatFieldValue(record[secondaryField.key], secondaryField) : "";
    const attachCount = record.attachments?.length || 0;
    return `
      <div class="list-row">
        <div class="list-row__icon">${icon(iconName, { size: 18 })}</div>
        <div class="list-row__main">
          <div class="list-row__title">${escapeHtml(primary || "Entry")}${secondary ? ` — ${escapeHtml(secondary)}` : ""}</div>
          <div class="list-row__subtitle">${formatDate(record.date)}${record.notes ? ` · ${escapeHtml(record.notes)}` : ""}${attachCount ? ` · ${attachCount} file${attachCount === 1 ? "" : "s"}` : ""}</div>
        </div>
        <div class="list-row__actions">
          <button class="icon-btn" data-edit="${record.id}" aria-label="Edit entry">${icon("edit", { size: 16 })}</button>
          <button class="icon-btn" data-delete="${record.id}" aria-label="Delete entry">${icon("trash", { size: 16 })}</button>
        </div>
      </div>`;
  }

  function handleDelete(id) {
    if (!confirm("Delete this entry? This can't be undone.")) return;
    updateState((state) => {
      const pet = state.pets.find((p) => p.id === state.activePetId);
      let obj = pet;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = obj[path[path.length - 1]].filter((r) => r.id !== id);
    });
    scheduleAutosave();
    showToast("Deleted");
    draw();
  }

  function openForm(recordId) {
    const { parent, key } = getParentAndKey();
    const existing = recordId ? parent[key].find((r) => r.id === recordId) : null;

    const backdrop = document.createElement("div");
    backdrop.className = "sheet-backdrop";
    backdrop.innerHTML = `
      <div class="sheet" role="dialog" aria-label="${existing ? "Edit" : "Add"} ${escapeHtml(title)} entry">
        <div class="sheet__handle"></div>
        <div class="sheet__header">
          <h2 class="sheet__title">${existing ? "Edit" : "Add"} entry</h2>
          <button class="icon-btn" data-close aria-label="Close">${icon("close")}</button>
        </div>
        <form data-form>
          <div class="field">
            <label class="field__label" for="rf-date">Date</label>
            <input id="rf-date" type="date" data-field="date" value="${existing?.date || todayISO()}" />
          </div>
          ${fields.map((f) => fieldHtml(f, existing?.[f.key])).join("")}
          <div class="field">
            <label class="field__label" for="rf-notes">Notes</label>
            <textarea id="rf-notes" data-field="notes">${escapeHtml(existing?.notes || "")}</textarea>
          </div>
          <div class="field">
            <label class="field__label" for="rf-attachment">Attachment</label>
            <input id="rf-attachment" type="file" data-field="attachment" />
            ${existing?.attachments?.length ? `<p class="field__hint">${existing.attachments.length} file(s) already attached — choosing a new one adds to the list.</p>` : ""}
          </div>
          <div class="btn-row">
            <button type="submit" class="btn btn--primary btn--full">Save</button>
            ${existing ? `<button type="button" class="btn btn--secondary" data-delete-inline>Delete</button>` : ""}
          </div>
        </form>
      </div>`;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector("[data-close]").addEventListener("click", close);
    backdrop.querySelector("[data-delete-inline]")?.addEventListener("click", () => {
      close();
      handleDelete(existing.id);
    });

    backdrop.querySelector("[data-form]").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const record = existing ? { ...existing } : { id: makeId("rec"), attachments: [] };
      record.date = form.querySelector('[data-field="date"]').value || todayISO();
      record.notes = form.querySelector('[data-field="notes"]').value.trim();

      for (const f of fields) {
        const input = form.querySelector(`[data-field="${f.key}"]`);
        if (!input) continue;
        record[f.key] = f.type === "number" ? (input.value === "" ? null : Number(input.value)) : input.value;
      }

      const fileInput = form.querySelector('[data-field="attachment"]');
      const file = fileInput?.files?.[0];
      if (file) {
        const dataUrl = await fileToDataUrl(file);
        record.attachments = [...(record.attachments || []), { id: makeId("att"), name: file.name, dataUrl }];
      }

      updateState((state) => {
        const pet = state.pets.find((p) => p.id === state.activePetId);
        let obj = pet;
        for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
        const arr = obj[path[path.length - 1]];
        const idx = arr.findIndex((r) => r.id === record.id);
        if (idx >= 0) arr[idx] = record; else arr.push(record);
      });
      scheduleAutosave();
      showToast(existing ? "Updated" : "Added");
      close();
      draw();
    });
  }

  draw();
}

function fieldHtml(f, value) {
  const id = `rf-${f.key}`;
  const label = `${f.label}${f.unit ? ` (${f.unit})` : ""}`;
  if (f.type === "select") {
    return `<div class="field">
      <label class="field__label" for="${id}">${escapeHtml(label)}</label>
      <select id="${id}" data-field="${f.key}">
        <option value="">—</option>
        ${f.options.map((o) => `<option value="${escapeHtml(o)}" ${value === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
      </select>
    </div>`;
  }
  if (f.type === "textarea") {
    return `<div class="field">
      <label class="field__label" for="${id}">${escapeHtml(label)}</label>
      <textarea id="${id}" data-field="${f.key}">${escapeHtml(value || "")}</textarea>
    </div>`;
  }
  if (f.type === "number") {
    return `<div class="field">
      <label class="field__label" for="${id}">${escapeHtml(label)}</label>
      <input id="${id}" type="number" step="any" inputmode="decimal" data-field="${f.key}" value="${value ?? ""}" />
    </div>`;
  }
  if (f.type === "date") {
    return `<div class="field">
      <label class="field__label" for="${id}">${escapeHtml(label)}</label>
      <input id="${id}" type="date" data-field="${f.key}" value="${value || ""}" />
    </div>`;
  }
  return `<div class="field">
    <label class="field__label" for="${id}">${escapeHtml(label)}</label>
    <input id="${id}" type="text" data-field="${f.key}" value="${escapeHtml(value || "")}" />
  </div>`;
}

function formatFieldValue(value, field) {
  if (value === null || value === undefined || value === "") return "";
  if (field.type === "number") return `${value}${field.unit ? ` ${field.unit}` : ""}`;
  if (field.type === "date") return formatDate(value);
  if (field.type === "textarea") {
    const str = String(value);
    return str.length > 70 ? `${str.slice(0, 70)}…` : str;
  }
  return String(value);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
