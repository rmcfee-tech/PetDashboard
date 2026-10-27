// ui/development.js
// Automatically calculates current age from the profile birthday (no
// manual entry needed), then gives four logs for milestones, fear
// periods, growth stages, and teething — all schema-driven via
// recordEditor.js like every other tracker in the app.

import { registerRoute } from "../router.js";
import { renderRecordSection } from "./recordEditor.js";
import { getActivePet } from "../state.js";
import { formatAge, formatDate } from "../utils.js";

const SECTIONS = [
  { id: "milestones", label: "Milestones", fields: [{ key: "milestone", label: "Milestone", type: "text" }] },
  { id: "fearPeriods", label: "Fear periods", fields: [{ key: "trigger", label: "Trigger", type: "text" }, { key: "response", label: "Response", type: "select", options: ["Mild startle", "Avoidance", "Recovered quickly", "Lasting anxiety"] }] },
  { id: "growthStages", label: "Growth stages", fields: [{ key: "stage", label: "Stage", type: "select", options: ["Neonatal", "Transitional", "Socialization", "Juvenile", "Adolescence", "Adulthood", "Senior"] }] },
  { id: "teethingLog", label: "Teething", fields: [{ key: "symptom", label: "Symptom", type: "select", options: ["Chewing increase", "Loose tooth", "Tooth lost", "Gum irritation", "Adult teeth in"] }] },
];

function render(container) {
  const pet = getActivePet();
  const age = formatAge(pet.profile.birthday);

  container.innerHTML = `
    <div class="page-heading"><h1>Puppy Development</h1></div>
    <div class="card" style="margin-bottom: var(--space-5);">
      <p class="card__label">Current age</p>
      <p class="card__value">${age}</p>
      <p class="card__meta">${pet.profile.birthday ? `Born ${formatDate(pet.profile.birthday)}` : "Set a birthday in Profile to calculate age automatically."}</p>
    </div>
    <div class="quickadd-tabs" role="tablist" id="dev-tabs">
      ${SECTIONS.map((s, i) => `<button role="tab" data-section="${s.id}" class="${i === 0 ? "is-active" : ""}">${s.label}</button>`).join("")}
    </div>
    <div id="dev-body"></div>
  `;

  const tabsEl = container.querySelector("#dev-tabs");
  const bodyEl = container.querySelector("#dev-body");
  function showSection(id) {
    const section = SECTIONS.find((s) => s.id === id);
    tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b.dataset.section === id));
    renderRecordSection(bodyEl, {
      title: section.label,
      path: ["puppyDevelopment", section.id],
      fields: section.fields,
      icon: "target",
      addLabel: `Log ${section.label.toLowerCase()}`,
      emptyLabel: "Nothing logged yet.",
    });
  }
  tabsEl.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => showSection(btn.dataset.section)));
  showSection(SECTIONS[0].id);
}

registerRoute("development", render);
