// ui/daughter.js
// Tracks what the daughter does with the puppy during her weeks in the
// house — framed as a lightweight reward system so logging feels like
// tracking achievements, not chores.

import { registerRoute } from "../router.js";
import { renderRecordSection } from "./recordEditor.js";
import { getActivePet, updateState } from "../state.js";
import { scheduleAutosave } from "../storage.js";
import { showToast } from "./toast.js";

const SECTIONS = [
  { id: "tasksCompleted", label: "Tasks", fields: [{ key: "task", label: "Task", type: "text" }] },
  { id: "trainingSessions", label: "Training help", fields: [{ key: "skillPracticed", label: "Skill practiced", type: "text" }] },
  { id: "walks", label: "Walks", fields: [{ key: "durationMinutes", label: "Duration", type: "number", unit: "min" }] },
  { id: "readingSessions", label: "Reading to puppy", fields: [{ key: "book", label: "Book", type: "text" }] },
  { id: "feedingLog", label: "Feeding", fields: [{ key: "meal", label: "Meal", type: "select", options: ["Breakfast", "Dinner"] }] },
  { id: "rewards", label: "Rewards", fields: [{ key: "reward", label: "Reward given", type: "text" }] },
  { id: "achievements", label: "Achievements", fields: [{ key: "title", label: "Achievement", type: "text" }] },
];

function render(container) {
  const pet = getActivePet();
  container.innerHTML = `
    <div class="page-heading"><h1>Daughter</h1></div>
    <div class="card" style="margin-bottom: var(--space-5);">
      <div class="field"><label class="field__label" for="daughter-name">Name</label><input id="daughter-name" type="text" value="${escapeAttr(pet.daughter.name)}" /></div>
      <div class="field">
        <label class="field__label" for="daughter-pattern">Schedule pattern</label>
        <select id="daughter-pattern">
          <option value="alternating-weekly" ${pet.daughter.schedulePattern === "alternating-weekly" ? "selected" : ""}>Alternating weekly</option>
          <option value="weekends" ${pet.daughter.schedulePattern === "weekends" ? "selected" : ""}>Weekends</option>
          <option value="custom" ${pet.daughter.schedulePattern === "custom" ? "selected" : ""}>Custom</option>
        </select>
      </div>
    </div>
    <div class="quickadd-tabs" role="tablist" id="daughter-tabs">
      ${SECTIONS.map((s, i) => `<button role="tab" data-section="${s.id}" class="${i === 0 ? "is-active" : ""}">${s.label}</button>`).join("")}
    </div>
    <div id="daughter-body"></div>
  `;

  container.querySelector("#daughter-name").addEventListener("change", (e) => saveField("name", e.target.value));
  container.querySelector("#daughter-pattern").addEventListener("change", (e) => saveField("schedulePattern", e.target.value));

  const tabsEl = container.querySelector("#daughter-tabs");
  const bodyEl = container.querySelector("#daughter-body");
  function showSection(id) {
    const section = SECTIONS.find((s) => s.id === id);
    tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b.dataset.section === id));
    renderRecordSection(bodyEl, {
      title: section.label,
      path: ["daughter", section.id],
      fields: section.fields,
      icon: "person",
      addLabel: `Log ${section.label.toLowerCase()}`,
      emptyLabel: "Nothing logged yet.",
    });
  }
  tabsEl.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => showSection(btn.dataset.section)));
  showSection(SECTIONS[0].id);
}

function saveField(key, value) {
  updateState((state) => {
    const pet = state.pets.find((p) => p.id === state.activePetId);
    pet.daughter[key] = value;
  });
  scheduleAutosave();
  showToast("Saved");
}

function escapeAttr(value) {
  return String(value ?? "").replaceAll('"', "&quot;");
}

registerRoute("daughter", render);
