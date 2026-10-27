// ui/profile.js
// The pet's editable profile — a single fixed-shape object rather than a
// list, so it doesn't use recordEditor.js. Every field saves independently
// on change/blur so nothing is lost mid-edit, and the whole page re-renders
// only when the active pet changes (photo upload, etc.), not per keystroke.

import { registerRoute } from "../router.js";
import { updateState, getActivePet } from "../state.js";
import { scheduleAutosave } from "../storage.js";
import { showToast } from "./toast.js";
import { icon } from "./icons.js";

function render(container) {
  const pet = getActivePet();
  const p = pet.profile;

  container.innerHTML = `
    <div class="page-heading"><h1>Profile</h1></div>

    <div class="card" style="margin-bottom: var(--space-4); display:flex; gap: var(--space-4); align-items:center; flex-wrap: wrap;">
      <div id="photo-preview" style="width:88px; height:88px; border-radius: var(--radius-full); background: var(--color-primary-soft); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
        ${p.photoDataUrl ? `<img src="${p.photoDataUrl}" alt="${p.name || "Pet"} photo" style="width:100%; height:100%; object-fit:cover;" />` : icon("paw", { size: 36 })}
      </div>
      <div>
        <label class="btn btn--secondary btn--sm" for="photo-input" style="cursor:pointer;">Change photo</label>
        <input id="photo-input" type="file" accept="image/*" class="visually-hidden" />
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--space-4);">
      <p class="card__label">Identity</p>
      ${textField("name", "Name", p.name)}
      <div style="display:flex; gap: var(--space-3);">
        <div style="flex:1;">${textField("breed", "Breed", p.breed)}</div>
        <div style="flex:1;">${selectField("sex", "Sex", p.sex, ["male", "female"])}</div>
      </div>
      <div style="display:flex; gap: var(--space-3);">
        <div style="flex:1;">${dateField("birthday", "Birthday", p.birthday)}</div>
        <div style="flex:1;">${dateField("gotchaDate", "Gotcha date", p.gotchaDate)}</div>
      </div>
      <div style="display:flex; gap: var(--space-3);">
        <div style="flex:1;">${textField("weight", "Weight", p.weight)}</div>
        <div style="flex:1;">${textField("height", "Height", p.height)}</div>
      </div>
      ${textField("colour", "Colour", p.colour)}
    </div>

    <div class="card" style="margin-bottom: var(--space-4);">
      <p class="card__label">Origin &amp; registration</p>
      ${textField("breeder", "Breeder", p.breeder)}
      <div style="display:flex; gap: var(--space-3);">
        <div style="flex:1;">${textField("microchip", "Microchip #", p.microchip)}</div>
        <div style="flex:1;">${textField("registration", "Registration #", p.registration)}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--space-4);">
      <p class="card__label">Care team</p>
      ${textField("vet.name", "Veterinarian", p.vet.name)}
      ${textField("vet.phone", "Vet phone", p.vet.phone)}
      ${textField("vet.address", "Vet address", p.vet.address)}
      ${textField("emergencyVet.name", "Emergency vet", p.emergencyVet.name)}
      ${textField("emergencyVet.phone", "Emergency vet phone", p.emergencyVet.phone)}
      ${textField("insurance.provider", "Insurance provider", p.insurance.provider)}
      ${textField("insurance.policyNumber", "Policy number", p.insurance.policyNumber)}
      ${textField("emergencyContact.name", "Emergency contact", p.emergencyContact.name)}
      ${textField("emergencyContact.phone", "Emergency contact phone", p.emergencyContact.phone)}
    </div>

    <div class="card" style="margin-bottom: var(--space-4);">
      <p class="card__label">Food &amp; toys</p>
      ${textField("food.brand", "Food brand", p.food.brand)}
      ${textField("food.amount", "Amount per meal", p.food.amount)}
      ${textField("food.schedule", "Feeding schedule", p.food.schedule)}
      ${textField("favouriteToys", "Favourite toys (comma-separated)", (p.favouriteToys || []).join(", "))}
    </div>

    <div class="card">
      <p class="card__label">Notes</p>
      ${textareaField("notes", "Notes", p.notes)}
    </div>
  `;

  container.querySelectorAll("[data-path]").forEach((input) => {
    input.addEventListener("change", () => saveField(input.dataset.path, input.value));
  });

  container.querySelector("#photo-input").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    updateState((state) => {
      const activePet = state.pets.find((pp) => pp.id === state.activePetId);
      activePet.profile.photoDataUrl = dataUrl;
    });
    scheduleAutosave();
    render(container);
  });
}

function saveField(path, rawValue) {
  const keys = path.split(".");
  updateState((state) => {
    const pet = state.pets.find((p) => p.id === state.activePetId);
    let obj = pet.profile;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    const finalKey = keys[keys.length - 1];
    if (finalKey === "favouriteToys") {
      obj[finalKey] = rawValue.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      obj[finalKey] = rawValue;
    }
  });
  scheduleAutosave();
  showToast("Saved");
}

function textField(path, label, value) {
  const id = `pf-${path.replace(/\./g, "-")}`;
  return `<div class="field">
    <label class="field__label" for="${id}">${label}</label>
    <input id="${id}" type="text" data-path="${path}" value="${escapeAttr(value)}" />
  </div>`;
}

function textareaField(path, label, value) {
  const id = `pf-${path}`;
  return `<div class="field">
    <label class="field__label" for="${id}">${label}</label>
    <textarea id="${id}" data-path="${path}">${escapeAttr(value)}</textarea>
  </div>`;
}

function dateField(path, label, value) {
  const id = `pf-${path}`;
  return `<div class="field">
    <label class="field__label" for="${id}">${label}</label>
    <input id="${id}" type="date" data-path="${path}" value="${value || ""}" />
  </div>`;
}

function selectField(path, label, value, options) {
  const id = `pf-${path}`;
  return `<div class="field">
    <label class="field__label" for="${id}">${label}</label>
    <select id="${id}" data-path="${path}">
      <option value="">—</option>
      ${options.map((o) => `<option value="${o}" ${value === o ? "selected" : ""}>${o[0].toUpperCase()}${o.slice(1)}</option>`).join("")}
    </select>
  </div>`;
}

function escapeAttr(value) {
  return String(value ?? "").replaceAll('"', "&quot;");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

registerRoute("profile", render);
