// ui/cat.js
// Tracks the dog/cat introduction process end to end: scent → visual →
// shared space (as a single "stage" field so progress reads as a timeline),
// plus an ongoing behaviour log and stress-indicator tracker for the cat.

import { registerRoute } from "../router.js";
import { renderRecordSection } from "./recordEditor.js";
import { getActivePet, updateState } from "../state.js";
import { scheduleAutosave } from "../storage.js";
import { showToast } from "./toast.js";

const SECTIONS = [
  {
    id: "introductionLog", label: "Introduction", icon: "paw",
    fields: [
      { key: "stage", label: "Stage", type: "select", options: ["Scent introduction", "Visual introduction", "Shared space"] },
      { key: "outcome", label: "Outcome", type: "select", options: ["Calm", "Curious", "Tense", "Hissing/swatting", "Ignored each other"] },
    ],
  },
  {
    id: "behaviourLog", label: "Behaviour", icon: "paw",
    fields: [
      { key: "type", label: "Type", type: "select", options: ["Positive interaction", "Negative interaction", "Neutral"] },
      { key: "description", label: "What happened", type: "text" },
    ],
  },
  {
    id: "stressIndicators", label: "Stress indicators", icon: "paw",
    fields: [
      { key: "indicator", label: "Indicator (e.g. hiding, overgrooming)", type: "text" },
      { key: "severity", label: "Severity", type: "select", options: ["Mild", "Moderate", "Concerning"] },
    ],
  },
];

function render(container) {
  const pet = getActivePet();
  container.innerHTML = `
    <div class="page-heading"><h1>Cat integration</h1></div>
    <div class="card" style="margin-bottom: var(--space-5);">
      <p class="card__label">Cat</p>
      <div class="field"><label class="field__label" for="cat-name">Name</label><input id="cat-name" type="text" value="${escapeAttr(pet.cat.name)}" /></div>
      <div class="field"><label class="field__label" for="cat-birthday">Birthday</label><input id="cat-birthday" type="date" value="${pet.cat.birthday || ""}" /></div>
    </div>
    <div class="quickadd-tabs" role="tablist" id="cat-tabs">
      ${SECTIONS.map((s, i) => `<button role="tab" data-section="${s.id}" class="${i === 0 ? "is-active" : ""}">${s.label}</button>`).join("")}
    </div>
    <div id="cat-body"></div>
  `;

  container.querySelector("#cat-name").addEventListener("change", (e) => saveCatField("name", e.target.value));
  container.querySelector("#cat-birthday").addEventListener("change", (e) => saveCatField("birthday", e.target.value));

  const tabsEl = container.querySelector("#cat-tabs");
  const bodyEl = container.querySelector("#cat-body");

  function showSection(id) {
    const section = SECTIONS.find((s) => s.id === id);
    tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b.dataset.section === id));
    renderRecordSection(bodyEl, {
      title: section.label,
      path: ["cat", section.id],
      fields: section.fields,
      icon: section.icon,
      addLabel: `Log ${section.label.toLowerCase()}`,
      emptyLabel: `Nothing logged yet.`,
    });
  }
  tabsEl.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => showSection(btn.dataset.section)));
  showSection(SECTIONS[0].id);
}

function saveCatField(key, value) {
  updateState((state) => {
    const pet = state.pets.find((p) => p.id === state.activePetId);
    pet.cat[key] = value;
  });
  scheduleAutosave();
  showToast("Saved");
}

function escapeAttr(value) {
  return String(value ?? "").replaceAll('"', "&quot;");
}

registerRoute("cat", render);
